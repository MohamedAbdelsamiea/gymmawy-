import otoService from '../../services/otoService.js';
import { getPrismaClient } from '../../config/db.js';

const prisma = getPrismaClient();

/**
 * Create an OTO order/shipment from an existing order
 */
export const createOTOShipment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { 
      pickupLocationCode,
      deliveryCompanyCode,
      boxes,
      codAmount,
      specialInstructions
    } = req.body;

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
      return res.status(404).json({
        error: { message: 'Order not found' }
      });
    }

    // Check if shipment already exists
    const existingShipment = await prisma.shipping.findFirst({
      where: { orderId }
    });

    if (existingShipment?.otoOrderId) {
      return res.status(409).json({
        error: { message: 'OTO shipment already exists for this order' }
      });
    }

    // Prepare OTO order data
    const otoOrderData = {
      orderId: order.orderNumber,
      referenceId: order.id,
      sender: {
        name: 'Gymmawy',
        phone: process.env.OTO_SENDER_PHONE || '+201000000000',
        email: process.env.OTO_SENDER_EMAIL || 'orders@gymmawy.com',
        pickupLocationCode: pickupLocationCode || process.env.OTO_DEFAULT_PICKUP_LOCATION
      },
      recipient: {
        name: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim(),
        phone: order.user.mobileNumber,
        email: order.user.email,
        address: {
          building: order.shippingBuilding,
          street: order.shippingStreet,
          city: order.shippingCity,
          country: order.shippingCountry,
          postcode: order.shippingPostcode
        }
      },
      items: order.items.map((item, index) => ({
        name: item.product?.name?.en || `Product ${index + 1}`,
        quantity: item.quantity,
        price: parseFloat(item.totalPrice),
        sku: item.product?.id || `SKU-${index + 1}`,
        weight: 0.5 // Default weight in kg - update based on your product model
      })),
      boxes: boxes || [{
        boxName: 'Box 1',
        weight: order.items.reduce((sum, item) => sum + (item.quantity * 0.5), 0),
        height: 20,
        width: 30,
        length: 40,
        dimensionUnit: 'cm'
      }],
      payment: {
        amount: parseFloat(order.price || 0),
        currency: order.currency,
        codAmount: codAmount !== undefined ? codAmount : parseFloat(order.price || 0),
        whoPays: 'recipient'
      },
      deliveryCompanyCode: deliveryCompanyCode,
      specialInstructions: specialInstructions || ''
    };

    // Create order in OTO
    const otoResponse = await otoService.createOrder(otoOrderData);

    // Create or update shipping record in database
    const shippingData = {
      orderId: order.id,
      trackingNumber: otoResponse.data.trackingNumber || `TRK${Date.now()}`,
      status: 'LABEL_CREATED',
      senderInfo: otoOrderData.sender,
      recipientInfo: otoOrderData.recipient,
      otoOrderId: otoResponse.data.orderId?.toString(),
      otoShipmentId: otoResponse.data.shipmentId?.toString(),
      otoStatus: otoResponse.data.status,
      deliveryCompany: deliveryCompanyCode,
      packageWeight: otoOrderData.boxes.reduce((sum, box) => sum + box.weight, 0),
      packageCount: otoOrderData.boxes.length,
      codAmount: codAmount,
      metadata: {
        otoResponse: otoResponse.data,
        createdAt: new Date().toISOString()
      }
    };

    let shipping;
    if (existingShipment) {
      shipping = await prisma.shipping.update({
        where: { id: existingShipment.id },
        data: shippingData
      });
    } else {
      shipping = await prisma.shipping.create({
        data: shippingData
      });
    }

    // Create box records
    if (boxes && boxes.length > 0) {
      await Promise.all(boxes.map(box =>
        prisma.oTOBox.create({
          data: {
            shippingId: shipping.id,
            boxName: box.boxName,
            weight: box.weight,
            height: box.height,
            width: box.width,
            length: box.length,
            dimensionUnit: box.dimensionUnit || 'cm'
          }
        })
      ));
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
        trackingNumber: shipping.trackingNumber
      }
    });

    res.status(201).json({
      success: true,
      data: {
        shipping,
        otoResponse: otoResponse.data
      }
    });
  } catch (error) {
    console.error('Create OTO Shipment Error:', error);
    
    if (error.isOTOError) {
      return res.status(error.status || 500).json({
        error: {
          message: error.message,
          otoErrorCode: error.otoErrorCode,
          details: error.details
        }
      });
    }
    
    res.status(500).json({
      error: { message: error.message || 'Failed to create OTO shipment' }
    });
  }
};

/**
 * Track an OTO shipment
 */
export const trackOTOShipment = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    // Get shipping record from database
    const shipping = await prisma.shipping.findUnique({
      where: { trackingNumber },
      include: {
        order: true,
        otoEvents: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!shipping) {
      return res.status(404).json({
        error: { message: 'Shipment not found' }
      });
    }

    // Get tracking info from OTO if we have an OTO order ID
    let otoTracking = null;
    if (shipping.otoOrderId) {
      try {
        const otoResponse = await otoService.trackShipment(shipping.otoOrderId);
        otoTracking = otoResponse.data;

        // Update local tracking events if new events exist
        if (otoTracking.events && otoTracking.events.length > 0) {
          const latestEvent = otoTracking.events[0];
          
          // Check if this event already exists
          const existingEvent = await prisma.oTOTrackingEvent.findFirst({
            where: {
              shippingId: shipping.id,
              status: latestEvent.status,
              timestamp: new Date(latestEvent.timestamp)
            }
          });

          if (!existingEvent) {
            await prisma.oTOTrackingEvent.create({
              data: {
                shippingId: shipping.id,
                status: latestEvent.status,
                stage: latestEvent.stage,
                description: latestEvent.description,
                location: latestEvent.location,
                timestamp: new Date(latestEvent.timestamp),
                metadata: latestEvent
              }
            });

            // Update shipping status
            const newStatus = otoService.mapOTOStatusToInternal(latestEvent.status);
            await prisma.shipping.update({
              where: { id: shipping.id },
              data: {
                status: newStatus,
                otoStatus: latestEvent.status
              }
            });
          }
        }
      } catch (error) {
        console.error('Error fetching OTO tracking:', error);
        // Continue with local data if OTO API fails
      }
    }

    res.json({
      success: true,
      data: {
        trackingNumber: shipping.trackingNumber,
        status: shipping.status,
        otoStatus: shipping.otoStatus,
        orderNumber: shipping.order?.orderNumber,
        estimatedDelivery: shipping.estimatedDelivery,
        actualDelivery: shipping.actualDelivery,
        events: shipping.otoEvents,
        otoTracking
      }
    });
  } catch (error) {
    console.error('Track OTO Shipment Error:', error);
    res.status(500).json({
      error: { message: error.message || 'Failed to track shipment' }
    });
  }
};

/**
 * Get shipping label for an OTO shipment
 */
export const getOTOShippingLabel = async (req, res) => {
  try {
    const { shippingId } = req.params;
    const { format = 'pdf' } = req.query;

    const shipping = await prisma.shipping.findUnique({
      where: { id: shippingId }
    });

    if (!shipping) {
      return res.status(404).json({
        error: { message: 'Shipment not found' }
      });
    }

    if (!shipping.otoShipmentId) {
      return res.status(400).json({
        error: { message: 'No OTO shipment ID found for this shipping' }
      });
    }

    // Get label from OTO
    const labelResponse = await otoService.getShippingLabel(shipping.otoShipmentId, format);

    // Set content type based on format
    res.setHeader('Content-Type', labelResponse.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="label-${shipping.trackingNumber}.${format}"`);
    res.send(labelResponse.data);
  } catch (error) {
    console.error('Get OTO Shipping Label Error:', error);
    
    if (error.isOTOError) {
      return res.status(error.status || 500).json({
        error: {
          message: error.message,
          otoErrorCode: error.otoErrorCode
        }
      });
    }
    
    res.status(500).json({
      error: { message: error.message || 'Failed to get shipping label' }
    });
  }
};

/**
 * Cancel an OTO shipment
 */
export const cancelOTOShipment = async (req, res) => {
  try {
    const { shippingId } = req.params;
    const { reason } = req.body;

    const shipping = await prisma.shipping.findUnique({
      where: { id: shippingId },
      include: { order: true }
    });

    if (!shipping) {
      return res.status(404).json({
        error: { message: 'Shipment not found' }
      });
    }

    if (!shipping.otoOrderId) {
      return res.status(400).json({
        error: { message: 'No OTO order ID found for this shipping' }
      });
    }

    // Cancel order in OTO
    const otoResponse = await otoService.cancelOrder(shipping.otoOrderId);

    // Update shipping status
    await prisma.shipping.update({
      where: { id: shippingId },
      data: {
        status: 'FAILED_DELIVERY',
        otoStatus: 'shipmentCanceled',
        metadata: {
          ...(shipping.metadata || {}),
          cancelReason: reason,
          canceledAt: new Date().toISOString(),
          otoResponse: otoResponse.data
        }
      }
    });

    // Update order status
    if (shipping.order) {
      await prisma.order.update({
        where: { id: shipping.order.id },
        data: { status: 'CANCELLED' }
      });
    }

    res.json({
      success: true,
      message: 'Shipment cancelled successfully',
      data: otoResponse.data
    });
  } catch (error) {
    console.error('Cancel OTO Shipment Error:', error);
    
    if (error.isOTOError) {
      return res.status(error.status || 500).json({
        error: {
          message: error.message,
          otoErrorCode: error.otoErrorCode
        }
      });
    }
    
    res.status(500).json({
      error: { message: error.message || 'Failed to cancel shipment' }
    });
  }
};

/**
 * Assign driver to shipments (OTO Flex)
 */
export const assignDriverToShipments = async (req, res) => {
  try {
    const { shipmentIds, driverID } = req.body;

    if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      return res.status(400).json({
        error: { message: 'shipmentIds must be a non-empty array' }
      });
    }

    if (!driverID) {
      return res.status(400).json({
        error: { message: 'driverID is required' }
      });
    }

    // Get shipments with OTO order IDs
    const shipments = await prisma.shipping.findMany({
      where: {
        id: { in: shipmentIds },
        otoOrderId: { not: null }
      }
    });

    if (shipments.length === 0) {
      return res.status(404).json({
        error: { message: 'No valid OTO shipments found' }
      });
    }

    const otoOrderIds = shipments
      .map(s => parseInt(s.otoOrderId))
      .filter(id => !isNaN(id));

    // Assign driver in OTO
    const otoResponse = await otoService.assignDriver(otoOrderIds, driverID);

    // Update shipments metadata
    await Promise.all(shipments.map(shipping =>
      prisma.shipping.update({
        where: { id: shipping.id },
        data: {
          metadata: {
            ...(shipping.metadata || {}),
            assignedDriver: driverID,
            assignedAt: new Date().toISOString()
          }
        }
      })
    ));

    res.json({
      success: true,
      message: 'Driver assigned successfully',
      data: {
        assignedShipments: shipments.length,
        driverID,
        otoResponse: otoResponse.data
      }
    });
  } catch (error) {
    console.error('Assign Driver Error:', error);
    
    if (error.isOTOError) {
      return res.status(error.status || 500).json({
        error: {
          message: error.message,
          otoErrorCode: error.otoErrorCode
        }
      });
    }
    
    res.status(500).json({
      error: { message: error.message || 'Failed to assign driver' }
    });
  }
};

/**
 * Get pickup locations
 */
export const getPickupLocations = async (req, res) => {
  try {
    const { city, isActive } = req.query;

    const where = {};
    if (city) where.city = city;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const locations = await prisma.oTOPickupLocation.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Get Pickup Locations Error:', error);
    res.status(500).json({
      error: { message: error.message || 'Failed to get pickup locations' }
    });
  }
};

/**
 * Create pickup location
 */
export const createPickupLocation = async (req, res) => {
  try {
    const locationData = req.body;

    const location = await prisma.oTOPickupLocation.create({
      data: locationData
    });

    // Optionally sync with OTO API if needed
    // const otoResponse = await otoService.createPickupLocation(locationData);

    res.status(201).json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Create Pickup Location Error:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: { message: 'Pickup location with this code already exists' }
      });
    }
    
    res.status(500).json({
      error: { message: error.message || 'Failed to create pickup location' }
    });
  }
};

/**
 * Update pickup location
 */
export const updatePickupLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const locationData = req.body;

    const location = await prisma.oTOPickupLocation.update({
      where: { id },
      data: locationData
    });

    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Update Pickup Location Error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: { message: 'Pickup location not found' }
      });
    }
    
    res.status(500).json({
      error: { message: error.message || 'Failed to update pickup location' }
    });
  }
};

/**
 * Webhook handler for OTO events
 */
export const handleOTOWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-oto-signature'];
    const payload = req.body;

    // Validate webhook signature
    if (!otoService.validateWebhookSignature(signature, payload)) {
      return res.status(401).json({
        error: { message: 'Invalid webhook signature' }
      });
    }

    const { event, data } = payload;

    console.log('OTO Webhook received:', event, data);

    // Handle different webhook events
    switch (event) {
      case 'shipment.created':
      case 'shipment.updated':
      case 'shipment.status_changed':
        await handleShipmentStatusUpdate(data);
        break;
      
      case 'shipment.delivered':
        await handleShipmentDelivered(data);
        break;
      
      case 'shipment.failed':
      case 'shipment.returned':
        await handleShipmentFailed(data);
        break;
      
      default:
        console.log('Unhandled OTO webhook event:', event);
    }

    // Always respond with 200 to acknowledge receipt
    res.json({ success: true, received: true });
  } catch (error) {
    console.error('OTO Webhook Error:', error);
    // Still respond with 200 to prevent retries
    res.json({ success: false, error: error.message });
  }
};

/**
 * Helper function to handle shipment status updates
 */
async function handleShipmentStatusUpdate(data) {
  const { orderId, shipmentId, status, trackingNumber } = data;

  const shipping = await prisma.shipping.findFirst({
    where: {
      OR: [
        { otoOrderId: orderId?.toString() },
        { otoShipmentId: shipmentId?.toString() },
        { trackingNumber }
      ]
    }
  });

  if (!shipping) {
    console.warn('Shipment not found for webhook update:', { orderId, shipmentId, trackingNumber });
    return;
  }

  // Create tracking event
  await prisma.oTOTrackingEvent.create({
    data: {
      shippingId: shipping.id,
      status: status,
      stage: data.stage,
      description: data.description,
      location: data.location,
      timestamp: new Date(data.timestamp || Date.now()),
      metadata: data
    }
  });

  // Update shipping status
  const newStatus = otoService.mapOTOStatusToInternal(status);
  await prisma.shipping.update({
    where: { id: shipping.id },
    data: {
      status: newStatus,
      otoStatus: status
    }
  });
}

/**
 * Helper function to handle delivered shipments
 */
async function handleShipmentDelivered(data) {
  await handleShipmentStatusUpdate(data);

  const { orderId, deliveredAt } = data;
  
  const shipping = await prisma.shipping.findFirst({
    where: { otoOrderId: orderId?.toString() }
  });

  if (shipping) {
    await prisma.shipping.update({
      where: { id: shipping.id },
      data: {
        actualDelivery: new Date(deliveredAt || Date.now()),
        status: 'DELIVERED'
      }
    });

    // Update order status
    await prisma.order.update({
      where: { id: shipping.orderId },
      data: { status: 'DELIVERED' }
    });
  }
}

/**
 * Helper function to handle failed shipments
 */
async function handleShipmentFailed(data) {
  await handleShipmentStatusUpdate(data);

  const { orderId } = data;
  
  const shipping = await prisma.shipping.findFirst({
    where: { otoOrderId: orderId?.toString() }
  });

  if (shipping) {
    await prisma.shipping.update({
      where: { id: shipping.id },
      data: {
        status: data.status === 'returned' ? 'RETURNED' : 'FAILED_DELIVERY'
      }
    });
  }
}

/**
 * Get OTO shipment statistics
 */
export const getOTOStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      otoOrderId: { not: null }
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, byStatus, recent] = await Promise.all([
      // Total shipments
      prisma.shipping.count({ where }),
      
      // Shipments by status
      prisma.shipping.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      
      // Recent shipments
      prisma.shipping.findMany({
        where,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              orderNumber: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
        recent
      }
    });
  } catch (error) {
    console.error('Get OTO Statistics Error:', error);
    res.status(500).json({
      error: { message: error.message || 'Failed to get statistics' }
    });
  }
};

/**
 * Check OTO delivery fee
 */
export const checkOTODeliveryFee = async (req, res) => {
  try {
    const feeData = req.body;
    const result = await otoService.checkOTODeliveryFee(feeData);
    
    res.json(result);
  } catch (error) {
    console.error('Check OTO Delivery Fee Error:', error);
    
    if (error.isOTOError) {
      return res.status(error.status || 500).json({
        error: {
          message: error.message,
          otoErrorCode: error.otoErrorCode
        }
      });
    }
    
    res.status(500).json({
      error: { message: error.message || 'Failed to check delivery fee' }
    });
  }
};

/**
 * Check delivery fee (custom contract)
 */
export const checkDeliveryFee = async (req, res) => {
  try {
    const feeData = req.body;
    const result = await otoService.checkDeliveryFee(feeData);
    
    res.json(result);
  } catch (error) {
    console.error('Check Delivery Fee Error:', error);
    
    if (error.isOTOError) {
      return res.status(error.status || 500).json({
        error: {
          message: error.message,
          otoErrorCode: error.otoErrorCode
        }
      });
    }
    
    res.status(500).json({
      error: { message: error.message || 'Failed to check delivery fee' }
    });
  }
};

/**
 * Buy credit / charge wallet
 */
export const buyCredit = async (req, res) => {
  try {
    const creditData = req.body;
    const result = await otoService.buyCredit(creditData);
    
    res.json(result);
  } catch (error) {
    console.error('Buy Credit Error:', error);
    
    if (error.isOTOError) {
      return res.status(error.status || 500).json({
        error: {
          message: error.message,
          otoErrorCode: error.otoErrorCode
        }
      });
    }
    
    res.status(500).json({
      error: { message: error.message || 'Failed to buy credit' }
    });
  }
};

/**
 * OTO health check
 */
export const otoHealthCheck = async (req, res) => {
  try {
    const result = await otoService.healthCheck();
    res.json(result);
  } catch (error) {
    console.error('OTO Health Check Error:', error);
    res.status(500).json({
      error: { message: error.message || 'OTO API health check failed' }
    });
  }
};

/**
 * Get OTO wallet balance
 */
export const getWalletBalance = async (req, res) => {
  try {
    const result = await otoService.getWalletBalance();
    res.json(result);
  } catch (error) {
    console.error('Get Wallet Balance Error:', error);
    res.status(500).json({
      error: { message: error.message || 'Failed to get wallet balance' }
    });
  }
};

/**
 * Get delivery company list
 */
export const getDeliveryCompanyList = async (req, res) => {
  try {
    const result = await otoService.getDeliveryCompanyList();
    res.json(result);
  } catch (error) {
    console.error('Get Delivery Company List Error:', error);
    res.status(500).json({
      error: { message: error.message || 'Failed to get delivery companies' }
    });
  }
};

/**
 * Get delivery company configuration
 */
export const getDeliveryCompanyConfig = async (req, res) => {
  try {
    const { companyCode } = req.query;
    
    if (!companyCode) {
      return res.status(400).json({
        error: { message: 'companyCode is required' }
      });
    }
    
    const result = await otoService.getDeliveryCompanyConfig(companyCode);
    res.json(result);
  } catch (error) {
    console.error('Get Delivery Company Config Error:', error);
    res.status(500).json({
      error: { message: error.message || 'Failed to get company config' }
    });
  }
};

/**
 * Activate delivery company
 */
export const activateDeliveryCompany = async (req, res) => {
  try {
    const activationData = req.body;
    const result = await otoService.activateDeliveryCompany(activationData);
    
    res.json(result);
  } catch (error) {
    console.error('Activate Delivery Company Error:', error);
    
    if (error.isOTOError) {
      return res.status(error.status || 500).json({
        error: {
          message: error.message,
          otoErrorCode: error.otoErrorCode
        }
      });
    }
    
    res.status(500).json({
      error: { message: error.message || 'Failed to activate delivery company' }
    });
  }
};

/**
 * Get detailed order status
 */
export const getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await otoService.getOrderStatus(orderId);
    
    res.json(result);
  } catch (error) {
    console.error('Get Order Status Error:', error);
    res.status(500).json({
      error: { message: error.message || 'Failed to get order status' }
    });
  }
};

/**
 * Get order history
 */
export const getOrderHistory = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await otoService.getOrderHistory(orderId);
    
    res.json(result);
  } catch (error) {
    console.error('Get Order History Error:', error);
    res.status(500).json({
      error: { message: error.message || 'Failed to get order history' }
    });
  }
};
