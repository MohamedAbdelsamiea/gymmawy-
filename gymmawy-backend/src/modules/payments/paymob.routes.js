import express from 'express';
import {
  createIntention,
  handleWebhook,
  getIntentionStatus,
  refundTransaction,
  getPaymentHistory,
  verifyPaymentPublic,
  testWebhook,
  getWebhookStatus
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
router.post('/test-webhook', requireAuth, testWebhook);
router.get('/webhook-status', requireAuth, getWebhookStatus);

export default router;
