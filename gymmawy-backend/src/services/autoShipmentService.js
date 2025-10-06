import { getPrismaClient } from '../config/db.js';
import otoService from './otoService.js';

const prisma = getPrismaClient();

/**
 * Automatic Shipment Creation Service
 * Creates OTO shipments automatically after successful payment
 */
class AutoShipmentService {
  /**
   * Create shipment automatically for a paid order
   * @param {string} orderId - Order ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Created shipment or null
   */
  async createShipmentForOrder(orderId, options = {}) {
    try {
      console.log(`📦 Auto-shipment: Checking order ${orderId}`);

      // Get order with all required details
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      if (!order) {
        console.error(`❌ Auto-shipment: Order ${orderId} not found`);
        return null;
      }

      // Check if order is paid
      if (order.status !== 'PAID') {
        console.log(`⏳ Auto-shipment: Order ${orderId} is not paid yet (status: ${order.status})`);
        return null;
      }

      // Check if shipment already exists
      const existingShipment = await prisma.shipping.findFirst({
        where: { orderId }
      });

      if (existingShipment) {
        console.log(`✅ Auto-shipment: Shipment already exists for order ${orderId}`);
        return existingShipment;
      }

      // Check if order has shipping address
      if (!order.shippingCity || !order.shippingCountry) {
        console.warn(`⚠️  Auto-shipment: Order ${orderId} missing shipping address`);
        return null;
      }

      // Check if user has phone
      if (!order.user.mobileNumber) {
        console.warn(`⚠️  Auto-shipment: Order ${orderId} user missing phone number`);
        return null;
      }

      // Prepare OTO order data
      const otoOrderData = this.prepareOTOOrderData(order, options);

      console.log(`🚀 Auto-shipment: Creating OTO shipment for order ${orderId}`);

      // Create shipment in OTO
      const otoResponse = await otoService.createOrder(otoOrderData);

      // Create shipping record in database
      const shippingData = {
        orderId: order.id,
        trackingNumber: otoResponse.data.trackingNumber || `TRK${Date.now()}`,
        status: 'LABEL_CREATED',
        senderInfo: otoOrderData.sender,
        recipientInfo: otoOrderData.recipient,
        otoOrderId: otoResponse.data.orderId?.toString(),
        otoShipmentId: otoResponse.data.shipmentId?.toString(),
        otoStatus: otoResponse.data.status,
        deliveryCompany: options.deliveryCompanyCode || null,
        packageWeight: otoOrderData.boxes?.reduce((sum, box) => sum + box.weight, 0),
        packageCount: otoOrderData.boxes?.length || 1,
        codAmount: otoOrderData.payment?.codAmount || 0,
        metadata: {
          otoResponse: otoResponse.data,
          autoCreated: true,
          createdAt: new Date().toISOString()
        }
      };

      const shipping = await prisma.shipping.create({
        data: shippingData
      });

      // Create box records if provided
      if (otoOrderData.boxes && otoOrderData.boxes.length > 0) {
        await Promise.all(otoOrderData.boxes.map(box =>
          prisma.oTOBox.create({
            data: {
              shippingId: shipping.id,
              boxName: box.boxName,
              weight: box.weight,
              height: box.height || null,
              width: box.width || null,
              length: box.length || null,
              dimensionUnit: box.dimensionUnit || 'cm'
            }
          })
        ));
      }

      // Update order with tracking number and status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'SHIPPED',
          trackingNumber: shipping.trackingNumber
        }
      });

      console.log(`✅ Auto-shipment: Created shipment ${shipping.id} for order ${orderId}`);
      console.log(`📍 Tracking number: ${shipping.trackingNumber}`);

      return {
        shipping,
        otoResponse: otoResponse.data
      };

    } catch (error) {
      console.error(`❌ Auto-shipment: Failed to create shipment for order ${orderId}:`, error.message);
      
      // Store error in order metadata for debugging
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            metadata: {
              ...(order.metadata || {}),
              shipmentCreationError: {
                message: error.message,
                timestamp: new Date().toISOString(),
                otoError: error.isOTOError ? {
                  code: error.otoErrorCode,
                  details: error.details
                } : null
              }
            }
          }
        });
      } catch (metadataError) {
        console.error('Failed to save error to order metadata:', metadataError);
      }

      return null;
    }
  }

  /**
   * Prepare OTO order data from order
   */
  prepareOTOOrderData(order, options = {}) {
    // Calculate total weight using actual product weights
    const totalWeight = order.items.reduce((sum, item) => {
      const productWeight = item.product?.weight ? parseFloat(item.product.weight) : 0.5;
      return sum + (item.quantity * productWeight);
    }, 0);

    // Determine if COD payment
    const isCOD = order.paymentMethod === 'COD' || 
                  order.paymentMethod === 'CASH_ON_DELIVERY' ||
                  options.codAmount > 0;

    const codAmount = isCOD ? parseFloat(order.price || 0) : 0;

    return {
      orderId: order.orderNumber,
      referenceId: order.id,
      sender: {
        name: process.env.OTO_SENDER_NAME || 'Gymmawy',
        phone: process.env.OTO_SENDER_PHONE || '+201000000000',
        email: process.env.OTO_SENDER_EMAIL || 'orders@gymmawy.com',
        pickupLocationCode: options.pickupLocationCode || 
                          process.env.OTO_DEFAULT_PICKUP_LOCATION || 
                          'WAREHOUSE_01'
      },
      recipient: {
        name: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Customer',
        phone: order.user.mobileNumber,
        email: order.user.email,
        address: {
          building: order.shippingBuilding || '',
          street: order.shippingStreet || '',
          city: order.shippingCity,
          country: order.shippingCountry,
          postcode: order.shippingPostcode || ''
        }
      },
      items: order.items.map((item, index) => ({
        name: item.product?.name?.en || `Product ${index + 1}`,
        quantity: item.quantity,
        price: parseFloat(item.totalPrice),
        sku: item.product?.id || `SKU-${index + 1}`,
        weight: item.product?.weight ? parseFloat(item.product.weight) : 0.5
      })),
      boxes: options.boxes || this.calculateBoxes(order.items, totalWeight),
      payment: {
        amount: parseFloat(order.price || 0),
        currency: order.currency,
        codAmount: codAmount,
        whoPays: isCOD ? 'recipient' : 'sender'
      },
      deliveryCompanyCode: options.deliveryCompanyCode || 
                          process.env.OTO_DEFAULT_DELIVERY_COMPANY || 
                          undefined,
      specialInstructions: options.specialInstructions || ''
    };
  }

  /**
   * Retry failed shipment creation
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} - Created shipment or null
   */
  async retryShipmentCreation(orderId) {
    console.log(`🔄 Retrying shipment creation for order ${orderId}`);
    return await this.createShipmentForOrder(orderId);
  }

  /**
   * Calculate boxes based on product dimensions
   * @param {Array} items - Order items
   * @param {number} totalWeight - Total weight
   * @returns {Array} - Box configurations
   */
  calculateBoxes(items, totalWeight) {
    // Get largest product dimensions for box sizing
    let maxLength = 0;
    let maxWidth = 0;
    let maxHeight = 0;

    items.forEach(item => {
      if (item.product?.length) maxLength = Math.max(maxLength, parseFloat(item.product.length));
      if (item.product?.width) maxWidth = Math.max(maxWidth, parseFloat(item.product.width));
      if (item.product?.height) maxHeight = Math.max(maxHeight, parseFloat(item.product.height));
    });

    // Use product dimensions if available, otherwise use defaults
    return [{
      boxName: 'Package 1',
      weight: totalWeight || 1,
      height: maxHeight > 0 ? maxHeight : 20,
      width: maxWidth > 0 ? maxWidth : 30,
      length: maxLength > 0 ? maxLength : 40,
      dimensionUnit: 'cm'
    }];
  }

  /**
   * Check if order should auto-create shipment
   * @param {Object} order - Order object
   * @returns {boolean}
   */
  shouldCreateShipment(order) {
    // Don't create if:
    // - Not paid
    // - Already has shipment
    // - No shipping address
    // - Digital product only (future enhancement)
    
    if (order.status !== 'PAID') return false;
    if (order.trackingNumber) return false;
    if (!order.shippingCity || !order.shippingCountry) return false;
    
    return true;
  }
}

export default new AutoShipmentService();
