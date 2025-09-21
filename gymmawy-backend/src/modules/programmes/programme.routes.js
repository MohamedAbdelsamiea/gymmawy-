import express from 'express';
import { requireAuth, requireAdmin } from '../../middlewares/authMiddleware.js';
import { currencyDetectionMiddleware } from '../../middlewares/currencyMiddleware.js';
import { 
  getProgrammesController, 
  listProgrammesController,
  getProgrammeByIdController, 
  getUserProgrammesController,
  getProgrammeStatsController,
  createProgrammeController, 
  updateProgrammeController, 
  deleteProgrammeController, 
  purchaseProgrammeController,
  purchaseProgrammeWithPaymentController,
  getPendingProgrammePurchasesController,
  approveProgrammePurchaseController,
  rejectProgrammePurchaseController
} from './programme.controller.js';

const router = express.Router();

// Apply currency detection middleware to all routes
router.use(currencyDetectionMiddleware);

router.get('/', getProgrammesController);
router.get('/list', listProgrammesController);
router.get('/:id', getProgrammeByIdController);
router.get('/user/my-programmes', requireAuth, getUserProgrammesController);
router.get('/stats/overview', requireAuth, getProgrammeStatsController);
router.post('/', createProgrammeController);
router.put('/:id', updateProgrammeController);
router.patch('/:id', updateProgrammeController);
router.delete('/:id', deleteProgrammeController);
router.post('/:id/purchase', purchaseProgrammeController);
router.post('/:id/purchase-with-payment', requireAuth, purchaseProgrammeWithPaymentController);

// Admin routes
router.get('/admin/pending-purchases', requireAuth, requireAdmin, getPendingProgrammePurchasesController);
router.patch('/admin/purchases/:id/approve', requireAuth, requireAdmin, approveProgrammePurchaseController);
router.patch('/admin/purchases/:id/reject', requireAuth, requireAdmin, rejectProgrammePurchaseController);

export default router;
