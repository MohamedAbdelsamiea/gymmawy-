import * as service from "./payment.service.js";
import { z } from "zod";
import { parseOrThrow } from "../../utils/validation.js";

export async function uploadPaymentProof(req, res, next) {
  try {
    const schema = z.object({
      paymentId: z.string().uuid(),
      proofUrl: z.string().url()
    });
    const { paymentId, proofUrl } = parseOrThrow(schema, req.body || {});
    
    const payment = await service.uploadPaymentProof(req.user.id, paymentId, proofUrl);
    res.json({ payment });
  } catch (e) { 
    next(e); 
  }
}

export async function getPendingPayments(req, res, next) {
  try {
    const { page = 1, pageSize = 10, status = 'PENDING_VERIFICATION' } = req.query;
    const payments = await service.getPendingPayments({ page: parseInt(page), pageSize: parseInt(pageSize), status });
    res.json(payments);
  } catch (e) { 
    next(e); 
  }
}

export async function approvePayment(req, res, next) {
  try {
    const { paymentId } = req.params;
    const result = await service.approvePayment(paymentId, req.user.id);
    res.json({ message: "Payment approved successfully", subscription: result.subscription, order: result.order, programmePurchase: result.programmePurchase });
  } catch (e) { 
    next(e); 
  }
}

export async function rejectPayment(req, res, next) {
  try {
    const { paymentId } = req.params;
    const result = await service.rejectPayment(paymentId, req.user.id);
    res.json({ message: "Payment rejected successfully", subscription: result.subscription, order: result.order, programmePurchase: result.programmePurchase });
  } catch (e) { 
    next(e); 
  }
}

export async function getPaymentById(req, res, next) {
  try {
    const { paymentId } = req.params;
    const payment = await service.getPaymentById(paymentId);
    if (!payment) return res.status(404).json({ error: { message: "Payment not found" } });
    res.json({ payment });
  } catch (e) { 
    next(e); 
  }
}

export async function createPayment(req, res, next) {
  try {
    const schema = z.object({
      amount: z.number().positive(),
      currency: z.enum(['EGP', 'SAR', 'AED', 'USD']),
      method: z.enum(['INSTA_PAY', 'VODAFONE_CASH', 'TABBY', 'TAMARA', 'CARD']),
      transactionId: z.string().optional(),
      paymentProofUrl: z.string().url().optional(),
      paymentableId: z.string().uuid(),
      paymentableType: z.enum(['PRODUCT', 'PLAN', 'PROGRAMME', 'MEDICAL', 'SUBSCRIPTION', 'PRODUCT', 'PROGRAMME']),
      metadata: z.object({}).optional()
    });
    
    const paymentData = parseOrThrow(schema, req.body || {});
    paymentData.userId = req.user.id;
    
    const payment = await service.createPayment(paymentData);
    res.status(201).json({ payment });
  } catch (e) { 
    next(e); 
  }
}