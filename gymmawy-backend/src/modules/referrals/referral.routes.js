import express from 'express';
import { requireAuth, requireAdmin } from '../../middlewares/authMiddleware.js';
import { 
  getReferrals, 
  createReferral, 
  updateReferral, 
  deleteReferral,
  getMyReferralCodes,
  validateReferralCode,
  deactivateReferralCode,
  getReferralAnalytics,
  getReferralRewards,
  generateReferralCode,
  useReferralCode
} from './referral.controller.js';

const router = express.Router();

router.get('/my-codes', requireAuth, getMyReferralCodes);
router.get('/validate/:code', requireAuth, validateReferralCode);
router.delete('/:code', requireAuth, deactivateReferralCode);
router.get('/analytics', requireAuth, getReferralAnalytics);
router.get('/rewards', requireAuth, getReferralRewards);
router.post('/generate', requireAuth, generateReferralCode);
router.post('/use', requireAuth, useReferralCode);

// Admin routes
router.get('/', requireAuth, requireAdmin, getReferrals);
router.post('/', requireAuth, requireAdmin, createReferral);
router.put('/:id', requireAuth, requireAdmin, updateReferral);
router.delete('/:id', requireAuth, requireAdmin, deleteReferral);

export default router;
