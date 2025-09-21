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
      variants: z.array(z.object({ color: z.string().optional(), size: z.string().optional(), stock: z.coerce.number().int().min(0).default(0), image: z.string().url().optional(), price: z.coerce.number().positive().optional() })).optional(),
    });
    const data = parseOrThrow(schema, req.body || {});
    const updated = await service.updateProduct(req.params.id, data);
    res.json({ product: updated });
  } catch (e) { next(e); }
}

export async function deleteProduct(req, res, next) {
  try {
    await service.deleteProduct(req.params.id);
    res.status(204).send();
  } catch (e) { next(e); }
}

