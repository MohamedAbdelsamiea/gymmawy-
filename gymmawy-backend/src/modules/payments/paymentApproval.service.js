import { getPrismaClient } from '../../config/db.js';
import autoShipmentService from '../../services/autoShipmentService.js';
import { activateOrder } from '../orders/order.service.js';
import { approveSubscription } from '../subscriptions/subscription.service.js';
import { approveProgrammePurchase } from '../programmes/programme.service.js';

const prisma = getPrismaClient();

/**
 * Upload payment proof
 */
export async function uploadPaymentProof(userId, paymentId, proofUrl) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId }
  });

  if (!payment) {
    const e = new Error("Payment not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: 'PENDING_VERIFICATION',
      paymentProofUrl: proofUrl
    }
  });

  return updated;
}

/**
 * Get pending payments for admin review
 */
export async function getPendingPayments(options = {}) {
  const { page = 1, pageSize = 10, status = 'PENDING_VERIFICATION' } = options;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { status },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            mobileNumber: true
          }
        }
      }
    }),
    prisma.payment.count({ where: { status } })
  ]);

  return {
    payments,
    pagination: {
      page,
      pageSize,
      total,
      pages: Math.ceil(total / pageSize)
    }
  };
}

/**
 * Approve payment and create shipment automatically
 */
export async function approvePayment(paymentId, adminId) {
  console.log(`💳 Approving payment ${paymentId} by admin ${adminId}`);

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: true
    }
  });

  if (!payment) {
    const e = new Error("Payment not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  // Use transaction for data consistency
  const result = await prisma.$transaction(async (tx) => {
    // Update payment status
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'SUCCESS',
        processedAt: new Date()
      }
    });

    let order = null;
    let subscription = null;
    let programmePurchase = null;

    // Handle different paymentable types and award loyalty points
    if (payment.paymentableType === 'ORDER') {
      // Update order status to PAID
      order = await tx.order.update({
        where: { id: payment.paymentableId },
        data: { status: 'PAID' }
      });

      console.log(`✅ Order ${order.id} marked as PAID`);
    } else if (payment.paymentableType === 'SUBSCRIPTION') {
      // Handle subscription activation
      subscription = await tx.subscription.update({
        where: { id: payment.paymentableId },
        data: { status: 'ACTIVE' }
      });

      console.log(`✅ Subscription ${subscription.id} activated`);
    } else if (payment.paymentableType === 'PROGRAMME_PURCHASE') {
      // Handle programme purchase
      programmePurchase = await tx.programmePurchase.update({
        where: { id: payment.paymentableId },
        data: { status: 'COMPLETE' }
      });

      console.log(`✅ Programme purchase ${programmePurchase.id} completed`);
    }

    return { payment: updatedPayment, order, subscription, programmePurchase };
  });

  // Award loyalty points after payment approval
  try {
    if (result.order) {
      console.log(`🎁 Awarding loyalty points for order ${result.order.id}`);
      await activateOrder(result.order.id, adminId);
      console.log(`✅ Loyalty points awarded for order ${result.order.id}`);
    } else if (result.subscription) {
      console.log(`🎁 Awarding loyalty points for subscription ${result.subscription.id}`);
      await approveSubscription(result.subscription.id);
      console.log(`✅ Loyalty points awarded for subscription ${result.subscription.id}`);
    } else if (result.programmePurchase) {
      console.log(`🎁 Awarding loyalty points for programme purchase ${result.programmePurchase.id}`);
      await approveProgrammePurchase(result.programmePurchase.id);
      console.log(`✅ Loyalty points awarded for programme purchase ${result.programmePurchase.id}`);
    }
  } catch (error) {
    console.error(`❌ Failed to award loyalty points:`, error.message);
    // Don't fail the payment approval if loyalty points awarding fails
    result.loyaltyPointsError = error.message;
  }

  // After transaction, create shipment automatically for orders
  if (result.order) {
    console.log(`📦 Attempting to create shipment for order ${result.order.id}`);
    
    try {
      const shipment = await autoShipmentService.createShipmentForOrder(result.order.id);
      
      if (shipment) {
        console.log(`✅ Shipment created successfully: ${shipment.shipping.trackingNumber}`);
        result.shipment = shipment;
      } else {
        console.log(`⚠️  Shipment not created (may not meet criteria)`);
      }
    } catch (error) {
      console.error(`❌ Failed to create shipment for order ${result.order.id}:`, error.message);
      // Don't fail the payment approval if shipment creation fails
      result.shipmentError = error.message;
    }
  }

  return result;
}

/**
 * Reject payment
 */
export async function rejectPayment(paymentId, adminId) {
  console.log(`❌ Rejecting payment ${paymentId} by admin ${adminId}`);

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId }
  });

  if (!payment) {
    const e = new Error("Payment not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update payment status
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        processedAt: new Date()
      }
    });

    let order = null;
    let subscription = null;
    let programmePurchase = null;

    // Handle different paymentable types
    if (payment.paymentableType === 'ORDER') {
      order = await tx.order.update({
        where: { id: payment.paymentableId },
        data: { status: 'CANCELLED' }
      });

      console.log(`❌ Order ${order.id} cancelled`);
    } else if (payment.paymentableType === 'SUBSCRIPTION') {
      subscription = await tx.subscription.update({
        where: { id: payment.paymentableId },
        data: { status: 'CANCELLED' }
      });

      console.log(`❌ Subscription ${subscription.id} cancelled`);
    } else if (payment.paymentableType === 'PROGRAMME_PURCHASE') {
      programmePurchase = await tx.programmePurchase.update({
        where: { id: payment.paymentableId },
        data: { status: 'CANCELLED' }
      });

      console.log(`❌ Programme purchase ${programmePurchase.id} cancelled`);
    }

    return { payment: updatedPayment, order, subscription, programmePurchase };
  });

  return result;
}

/**
 * Get payment by ID
 */
export async function getPaymentById(paymentId) {
  return await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });
}

/**
 * Get recent payments for a user
 */
export async function getRecentPayments(userId, limit = 5) {
  return await prisma.payment.findMany({
    where: { userId },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });
}

/**
 * Create a payment record
 */
export async function createPayment(paymentData) {
  return await prisma.payment.create({
    data: {
      ...paymentData,
      status: paymentData.status || 'PENDING'
    }
  });
}
