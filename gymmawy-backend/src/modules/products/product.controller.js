import * as service from "./product.service.js";
import { z } from "zod";
import { parseOrThrow, paginationSchema, buildPagination } from "../../utils/validation.js";

const categorySchema = z.object({ name: z.string().trim().min(1) });

export async function listCategories(_req, res, next) {
  try {
    const categories = await service.listCategories();
    res.json({ items: categories });
  } catch (e) { next(e); }
}

export async function createCategory(req, res, next) {
  try {
    const data = parseOrThrow(categorySchema, req.body || {});
    const category = await service.createCategory(data);
    res.status(201).json({ category });
  } catch (e) { next(e); }
}

export async function listProducts(req, res, next) {
  try {
    const base = parseOrThrow(paginationSchema.extend({ 
      categoryId: z.string().uuid().optional(),
      currency: z.enum(['EGP', 'SAR', 'AED', 'USD']).optional()
    }), req.query);
    const { skip, take } = buildPagination(base);
    const result = await service.listProducts({ 
      skip, 
      take, 
      q: base.q, 
      categoryId: base.categoryId,
      currency: base.currency || req.currency
    });
    res.json({
      ...result,
      currency: base.currency || req.currency,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (e) { next(e); }
}

export async function getProduct(req, res, next) {
  try {
    const product = await service.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: { message: "Not found" } });
    res.json({ product });
  } catch (e) { next(e); }
}

export async function createProduct(req, res, next) {
  try {
    const schema = z.object({
      name: z.string().trim().min(1),
      description: z.string().optional(),
      price: z.coerce.number().positive(),
      image: z.string().url().optional(),
      categoryId: z.string().uuid(),
      loyaltyPointsAwarded: z.coerce.number().int().min(0).optional(),
      loyaltyPointsRequired: z.coerce.number().int().min(0).optional(),
      variants: z.array(z.object({ color: z.string().optional(), size: z.string().optional(), stock: z.coerce.number().int().min(0).default(0), image: z.string().url().optional(), price: z.coerce.number().positive().optional() })).optional(),
    });
    const data = parseOrThrow(schema, req.body || {});
    const created = await service.createProduct(data);
    res.status(201).json({ product: created });
  } catch (e) { next(e); }
}

export async function updateProduct(req, res, next) {
  try {
    const schema = z.object({
      name: z.string().trim().min(1).optional(),
      description: z.string().optional(),
      price: z.coerce.number().positive().optional(),
      image: z.string().url().optional(),
      categoryId: z.string().uuid().optional(),
      loyaltyPointsAwarded: z.coerce.number().int().min(0).optional(),
      loyaltyPointsRequired: z.coerce.number().int().min(0).optional(),
      carouselImages: z.array(z.string().url()).optional(),
      variants: z.array(z.object({ color: z.string().optional(), size: z.string().optional(), stock: z.coerce.number().int().min(0).default(0), image: z.string().url().optional(), price: z.coerce.number().positive().optional() })).optional(),
    });
    const data = parseOrThrow(schema, req.body || {});
    
    // Get the old product to check if image changed
    const oldProduct = await service.getProductById(req.params.id);
    if (!oldProduct) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }
    
    // Update the product
    const updated = await service.updateProduct(req.params.id, data);
    
    // If image changed, delete the old file
    if (oldProduct.image && oldProduct.image !== data.image) {
      try {
        // Extract file ID from the old image
        const oldImageUrl = oldProduct.image;
        if (oldImageUrl.includes('/uploads/content/')) {
          const fileName = oldImageUrl.split('/').pop();
          const fileId = fileName.split('.')[0]; // Remove extension
          
          // Delete the old file
          const { deleteUpload } = await import('../uploads/upload.service.js');
          await deleteUpload(fileId, 'products');
          console.log(`Deleted old product image: ${fileId}`);
        }
      } catch (deleteError) {
        console.error('Error deleting old product image:', deleteError);
        // Don't fail the update if file deletion fails
      }
    }
    
    // Handle carousel images deletion
    if (data.carouselImages && Array.isArray(data.carouselImages)) {
      try {
        // Get old carousel images
        const oldCarouselImages = oldProduct.images || [];
        const newCarouselUrls = data.carouselImages;
        
        // Find images that were removed
        const removedImages = oldCarouselImages.filter(oldImg => 
          !newCarouselUrls.includes(oldImg.url)
        );
        
        // Delete removed carousel images
        for (const removedImage of removedImages) {
          try {
            const oldImageUrl = removedImage.url;
            if (oldImageUrl.includes('/uploads/content/')) {
              const fileName = oldImageUrl.split('/').pop();
              const fileId = fileName.split('.')[0]; // Remove extension
              
              // Delete the old file
              const { deleteUpload } = await import('../uploads/upload.service.js');
              await deleteUpload(fileId, 'products');
              console.log(`Deleted old carousel image: ${fileId}`);
            }
          } catch (deleteError) {
            console.error('Error deleting old carousel image:', deleteError);
            // Continue with other images even if one fails
          }
        }
      } catch (carouselError) {
        console.error('Error handling carousel images deletion:', carouselError);
        // Don't fail the update if carousel image deletion fails
      }
    }
    
    res.json({ product: updated });
  } catch (e) { next(e); }
}

export async function deleteProduct(req, res, next) {
  try {
    const productId = req.params.id;
    
    // Get the product before deleting to access the images
    const product = await service.getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }
    
    // Delete the product from database
    await service.deleteProduct(productId);
    
    // Delete the main image file
    if (product.image) {
      try {
        const imageUrl = product.image;
        if (imageUrl.includes('/uploads/content/')) {
          const fileName = imageUrl.split('/').pop();
          const fileId = fileName.split('.')[0]; // Remove extension
          
          // Delete the file
          const { deleteUpload } = await import('../uploads/upload.service.js');
          await deleteUpload(fileId, 'products');
          console.log(`Deleted product main image: ${fileId}`);
        }
      } catch (deleteError) {
        console.error('Error deleting product main image:', deleteError);
        // Don't fail the deletion if file deletion fails
      }
    }
    
    // Delete carousel images
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        try {
          const imageUrl = image.url;
          if (imageUrl.includes('/uploads/content/')) {
            const fileName = imageUrl.split('/').pop();
            const fileId = fileName.split('.')[0]; // Remove extension
            
            // Delete the file
            const { deleteUpload } = await import('../uploads/upload.service.js');
            await deleteUpload(fileId, 'products');
            console.log(`Deleted product carousel image: ${fileId}`);
          }
        } catch (deleteError) {
          console.error('Error deleting product carousel image:', deleteError);
          // Continue with other images even if one fails
        }
      }
    }
    
    res.status(204).send();
  } catch (e) { next(e); }
}

// Get new arrivals
export async function getNewArrivals(req, res, next) {
  try {
    const schema = z.object({
      limit: z.coerce.number().int().min(1).max(50).default(8),
      currency: z.enum(['EGP', 'SAR', 'AED', 'USD']).optional()
    });
    const { limit, currency } = parseOrThrow(schema, req.query);
    const result = await service.getNewArrivals({ 
      limit, 
      currency: currency || req.currency 
    });
    res.json({
      ...result,
      currency: currency || req.currency,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (e) { next(e); }
}

// Get all products for shop-all page
export async function getAllProducts(req, res, next) {
  try {
    const schema = paginationSchema.extend({
      categoryId: z.string().uuid().optional(),
      currency: z.enum(['EGP', 'SAR', 'AED', 'USD']).optional(),
      search: z.string().optional()
    });
    const base = parseOrThrow(schema, req.query);
    const { skip, take } = buildPagination(base);
    const result = await service.getAllProducts({ 
      skip, 
      take, 
      categoryId: base.categoryId,
      currency: base.currency || req.currency,
      search: base.search
    });
    res.json({
      ...result,
      currency: base.currency || req.currency,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (e) { next(e); }
}

export async function getRelatedProducts(req, res, next) {
  try {
    const schema = z.object({
      id: z.string().uuid(),
      limit: z.coerce.number().int().min(1).max(20).default(4),
      currency: z.enum(['EGP', 'SAR', 'AED', 'USD']).optional()
    });
    const { id, limit, currency } = parseOrThrow(schema, { ...req.params, ...req.query });
    const relatedProducts = await service.getRelatedProducts(id, limit);
    res.json({
      items: relatedProducts,
      total: relatedProducts.length,
      currency: currency || req.currency,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (e) { next(e); }
}

