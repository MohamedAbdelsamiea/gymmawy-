import { getPrismaClient } from '../config/db.js';

const prisma = getPrismaClient();

/**
 * Award loyalty points to a user for a completed purchase
 * @param {string} userId - User ID
 * @param {string} purchaseType - Type of purchase ('ORDER', 'SUBSCRIPTION', 'PROGRAMME')
 * @param {string} purchaseId - Purchase ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result of the loyalty points award
 */
export async function awardLoyaltyPoints(userId, purchaseType, purchaseId, options = {}) {
  try {
    let loyaltyPoints = 0;
    let sourceDescription = '';
    let metadata = {};

    switch (purchaseType) {
      case 'ORDER':
        // Get order with items and products
        const order = await prisma.order.findUnique({
          where: { id: purchaseId },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        });

        if (!order) {
          throw new Error(`Order ${purchaseId} not found`);
        }

        // Calculate total loyalty points from all items
        for (const item of order.items) {
          const pointsPerItem = item.product?.loyaltyPointsAwarded || 0;
          const pointsForThisItem = pointsPerItem * item.quantity;
          loyaltyPoints += pointsForThisItem;
        }

        sourceDescription = 'ORDER_PURCHASE';
        metadata = {
          type: 'EARNED',
          source: 'ORDER_PURCHASE',
          sourceId: order.id,
          orderNumber: order.orderNumber
        };
        break;

      case 'SUBSCRIPTION':
        // Get subscription with plan
        const subscription = await prisma.subscription.findUnique({
          where: { id: purchaseId },
          include: {
            subscriptionPlan: true
          }
        });

        if (!subscription) {
          throw new Error(`Subscription ${purchaseId} not found`);
        }

        // Use medical loyalty points if this is a medical subscription
        if (subscription.isMedical && subscription.subscriptionPlan.medicalLoyaltyPointsAwarded > 0) {
          loyaltyPoints = subscription.subscriptionPlan.medicalLoyaltyPointsAwarded;
        } else {
          loyaltyPoints = subscription.subscriptionPlan.loyaltyPointsAwarded || 0;
        }

        sourceDescription = 'SUBSCRIPTION_PURCHASE';
        metadata = {
          type: 'EARNED',
          source: 'SUBSCRIPTION_PURCHASE',
          sourceId: subscription.id,
          subscriptionNumber: subscription.subscriptionNumber,
          isMedical: subscription.isMedical
        };
        break;

      case 'PROGRAMME':
        // Get programme purchase with programme
        const programmePurchase = await prisma.programmePurchase.findUnique({
          where: { id: purchaseId },
          include: {
            programme: true
          }
        });

        if (!programmePurchase) {
          throw new Error(`Programme purchase ${purchaseId} not found`);
        }

        loyaltyPoints = programmePurchase.programme.loyaltyPointsAwarded || 0;
        sourceDescription = 'PROGRAMME_PURCHASE';
        metadata = {
          type: 'EARNED',
          source: 'PROGRAMME_PURCHASE',
          sourceId: programmePurchase.id,
          purchaseNumber: programmePurchase.purchaseNumber
        };
        break;

      default:
        throw new Error(`Unknown purchase type: ${purchaseType}`);
    }

    // Only proceed if there are loyalty points to award
    if (loyaltyPoints <= 0) {
      console.log(`No loyalty points to award for ${purchaseType} ${purchaseId}`);
      return {
        success: true,
        loyaltyPoints: 0,
        message: 'No loyalty points configured for this purchase'
      };
    }

    // Award loyalty points to user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        loyaltyPoints: {
          increment: loyaltyPoints
        }
      },
      select: {
        id: true,
        loyaltyPoints: true
      }
    });

    // Create payment record for loyalty points earned
    const paymentReference = `LOYALTY-${sourceDescription}-${purchaseId}`;
    await prisma.payment.create({
      data: {
        userId: userId,
        amount: loyaltyPoints,
        status: 'SUCCESS',
        method: 'GYMMAWY_COINS',
        currency: 'GYMMAWY_COINS',
        paymentReference: paymentReference,
        paymentableType: purchaseType,
        paymentableId: purchaseId,
        metadata: metadata
      }
    });

    console.log(`✅ Awarded ${loyaltyPoints} loyalty points to user ${userId} for ${purchaseType} ${purchaseId}`);
    console.log(`💰 User ${userId} now has ${updatedUser.loyaltyPoints} total loyalty points`);

    return {
      success: true,
      loyaltyPoints: loyaltyPoints,
      totalLoyaltyPoints: updatedUser.loyaltyPoints,
      message: `Awarded ${loyaltyPoints} loyalty points for ${purchaseType} purchase`
    };

  } catch (error) {
    console.error(`❌ Failed to award loyalty points for ${purchaseType} ${purchaseId}:`, error);
    return {
      success: false,
      error: error.message,
      loyaltyPoints: 0
    };
  }
}

/**
 * Award loyalty points for a completed order
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Result of the loyalty points award
 */
export async function awardLoyaltyPointsForOrder(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true }
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  return await awardLoyaltyPoints(order.userId, 'ORDER', orderId);
}

/**
 * Award loyalty points for a completed subscription
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<Object>} Result of the loyalty points award
 */
export async function awardLoyaltyPointsForSubscription(subscriptionId) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: { userId: true }
  });

  if (!subscription) {
    throw new Error(`Subscription ${subscriptionId} not found`);
  }

  return await awardLoyaltyPoints(subscription.userId, 'SUBSCRIPTION', subscriptionId);
}

/**
 * Award loyalty points for a completed programme purchase
 * @param {string} programmePurchaseId - Programme purchase ID
 * @returns {Promise<Object>} Result of the loyalty points award
 */
export async function awardLoyaltyPointsForProgramme(programmePurchaseId) {
  const programmePurchase = await prisma.programmePurchase.findUnique({
    where: { id: programmePurchaseId },
    select: { userId: true }
  });

  if (!programmePurchase) {
    throw new Error(`Programme purchase ${programmePurchaseId} not found`);
  }

  return await awardLoyaltyPoints(programmePurchase.userId, 'PROGRAMME', programmePurchaseId);
}
