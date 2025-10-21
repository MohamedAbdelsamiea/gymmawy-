import { getPrismaClient } from "../../config/db.js";
import { generateOrderNumber, generateUniqueId } from "../../utils/idGenerator.js";

const prisma = getPrismaClient();

/**
 * Validate if user has enough points for redemption
 */
export async function validateRedemption(userId, itemId, category, pointsRequired) {
  try {
    console.log('🔍 Validating redemption:', { userId, itemId, category, pointsRequired });

    // Get user's current points
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    console.log('👤 User loyalty points:', user.loyaltyPoints);

    if (user.loyaltyPoints < pointsRequired) {
      throw new Error('Insufficient loyalty points');
    }

    // Verify the reward exists and get its details
    let reward = null;
    let rewardData = null;

    console.log('🔍 Looking up reward:', { category, itemId });

    switch (category) {
      case 'packages':
        reward = await prisma.subscriptionPlan.findFirst({
          where: {
            id: itemId,
            loyaltyPointsRequired: { gt: 0 }
          }
        });
        console.log('📦 Found subscription plan:', reward ? { id: reward.id, loyaltyPointsRequired: reward.loyaltyPointsRequired } : null);
        break;
      case 'products':
        reward = await prisma.product.findFirst({
          where: {
            id: itemId,
            loyaltyPointsRequired: { gt: 0 }
          }
        });
        break;
      case 'programmes':
        reward = await prisma.programme.findFirst({
          where: {
            id: itemId,
            loyaltyPointsRequired: { gt: 0 }
          }
        });
        break;
      default:
        throw new Error('Invalid reward category');
    }

    if (!reward) {
      throw new Error('Reward not found or not available for redemption');
    }

    if (reward.loyaltyPointsRequired !== pointsRequired) {
      throw new Error('Points required mismatch');
    }

    return {
      valid: true,
      reward,
      userPoints: user.loyaltyPoints
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Process loyalty points redemption
 */
export async function processRedemption(userId, itemId, category, shippingDetails) {
  try {
    // Get user details for language preference
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLanguage: true }
    });
    
    const language = user?.preferredLanguage || 'en';
    
    // Get reward details and validate
    let reward = null;
    let rewardName = '';
    let rewardPrice = 0;

    switch (category) {
      case 'packages':
        reward = await prisma.subscriptionPlan.findUnique({
          where: { id: itemId }
        });
        rewardName = reward.name?.en || reward.name || 'Subscription Package';
        // For packages, price is typically 0 since it's redeemed with points
        rewardPrice = 0;
        break;
      case 'products':
        reward = await prisma.product.findUnique({
          where: { id: itemId }
        });
        rewardName = reward.name?.en || reward.name || 'Product';
        // For products, price is typically 0 since it's redeemed with points
        rewardPrice = 0;
        break;
      case 'programmes':
        reward = await prisma.programme.findUnique({
          where: { id: itemId }
        });
        rewardName = reward.name?.en || reward.name || 'Programme';
        // For programmes, price is typically 0 since it's redeemed with points
        rewardPrice = 0;
        break;
      default:
        throw new Error('Invalid reward category');
    }

    if (!reward) {
      throw new Error('Reward not found');
    }

    const pointsRequired = reward.loyaltyPointsRequired;

    // Validate redemption
    const validation = await validateRedemption(userId, itemId, category, pointsRequired);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Process the redemption in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct points from user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: {
            decrement: pointsRequired
          }
        }
      });

      // Create payment record for Gymmawy coins transaction
      const payment = await tx.payment.create({
        data: {
          amount: pointsRequired,
          currency: 'GYMMAWY_COINS',
          method: 'GYMMAWY_COINS',
          status: 'COMPLETED',
          gatewayId: null,
          transactionId: null,
          paymentReference: `REWARD-${itemId}-${Date.now()}`,
          userId: userId,
          paymentableId: null,
          paymentableType: null
        }
      });

      // Generate unique order number
      const orderNumber = await generateUniqueId(
        generateOrderNumber,
        async (number) => {
          const existing = await tx.order.findUnique({ where: { orderNumber: number } });
          return !existing;
        }
      );

      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber: orderNumber,
          userId: userId,
          status: 'PAID', // Directly mark as paid since it's loyalty redemption
          price: pointsRequired, // Use points as price for Gymmawy coins
          currency: 'GYMMAWY_COINS', // Set currency to Gymmawy coins
          paymentMethod: 'GYMMAWY_COINS',
          paymentReference: payment.paymentReference, // Reference payment transaction
          discountPercentage: 0, // No discounts for reward redemptions
          couponDiscount: 0, // No coupon discounts for reward redemptions
          shippingBuilding: shippingDetails?.building || null,
          shippingStreet: shippingDetails?.street || null,
          shippingCity: shippingDetails?.city || null,
          shippingCountry: shippingDetails?.country || null,
          shippingPostcode: shippingDetails?.postcode || null,
          items: {
            create: [{
              productId: itemId,
              category: category,
              name: rewardName,
              quantity: 1,
              price: pointsRequired, // Price is the number of coins used
              discountPercentage: 0 // No discounts for reward items
            }]
          }
        }
      });

      // Create specific records based on category
      let specificRecord = null;

      if (category === 'packages') {
        // Create subscription
        const subscription = await tx.subscription.create({
          data: {
            userId: userId,
            subscriptionPlanId: itemId,
            subscriptionNumber: `SUB-${orderNumber}`,
            status: 'ACTIVE',
            startDate: new Date(),
            endDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days from now
            price: 0, // Free since redeemed with points
            currency: 'EGP',
            paymentMethod: 'GYMMAWY_COINS'
          }
        });
        specificRecord = subscription;
      } else if (category === 'programmes') {
        // Create programme purchase
        const programmePurchase = await tx.programmePurchase.create({
          data: {
            userId: userId,
            programmeId: itemId,
            price: 0, // Free since redeemed with points
            purchaseNumber: `PROG-${orderNumber}`,
            status: 'COMPLETE', // Auto-approve loyalty redemptions
            currency: 'EGP'
          }
        });
        specificRecord = programmePurchase;
      }

      return {
        order,
        loyaltyTransaction,
        specificRecord,
        remainingPoints: updatedUser.loyaltyPoints
      };
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Redemption processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get redemption history for a user
 */
export async function getRedemptionHistory(userId, query = {}) {
  try {
    const { page = 1, limit = 10, category } = query;
    const skip = (page - 1) * limit;

    const whereClause = {
      userId: userId,
      type: 'SPENT',
      source: 'REWARD_REDEMPTION'
    };

    if (category) {
      whereClause.metadata = {
        path: ['category'],
        equals: category
      };
    }

    const [transactions, total] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: parseInt(limit),
        select: {
          id: true,
          points: true,
          reason: true,
          metadata: true,
          createdAt: true
        }
      }),
      prisma.loyaltyTransaction.count({
        where: whereClause
      })
    ]);

    return {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Get redemption history error:', error);
    throw error;
  }
}
