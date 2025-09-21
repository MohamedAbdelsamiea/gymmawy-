import * as service from "./cart.service.js";
import { z } from "zod";
import { parseOrThrow } from "../../utils/validation.js";

export async function getCart(req, res, next) {
  try {
    const cart = await service.getOrCreateCart(req.user.id);
    res.json({ cart });
  } catch (e) { next(e); }
}

export async function addItem(req, res, next) {
  try {
    const schema = z.object({ productVariantId: z.string().uuid(), quantity: z.coerce.number().int().min(1).default(1) });
    const data = parseOrThrow(schema, req.body || {});
    await service.addItem(req.user.id, data);
    const cart = await service.getOrCreateCart(req.user.id);
    res.json({ cart });
  } catch (e) { next(e); }
}

export async function updateItem(req, res, next) {
  try {
    const schema = z.object({ productVariantId: z.string().uuid(), quantity: z.coerce.number().int().min(1) });
    const data = parseOrThrow(schema, req.body || {});
    await service.updateQuantity(req.user.id, data);
    const cart = await service.getOrCreateCart(req.user.id);
    res.json({ cart });
  } catch (e) { next(e); }
}

export async function removeItem(req, res, next) {
  try {
    await service.removeItem(req.user.id, req.params.itemId);
    const cart = await service.getOrCreateCart(req.user.id);
    res.json({ cart });
  } catch (e) { next(e); }
}

export async function clearCart(req, res, next) {
  try {
    await service.clearCart(req.user.id);
    res.json({ success: true, message: "Cart cleared successfully" });
  } catch (e) { next(e); }
}

export async function applyCoupon(req, res, next) {
  try {
    const schema = z.object({ code: z.string().min(1) });
    const data = parseOrThrow(schema, req.body || {});
    const result = await service.applyCoupon(req.user.id, data.code);
    res.json(result);
  } catch (e) { next(e); }
}

export async function removeCoupon(req, res, next) {
  try {
    await service.removeCoupon(req.user.id);
    res.json({ success: true, message: "Coupon removed successfully" });
  } catch (e) { next(e); }
}


