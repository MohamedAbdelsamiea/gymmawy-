import { getPrismaClient } from "../../config/db.js";
import { generateOrderNumber, generateUniqueId } from "../../utils/idGenerator.js";

const prisma = getPrismaClient();

/**
 * Validate if user has enough points for redemption
 */
export async function validateRedemption(userId, rewardId, category, pointsRequired) {
  try {
    console.log('🔍 Validating redemption:', { userId, rewardId, category, pointsRequired });

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

    console.log('🔍 Looking up reward:', { category, rewardId });

    switch (category) {
      case 'packages':
        reward = await prisma.subscriptionPlan.findFirst({
          where: {
            id: rewardId,
            loyaltyPointsRequired: { gt: 0 }
          },
          include: {
            prices: true
          }
        });
        console.log('📦 Found subscription plan:', reward ? { id: reward.id, loyaltyPointsRequired: reward.loyaltyPointsRequired } : null);
        break;
      case 'products':
        reward = await prisma.product.findFirst({
          where: {
            id: rewardId,
            loyaltyPointsRequired: { gt: 0 }
          },
          include: {
            prices: true
          }
        });
        break;
      case 'programmes':
        reward = await prisma.programme.findFirst({
          where: {
            id: rewardId,
            loyaltyPointsRequired: { gt: 0 }
          },
          include: {
            prices: true
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
export async function processRedemption(userId, rewardId, category, shippingAddress, language = 'en') {
  try {
    // Get reward details and validate
    let reward = null;
    let rewardName = '';
    let rewardPrice = 0;

    switch (category) {
      case 'packages':
        reward = await prisma.subscriptionPlan.findUnique({
          where: { id: rewardId },
          include: { prices: true }
        });
        rewardName = reward.name?.en || reward.name || 'Subscription Package';
        // For packages, price is typically 0 since it's redeemed with points
        rewardPrice = 0;
        break;
      case 'products':
        reward = await prisma.product.findUnique({
          where: { id: rewardId },
          include: { prices: true }
        });
        rewardName = reward.name?.en || reward.name || 'Product';
        // Get price for user's currency (default to EGP)
        const productPrice = reward.prices?.find(p => p.currency === 'EGP') || reward.prices?.[0];
        rewardPrice = productPrice?.amount || 0;
        break;
      case 'programmes':
        reward = await prisma.programme.findUnique({
          where: { id: rewardId },
          include: { prices: true }
        });
        rewardName = reward.name?.en || reward.name || 'Programme';
        // Get price for user's currency (default to EGP)
        const programmePrice = reward.prices?.find(p => p.currency === 'EGP') || reward.prices?.[0];
        rewardPrice = programmePrice?.amount || 0;
        break;
      default:
        throw new Error('Invalid reward category');
    }

    if (!reward) {
      throw new Error('Reward not found');
    }

    const pointsRequired = reward.loyaltyPointsRequired;

    // Validate redemption
    const validation = await validateRedemption(userId, rewardId, category, pointsRequired);
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

      // Create loyalty transaction record
      const loyaltyTransaction = await tx.loyaltyTransaction.create({
        data: {
          userId: userId,
          points: pointsRequired,
          type: 'SPENT',
          source: 'REWARD_REDEMPTION',
          sourceId: rewardId,
          reason: `Redeemed ${rewardName}`,
          metadata: {
            category: category,
            rewardName: rewardName,
            rewardPrice: rewardPrice
          }
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
          totalAmount: rewardPrice,
          currency: 'EGP', // Default currency
          paymentMethod: 'LOYALTY_POINTS',
          paymentReference: `LOYALTY-${loyaltyTransaction.id}`,
          shippingAddress: shippingAddress,
          language: language,
          items: {
            create: [{
              rewardId: rewardId,
              category: category,
              name: rewardName,
              quantity: 1,
              price: rewardPrice,
              totalPrice: rewardPrice,
              loyaltyPointsUsed: pointsRequired
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
            subscriptionPlanId: rewardId,
            subscriptionNumber: `SUB-${orderNumber}`,
            status: 'ACTIVE',
            startDate: new Date(),
            endDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days from now
            price: 0, // Free since redeemed with points
            currency: 'EGP',
            paymentMethod: 'LOYALTY_POINTS',
            orderId: order.id
          }
        });
        specificRecord = subscription;
      } else if (category === 'programmes') {
        // Create programme purchase
        const programmePurchase = await tx.programmePurchase.create({
          data: {
            userId: userId,
            programmeId: rewardId,
            status: 'APPROVED', // Auto-approve loyalty redemptions
            price: 0, // Free since redeemed with points
            currency: 'EGP',
            paymentMethod: 'LOYALTY_POINTS',
            orderId: order.id,
            approvedAt: new Date(),
            approvedBy: 'SYSTEM' // Auto-approved by system
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
