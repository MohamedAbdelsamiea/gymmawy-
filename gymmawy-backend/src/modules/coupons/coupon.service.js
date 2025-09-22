import { getPrismaClient } from "../../config/db.js";

const prisma = getPrismaClient();

export async function createCoupon(data) {
  return prisma.coupon.create({ data });
}

export async function listCoupons() {
  return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
}

export async function applyCouponToOrderOrCart(userId, code) {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  
  if (!coupon) {
    const e = new Error("Invalid coupon code"); e.status = 400; e.expose = true; throw e;
  }
  
  if (!coupon.isActive) {
    const e = new Error("Coupon is inactive"); e.status = 400; e.expose = true; throw e;
  }
  
  if (coupon.expirationDate < new Date()) {
    const e = new Error("Coupon has expired"); e.status = 400; e.expose = true; throw e;
  }
  
  // Check global max redemptions limit (including pending orders/subscriptions/programme purchases)
  if (coupon.maxRedemptions && coupon.maxRedemptions > 0) {
    // Count completed redemptions
    const completedRedemptions = coupon.totalRedemptions;
    
    // Count orders that use this coupon (all statuses except CANCELLED)
    const ordersWithCoupon = await prisma.order.count({
      where: {
        couponId: coupon.id,
        status: { not: 'CANCELLED' }
      }
    });
    
    // Count pending subscriptions that use this coupon
    const pendingSubscriptionsWithCoupon = await prisma.subscription.count({
      where: {
        couponId: coupon.id,
        status: 'PENDING'
      }
    });
    
    // Count pending programme purchases that use this coupon
    const pendingProgrammePurchasesWithCoupon = await prisma.programmePurchase.count({
      where: {
        couponId: coupon.id,
        status: 'PENDING'
      }
    });
    
    // Total global usage count (completed + active orders/subscriptions/purchases)
    const totalGlobalUsage = completedRedemptions + ordersWithCoupon + pendingSubscriptionsWithCoupon + pendingProgrammePurchasesWithCoupon;
    
    if (totalGlobalUsage >= coupon.maxRedemptions) {
      const e = new Error("This coupon has reached its global usage limit and can no longer be used"); e.status = 400; e.expose = true; throw e;
    }
  }
  
  // Check per-user max redemptions limit
  if (coupon.maxRedemptionsPerUser && coupon.maxRedemptionsPerUser > 0 && userId) {
    // Check completed redemptions
    const userRedemptions = await prisma.userCouponRedemption.count({
      where: {
        userId: userId,
        couponId: coupon.id
      }
    });

    // Check orders that use this coupon (all statuses except CANCELLED)
    const ordersWithCoupon = await prisma.order.count({
      where: {
        userId: userId,
        couponId: coupon.id,
        status: { not: 'CANCELLED' }
      }
    });

    // Check subscriptions that use this coupon (both PENDING and ACTIVE)
    const subscriptionsWithCoupon = await prisma.subscription.count({
      where: {
        userId: userId,
        couponId: coupon.id,
        status: { in: ['PENDING', 'COMPLETE'] }
      }
    });

    // Check programme purchases that use this coupon (both PENDING and COMPLETE)
    const programmePurchasesWithCoupon = await prisma.programmePurchase.count({
      where: {
        userId: userId,
        couponId: coupon.id,
        status: { in: ['PENDING', 'COMPLETE'] }
      }
    });

    // Total usage count (completed redemptions + active orders/subscriptions/purchases)
    const totalUsageCount = userRedemptions + ordersWithCoupon + subscriptionsWithCoupon + programmePurchasesWithCoupon;

    if (totalUsageCount >= coupon.maxRedemptionsPerUser) {
      const e = new Error("You have already used this coupon the maximum number of times allowed per user"); e.status = 400; e.expose = true; throw e;
    }
  }
  
  return coupon;
}

export async function redeemCoupon(userId, code) {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  
  if (!coupon) {
    const e = new Error("Invalid coupon code"); e.status = 400; e.expose = true; throw e;
  }
  
  if (!coupon.isActive) {
    const e = new Error("Coupon is inactive"); e.status = 400; e.expose = true; throw e;
  }
  
  if (coupon.expirationDate < new Date()) {
    const e = new Error("Coupon has expired"); e.status = 400; e.expose = true; throw e;
  }
  
  // Check global max redemptions limit (including pending orders/subscriptions/programme purchases)
  if (coupon.maxRedemptions && coupon.maxRedemptions > 0) {
    // Count completed redemptions
    const completedRedemptions = coupon.totalRedemptions;
    
    // Count orders that use this coupon (all statuses except CANCELLED)
    const ordersWithCoupon = await prisma.order.count({
      where: {
        couponId: coupon.id,
        status: { not: 'CANCELLED' }
      }
    });
    
    // Count pending subscriptions that use this coupon
    const pendingSubscriptionsWithCoupon = await prisma.subscription.count({
      where: {
        couponId: coupon.id,
        status: 'PENDING'
      }
    });
    
    // Count pending programme purchases that use this coupon
    const pendingProgrammePurchasesWithCoupon = await prisma.programmePurchase.count({
      where: {
        couponId: coupon.id,
        status: 'PENDING'
      }
    });
    
    // Total global usage count (completed + active orders/subscriptions/purchases)
    const totalGlobalUsage = completedRedemptions + ordersWithCoupon + pendingSubscriptionsWithCoupon + pendingProgrammePurchasesWithCoupon;
    
    if (totalGlobalUsage >= coupon.maxRedemptions) {
      const e = new Error("This coupon has reached its global usage limit and can no longer be used"); e.status = 400; e.expose = true; throw e;
    }
  }
  
  // Check per-user max redemptions limit
  if (coupon.maxRedemptionsPerUser > 0) {
    // Check completed redemptions
    const userRedemptions = await prisma.userCouponRedemption.count({
      where: {
        userId: userId,
        couponId: coupon.id
      }
    });

    // Check orders that use this coupon (all statuses except CANCELLED)
    const ordersWithCoupon = await prisma.order.count({
      where: {
        userId: userId,
        couponId: coupon.id,
        status: { not: 'CANCELLED' }
      }
    });

    // Check subscriptions that use this coupon (both PENDING and ACTIVE)
    const subscriptionsWithCoupon = await prisma.subscription.count({
      where: {
        userId: userId,
        couponId: coupon.id,
        status: { in: ['PENDING', 'COMPLETE'] }
      }
    });

    // Check programme purchases that use this coupon (both PENDING and COMPLETE)
    const programmePurchasesWithCoupon = await prisma.programmePurchase.count({
      where: {
        userId: userId,
        couponId: coupon.id,
        status: { in: ['PENDING', 'COMPLETE'] }
      }
    });

    // Total usage count (completed redemptions + active orders/subscriptions/purchases)
    const totalUsageCount = userRedemptions + ordersWithCoupon + subscriptionsWithCoupon + programmePurchasesWithCoupon;

    if (totalUsageCount >= coupon.maxRedemptionsPerUser) {
      const e = new Error("You have already used this coupon the maximum number of times allowed per user"); e.status = 400; e.expose = true; throw e;
    }
  }
  
  // Use centralized coupon usage tracking
  const { applyCouponUsage } = await import('./couponUsage.service.js');
  await applyCouponUsage(userId, coupon.id, 'DIRECT_REDEMPTION', 'direct');
  
  return coupon;
}

export async function getUserCoupons(userId) {
  const redemptions = await prisma.userCouponRedemption.findMany({
    where: { userId },
    include: { coupon: true },
    orderBy: { redeemedAt: 'desc' }
  });

  return redemptions.map(redemption => ({
    id: redemption.id,
    coupon: redemption.coupon,
    redeemedAt: redemption.redeemedAt
  }));
}

export async function validateCoupon(code, userId = null) {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  
  if (!coupon) {
    const e = new Error("Invalid coupon code");
    e.status = 400;
    e.expose = true;
    throw e;
  }

  if (!coupon.isActive) {
    const e = new Error("Coupon is inactive");
    e.status = 400;
    e.expose = true;
    throw e;
  }

  if (coupon.expirationDate < new Date()) {
    const e = new Error("Coupon has expired");
    e.status = 400;
    e.expose = true;
    throw e;
  }

  // Check global max redemptions limit (including pending orders/subscriptions/programme purchases)
  if (coupon.maxRedemptions > 0) {
    // Count completed redemptions
    const completedRedemptions = coupon.totalRedemptions;
    
    // Count orders that use this coupon (all statuses except CANCELLED)
    const ordersWithCoupon = await prisma.order.count({
      where: {
        couponId: coupon.id,
        status: { not: 'CANCELLED' }
      }
    });
    
    // Count pending subscriptions that use this coupon
    const pendingSubscriptionsWithCoupon = await prisma.subscription.count({
      where: {
        couponId: coupon.id,
        status: 'PENDING'
      }
    });
    
    // Count pending programme purchases that use this coupon
    const pendingProgrammePurchasesWithCoupon = await prisma.programmePurchase.count({
      where: {
        couponId: coupon.id,
        status: 'PENDING'
      }
    });
    
    // Total global usage count (completed + active orders/subscriptions/purchases)
    const totalGlobalUsage = completedRedemptions + ordersWithCoupon + pendingSubscriptionsWithCoupon + pendingProgrammePurchasesWithCoupon;
    
    if (totalGlobalUsage >= coupon.maxRedemptions) {
      const e = new Error("This coupon has reached its global usage limit and can no longer be used");
      e.status = 400;
      e.expose = true;
      throw e;
    }
  }

  // Check per-user max redemptions limit (if userId is provided)
  if (userId && coupon.maxRedemptionsPerUser > 0) {
    // Get user's actual usage count from redemption records
    const userRedemption = await prisma.userCouponRedemption.findUnique({
      where: {
        userId_couponId: {
          userId: userId,
          couponId: coupon.id
        }
      }
    });

    const userUsageCount = userRedemption ? userRedemption.usageCount : 0;

    if (userUsageCount >= coupon.maxRedemptionsPerUser) {
      const e = new Error("You have already used this coupon the maximum number of times allowed per user");
      e.status = 400;
      e.expose = true;
      throw e;
    }
  }

  return coupon;
}

export async function getCouponById(id) {
  return prisma.coupon.findUnique({ where: { id } });
}

export async function updateCoupon(id, data) {
  const result = await prisma.coupon.update({
    where: { id },
    data
  });
  return result;
}

export async function deleteCoupon(id) {
  return prisma.coupon.delete({ where: { id } });
}

export async function rollbackCouponRedemption(userId, couponId) {
  try {
    // Find the redemption record
    const redemption = await prisma.userCouponRedemption.findUnique({
      where: {
        userId_couponId: {
          userId,
          couponId
        }
      }
    });

    if (!redemption) {
      console.log('No coupon redemption found to rollback for user:', userId, 'coupon:', couponId);
      return false;
    }

    // Rollback in transaction
    await prisma.$transaction([
      // Delete the user redemption record
      prisma.userCouponRedemption.delete({
        where: {
          userId_couponId: {
            userId,
            couponId
          }
        }
      }),
      // Decrement the total redemptions counter
      prisma.coupon.update({
        where: { id: couponId },
        data: {
          totalRedemptions: { decrement: 1 }
        }
      })
    ]);

    console.log('Coupon redemption rolled back successfully for user:', userId, 'coupon:', couponId);
    return true;
  } catch (error) {
    console.error('Failed to rollback coupon redemption:', error);
    throw error;
  }
}

