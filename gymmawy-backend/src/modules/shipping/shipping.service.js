import { getPrismaClient } from '../../config/db.js';
import otoService from '../../services/otoService.js';

const prisma = getPrismaClient();

export const getShippingMethodsService = async () => {
  return prisma.shippingMethod.findMany();
};

export const createShippingMethodService = async (data) => {
  return prisma.shippingMethod.create({ data });
};

export const updateShippingMethodService = async (id, data) => {
  return prisma.shippingMethod.update({
    where: { id: parseInt(id) },
    data
  });
};

export const deleteShippingMethodService = async (id) => {
  return prisma.shippingMethod.delete({
    where: { id: parseInt(id) }
  });
};

export const trackShipmentService = async (trackingNumber) => {
  // First, check if we have this shipment in database
  const shipping = await prisma.shipping.findUnique({
    where: { trackingNumber },
    include: {
      order: {
        select: {
          orderNumber: true,
          status: true
        }
      },
      otoEvents: {
        orderBy: { timestamp: 'desc' },
        take: 10
      }
    }
  });

  // If we have an OTO shipment, fetch real-time tracking
  if (shipping?.otoOrderId) {
    try {
      const otoTracking = await otoService.trackShipment(shipping.otoOrderId);
      
      return {
        trackingNumber,
        status: shipping.status,
        otoStatus: shipping.otoStatus,
        carrier: shipping.deliveryCompany || 'OTO',
        estimatedDelivery: shipping.estimatedDelivery,
        actualDelivery: shipping.actualDelivery,
        currentLocation: otoTracking.data?.currentLocation,
        history: shipping.otoEvents.map(event => ({
          status: event.status,
          timestamp: event.timestamp,
          location: event.location,
          description: event.description
        })),
        otoData: otoTracking.data
      };
    } catch (error) {
      console.error('Error tracking OTO shipment:', error);
      // Fall through to return database data
    }
  }

  // Return database data if OTO tracking is not available
  if (shipping) {
    return {
      trackingNumber,
      status: shipping.status,
      carrier: shipping.deliveryCompany || 'Gymmawy Logistics',
      estimatedDelivery: shipping.estimatedDelivery,
      actualDelivery: shipping.actualDelivery,
      history: shipping.otoEvents.map(event => ({
        status: event.status,
        timestamp: event.timestamp,
        location: event.location,
        description: event.description
      }))
    };
  }

  // Mock tracking data for shipments not in database
  const trackingData = {
    trackingNumber,
    status: 'IN_TRANSIT',
    carrier: 'Gymmawy Logistics',
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    currentLocation: 'Distribution Center',
    history: [
      {
        status: 'PICKED_UP',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        location: 'Origin Warehouse',
        description: 'Package picked up from origin'
      },
      {
        status: 'IN_TRANSIT',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        location: 'Distribution Center',
        description: 'Package in transit'
      }
    ]
  };

  return trackingData;
};

export const generateShippingLabelService = async (orderId, shippingMethodId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: true }
  });

  if (!order) {
    const e = new Error("Order not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  const shippingMethod = await prisma.shippingMethod.findUnique({
    where: { id: shippingMethodId }
  });

  if (!shippingMethod) {
    const e = new Error("Shipping method not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  // Generate mock shipping label
  const label = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    trackingNumber: `TRK${order.id.slice(-8).toUpperCase()}`,
    shippingMethod: shippingMethod.name,
    from: {
      name: 'Gymmawy Store',
      address: '123 Store Street, City, Country'
    },
    to: {
      name: `${order.user.firstName} ${order.user.lastName}`,
      address: order.shippingAddress || 'Address not provided'
    },
    items: order.items.map(item => ({
      name: item.product?.name?.en || 'Product',
      quantity: item.quantity
    })),
    labelUrl: `${process.env.LABELS_BASE_URL || 'https://labels.gymmawy.com'}/${order.id}.pdf`
  };

  return label;
};

export const getShippingInfoService = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { 
      user: true, 
      items: { include: { product: true } }
    }
  });

  if (!order) {
    const e = new Error("Order not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  // Check if we have shipping record with OTO integration
  const shipping = await prisma.shipping.findFirst({
    where: { orderId },
    include: {
      otoEvents: {
        orderBy: { timestamp: 'desc' },
        take: 5
      },
      otoBoxes: true
    }
  });

  const shippingInfo = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    trackingNumber: shipping?.trackingNumber || order.trackingNumber || `TRK${order.id.slice(-8).toUpperCase()}`,
    estimatedDelivery: shipping?.estimatedDelivery || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    actualDelivery: shipping?.actualDelivery,
    shippingStatus: shipping?.status,
    shippingAddress: {
      building: order.shippingBuilding,
      street: order.shippingStreet,
      city: order.shippingCity,
      country: order.shippingCountry,
      postcode: order.shippingPostcode
    },
    items: order.items.map(item => ({
      name: item.product?.name?.en || 'Product',
      quantity: item.quantity,
      weight: 0.5 // Default weight - update based on your product model
    })),
    // OTO specific data
    otoIntegrated: !!shipping?.otoOrderId,
    otoOrderId: shipping?.otoOrderId,
    otoStatus: shipping?.otoStatus,
    deliveryCompany: shipping?.deliveryCompany,
    packageWeight: shipping?.packageWeight,
    trackingEvents: shipping?.otoEvents?.map(event => ({
      status: event.status,
      description: event.description,
      location: event.location,
      timestamp: event.timestamp
    })) || [],
    boxes: shipping?.otoBoxes?.map(box => ({
      name: box.boxName,
      weight: box.weight,
      dimensions: box.height && box.width && box.length ? {
        height: box.height,
        width: box.width,
        length: box.length,
        unit: box.dimensionUnit
      } : null
    })) || []
  };

  return shippingInfo;
};
