import express from 'express';
import { requireAuth, requireAdmin } from '../../middlewares/authMiddleware.js';
import { sendProgrammeEmail, sendBatchProgrammeEmails } from './programmeEmail.controller.js';

const router = express.Router();

// Admin routes for programme email management
router.post('/send/:programmePurchaseId', requireAuth, requireAdmin, sendProgrammeEmail);
router.post('/send-batch', requireAuth, requireAdmin, sendBatchProgrammeEmails);

export default router;
