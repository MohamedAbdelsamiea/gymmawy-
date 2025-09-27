import fs from 'fs';
import path from 'path';

// Create upload record (no database storage needed for file uploads)
export const createUploadRecord = async (uploadData) => {
  // For now, we'll just return the upload data without database storage
  // This can be extended later if we need to track uploads in the database
  return {
    id: uploadData.id,
    originalName: uploadData.originalName,
    fileName: uploadData.fileName,
    url: uploadData.url,
    size: uploadData.size,
    mimetype: uploadData.mimetype,
    category: uploadData.category || 'images',
    isPublic: uploadData.isPublic,
    uploadedBy: uploadData.uploadedBy || null
  };
};

// Get upload by ID (placeholder - no database storage)
export const getUploadById = async (id) => {
  // Since we're not storing uploads in database, return null
  return null;
};

// Get uploads by user (placeholder - no database storage)
export const getUploadsByUser = async (userId) => {
  // Since we're not storing uploads in database, return empty array
  return [];
};

// Get public uploads (placeholder - no database storage)
export const getPublicUploads = async () => {
  // Since we're not storing uploads in database, return empty array
  return [];
};

// Get admin uploads (placeholder - no database storage)
export const getAdminUploads = async () => {
  // Since we're not storing uploads in database, return empty array
  return [];
};

// Delete upload file by ID and category
export const deleteUpload = async (fileId, category = 'products') => {
  try {
    // For videos, we need to find the file with any extension
    if (category === 'videos') {
      const videoDir = path.join('uploads', 'content', 'videos');
      
      // Check if directory exists
      if (!fs.existsSync(videoDir)) {
        console.log(`Video directory not found: ${videoDir}`);
        return { success: false, message: 'Video directory not found' };
      }
      
      // Find the file with the given ID (any extension)
      const files = fs.readdirSync(videoDir);
      const targetFile = files.find(file => file.startsWith(fileId));
      
      if (targetFile) {
        const filePath = path.join(videoDir, targetFile);
        fs.unlinkSync(filePath);
        console.log(`Deleted video file: ${filePath}`);
        return { success: true, message: 'Video file deleted successfully' };
      } else {
        console.log(`Video file not found with ID: ${fileId}`);
        return { success: false, message: 'Video file not found' };
      }
    } else {
      // For images, use .webp extension
      const fileName = `${fileId}.webp`;
      const filePath = path.join('uploads', 'content', category, fileName);
      
      // Delete file from filesystem
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
        return { success: true, message: 'File deleted successfully' };
      } else {
        console.log(`File not found: ${filePath}`);
        return { success: false, message: 'File not found' };
      }
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Delete subscription plan image by URL
export const deleteSubscriptionPlanImage = async (imageUrl) => {
  try {
    if (!imageUrl) {
      return { success: true, message: 'No image URL provided' };
    }

    // Extract file ID from URL
    // URL format: /uploads/content/subscription-plans/{fileId}.webp
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    if (!fileName || !fileName.endsWith('.webp')) {
      console.log(`Invalid image URL format: ${imageUrl}`);
      return { success: false, message: 'Invalid image URL format' };
    }

    const fileId = fileName.replace('.webp', '');
    const filePath = path.join('uploads', 'content', 'subscription-plans', fileName);
    
    // Delete file from filesystem
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted subscription plan image: ${filePath}`);
      return { success: true, message: 'Subscription plan image deleted successfully' };
    } else {
      console.log(`Subscription plan image not found: ${filePath}`);
      return { success: false, message: 'Subscription plan image not found' };
    }
  } catch (error) {
    console.error('Error deleting subscription plan image:', error);
    throw error;
  }
};

// Clean up old files (simplified version without database)
export const cleanupOrphanedFiles = async () => {
  try {
    const uploadDirs = [
      'uploads/content/plans',
      'uploads/content/subscription-plans',
      'uploads/content/products',
      'uploads/content/programmes',
      'uploads/content/transformations',
      'uploads/content/videos',
      'uploads/content/documents',
      'uploads/payment-proofs',
      'uploads/temp'
    ];
    const cleanedFiles = [];

    for (const dir of uploadDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
          
          // Delete files older than 30 days
          if (ageInDays > 30) {
            fs.unlinkSync(filePath);
            cleanedFiles.push(filePath);
            console.log(`Cleaned up old file: ${filePath}`);
          }
        }
      }
    }

    return { 
      success: true, 
      message: `Cleaned up ${cleanedFiles.length} old files`,
      cleanedFiles 
    };
  } catch (error) {
    console.error('Error cleaning up old files:', error);
    throw error;
  }
};

// Clean up orphaned subscription plan images
export const cleanupOrphanedSubscriptionPlanImages = async () => {
  try {
    // Import Prisma client
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Get all subscription plan image URLs from database
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        deletedAt: null, // Only active plans
        imageUrl: {
          not: null
        }
      },
      select: {
        imageUrl: true
      }
    });

    const activeImageUrls = new Set(plans.map(plan => plan.imageUrl).filter(Boolean));

    // Get all files in subscription-plans directory
    const subscriptionPlansDir = 'uploads/content/subscription-plans';
    if (!fs.existsSync(subscriptionPlansDir)) {
      return { 
        success: true, 
        message: 'Subscription plans directory not found',
        cleanedFiles: [] 
      };
    }

    const files = fs.readdirSync(subscriptionPlansDir);
    const cleanedFiles = [];

    for (const file of files) {
      const filePath = path.join(subscriptionPlansDir, file);
      const imageUrl = `/uploads/content/subscription-plans/${file}`;
      
      // If this file is not referenced by any active subscription plan, delete it
      if (!activeImageUrls.has(imageUrl)) {
        try {
          fs.unlinkSync(filePath);
          cleanedFiles.push(filePath);
          console.log(`Cleaned up orphaned subscription plan image: ${filePath}`);
        } catch (error) {
          console.error(`Error deleting orphaned file ${filePath}:`, error);
        }
      }
    }

    await prisma.$disconnect();

    return { 
      success: true, 
      message: `Cleaned up ${cleanedFiles.length} orphaned subscription plan images`,
      cleanedFiles 
    };
  } catch (error) {
    console.error('Error cleaning up orphaned subscription plan images:', error);
    throw error;
  }
};

export const deleteProgrammeImage = async (imageUrl) => {
  try {
    if (!imageUrl) {
      return { success: true, message: 'No image URL provided' };
    }
    
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    if (!fileName || !fileName.endsWith('.webp')) {
      console.log(`Invalid image URL format: ${imageUrl}`);
      return { success: false, message: 'Invalid image URL format' };
    }
    
    const fileId = fileName.replace('.webp', '');
    const filePath = path.join('uploads', 'content', 'programmes', fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted programme image: ${filePath}`);
      return { success: true, message: 'Programme image deleted successfully' };
    } else {
      console.log(`Programme image not found: ${filePath}`);
      return { success: false, message: 'Programme image not found' };
    }
  } catch (error) {
    console.error('Error deleting programme image:', error);
    throw error;
  }
};

export const cleanupOrphanedProgrammeImages = async () => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Get all active programmes with image URLs
    const programmes = await prisma.programme.findMany({
      where: {
        deletedAt: null,
        imageUrl: { not: null }
      },
      select: { imageUrl: true }
    });
    
    // Create a set of active image URLs
    const activeImageUrls = new Set(programmes.map(programme => programme.imageUrl).filter(Boolean));
    
    // Check the programmes directory
    const programmesDir = 'uploads/content/programmes';
    if (!fs.existsSync(programmesDir)) {
      console.log('Programmes directory does not exist');
      await prisma.$disconnect();
      return { success: true, message: 'No programmes directory found', cleanedFiles: [] };
    }
    
    const files = fs.readdirSync(programmesDir);
    const cleanedFiles = [];
    
    for (const file of files) {
      const filePath = path.join(programmesDir, file);
      const imageUrl = `/uploads/content/programmes/${file}`;
      
      if (!activeImageUrls.has(imageUrl)) {
        try {
          fs.unlinkSync(filePath);
          cleanedFiles.push(filePath);
          console.log(`Cleaned up orphaned programme image: ${filePath}`);
        } catch (error) {
          console.error(`Error deleting orphaned file ${filePath}:`, error);
        }
      }
    }
    
    await prisma.$disconnect();
    return { 
      success: true, 
      message: `Cleaned up ${cleanedFiles.length} orphaned programme images`, 
      cleanedFiles 
    };
  } catch (error) {
    console.error('Error cleaning up orphaned programme images:', error);
    throw error;
  }
};

// Get uploads by category (placeholder - no database storage)
export const getUploadsByCategory = async (category, isPublic = false) => {
  return [];
};

// Get payment proof uploads (placeholder - no database storage)
export const getPaymentProofs = async () => {
  return [];
};

// Get public images (placeholder - no database storage)
export const getPublicImages = async () => {
  return [];
};

// Get private images (placeholder - no database storage)
export const getPrivateImages = async () => {
  return [];
};

// Get upload statistics (placeholder - no database storage)
export const getUploadStats = async () => {
  return {
    totalUploads: 0,
    publicUploads: 0,
    privateUploads: 0,
    totalSize: 0,
    categoryStats: []
  };
};

// Product image cleanup functions
export const deleteProductImage = async (imageUrl) => {
  try {
    if (!imageUrl) {
      return { success: true, message: 'No image URL provided' };
    }
    
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    if (!fileName || !fileName.endsWith('.webp')) {
      console.log(`Invalid image URL format: ${imageUrl}`);
      return { success: false, message: 'Invalid image URL format' };
    }
    
    const fileId = fileName.replace('.webp', '');
    const filePath = path.join('uploads', 'content', 'products', fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted product image: ${filePath}`);
      return { success: true, message: 'Product image deleted successfully' };
    } else {
      console.log(`Product image not found: ${filePath}`);
      return { success: false, message: 'Product image not found' };
    }
  } catch (error) {
    console.error('Error deleting product image:', error);
    throw error;
  }
};

export const cleanupOrphanedProductImages = async () => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Get all active products with image URLs
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
        imageUrl: { not: null }
      },
      select: { imageUrl: true }
    });
    
    // Get all product images from the database
    const productImages = await prisma.productImage.findMany({
      where: {
        product: {
          deletedAt: null
        }
      },
      select: { url: true }
    });
    
    // Create a set of active image URLs
    const activeImageUrls = new Set([
      ...products.map(product => product.imageUrl).filter(Boolean),
      ...productImages.map(image => image.url).filter(Boolean)
    ]);
    
    // Check the products directory
    const productsDir = 'uploads/content/products';
    if (!fs.existsSync(productsDir)) {
      console.log('Products directory does not exist');
      await prisma.$disconnect();
      return { success: true, message: 'No products directory found', cleanedFiles: [] };
    }
    
    const files = fs.readdirSync(productsDir);
    const cleanedFiles = [];
    
    for (const file of files) {
      const filePath = path.join(productsDir, file);
      const imageUrl = `/uploads/content/products/${file}`;
      
      if (!activeImageUrls.has(imageUrl)) {
        try {
          fs.unlinkSync(filePath);
          cleanedFiles.push(filePath);
          console.log(`Cleaned up orphaned product image: ${filePath}`);
        } catch (error) {
          console.error(`Error deleting orphaned file ${filePath}:`, error);
        }
      }
    }
    
    await prisma.$disconnect();
    return { 
      success: true, 
      message: `Cleaned up ${cleanedFiles.length} orphaned product images`, 
      cleanedFiles 
    };
  } catch (error) {
    console.error('Error cleaning up orphaned product images:', error);
    throw error;
  }
};
