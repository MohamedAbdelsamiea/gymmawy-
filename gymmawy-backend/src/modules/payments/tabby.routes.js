import { Router } from 'express';
import {
  createTabbyCheckout,
  handleTabbyWebhook,
  getTabbyPaymentStatus,
  captureTabbyPayment,
  refundTabbyPayment,
  closeTabbyPayment,
  setupTabbyWebhook,
  listTabbyWebhooks,
  checkTabbyAvailability,
  manualCapturePayment,
  performPrescoring
} from './tabby.controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';

const router = Router();

// Public routes (no authentication required)
router.post('/webhook', handleTabbyWebhook);
router.post('/webhook/setup', setupTabbyWebhook);
router.get('/webhooks', listTabbyWebhooks);
router.get('/availability', checkTabbyAvailability);
router.post('/prescoring', performPrescoring);

// Protected routes (require authentication)
router.use(requireAuth);

// Checkout routes
router.post('/checkout', createTabbyCheckout);

// Payment management routes
router.get('/payment/:paymentId/status', getTabbyPaymentStatus);
router.post('/payment/:paymentId/capture', captureTabbyPayment);
router.post('/payment/:paymentId/manual-capture', manualCapturePayment);
router.post('/payment/:paymentId/refund', refundTabbyPayment);
router.post('/payment/:paymentId/close', closeTabbyPayment);

export default router;
