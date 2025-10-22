import { getPrismaClient } from "../../config/db.js";

const prisma = getPrismaClient();

/**
 * Unified Coupon Service
 * Handles all coupon-related operations: CRUD, validation, redemption, usage tracking, and statistics
 */

// ============================================================================
// CORE COUPON MANAGEMENT
// ============================================================================

export async function createCoupon(data) {
  return prisma.coupon.create({ data });
}

export async function listCoupons() {
  return prisma.coupon.findMany({ 
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          orders: true,
          subscriptions: true,
          programmePurchases: true,
          redeemedBy: true
        }
      }
    }
  });
}

export async function getCouponById(id) {
  return prisma.coupon.findUnique({ 
    where: { id },
    include: {
      _count: {
        select: {
          orders: true,
          subscriptions: true,
          programmePurchases: true,
          redeemedBy: true
        }
      }
    }
  });
}

export async function updateCoupon(id, data) {
  return prisma.coupon.update({
    where: { id },
    data
  });
}

export async function deleteCoupon(id) {
  return prisma.coupon.delete({ where: { id } });
}

// ============================================================================
// COUPON VALIDATION & APPLICATION
// ============================================================================

/**
 * Calculate total redemptions for a coupon using dynamic query logic
 */
async function calculateTotalRedemptions(couponId) {
  // Count orders that use this coupon (all statuses except CANCELLED)
  const ordersWithCoupon = await prisma.order.count({
    where: {
      couponId: couponId,
      status: { not: 'CANCELLED' }
    }
  });
  
  // Count subscriptions that use this coupon (both PENDING and COMPLETE)
  const subscriptionsWithCoupon = await prisma.subscription.count({
    where: {
      couponId: couponId,
      status: { in: ['PENDING', 'COMPLETE'] }
    }
  });
  
  // Count programme purchases that use this coupon (both PENDING and COMPLETE)
  const programmePurchasesWithCoupon = await prisma.programmePurchase.count({
    where: {
      couponId: couponId,
      status: { in: ['PENDING', 'COMPLETE'] }
    }
  });
  
  return ordersWithCoupon + subscriptionsWithCoupon + programmePurchasesWithCoupon;
}

export async function applyCouponToOrderOrCart(userId, code) {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  
  if (!coupon) {
    const e = new Error("Invalid coupon code"); e.status = 400; e.expose = true; throw e;
  }
  
  if (!coupon.isActive) {
    const e = new Error("This coupon is currently inactive and cannot be used"); e.status = 400; e.expose = true; throw e;
  }
  
  if (coupon.expirationDate < new Date()) {
    const e = new Error("This coupon has expired and can no longer be used"); e.status = 400; e.expose = true; throw e;
  }
  
  // Check if user has already used this coupon (one use per user)
  if (userId) {
    const userRedemption = await prisma.userCouponRedemption.findUnique({
      where: {
        userId_couponId: {
          userId: userId,
          couponId: coupon.id
        }
      }
    });
    
    if (userRedemption) {
      const e = new Error("You have already used this coupon and cannot use it again"); e.status = 400; e.expose = true; throw e;
    }
  }
  
  // Check global max redemptions limit using dynamic query logic
  if (coupon.maxRedemptions && coupon.maxRedemptions > 0) {
    const totalRedemptions = await calculateTotalRedemptions(coupon.id);
    
    if (totalRedemptions >= coupon.maxRedemptions) {
      const e = new Error("This coupon has reached its maximum usage limit and can no longer be used"); e.status = 400; e.expose = true; throw e;
    }
  }
  
  return coupon;
}

export async function validateCoupon(code, userId = null) {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  
  if (!coupon) {
    const e = new Error("Invalid coupon code"); e.status = 400; e.expose = true; throw e;
  }
  
  if (!coupon.isActive) {
    const e = new Error("This coupon is currently inactive and cannot be used"); e.status = 400; e.expose = true; throw e;
  }
  
  if (coupon.expirationDate < new Date()) {
    const e = new Error("This coupon has expired and can no longer be used"); e.status = 400; e.expose = true; throw e;
  }
  
  // Check if user has already used this coupon (one use per user)
  if (userId) {
    const userRedemption = await prisma.userCouponRedemption.findUnique({
      where: {
        userId_couponId: {
          userId: userId,
          couponId: coupon.id
        }
      }
    });
    
    if (userRedemption) {
      const e = new Error("You have already used this coupon and cannot use it again"); e.status = 400; e.expose = true; throw e;
    }
  }
  
  // Check global max redemptions limit using dynamic query logic
  if (coupon.maxRedemptions && coupon.maxRedemptions > 0) {
    const totalRedemptions = await calculateTotalRedemptions(coupon.id);
    
    if (totalRedemptions >= coupon.maxRedemptions) {
      const e = new Error("This coupon has reached its maximum usage limit and can no longer be used"); e.status = 400; e.expose = true; throw e;
    }
  }
  
  return coupon;
}

// ============================================================================
// COUPON REDEMPTION MANAGEMENT
// ============================================================================

export async function redeemCoupon(userId, code) {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  
  if (!coupon) {
    const e = new Error("Invalid coupon code"); e.status = 400; e.expose = true; throw e;
  }
  
  if (!coupon.isActive) {
    const e = new Error("This coupon is currently inactive and cannot be used"); e.status = 400; e.expose = true; throw e;
  }
  
  if (coupon.expirationDate < new Date()) {
    const e = new Error("This coupon has expired and can no longer be used"); e.status = 400; e.expose = true; throw e;
  }
  
  // Check if user has already used this coupon (one use per user)
  const existingRedemption = await prisma.userCouponRedemption.findUnique({
    where: {
      userId_couponId: {
        userId: userId,
        couponId: coupon.id
      }
    }
  });
  
  if (existingRedemption) {
    const e = new Error("You have already used this coupon and cannot use it again"); e.status = 400; e.expose = true; throw e;
  }
  
  // Check global max redemptions limit using dynamic query logic
  if (coupon.maxRedemptions && coupon.maxRedemptions > 0) {
    const totalRedemptions = await calculateTotalRedemptions(coupon.id);
    
    if (totalRedemptions >= coupon.maxRedemptions) {
      const e = new Error("This coupon has reached its maximum usage limit and can no longer be used"); e.status = 400; e.expose = true; throw e;
    }
  }
  
  // Create redemption record
  const redemption = await prisma.userCouponRedemption.create({
    data: {
      userId: userId,
      couponId: coupon.id
    }
  });
  
  return {
    ...coupon,
    redemption
  };
}

export async function redeemCouponForPurchase(userId, couponId, purchasableType, purchasableId) {
  return await prisma.$transaction(async (tx) => {
    // Get the coupon
    const coupon = await tx.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) {
      throw new Error("Coupon not found");
    }

    // Check if user already has a redemption record for this coupon
    const existingRedemption = await tx.userCouponRedemption.findUnique({
      where: {
        userId_couponId: {
          userId: userId,
          couponId: couponId
        }
      }
    });

    if (existingRedemption) {
      throw new Error("You have already used this coupon and cannot use it again");
    }

    // Create redemption record (one use per user)
    const userRedemption = await tx.userCouponRedemption.create({
      data: {
        userId: userId,
        couponId: couponId
      }
    });

    console.log(`Coupon ${coupon.code} redeemed successfully:`, {
      userId,
      couponId,
      purchasableType,
      purchasableId,
      redemptionId: userRedemption.id
    });

    return {
      success: true,
      userRedemption,
      coupon
    };
  });
}

export async function cancelCouponRedemption(userId, couponId, purchasableType, purchasableId) {
  return await prisma.$transaction(async (tx) => {
    // Get the user redemption record
    const userRedemption = await tx.userCouponRedemption.findUnique({
      where: {
        userId_couponId: {
          userId: userId,
          couponId: couponId
        }
      }
    });

    if (!userRedemption) {
      console.log(`No redemption found for user ${userId} and coupon ${couponId}`);
      return { success: false, message: "No redemption found" };
    }

    // Delete the redemption record
    await tx.userCouponRedemption.delete({
      where: {
        userId_couponId: {
          userId: userId,
          couponId: couponId
        }
      }
    });

    console.log(`Coupon redemption cancelled:`, {
      userId,
      couponId,
      purchasableType,
      purchasableId,
      redemptionId: userRedemption.id
    });

    return {
      success: true,
      message: "Coupon redemption cancelled successfully"
    };
  });
}

// ============================================================================
// COUPON USAGE TRACKING
// ============================================================================

export async function applyCouponUsage(userId, couponId, sourceType, sourceId) {
  if (!couponId) return null;

  try {
    return await prisma.$transaction(async (tx) => {
      // Check if user has already redeemed this coupon
      const existingRedemption = await tx.userCouponRedemption.findUnique({
        where: {
          userId_couponId: {
            userId: userId,
            couponId: couponId
          }
        }
      });

      if (!existingRedemption) {
        // Create new redemption record (this should have been created during redemption)
        await tx.userCouponRedemption.create({ 
          data: { userId, couponId: couponId } 
        });
        
        console.log(`Coupon ${couponId} applied for ${sourceType} ${sourceId} - new redemption`);
      } else {
        console.log(`Coupon ${couponId} already redeemed for ${sourceType} ${sourceId}`);
      }

      return true;
    });
  } catch (error) {
    console.error(`Failed to apply coupon usage for ${sourceType} ${sourceId}:`, error);
    throw error;
  }
}

export async function removeCouponUsage(userId, couponId, sourceType, sourceId) {
  if (!couponId) return null;

  try {
    return await prisma.$transaction(async (tx) => {
      // Find the redemption record
      const redemption = await tx.userCouponRedemption.findUnique({
        where: {
          userId_couponId: {
            userId,
            couponId
          }
        }
      });

      if (!redemption) {
        console.log(`No coupon redemption found to remove for ${sourceType} ${sourceId}`);
        return false;
      }

      // Delete the redemption record (since users can only use each coupon once)
      await tx.userCouponRedemption.delete({
        where: {
          userId_couponId: {
            userId,
            couponId
          }
        }
      });

      console.log(`Coupon ${couponId} usage removed for ${sourceType} ${sourceId} - redemption deleted`);

      return true;
    });
  } catch (error) {
    console.error(`Failed to remove coupon usage for ${sourceType} ${sourceId}:`, error);
    throw error;
  }
}

// ============================================================================
// USER COUPON MANAGEMENT
// ============================================================================

export async function getUserCoupons(userId) {
  return prisma.userCouponRedemption.findMany({
    where: { userId },
    include: {
      coupon: true
    },
    orderBy: { redeemedAt: "desc" }
  });
}

export async function rollbackCouponRedemption(userId, couponId) {
  return prisma.userCouponRedemption.delete({
    where: {
      userId_couponId: {
        userId: userId,
        couponId: couponId
      }
    }
  });
}

// ============================================================================
// COUPON STATISTICS & ANALYTICS
// ============================================================================

export async function getCouponUsageStats(couponId) {
  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
    include: {
      _count: {
        select: {
          orders: true,
          subscriptions: true,
          programmePurchases: true,
          redeemedBy: true
        }
      }
    }
  });
  
  if (!coupon) {
    throw new Error("Coupon not found");
  }
  
  const totalRedemptions = await calculateTotalRedemptions(couponId);
  const uniqueUsers = coupon._count.redeemedBy;
  
  return {
    couponId: coupon.id,
    code: coupon.code,
    maxRedemptions: coupon.maxRedemptions,
    totalRedemptions,
    uniqueUsers,
    isAtLimit: coupon.maxRedemptions ? totalRedemptions >= coupon.maxRedemptions : false,
    remainingUses: coupon.maxRedemptions ? Math.max(0, coupon.maxRedemptions - totalRedemptions) : null,
    breakdown: {
      orders: coupon._count.orders,
      subscriptions: coupon._count.subscriptions,
      programmePurchases: coupon._count.programmePurchases
    }
  };
}

export async function syncCouponUsageStats(couponId) {
  const stats = await getCouponUsageStats(couponId);
  console.log(`Synced usage stats for coupon ${couponId}:`, stats);
  return stats;
}

export async function getAllCouponsWithUsageStats() {
  const coupons = await prisma.coupon.findMany({
    include: {
      _count: {
        select: {
          orders: true,
          subscriptions: true,
          programmePurchases: true,
          redeemedBy: true
        }
      }
    }
  });

  return Promise.all(coupons.map(async (coupon) => {
    const totalRedemptions = await calculateTotalRedemptions(coupon.id);
    return {
      ...coupon,
      totalRedemptions,
      uniqueUsers: coupon._count.redeemedBy,
      isAtLimit: coupon.maxRedemptions ? totalRedemptions >= coupon.maxRedemptions : false,
      remainingUses: coupon.maxRedemptions ? Math.max(0, coupon.maxRedemptions - totalRedemptions) : null
    };
  }));
}