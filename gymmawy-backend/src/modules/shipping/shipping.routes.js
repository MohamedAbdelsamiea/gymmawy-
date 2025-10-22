import { Router } from 'express';
import {
  calculateShippingCost,
  getAvailableCities,
  getDeliveryOptions,
  testOTOConnection,
  retryShipmentCreation,
  getCreditSummary,
  bulkRetryShipments,
  validateCity,
  searchCities
} from './shipping.controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';

const router = Router();

// Public routes (no authentication required for shipping calculation)
router.post('/calculate', calculateShippingCost);
router.get('/cities', getAvailableCities);
router.get('/delivery-options', getDeliveryOptions);
router.get('/test', testOTOConnection);
router.get('/validate-city', validateCity);
router.get('/search-cities', searchCities);

// Admin routes (require authentication)
router.post('/retry/:orderId', requireAuth, retryShipmentCreation);
router.get('/credit-summary', requireAuth, getCreditSummary);
router.post('/bulk-retry', requireAuth, bulkRetryShipments);

export default router;
