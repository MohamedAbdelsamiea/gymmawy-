import { getPrismaClient } from "../../config/db.js";
import { generateUniqueId } from "../../utils/idGenerator.js";
import * as notificationService from "../notifications/notification.service.js";
import * as loyaltyService from "../loyalty/loyalty.service.js";

const prisma = getPrismaClient();

// Payment validation function
// Handles different payment method requirements:
// - CARD/TABBY/TAMARA: require transactionId (online payment gateway response)
// - INSTA_PAY/VODAFONE_CASH: require paymentProofUrl (manual payment proof)
function validatePaymentData(paymentMethod, transactionId, paymentProofUrl) {
  const errors = [];
  
  // Online payment methods (CARD, TABBY, TAMARA) require transaction ID from payment gateway
  if (['CARD', 'TABBY', 'TAMARA'].includes(paymentMethod)) {
    if (!transactionId || transactionId.trim() === '') {
      errors.push(`Transaction ID is required for online payment method: ${paymentMethod}`);
    }
  }
  
  // Manual payment methods (INSTA_PAY, VODAFONE_CASH) require payment proof URL
  if (['INSTA_PAY', 'VODAFONE_CASH'].includes(paymentMethod)) {
    if (!paymentProofUrl || paymentProofUrl.trim() === '') {
      errors.push(`Payment proof URL is required for manual payment method: ${paymentMethod}`);
    }
  }
  
  // Validate that we have a recognized payment method
  const validMethods = ['CARD', 'TABBY', 'TAMARA', 'INSTA_PAY', 'VODAFONE_CASH'];
  if (!validMethods.includes(paymentMethod)) {
    errors.push(`Invalid payment method: ${paymentMethod}. Must be one of: ${validMethods.join(', ')}`);
  }
  
  if (errors.length > 0) {
    const error = new Error(`Payment validation failed: ${errors.join(', ')}`);
    error.status = 400;
    error.expose = true;
    throw error;
  }
}

export async function uploadPaymentProof(userId, paymentId, proofUrl) {
  // Verify the payment belongs to the user
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      userId: userId,
      paymentableType: 'SUBSCRIPTION'
    },
    include: {
      user: true
    }
  });

  if (!payment) {
    const e = new Error("Payment not found or access denied");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  if (payment.status !== 'PENDING') {
    const e = new Error("Payment cannot be updated");
    e.status = 400;
    e.expose = true;
    throw e;
  }

  // Validate payment data after uploading proof
  validatePaymentData(payment.method, payment.transactionId, proofUrl);

  // Update payment with proof and change status to PENDING_VERIFICATION
  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      paymentProofUrl: proofUrl,
      status: 'PENDING_VERIFICATION'
    },
    include: {
      user: true
    }
  });

  // Create notification for admin
  try {
    await notificationService.notifyPaymentProofUploaded(updatedPayment);
  } catch (error) {
    console.error('Failed to create payment proof notification:', error);
  }

  return updatedPayment;
}

// Create payment with validation
export async function createPayment(paymentData) {
  const {
    userId,
    amount,
    currency,
    method,
    transactionId,
    paymentProofUrl,
    paymentableId,
    paymentableType,
    metadata = {}
  } = paymentData;

  // Validate payment data
  validatePaymentData(method, transactionId, paymentProofUrl);

  // Generate unique payment reference
  const paymentReference = await generateUniqueId(
    () => `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    async (ref) => {
      const existing = await prisma.payment.findUnique({ where: { paymentReference: ref } });
      return !existing;
    }
  );

  // Determine payment status based on method
  let paymentStatus = 'PENDING';
  if (method === 'INSTA_PAY' || method === 'VODAFONE_CASH') {
    paymentStatus = 'PENDING';
  } else if (method === 'CARD' || method === 'TABBY' || method === 'TAMARA') {
    paymentStatus = 'PENDING';
  }

  return prisma.payment.create({
    data: {
      userId,
      amount,
      currency,
      method,
      status: paymentStatus,
      paymentReference,
      transactionId,
      paymentProofUrl,
      paymentableId,
      paymentableType,
      metadata
    }
  });
}

export async function getPendingPayments(query = {}) {
  const { page = 1, pageSize = 10, status = 'PENDING_VERIFICATION' } = query;
  const skip = (page - 1) * pageSize;
  
  const where = { status };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
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
    prisma.payment.count({ where })
  ]);

  // Get related entity details for each payment
  const paymentsWithDetails = await Promise.all(
    payments.map(async (payment) => {
      let relatedEntity = null;
      
      if (payment.paymentableType === 'SUBSCRIPTION') {
        relatedEntity = await prisma.subscription.findUnique({
          where: { id: payment.paymentableId },
          include: {
            subscriptionPlan: true
          }
        });
        return {
          ...payment,
          subscription: relatedEntity
        };
      } else if (payment.paymentableType === 'PRODUCT') {
        relatedEntity = await prisma.order.findUnique({
          where: { id: payment.paymentableId },
          include: {
            items: true
          }
        });
        return {
          ...payment,
          order: relatedEntity
        };
      } else if (payment.paymentableType === 'PROGRAMME') {
        relatedEntity = await prisma.programmePurchase.findUnique({
          where: { id: payment.paymentableId },
          include: {
            programme: true
          }
        });
        return {
          ...payment,
          programmePurchase: relatedEntity
        };
      }
      
      return payment;
    })
  );

  return { items: paymentsWithDetails, total, page, pageSize };
}

export async function approvePayment(paymentId, adminId) {
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

  if (!['PENDING', 'PENDING_VERIFICATION', 'FAILED'].includes(payment.status)) {
    let errorMessage;
    switch (payment.status) {
      case 'SUCCESS':
        errorMessage = "This payment has already been approved";
        break;
      case 'CANCELLED':
        errorMessage = "This payment has been cancelled and cannot be approved";
        break;
      case 'REFUNDED':
        errorMessage = "This payment has been refunded and cannot be approved";
        break;
      default:
        errorMessage = `Payment with status '${payment.status}' cannot be approved`;
    }
    const e = new Error(errorMessage);
    e.status = 400;
    e.expose = true;
    throw e;
  }

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update payment status
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'SUCCESS',
        processedAt: new Date()
      }
    });

    let subscription = null;
    let order = null;
    let programmePurchase = null;

    // Handle different payment types
    if (payment.paymentableType === 'SUBSCRIPTION') {
      // Activate subscription
      const existingSubscription = await tx.subscription.findUnique({
        where: { id: payment.paymentableId },
        include: {
          subscriptionPlan: true
        }
      });

      if (existingSubscription) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + existingSubscription.subscriptionPlan.subscriptionPeriodDays);

        subscription = await tx.subscription.update({
          where: { id: payment.paymentableId },
          data: {
            status: 'ACTIVE',
            startDate,
            endDate
          },
          include: {
            subscriptionPlan: true
          }
        });


        // Award loyalty points for subscription
        const plan = subscription.subscriptionPlan;
        if (plan.loyaltyPointsAwarded > 0) {
          await tx.user.update({
            where: { id: payment.userId },
            data: {
              loyaltyPoints: {
                increment: plan.loyaltyPointsAwarded
              }
            }
          });

          await tx.loyaltyTransaction.create({
            data: {
              userId: payment.userId,
              points: plan.loyaltyPointsAwarded,
              type: 'EARNED',
              source: 'SUBSCRIPTION',
              sourceId: subscription.id
            }
          });
        }
      }
    } else if (payment.paymentableType === 'PRODUCT') {
      // Activate order
      order = await tx.order.update({
        where: { id: payment.paymentableId },
        data: {
          status: 'PAID'
        },
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

      // Award loyalty points for order items
      let totalLoyaltyPoints = 0;
      for (const item of order.items) {
        const pointsPerItem = item.loyaltyPointsAwarded || 0;
        const pointsForThisItem = pointsPerItem * item.quantity;
        totalLoyaltyPoints += pointsForThisItem;
      }

      if (totalLoyaltyPoints > 0) {
        await tx.user.update({
          where: { id: payment.userId },
          data: {
            loyaltyPoints: {
              increment: totalLoyaltyPoints
            }
          }
        });

        await tx.loyaltyTransaction.create({
          data: {
            userId: payment.userId,
            points: totalLoyaltyPoints,
            type: 'EARNED',
            source: 'PRODUCT_ITEM',
            sourceId: order.id
          }
        });

        console.log(`Awarded ${totalLoyaltyPoints} loyalty points for order ${order.id}`);
      }
    } else if (payment.paymentableType === 'PROGRAMME') {
      // Activate programme purchase
      programmePurchase = await tx.programmePurchase.update({
        where: { id: payment.paymentableId },
        data: {
          status: 'COMPLETE'
        },
        include: {
          programme: true
        }
      });

      // Award loyalty points for programme purchase
      if (programmePurchase.programme.loyaltyPointsAwarded > 0) {
        await tx.user.update({
          where: { id: payment.userId },
          data: {
            loyaltyPoints: {
              increment: programmePurchase.programme.loyaltyPointsAwarded
            }
          }
        });

        await tx.loyaltyTransaction.create({
          data: {
            userId: payment.userId,
            points: programmePurchase.programme.loyaltyPointsAwarded,
            type: 'EARNED',
            source: 'PROGRAMME',
            sourceId: programmePurchase.id
          }
        });
      }
    }

    return { payment: updatedPayment, subscription, order, programmePurchase };
  });

  // Create notification for user
  try {
    await notificationService.notifyPaymentApproved(result.payment, result.subscription);
  } catch (error) {
    console.error('Failed to create payment approval notification:', error);
  }

  return result;
}

export async function rejectPayment(paymentId, adminId) {
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

  // Allow rejection for payments that are PENDING_VERIFICATION, PENDING with payment proof, FAILED, or SUCCESS
  if (payment.status !== 'PENDING_VERIFICATION' && 
      !(payment.status === 'PENDING' && payment.paymentProofUrl) &&
      payment.status !== 'FAILED' &&
      payment.status !== 'SUCCESS') {
    let errorMessage;
    switch (payment.status) {
      case 'CANCELLED':
        errorMessage = "This payment has already been cancelled";
        break;
      case 'REFUNDED':
        errorMessage = "This payment has already been refunded";
        break;
      default:
        errorMessage = `Payment with status '${payment.status}' cannot be rejected`;
    }
    const e = new Error(errorMessage);
    e.status = 400;
    e.expose = true;
    throw e;
  }

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update payment status
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        processedAt: new Date(),
        metadata: {
          ...payment.metadata,
          rejectedBy: adminId,
          rejectedAt: new Date()
        }
      }
    });

    let subscription = null;
    let order = null;
    let programmePurchase = null;

    // Handle different payment types - remove/cancel the associated entity
    if (payment.paymentableType === 'SUBSCRIPTION') {
      // Get subscription with coupon info before cancelling
      const existingSubscription = await tx.subscription.findUnique({
        where: { id: payment.paymentableId },
        include: {
          subscriptionPlan: true
        }
      });

      // Cancel subscription
      subscription = await tx.subscription.update({
        where: { id: payment.paymentableId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date()
        },
        include: {
          subscriptionPlan: true
        }
      });

      // Clean up coupon redemption if subscription had a coupon
      if (existingSubscription && existingSubscription.couponId) {
        try {
          const { rollbackCouponRedemption } = await import('../coupons/coupon.service.js');
          await rollbackCouponRedemption(payment.userId, existingSubscription.couponId);
          console.log('Coupon redemption cleaned up for cancelled subscription:', existingSubscription.id);
        } catch (error) {
          console.error('Failed to clean up coupon redemption for cancelled subscription:', error);
          // Don't throw error here as subscription is already cancelled
        }
      }
    } else if (payment.paymentableType === 'PRODUCT') {
      // Cancel order
      order = await tx.order.update({
        where: { id: payment.paymentableId },
        data: {
          status: 'CANCELLED'
        },
        include: {
          items: true
        }
      });
    } else if (payment.paymentableType === 'PROGRAMME') {
      // Get programme purchase with coupon info before cancelling
      const existingProgrammePurchase = await tx.programmePurchase.findUnique({
        where: { id: payment.paymentableId },
        include: {
          programme: true
        }
      });

      // Cancel programme purchase
      programmePurchase = await tx.programmePurchase.update({
        where: { id: payment.paymentableId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date()
        },
        include: {
          programme: true
        }
      });

      // Clean up coupon redemption if programme purchase had a coupon
      if (existingProgrammePurchase && existingProgrammePurchase.couponId) {
        try {
          const { rollbackCouponRedemption } = await import('../coupons/coupon.service.js');
          await rollbackCouponRedemption(payment.userId, existingProgrammePurchase.couponId);
          console.log('Coupon redemption cleaned up for cancelled programme purchase:', existingProgrammePurchase.id);
        } catch (error) {
          console.error('Failed to clean up coupon redemption for cancelled programme purchase:', error);
          // Don't throw error here as programme purchase is already cancelled
        }
      }
    }

    return { payment: updatedPayment, subscription, order, programmePurchase };
  });

  // Create notification for user
  try {
    await notificationService.notifyPaymentRejected(result.payment, result.subscription);
  } catch (error) {
    console.error('Failed to create payment rejection notification:', error);
  }

  return result;
}

export async function getPaymentById(paymentId) {
  return prisma.payment.findUnique({
    where: { id: paymentId },
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
  });
}

// Helper function to clean up coupon redemptions when payments fail
export async function cleanupCouponRedemptionForFailedPayment(paymentId) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        subscription: true
      }
    });

    if (!payment || payment.paymentableType !== 'SUBSCRIPTION') {
      return false;
    }

    const subscription = payment.subscription;
    if (!subscription || !subscription.couponId) {
      return false;
    }

    // Import coupon service dynamically to avoid circular dependency
    const { rollbackCouponRedemption } = await import('../coupons/coupon.service.js');
    await rollbackCouponRedemption(payment.userId, subscription.couponId);
    
    console.log('Coupon redemption cleaned up for failed payment:', paymentId);
    return true;
  } catch (error) {
    console.error('Failed to clean up coupon redemption for failed payment:', error);
    return false;
  }
}