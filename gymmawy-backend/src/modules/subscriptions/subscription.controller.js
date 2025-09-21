import * as service from "./subscription.service.js";
import { z } from "zod";
import { parseOrThrow } from "../../utils/validation.js";

export async function listPlans(req, res, next) {
  try { 
    const items = await service.listPlans(req); 
    res.json({ 
      items,
      currency: req.currency,
      meta: {
        timestamp: new Date().toISOString()
      }
    }); 
  } catch (e) { next(e); }
}

export async function subscribe(req, res, next) {
  try {
    const schema = z.object({ planId: z.string().uuid() });
    const { planId } = parseOrThrow(schema, req.body || {});
    const sub = await service.subscribeToPlan(req.user.id, planId);
    res.status(201).json({ subscription: sub });
  } catch (e) { next(e); }
}

export async function createSubscriptionWithPayment(req, res, next) {
  try {
    console.log('Subscription request body:', JSON.stringify(req.body, null, 2));
    
    const schema = z.object({
      planId: z.string().uuid(),
      paymentMethod: z.enum(["INSTA_PAY", "VODAFONE_CASH", "TABBY", "TAMARA", "CARD", "CASH"]).optional(),
      paymentProof: z.string().min(1).optional(),
      isMedical: z.boolean().optional(),
      price: z.coerce.number().positive(),
      currency: z.string().default("EGP"),
      discount: z.coerce.number().min(0).optional(),
      subscriptionPeriodDays: z.coerce.number().int().min(1).optional(),
      giftPeriodDays: z.coerce.number().int().min(0).optional(),
      planName: z.string().optional(),
      planDescription: z.string().optional(),
      planDiscountPercentage: z.coerce.number().min(0).max(100).optional(),
      totalDiscountAmount: z.coerce.number().min(0).optional(),
      originalPrice: z.coerce.number().positive().optional(),
      couponId: z.string().uuid().nullable().optional(),
      couponDiscount: z.coerce.number().min(0).optional()
    });
    const data = parseOrThrow(schema, req.body || {});
    const subscription = await service.createSubscriptionWithPayment(req.user.id, data);
    res.status(201).json({ subscription });
  } catch (e) { 
    console.log('Validation error:', e.message);
    next(e); 
  }
}

export async function listUserSubscriptions(req, res, next) {
  try {
    const items = await service.listUserSubscriptions(req.user.id);
    res.json({ items });
  } catch (e) { next(e); }
}

export async function cancel(req, res, next) {
  try {
    const sub = await service.cancelSubscription(req.user.id, req.params.id);
    if (!sub) return res.status(404).json({ error: { message: "Not found" } });
    res.json({ subscription: sub });
  } catch (e) { next(e); }
}

// Admin functions
export async function getPendingSubscriptions(req, res, next) {
  try {
    const subscriptions = await service.getPendingSubscriptions();
    res.json({ subscriptions });
  } catch (e) { next(e); }
}

export async function approveSubscription(req, res, next) {
  try {
    const subscription = await service.approveSubscription(req.params.id);
    res.json({ subscription });
  } catch (e) { next(e); }
}

export async function rejectSubscription(req, res, next) {
  try {
    const schema = z.object({
      reason: z.string().optional()
    });
    const { reason } = parseOrThrow(schema, req.body || {});
    const subscription = await service.rejectSubscription(req.params.id, reason);
    res.json({ subscription });
  } catch (e) { next(e); }
}

export async function expireSubscriptions(req, res, next) {
  try {
    const result = await service.expireSubscriptions();
    res.json(result);
  } catch (e) { next(e); }
}

