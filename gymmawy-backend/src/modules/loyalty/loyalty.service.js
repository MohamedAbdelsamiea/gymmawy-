import { getPrismaClient } from "../../config/db.js";

const prisma = getPrismaClient();

/**
 * Get recent loyalty transactions for a user (for dashboard preview)
 * Fetches last 20 transactions OR all transactions from past 90 days (whichever is greater)
 */
export async function getRecentLoyaltyTransactions(userId) {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // First, get all transactions from the past 90 days
  const recentTransactions = await prisma.loyaltyTransaction.findMany({
    where: {
      userId: userId,
      createdAt: { gte: ninetyDaysAgo }
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      points: true,
      type: true,
      source: true,
      reason: true,
      metadata: true,
      createdAt: true
    }
  });

  // If we have less than 20 transactions from the past 90 days,
  // get additional older transactions to reach 20 total
  if (recentTransactions.length < 20) {
    const olderTransactions = await prisma.loyaltyTransaction.findMany({
      where: {
        userId: userId,
        createdAt: { lt: ninetyDaysAgo }
      },
      orderBy: { createdAt: 'desc' },
      take: 20 - recentTransactions.length,
      select: {
        id: true,
        points: true,
        type: true,
        source: true,
        reason: true,
        metadata: true,
        createdAt: true
      }
    });

    return [...recentTransactions, ...olderTransactions];
  }

  return recentTransactions;
}

/**
 * Get paginated loyalty transactions for a user (for full history page)
 */
export async function getLoyaltyTransactions(userId, query = {}) {
  const {
    page = 1,
    pageSize = 20,
    type,
    source,
    startDate,
    endDate,
    cursor
  } = query;

  const skip = (page - 1) * pageSize;

  // Build where clause
  const where = {
    userId: userId
  };

  if (type) {
    where.type = type;
  }

  if (source) {
    where.source = source;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  // Use cursor-based pagination if cursor is provided
  if (cursor) {
    where.id = { lt: cursor };
  }

  const [transactions, total] = await Promise.all([
    prisma.loyaltyTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: cursor ? 0 : skip,
      select: {
        id: true,
        points: true,
        type: true,
        source: true,
        reason: true,
        metadata: true,
        createdAt: true
      }
    }),
    prisma.loyaltyTransaction.count({ where })
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    transactions,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      nextCursor: hasNextPage ? transactions[transactions.length - 1]?.id : null
    }
  };
}

/**
 * Get loyalty transaction statistics for a user
 */
export async function getLoyaltyStats(userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalEarned,
    totalRedeemed,
    monthEarned,
    monthRedeemed,
    weekEarned,
    weekRedeemed,
    currentBalance
  ] = await Promise.all([
    // Total earned points
    prisma.loyaltyTransaction.aggregate({
      _sum: { points: true },
      where: {
        userId: userId,
        type: 'EARNED',
        points: { gt: 0 }
      }
    }),
    // Total redeemed points
    prisma.loyaltyTransaction.aggregate({
      _sum: { points: true },
      where: {
        userId: userId,
        type: 'REDEEMED',
        points: { lt: 0 }
      }
    }),
    // This month earned
    prisma.loyaltyTransaction.aggregate({
      _sum: { points: true },
      where: {
        userId: userId,
        type: 'EARNED',
        points: { gt: 0 },
        createdAt: { gte: startOfMonth }
      }
    }),
    // This month redeemed
    prisma.loyaltyTransaction.aggregate({
      _sum: { points: true },
      where: {
        userId: userId,
        type: 'REDEEMED',
        points: { lt: 0 },
        createdAt: { gte: startOfMonth }
      }
    }),
    // This week earned
    prisma.loyaltyTransaction.aggregate({
      _sum: { points: true },
      where: {
        userId: userId,
        type: 'EARNED',
        points: { gt: 0 },
        createdAt: { gte: startOfWeek }
      }
    }),
    // This week redeemed
    prisma.loyaltyTransaction.aggregate({
      _sum: { points: true },
      where: {
        userId: userId,
        type: 'REDEEMED',
        points: { lt: 0 },
        createdAt: { gte: startOfWeek }
      }
    }),
    // Current balance from user table
    prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true }
    })
  ]);

  return {
    totalEarned: Number(totalEarned._sum.points || 0),
    totalRedeemed: Math.abs(Number(totalRedeemed._sum.points || 0)),
    monthEarned: Number(monthEarned._sum.points || 0),
    monthRedeemed: Math.abs(Number(monthRedeemed._sum.points || 0)),
    weekEarned: Number(weekEarned._sum.points || 0),
    weekRedeemed: Math.abs(Number(weekRedeemed._sum.points || 0)),
    currentBalance: currentBalance?.loyaltyPoints || 0
  };
}

/**
 * Get available filter options for loyalty transactions
 */
export async function getLoyaltyFilterOptions(userId) {
  const [types, sources] = await Promise.all([
    prisma.loyaltyTransaction.findMany({
      where: { userId: userId },
      select: { type: true },
      distinct: ['type']
    }),
    prisma.loyaltyTransaction.findMany({
      where: { userId: userId },
      select: { source: true },
      distinct: ['source']
    })
  ]);

  return {
    types: types.map(t => t.type),
    sources: sources.map(s => s.source)
  };
}
