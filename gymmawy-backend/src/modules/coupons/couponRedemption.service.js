import { getPrismaClient } from "../../config/db.js";

const prisma = getPrismaClient();

/**
 * Redeem a coupon for a user
 * @param {string} userId - User ID
 * @param {string} couponId - Coupon ID
 * @param {string} purchasableType - Type of purchase (SUBSCRIPTION, ORDER, PROGRAMME_PURCHASE)
 * @param {string} purchasableId - ID of the purchase record
 * @returns {Promise<Object>} Redemption result
 */
export async function redeemCoupon(userId, couponId, purchasableType, purchasableId) {
  return await prisma.$transaction(async (tx) => {
    // Get the coupon
    const coupon = await tx.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) {
      throw new Error("Coupon not found");
    }

    // Check if user already has a redemption record for this coupon
    let userRedemption = await tx.userCouponRedemption.findUnique({
      where: {
        userId_couponId: {
          userId: userId,
          couponId: couponId
        }
      }
    });

    if (userRedemption) {
      // User already used this coupon, increment usage count
      userRedemption = await tx.userCouponRedemption.update({
        where: {
          userId_couponId: {
            userId: userId,
            couponId: couponId
          }
        },
        data: {
          usageCount: { increment: 1 }
        }
      });
    } else {
      // First time user is using this coupon, create new record
      userRedemption = await tx.userCouponRedemption.create({
        data: {
          userId: userId,
          couponId: couponId,
          usageCount: 1
        }
      });
    }

    // Increment total redemptions for the coupon
    await tx.coupon.update({
      where: { id: couponId },
      data: {
        totalRedemptions: { increment: 1 }
      }
    });

    console.log(`Coupon ${coupon.code} redeemed successfully:`, {
      userId,
      couponId,
      purchasableType,
      purchasableId,
      userUsageCount: userRedemption.usageCount,
      totalRedemptions: coupon.totalRedemptions + 1
    });

    return {
      success: true,
      userRedemption,
      coupon: {
        ...coupon,
        totalRedemptions: coupon.totalRedemptions + 1
      }
    };
  });
}

/**
 * Cancel a coupon redemption (when purchase is cancelled)
 * @param {string} userId - User ID
 * @param {string} couponId - Coupon ID
 * @param {string} purchasableType - Type of purchase
 * @param {string} purchasableId - ID of the purchase record
 * @returns {Promise<Object>} Cancellation result
 */
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
      console.warn(`No redemption record found for user ${userId} and coupon ${couponId}`);
      return { success: false, message: "No redemption record found" };
    }

    if (userRedemption.usageCount <= 1) {
      // Remove the redemption record completely
      await tx.userCouponRedemption.delete({
        where: {
          userId_couponId: {
            userId: userId,
            couponId: couponId
          }
        }
      });
    } else {
      // Decrement usage count
      await tx.userCouponRedemption.update({
        where: {
          userId_couponId: {
            userId: userId,
            couponId: couponId
          }
        },
        data: {
          usageCount: { decrement: 1 }
        }
      });
    }

    // Decrement total redemptions for the coupon
    await tx.coupon.update({
      where: { id: couponId },
      data: {
        totalRedemptions: { decrement: 1 }
      }
    });

    console.log(`Coupon ${couponId} redemption cancelled:`, {
      userId,
      couponId,
      purchasableType,
      purchasableId,
      newUsageCount: Math.max(0, userRedemption.usageCount - 1)
    });

    return {
      success: true,
      message: "Coupon redemption cancelled successfully"
    };
  });
}

/**
 * Get coupon usage statistics
 * @param {string} couponId - Coupon ID
 * @returns {Promise<Object>} Usage statistics
 */
export async function getCouponUsageStats(couponId) {
  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
    include: {
      redeemedBy: {
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
      }
    }
  });

  if (!coupon) {
    throw new Error("Coupon not found");
  }

  // Calculate total user usage
  const totalUserUsage = coupon.redeemedBy.reduce((sum, redemption) => {
    return sum + redemption.usageCount;
  }, 0);

  return {
    coupon: {
      id: coupon.id,
      code: coupon.code,
      totalRedemptions: coupon.totalRedemptions,
      maxRedemptions: coupon.maxRedemptions,
      maxRedemptionsPerUser: coupon.maxRedemptionsPerUser
    },
    usage: {
      totalUserUsage,
      totalRedemptions: coupon.totalRedemptions,
      uniqueUsers: coupon.redeemedBy.length,
      userRedemptions: coupon.redeemedBy.map(redemption => ({
        userId: redemption.userId,
        userEmail: redemption.user.email,
        userName: `${redemption.user.firstName} ${redemption.user.lastName}`,
        usageCount: redemption.usageCount,
        firstRedeemedAt: redemption.redeemedAt
      }))
    }
  };
}
