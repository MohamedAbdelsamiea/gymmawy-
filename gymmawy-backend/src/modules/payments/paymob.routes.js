import express from 'express';
import {
  createIntention,
  handleWebhook,
  getIntentionStatus,
  refundTransaction,
  getPaymentHistory,
  verifyPaymentPublic
} from './paymob.controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/webhook', handleWebhook);
router.get('/payment/:paymentId/verify', verifyPaymentPublic);

// Protected routes (authentication required)
router.post('/create-intention', requireAuth, createIntention);
router.get('/intention/:intentionId/status', requireAuth, getIntentionStatus);
router.post('/refund', requireAuth, refundTransaction);
router.get('/payments', requireAuth, getPaymentHistory);

export default router;
