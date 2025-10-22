import { z } from "zod";
import * as service from "./subscription.service.js";
import { parseOrThrow } from "../../utils/validation.js";

export async function subscribe(req, res, next) {
  try {
    const sub = await service.subscribeToPlan(req.user.id, req.body.planId);
    res.status(201).json({ subscription: sub });
  } catch (e) { next(e); }
}

export async function createSubscriptionWithPayment(req, res, next) {
  try {
    console.log('Subscription request body:', JSON.stringify(req.body, null, 2));
    
    const schema = z.object({
      planId: z.string().uuid(),
      paymentMethod: z.enum(["INSTAPAY", "VODAFONECASH", "TABBY", "TAMARA", "CARD", "CASH", "PAYMOB"]).optional(),
      paymentProof: z.string().min(1).optional(),
      isMedical: z.boolean().optional(),
      currency: z.string().default("EGP"),
      couponId: z.string().uuid().nullable().optional(),
      reason: z.string().optional(), // User's reason for subscribing
      // Remove all price fields - backend calculates everything
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
    res.json({ subscription: sub });
  } catch (e) { next(e); }
}

export async function listPlans(req, res, next) {
  try {
    const plans = await service.listPlans(req);
    res.json({ plans });
  } catch (e) { next(e); }
}

export async function activateSubscription(req, res, next) {
  try {
    const { id } = req.params;
    const subscription = await service.activateSubscription(id, req.user.id);
    res.json({ subscription });
  } catch (e) { next(e); }
}

export async function adminUpdateSubscriptionStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const subscription = await service.adminUpdateSubscriptionStatus(id, status);
    res.json({ subscription });
  } catch (e) { next(e); }
}

// New endpoint to manually fix subscription status
export async function fixSubscriptionStatus(req, res, next) {
  try {
    const { subscriptionId } = req.params;
    const { status = 'PAID' } = req.body;
    
    console.log(`🔧 Manually fixing subscription ${subscriptionId} to status: ${status}`);
    
    const subscription = await service.adminUpdateSubscriptionStatus(subscriptionId, status);
    
    // Also update any related payment records
    const { getPrismaClient } = await import('../../config/db.js');
    const prisma = getPrismaClient();
    
    const payments = await prisma.payment.findMany({
      where: {
        paymentableId: subscriptionId,
        paymentableType: 'SUBSCRIPTION'
      }
    });
    
    if (payments.length > 0) {
      await prisma.payment.updateMany({
        where: {
          paymentableId: subscriptionId,
          paymentableType: 'SUBSCRIPTION'
        },
        data: {
          status: 'SUCCESS',
          processedAt: new Date()
        }
      });
      
      console.log(`✅ Updated ${payments.length} payment records to SUCCESS`);
    }
    
    res.json({ 
      success: true, 
      message: `Subscription ${subscriptionId} status updated to ${status}`,
      subscription 
    });
  } catch (e) { 
    console.error('Error fixing subscription status:', e);
    next(e); 
  }
}