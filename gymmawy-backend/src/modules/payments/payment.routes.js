import express from 'express';
import { requireAuth, requireAdmin } from '../../middlewares/authMiddleware.js';
import * as controller from './payment.controller.js';

const router = express.Router();

// User routes
router.post('/upload-proof', requireAuth, controller.uploadPaymentProof);
router.get('/:paymentId', requireAuth, controller.getPaymentById);

// Admin routes
router.get('/admin/pending', requireAuth, requireAdmin, controller.getPendingPayments);
router.post('/admin/:paymentId/approve', requireAuth, requireAdmin, controller.approvePayment);
router.post('/admin/:paymentId/reject', requireAuth, requireAdmin, controller.rejectPayment);

export default router;