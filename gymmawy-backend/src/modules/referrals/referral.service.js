import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getReferralsService = async () => {
  return prisma.referral.findMany();
};

export const createReferralService = async (data) => {
  return prisma.referral.create({ data });
};

export const updateReferralService = async (id, data) => {
  return prisma.referral.update({
    where: { id: parseInt(id) },
    data
  });
};

export const deleteReferralService = async (id) => {
  return prisma.referral.delete({
    where: { id: parseInt(id) }
  });
};

export const getMyReferralCodesService = async (userId) => {
  return prisma.referralCode.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'desc' }
  });
};

export const validateReferralCodeService = async (code) => {
  const referralCode = await prisma.referralCode.findFirst({
    where: { code, isActive: true },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } }
  });

  if (!referralCode) {
    const e = new Error("Invalid referral code");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  return referralCode;
};

export const deactivateReferralCodeService = async (userId, code) => {
  const referralCode = await prisma.referralCode.findFirst({
    where: { code, userId }
  });

  if (!referralCode) {
    const e = new Error("Referral code not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  return prisma.referralCode.update({
    where: { id: referralCode.id },
    data: { isActive: false }
  });
};

export const getReferralAnalyticsService = async (userId) => {
  const [
    totalReferrals,
    successfulReferrals,
    pendingReferrals,
    totalRewards
  ] = await Promise.all([
    prisma.referralUsage.count({
      where: { 
        referral: { userId: userId }
      }
    }),
    prisma.referralUsage.count({
      where: { 
        referral: { userId: userId },
        isProcessed: true
      }
    }),
    prisma.referralUsage.count({
      where: { 
        referral: { userId: userId },
        isProcessed: false
      }
    }),
    prisma.referralReward.aggregate({
      where: { userId },
      _sum: { amount: true }
    })
  ]);

  return {
    totalReferrals,
    successfulReferrals,
    pendingReferrals,
    totalRewards: totalRewards._sum.amount || 0
  };
};

export const getReferralRewardsService = async (userId) => {
  return prisma.referralReward.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
};

export const generateReferralCodeService = async (userId) => {
  // Generate unique referral code
  const code = `REF${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  
  return prisma.referralCode.create({
    data: {
      code,
      userId,
      isActive: true
    }
  });
};

export const useReferralCodeService = async (code, userId) => {
  const referralCode = await prisma.referralCode.findFirst({
    where: { code, isActive: true }
  });

  if (!referralCode) {
    const e = new Error("Invalid referral code");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  if (referralCode.userId === userId) {
    const e = new Error("Cannot use your own referral code");
    e.status = 400;
    e.expose = true;
    throw e;
  }

  // Check if user has already used a referral code
  const existingUsage = await prisma.referralUsage.findFirst({
    where: { referredUserId: userId }
  });

  if (existingUsage) {
    const e = new Error("User has already used a referral code");
    e.status = 400;
    e.expose = true;
    throw e;
  }

  // Create referral usage record
  const referralUsage = await prisma.referralUsage.create({
    data: {
      referrerId: referralCode.userId,
      referredUserId: userId,
      referralCodeId: referralCode.id,
      status: 'PENDING'
    }
  });

  return referralUsage;
};
