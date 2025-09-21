import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middlewares/authMiddleware.js';
import { currencyDetectionMiddleware } from '../../middlewares/currencyMiddleware.js';
import * as controller from './price.controller.js';

const router = Router();

// Apply currency detection middleware to all routes
router.use(currencyDetectionMiddleware);

// Public routes
router.get('/by-purchasable', controller.getPricesByPurchasable);
router.get('/by-currency', controller.getPricesByCurrency);
router.get('/subscription-plans/:planId', controller.getSubscriptionPlanPrices);
router.get('/products/:productId', controller.getProductPrices);
router.get('/programmes/:programmeId', controller.getProgrammePrices);
router.get('/medical/:planId', controller.getMedicalPrices);
router.get('/available-currencies', controller.getAvailableCurrencies);

// Protected routes (require authentication)
router.get('/:id', requireAuth, controller.getPriceById);

// Admin routes (require admin role)
router.post('/', requireAuth, requireAdmin, controller.createPrice);
router.put('/:id', requireAuth, requireAdmin, controller.updatePrice);
router.delete('/:id', requireAuth, requireAdmin, controller.deletePrice);
router.post('/bulk', requireAuth, requireAdmin, controller.createBulkPrices);

export default router;
