import * as service from "./coupon.service.js";
import { z } from "zod";
import { parseOrThrow } from "../../utils/validation.js";

export async function apply(req, res, next) {
  try {
    const schema = z.object({ code: z.string().trim().min(1) });
    const { code } = parseOrThrow(schema, req.body || {});
    const coupon = await service.applyCouponToOrderOrCart(req.user.id, code);
    res.json({ coupon });
  } catch (e) { next(e); }
}

export async function redeem(req, res, next) {
  try {
    const coupon = await service.redeemCoupon(req.user.id, req.params.code);
    res.json({ coupon });
  } catch (e) { next(e); }
}

export async function create(req, res, next) {
  try {
    console.log('🚀 COUPON CREATE ENDPOINT HIT - VERSION 3!');
    console.log('🚀 Raw request body:', JSON.stringify(req.body, null, 2));
    
    const schema = z.object({
      code: z.string().trim().min(3),
      discountType: z.enum(["PERCENTAGE"]),
      discountValue: z.coerce.number().positive(),
      expirationDate: z.coerce.date(),
      maxRedemptions: z.coerce.number().int().min(0).nullable().optional(),
      isActive: z.coerce.boolean(),
    });
    const data = parseOrThrow(schema, req.body || {});
    
    console.log('🚀 Parsed data:', JSON.stringify(data, null, 2));
    
    console.log('=== COUPON CREATE DEBUG ===');
    console.log('Raw request body:', req.body);
    console.log('Parsed data:', data);
    console.log('maxRedemptions in data:', data.maxRedemptions, 'type:', typeof data.maxRedemptions);
    console.log('maxRedemptions === 0:', data.maxRedemptions === 0);
    console.log('maxRedemptions === null:', data.maxRedemptions === null);
    console.log('maxRedemptions === undefined:', data.maxRedemptions === undefined);
    
    // Map the data to match the database schema
    const couponData = {
      code: data.code,
      discountPercentage: data.discountValue, // Map discountValue to discountPercentage
      expirationDate: data.expirationDate,
      isActive: data.isActive
    };
    
    // Only set maxRedemptions if it's defined
    if (data.maxRedemptions !== undefined) couponData.maxRedemptions = data.maxRedemptions === null || data.maxRedemptions === 0 ? null : data.maxRedemptions;
    
    console.log('Mapped couponData:', couponData);
    console.log('maxRedemptions in couponData:', couponData.maxRedemptions);
    console.log('===============================');
    
    const created = await service.createCoupon(couponData);
    res.status(201).json({ coupon: created });
  } catch (e) { next(e); }
}

export async function getMyCoupons(req, res, next) {
  try {
    const coupons = await service.getUserCoupons(req.user.id);
    res.json({ coupons });
  } catch (e) { next(e); }
}

export async function validateCoupon(req, res, next) {
  try {
    // Only check user-specific usage if user is authenticated
    const userId = req.user?.id || null;
    const coupon = await service.validateCoupon(req.params.code, userId);
    res.json({ 
      coupon,
      discount: coupon.discountPercentage,
      discountType: 'percentage',
      message: 'Coupon is valid'
    });
  } catch (e) { next(e); }
}

export async function list(_req, res, next) {
  try {
    const items = await service.listCoupons();
    res.json({ items });
  } catch (e) { next(e); }
}

export async function getById(req, res, next) {
  try {
    const coupon = await service.getCouponById(req.params.id);
    if (!coupon) return res.status(404).json({ error: { message: "Coupon not found" } });
    res.json({ coupon });
  } catch (e) { next(e); }
}

export async function update(req, res, next) {
  try {
    console.log('=== COUPON UPDATE REQUEST ===');
    console.log('Raw request body:', req.body);
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    const schema = z.object({
      code: z.string().trim().min(3).optional(),
      discountType: z.enum(["PERCENTAGE"]).optional(),
      discountValue: z.coerce.number().positive().optional(),
      expirationDate: z.coerce.date().optional(),
      maxRedemptions: z.coerce.number().int().min(0).nullable().optional(),
      isActive: z.coerce.boolean().optional(),
    });
    
    console.log('About to parse data with schema...');
    const data = parseOrThrow(schema, req.body || {});
    
    console.log('Parsed data:', data);
    console.log('maxRedemptions in data:', data.maxRedemptions);
    
    // Map the data to match the database schema
    const couponData = {};
    if (data.code !== undefined) couponData.code = data.code;
    if (data.discountValue !== undefined) couponData.discountPercentage = data.discountValue;
    if (data.expirationDate !== undefined) couponData.expirationDate = data.expirationDate;
    if (data.maxRedemptions !== undefined) couponData.maxRedemptions = data.maxRedemptions || null; // Convert 0 to null for unlimited
    if (data.isActive !== undefined) couponData.isActive = data.isActive;
    
    console.log('Mapped couponData:', couponData);
    console.log('maxRedemptions in couponData:', couponData.maxRedemptions);
    
    const coupon = await service.updateCoupon(req.params.id, couponData);
    res.json({ coupon });
  } catch (e) { next(e); }
}

export async function deleteCoupon(req, res, next) {
  try {
    await service.deleteCoupon(req.params.id);
    res.status(204).send();
  } catch (e) { next(e); }
}

export async function getUsageStats(req, res, next) {
  try {
    const schema = z.object({ id: z.string().uuid() });
    const { id } = parseOrThrow(schema, req.params);
    const stats = await service.getCouponUsageStats(id);
    res.json(stats);
  } catch (e) { next(e); }
}

