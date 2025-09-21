import { getPrismaClient } from "../../config/db.js";
import { generateOrderNumber, generateUniqueId } from "../../utils/idGenerator.js";

const prisma = getPrismaClient();

export async function createOrderFromCart(userId, orderData = {}) {
  const { couponId, currency = 'EGP' } = orderData;
  
  const cart = await prisma.cart.findUnique({ 
    where: { userId }, 
    include: { 
      items: { 
        include: { 
          productVariant: { 
            include: { 
              product: true 
            } 
          } 
        } 
      } 
    } 
  });
  
  if (!cart || cart.items.length === 0) {
    const e = new Error("Cart is empty"); 
    e.status = 400; 
    e.expose = true; 
    throw e;
  }

  // Calculate total price from cart items
  let totalPrice = 0;
  const currencyField = currency === 'SAR' ? 'priceSAR' : 'priceEGP';
  
  for (const item of cart.items) {
    const itemPrice = item.productVariant[currencyField] ?? item.productVariant.product[currencyField];
    totalPrice += itemPrice * item.quantity;
  }

  // Handle coupon validation and calculation if provided
  let couponDiscount = 0;
  let validatedCoupon = null;
  
  if (couponId) {
    validatedCoupon = await prisma.coupon.findUnique({ 
      where: { id: couponId } 
    });
    
    if (!validatedCoupon) {
      const e = new Error("Invalid coupon"); 
      e.status = 400; 
      e.expose = true; 
      throw e;
    }

    // Validate coupon redemption limits
    try {
      const { validateCoupon } = await import('../coupons/coupon.service.js');
      await validateCoupon(validatedCoupon.code, userId);
    } catch (error) {
      const e = new Error(error.message);
      e.status = error.status || 400;
      e.expose = true;
      throw e;
    }

    // Calculate coupon discount
    if (validatedCoupon.discountType === 'PERCENTAGE' || validatedCoupon.discountPercentage) {
      // If discountType is PERCENTAGE or if only discountPercentage exists (legacy support)
      couponDiscount = (totalPrice * validatedCoupon.discountPercentage) / 100;
    } else if (validatedCoupon.discountType === 'FIXED') {
      couponDiscount = Math.min(validatedCoupon.discountAmount, totalPrice);
    }
  }

  const finalPrice = Math.max(0, totalPrice - couponDiscount);

  console.log('Order creation - server calculated price:', {
    userId,
    totalPrice,
    couponDiscount,
    finalPrice,
    currency,
    couponCode: validatedCoupon?.code
  });

  const order = await prisma.$transaction(async (tx) => {
    // Generate unique order number
    const orderNumber = await generateUniqueId(
      generateOrderNumber,
      async (number) => {
        const existing = await tx.order.findUnique({ where: { orderNumber: number } });
        return !existing;
      }
    );
    
    const created = await tx.order.create({ 
      data: { 
        userId, 
        orderNumber,
        price: finalPrice,
        currency: currency,
        couponId: validatedCoupon?.id || null,
        couponDiscount: couponDiscount || null
      } 
    });
    
    for (const item of cart.items) {
      await tx.orderItem.create({
        data: {
          orderId: created.id,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          priceEGP: item.productVariant.priceEGP ?? item.productVariant.product.priceEGP,
          priceSAR: item.productVariant.priceSAR ?? item.productVariant.product.priceSAR,
          loyaltyPointsAwarded: item.productVariant.product.loyaltyPointsAwarded,
        },
      });
      await tx.productVariant.update({ 
        where: { id: item.productVariantId }, 
        data: { stock: { decrement: item.quantity } } 
      });
    }
    
    // Redeem coupon if valid (within the same transaction)
    if (validatedCoupon) {
      // Create user redemption record
      await tx.userCouponRedemption.create({ 
        data: { userId, couponId: validatedCoupon.id } 
      });
      
      // Increment total redemptions
      await tx.coupon.update({ 
        where: { id: validatedCoupon.id }, 
        data: { totalRedemptions: { increment: 1 } } 
      });
      
      console.log('Coupon redeemed successfully for order:', created.id);
    }
    
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });
  
  return prisma.order.findUnique({ 
    where: { id: order.id }, 
    include: { 
      items: true,
      coupon: true
    } 
  });
}

export async function listOrders(userId) {
  return prisma.order.findMany({ 
    where: { userId }, 
    orderBy: { createdAt: "desc" }, 
    include: { 
      items: true,
      coupon: true
    } 
  });
}

export async function getOrderById(userId, id) {
  return prisma.order.findFirst({ 
    where: { id, userId }, 
    include: { 
      items: true,
      coupon: true
    } 
  });
}

export async function updateOrder(userId, orderId, data) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId }
  });

  if (!order) {
    const e = new Error("Order not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  if (order.status !== 'PENDING') {
    const e = new Error("Only pending orders can be updated");
    e.status = 400;
    e.expose = true;
    throw e;
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      ...(data.shippingAddress && { shippingAddress: data.shippingAddress }),
      ...(data.notes && { notes: data.notes })
    }
  });
}

export async function cancelOrder(userId, orderId) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId }
  });

  if (!order) {
    const e = new Error("Order not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  if (order.status !== 'PENDING') {
    const e = new Error("Only pending orders can be cancelled");
    e.status = 400;
    e.expose = true;
    throw e;
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED' }
  });
}

export async function getOrderTracking(userId, orderId) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true }
  });

  if (!order) {
    const e = new Error("Order not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  // Mock tracking data - in real app, integrate with shipping provider
  const trackingData = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    trackingNumber: `TRK${order.id.slice(-8).toUpperCase()}`,
    carrier: "Gymmawy Logistics",
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    trackingUrl: `${process.env.TRACKING_BASE_URL || 'https://tracking.gymmawy.com'}/${order.id}`,
    history: [
      {
        status: "ORDER_PLACED",
        timestamp: order.createdAt,
        description: "Order placed successfully"
      },
      ...(order.status !== 'PENDING' ? [{
        status: order.status,
        timestamp: order.updatedAt,
        description: `Order ${order.status.toLowerCase()}`
      }] : [])
    ]
  };

  return trackingData;
}

export async function adminUpdateStatus(id, status) {
  return prisma.order.update({ where: { id }, data: { status } });
}

export async function activateOrder(orderId, adminId) {
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
    const e = new Error("Order not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  if (order.status !== 'PENDING') {
    const e = new Error("Only pending orders can be activated");
    e.status = 400;
    e.expose = true;
    throw e;
  }

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update order status to PAID
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        updatedAt: new Date()
      }
    });

    // Check if this order contains subscription items
    let subscription = null;
    const subscriptionItems = order.items.filter(item => 
      item.product && item.product.name && 
      (JSON.stringify(item.product.name).toLowerCase().includes('subscription') || 
       JSON.stringify(item.product.name).toLowerCase().includes('اشتراك'))
    );

    if (subscriptionItems.length > 0) {
      // Find the subscription plan (assuming first subscription item)
      const subscriptionItem = subscriptionItems[0];
      
      // Try to find subscription plan by name matching
      const subscriptionPlans = await tx.subscriptionPlan.findMany({
        where: {
          isActive: true
        }
      });

      // Find matching plan by checking if any plan name contains subscription-related keywords
      let subscriptionPlan = null;
      
      // First, try to find a plan that matches the product name more closely
      for (const plan of subscriptionPlans) {
        const planName = JSON.stringify(plan.name).toLowerCase();
        const productName = JSON.stringify(subscriptionItem.product.name).toLowerCase();
        
        // Check for exact matches or similar keywords
        if (planName.includes('subscription') || planName.includes('اشتراك') || 
            planName.includes('plan') || planName.includes('برنامج') ||
            planName.includes('basic') || planName.includes('أساسي') ||
            planName.includes('competition') || planName.includes('مسابقة') ||
            planName.includes('challenge') || planName.includes('تحدي')) {
          subscriptionPlan = plan;
          break;
        }
      }

      // If no specific plan found, try to match by duration or other characteristics
      if (!subscriptionPlan) {
        // Look for plans with similar characteristics
        for (const plan of subscriptionPlans) {
          // If the product mentions 90 days, look for 90-day plans
          if (JSON.stringify(subscriptionItem.product.name).toLowerCase().includes('90') && 
              plan.subscriptionPeriodDays === 90) {
            subscriptionPlan = plan;
            break;
          }
          // If the product mentions 30 days, look for 30-day plans
          if (JSON.stringify(subscriptionItem.product.name).toLowerCase().includes('30') && 
              plan.subscriptionPeriodDays === 30) {
            subscriptionPlan = plan;
            break;
          }
        }
      }

      // If still no plan found, use the first available plan
      if (!subscriptionPlan && subscriptionPlans.length > 0) {
        subscriptionPlan = subscriptionPlans[0];
      }

      if (subscriptionPlan) {
        // Create subscription
        const subscriptionNumber = await generateUniqueId(
          () => `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          async (number) => {
            const existing = await tx.subscription.findUnique({ where: { subscriptionNumber: number } });
            return !existing;
          }
        );

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + subscriptionPlan.subscriptionPeriodDays);

        // Determine if this is a medical plan based on product name, plan name, or plan characteristics
        const productName = JSON.stringify(subscriptionItem.product.name).toLowerCase();
        const planName = JSON.stringify(subscriptionPlan.name).toLowerCase();
        
        const isMedicalPlan = 
          // Check product name for medical keywords
          productName.includes('medical') ||
          productName.includes('طبي') ||
          productName.includes('medic') ||
          // Check plan name for medical keywords
          planName.includes('medical') ||
          planName.includes('طبي') ||
          planName.includes('medic') ||
          // Check if plan has medical-specific loyalty points (indicates medical plan)
          (subscriptionPlan.medicalLoyaltyPointsAwarded && subscriptionPlan.medicalLoyaltyPointsAwarded > 0) ||
          // Check if plan has medical-specific requirements
          (subscriptionPlan.medicalLoyaltyPointsRequired && subscriptionPlan.medicalLoyaltyPointsRequired > 0);

        subscription = await tx.subscription.create({
          data: {
            userId: order.userId,
            subscriptionPlanId: subscriptionPlan.id,
            subscriptionNumber,
            status: 'ACTIVE',
            startDate,
            endDate,
            price: subscriptionItem.totalPrice,
            currency: order.currency,
            paymentMethod: 'INSTA_PAY', // Default for manual orders
            isMedical: isMedicalPlan
          },
          include: {
            subscriptionPlan: true
          }
        });

        // Award loyalty points if applicable
        if (subscriptionPlan.loyaltyPointsAwarded > 0) {
          await tx.user.update({
            where: { id: order.userId },
            data: {
              loyaltyPoints: {
                increment: subscriptionPlan.loyaltyPointsAwarded
              }
            }
          });

          await tx.loyaltyTransaction.create({
            data: {
              userId: order.userId,
              points: subscriptionPlan.loyaltyPointsAwarded,
              type: 'EARNED',
              source: 'SUBSCRIPTION',
              sourceId: subscription.id
            }
          });
        }
      }
    }

    // Award loyalty points for regular product items
    const regularItems = order.items.filter(item => 
      !subscriptionItems.some(subItem => subItem.id === item.id)
    );

    let totalLoyaltyPoints = 0;
    for (const item of regularItems) {
      const pointsPerItem = item.loyaltyPointsAwarded || 0;
      const pointsForThisItem = pointsPerItem * item.quantity;
      totalLoyaltyPoints += pointsForThisItem;
    }

    if (totalLoyaltyPoints > 0) {
      await tx.user.update({
        where: { id: order.userId },
        data: {
          loyaltyPoints: {
            increment: totalLoyaltyPoints
          }
        }
      });

      await tx.loyaltyTransaction.create({
        data: {
          userId: order.userId,
          points: totalLoyaltyPoints,
          type: 'EARNED',
          source: 'ORDER_ITEM',
          sourceId: order.id
        }
      });

      console.log(`Awarded ${totalLoyaltyPoints} loyalty points for order ${order.id}`);
    }

    return { order: updatedOrder, subscription };
  });

  return result;
}

export async function rejectOrder(orderId, adminId, reason) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true }
  });

  if (!order) {
    const e = new Error("Order not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  if (order.status !== 'PENDING') {
    const e = new Error("Only pending orders can be rejected");
    e.status = 400;
    e.expose = true;
    throw e;
  }

  // Update order status to CANCELLED with rejection reason
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CANCELLED',
      updatedAt: new Date(),
      metadata: {
        rejectionReason: reason,
        rejectedBy: adminId,
        rejectedAt: new Date()
      }
    }
  });

  return { order: updatedOrder };
}

export async function adminListOrders(params = {}) {
  const { search, status, date } = params;
  
  // Build where clause
  const where = {};
  
  if (status && status !== 'all') {
    where.status = status;
  }
  
  if (date && date !== 'all') {
    const now = new Date();
    switch (date) {
      case 'today':
        where.createdAt = {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        };
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        where.createdAt = { gte: weekAgo };
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        where.createdAt = { gte: monthAgo };
        break;
    }
  }
  
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { firstName: { contains: search, mode: 'insensitive' } } },
      { user: { lastName: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } }
    ];
  }
  
  const orders = await prisma.order.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          mobileNumber: true
        }
      },
      items: {
        include: {
          product: true
        }
      },
      coupon: {
        select: {
          id: true,
          code: true,
          discountPercentage: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  // Get subscriptions for each order separately
  const ordersWithSubscriptions = await Promise.all(
    orders.map(async (order) => {
      const subscriptions = await prisma.subscription.findMany({
        where: { userId: order.userId },
        include: {
          subscriptionPlan: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return {
        ...order,
        subscriptions
      };
    })
  );
  
  // Transform the data for frontend
  return ordersWithSubscriptions.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : 'N/A',
    customerEmail: order.user?.email || 'N/A',
    customerMobile: order.user?.mobileNumber || 'N/A',
    items: order.items.length,
    total: order.price?.toString() || '0.00',
    currency: order.currency,
    status: order.status,
    paymentStatus: 'SUCCESS', // Default for now
    shippingStatus: 'PENDING', // Default for now
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    shippingAddress: order.shippingBuilding || order.shippingStreet || order.shippingCity ? 
      `${order.shippingBuilding || ''} ${order.shippingStreet || ''} ${order.shippingCity || ''}`.trim() : 'N/A',
    // Subscription information
    subscription: order.subscriptions?.[0] ? {
      id: order.subscriptions[0].id,
      isMedical: order.subscriptions[0].isMedical,
      startDate: order.subscriptions[0].startDate,
      endDate: order.subscriptions[0].endDate,
      status: order.subscriptions[0].status,
      planName: order.subscriptions[0].subscriptionPlan.name,
      planDiscount: order.subscriptions[0].subscriptionPlan.discountPercentage
    } : null,
    // Coupon information
    coupon: order.coupon ? {
      code: order.coupon.code,
      discount: order.coupon.discountPercentage
    } : null,
    // Payment information (placeholder for now)
    payment: {
      method: 'INSTA_PAY', // Default
      status: 'SUCCESS',
      proofFile: null // Will be populated if payment proof exists
    }
  }));
}

