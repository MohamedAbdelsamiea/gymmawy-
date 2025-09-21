import express from 'express';
import { 
  getShippingMethods, 
  createShippingMethod, 
  updateShippingMethod, 
  deleteShippingMethod,
  trackShipment,
  generateShippingLabel,
  getShippingInfo
} from './shipping.controller.js';

const router = express.Router();

router.get('/track/:trackingNumber', trackShipment);
router.post('/label', generateShippingLabel);
router.get('/order/:orderId', getShippingInfo);

// Admin routes
router.get('/', getShippingMethods);
router.post('/', createShippingMethod);
router.put('/:id', updateShippingMethod);
router.delete('/:id', deleteShippingMethod);

export default router;
