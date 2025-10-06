import express from 'express';
import {
  createOTOShipment,
  trackOTOShipment,
  getOTOShippingLabel,
  cancelOTOShipment,
  assignDriverToShipments,
  getPickupLocations,
  createPickupLocation,
  updatePickupLocation,
  handleOTOWebhook,
  getOTOStatistics,
  checkOTODeliveryFee,
  checkDeliveryFee,
  buyCredit,
  getDeliveryCompanyList,
  getDeliveryCompanyConfig,
  activateDeliveryCompany,
  getOrderStatus,
  getOrderHistory,
  otoHealthCheck,
  getWalletBalance
} from './oto.controller.js';
import { requireAuth, requireAdmin } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// Public endpoints (no auth required)
router.get('/health', otoHealthCheck);
router.post('/webhook', handleOTOWebhook);
router.get('/track/:trackingNumber', trackOTOShipment);

// Protected routes - require authentication
router.use(requireAuth);

// Shipment management
router.post('/shipments/create/:orderId', createOTOShipment);
router.get('/shipments/:shippingId/label', getOTOShippingLabel);
router.post('/shipments/:shippingId/cancel', cancelOTOShipment);

// Driver assignment (OTO Flex)
router.post('/drivers/assign', assignDriverToShipments);

// Pickup locations
router.get('/pickup-locations', getPickupLocations);

// Fee calculation (before creating shipment)
router.post('/check-oto-fee', checkOTODeliveryFee);
router.post('/check-delivery-fee', checkDeliveryFee);

// Order status and history
router.get('/order-status/:orderId', getOrderStatus);
router.get('/order-history/:orderId', getOrderHistory);

// Delivery companies
router.get('/delivery-companies', getDeliveryCompanyList);
router.get('/delivery-company-config', getDeliveryCompanyConfig);

// Admin routes - require admin role
router.use(requireAdmin);

// Pickup location management
router.post('/pickup-locations', createPickupLocation);
router.put('/pickup-locations/:id', updatePickupLocation);

// Wallet / Credit management
router.get('/wallet/balance', getWalletBalance);
router.post('/buy-credit', buyCredit);

// Delivery company activation
router.post('/activate-delivery-company', activateDeliveryCompany);

// Statistics
router.get('/statistics', getOTOStatistics);

export default router;
