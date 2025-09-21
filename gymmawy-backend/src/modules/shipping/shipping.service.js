import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  // Mock tracking data - in real app, integrate with shipping provider
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
      name: item.productVariant?.product?.name || 'Product',
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
      items: { include: { productVariant: { include: { product: true } } } },
      shippingMethod: true
    }
  });

  if (!order) {
    const e = new Error("Order not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  const shippingInfo = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    trackingNumber: `TRK${order.id.slice(-8).toUpperCase()}`,
    shippingMethod: order.shippingMethod?.name || 'Standard Shipping',
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    shippingAddress: order.shippingAddress,
    items: order.items.map(item => ({
      name: item.productVariant?.product?.name || 'Product',
      quantity: item.quantity,
      weight: item.productVariant?.weight || 0
    }))
  };

  return shippingInfo;
};
