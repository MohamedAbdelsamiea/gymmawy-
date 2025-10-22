import { getPrismaClient } from "../../config/db.js";
import { generateOrderNumber, generateUniqueId } from "../../utils/idGenerator.js";

const prisma = getPrismaClient();

// ============================================================================
// LOYALTY POINTS TRACKING & HISTORY
// ============================================================================

/**
 * Get recent loyalty transactions for a user (for dashboard preview)
 * Fetches last 20 transactions OR all transactions from past 90 days (whichever is greater)
 */
export async function getRecentLoyaltyTransactions(userId) {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // First, get all transactions from the past 90 days
  const recentTransactions = await prisma.payment.findMany({
    where: {
      userId: userId,
      currency: 'GYMMAWY_COINS',
      createdAt: { gte: ninetyDaysAgo }
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      amount: true,
      method: true,
      status: true,
      paymentableType: true,
      paymentableId: true,
      metadata: true,
      createdAt: true
    }
  });

  // If we have less than 20 transactions from the past 90 days,
  // get additional older transactions to reach 20 total
  if (recentTransactions.length < 20) {
    const olderTransactions = await prisma.payment.findMany({
      where: {
        userId: userId,
        currency: 'GYMMAWY_COINS',
        createdAt: { lt: ninetyDaysAgo }
      },
      orderBy: { createdAt: 'desc' },
      take: 20 - recentTransactions.length,
      select: {
        id: true,
        amount: true,
        method: true,
        status: true,
        paymentableType: true,
        paymentableId: true,
        metadata: true,
        createdAt: true
      }
    });

    return [...recentTransactions, ...olderTransactions];
  }

  return recentTransactions;
}

/**
 * Get paginated loyalty transactions for full history page
 */
export async function getLoyaltyTransactions(userId, query = {}) {
  const {
    page = 1,
    limit = 20,
    type = 'all', // 'earned', 'spent', 'all'
    source = 'all', // 'subscription', 'order', 'redemption', 'all'
    startDate,
    endDate
  } = query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build where clause
  const where = {
    userId: userId,
    currency: 'GYMMAWY_COINS'
  };

  // Filter by type (earned/spent)
  if (type === 'earned') {
    where.amount = { gt: 0 };
  } else if (type === 'spent') {
    where.amount = { lt: 0 };
  }

  // Filter by source
  if (source !== 'all') {
    where.paymentableType = source.toUpperCase();
  }

  // Filter by date range
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  // Get transactions
  const [transactions, totalCount] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
      select: {
        id: true,
        amount: true,
        method: true,
        status: true,
        paymentableType: true,
        paymentableId: true,
        metadata: true,
        createdAt: true
      }
    }),
    prisma.payment.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  return {
    transactions,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalCount,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
    }
  };
}

/**
 * Get loyalty statistics for a user
 */
export async function getLoyaltyStats(userId) {
  // Get current balance
  const currentBalance = await prisma.user.findUnique({
    where: { id: userId },
    select: { loyaltyPoints: true }
  });

  // Get earned points (positive amounts)
  const earnedStats = await prisma.payment.aggregate({
    where: {
      userId: userId,
      currency: 'GYMMAWY_COINS',
      amount: { gt: 0 }
    },
    _sum: { amount: true },
    _count: true
  });

  // Get spent points (negative amounts)
  const spentStats = await prisma.payment.aggregate({
    where: {
      userId: userId,
      currency: 'GYMMAWY_COINS',
      amount: { lt: 0 }
    },
    _sum: { amount: true },
    _count: true
  });

  // Get total transactions
  const totalTransactions = await prisma.payment.count({
    where: {
      userId: userId,
      currency: 'GYMMAWY_COINS'
    }
  });

  return {
    currentBalance: currentBalance?.loyaltyPoints || 0,
    totalEarned: earnedStats._sum.amount || 0,
    totalSpent: Math.abs(spentStats._sum.amount || 0),
    earnedCount: earnedStats._count || 0,
    spentCount: spentStats._count || 0,
    totalTransactions
  };
}

/**
 * Get filter options for loyalty transactions
 */
export async function getFilterOptions(userId) {
  // Get unique sources
  const sources = await prisma.payment.findMany({
    where: {
      userId: userId,
      currency: 'GYMMAWY_COINS',
      paymentableType: { not: null }
    },
    select: { paymentableType: true },
    distinct: ['paymentableType']
  });

  // Get date range
  const dateRange = await prisma.payment.aggregate({
    where: {
      userId: userId,
      currency: 'GYMMAWY_COINS'
    },
    _min: { createdAt: true },
    _max: { createdAt: true }
  });

  return {
    sources: sources.map(s => s.paymentableType).filter(Boolean),
    dateRange: {
      min: dateRange._min.createdAt,
      max: dateRange._max.createdAt
    },
    types: ['earned', 'spent', 'all']
  };
}

// ============================================================================
// REWARD REDEMPTION & VALIDATION
// ============================================================================

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
        console.log('🛍️ Found product:', reward ? { id: reward.id, loyaltyPointsRequired: reward.loyaltyPointsRequired } : null);
        break;
      case 'programmes':
        reward = await prisma.programme.findFirst({
          where: {
            id: itemId,
            loyaltyPointsRequired: { gt: 0 }
          }
        });
        console.log('📚 Found programme:', reward ? { id: reward.id, loyaltyPointsRequired: reward.loyaltyPointsRequired } : null);
        break;
      default:
        throw new Error('Invalid reward category');
    }

    if (!reward) {
      throw new Error('Reward not found or not available for redemption');
    }

    // Verify the points required match
    if (reward.loyaltyPointsRequired !== pointsRequired) {
      throw new Error('Points required mismatch');
    }

    // Check if reward is active
    if (reward.isActive === false) {
      throw new Error('Reward is not active');
    }

    // Check stock if applicable
    if (reward.stock !== null && reward.stock <= 0) {
      throw new Error('Reward is out of stock');
    }

    console.log('✅ Redemption validation successful');

    return {
      valid: true,
      reward: {
        id: reward.id,
        name: reward.name,
        category: category,
        pointsRequired: reward.loyaltyPointsRequired,
        stock: reward.stock
      },
      userPoints: user.loyaltyPoints,
      remainingPoints: user.loyaltyPoints - pointsRequired
    };

  } catch (error) {
    console.error('❌ Redemption validation failed:', error.message);
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Process reward redemption
 */
export async function processRedemption(userId, itemId, category, pointsRequired) {
  try {
    console.log('🎁 Processing redemption:', { userId, itemId, category, pointsRequired });

    // First validate the redemption
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

      // Create payment record for the redemption
      const payment = await tx.payment.create({
        data: {
          userId: userId,
          amount: -pointsRequired, // Negative amount for spending
          currency: 'GYMMAWY_COINS',
          method: 'GYMMAWY_COINS',
          status: 'SUCCESS',
          paymentReference: await generateUniqueId(),
          paymentableId: itemId,
          paymentableType: category.toUpperCase(),
          metadata: {
            type: 'REDEMPTION',
            category: category,
            itemId: itemId,
            pointsSpent: pointsRequired
          }
        }
      });

      // Update stock if applicable
      if (validation.reward.stock !== null) {
        await tx[category === 'packages' ? 'subscriptionPlan' : category === 'products' ? 'product' : 'programme'].update({
          where: { id: itemId },
          data: {
            stock: {
              decrement: 1
            }
          }
        });
      }

      return {
        payment,
        updatedUser,
        reward: validation.reward
      };
    });

    console.log('✅ Redemption processed successfully:', result.payment.id);

    return {
      success: true,
      redemptionId: result.payment.id,
      pointsSpent: pointsRequired,
      remainingPoints: result.updatedUser.loyaltyPoints,
      reward: result.reward
    };

  } catch (error) {
    console.error('❌ Redemption processing failed:', error.message);
    throw error;
  }
}

/**
 * Get redemption history for a user
 */
export async function getRedemptionHistory(userId, query = {}) {
  const {
    page = 1,
    limit = 20,
    startDate,
    endDate
  } = query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    userId: userId,
    currency: 'GYMMAWY_COINS',
    amount: { lt: 0 } // Only spent points (redemptions)
  };

  // Filter by date range
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  const [redemptions, totalCount] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
      select: {
        id: true,
        amount: true,
        paymentableType: true,
        paymentableId: true,
        metadata: true,
        createdAt: true
      }
    }),
    prisma.payment.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  return {
    redemptions,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalCount,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
    }
  };
}

// ============================================================================
// AVAILABLE REWARDS
// ============================================================================

/**
 * Get available rewards for redemption
 */
export async function getAvailableRewards(category = 'all') {
  const rewards = [];

  if (category === 'all' || category === 'packages') {
    const packages = await prisma.subscriptionPlan.findMany({
      where: {
        loyaltyPointsRequired: { gt: 0 },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        loyaltyPointsRequired: true,
        stock: true,
        imageUrl: true
      }
    });
    rewards.push(...packages.map(p => ({ ...p, category: 'packages' })));
  }

  if (category === 'all' || category === 'products') {
    const products = await prisma.product.findMany({
      where: {
        loyaltyPointsRequired: { gt: 0 },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        loyaltyPointsRequired: true,
        stock: true,
        imageUrl: true
      }
    });
    rewards.push(...products.map(p => ({ ...p, category: 'products' })));
  }

  if (category === 'all' || category === 'programmes') {
    const programmes = await prisma.programme.findMany({
      where: {
        loyaltyPointsRequired: { gt: 0 },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        loyaltyPointsRequired: true,
        stock: true,
        imageUrl: true
      }
    });
    rewards.push(...programmes.map(p => ({ ...p, category: 'programmes' })));
  }

  return rewards.sort((a, b) => a.loyaltyPointsRequired - b.loyaltyPointsRequired);
}