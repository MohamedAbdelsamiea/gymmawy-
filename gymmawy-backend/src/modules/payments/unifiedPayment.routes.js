import express from 'express';
import {
  getPaymentProviders,
  createPayment,
  getPaymentStatus,
  processRefund,
  getPaymentHistory,
  handleWebhook,
  getPaymentStats
} from './unifiedPayment.controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/webhook/:provider', handleWebhook);

// Protected routes (authentication required)
router.get('/providers', requireAuth, getPaymentProviders);
router.post('/create', requireAuth, createPayment);
router.get('/:paymentId/status', requireAuth, getPaymentStatus);
router.post('/refund', requireAuth, processRefund);
router.get('/history', requireAuth, getPaymentHistory);
router.get('/stats', requireAuth, getPaymentStats);

export default router;
