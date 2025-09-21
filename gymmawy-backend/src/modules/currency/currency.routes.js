import { Router } from 'express';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { currencyDetectionMiddleware } from '../../middlewares/currencyMiddleware.js';
import * as controller from './currency.controller.js';

const router = Router();

// Apply currency detection middleware to all routes
router.use(currencyDetectionMiddleware);

// Public routes
router.get('/detect', controller.detectCurrency);
router.get('/available', controller.getAvailableCurrencies);
router.get('/rates', controller.getRates);
router.get('/prices', controller.getPrices);

// Protected routes (require authentication)
router.patch('/preferred', requireAuth, controller.updatePreferredCurrency);

export default router;
