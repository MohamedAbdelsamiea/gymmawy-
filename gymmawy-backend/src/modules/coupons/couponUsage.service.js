import { getPrismaClient } from '../../config/database.js';

const prisma = getPrismaClient();

/**
 * Centralized coupon usage tracking service
 * Handles all coupon usage updates consistently across orders, subscriptions, and programme purchases
 */

/**
 * Apply coupon usage when an order/subscription/purchase becomes active
 */
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
        // Create new redemption record
        await tx.userCouponRedemption.create({ 
          data: { userId, couponId: couponId } 
        });
        
        // Increment total redemptions
        await tx.coupon.update({ 
          where: { id: couponId }, 
          data: { totalRedemptions: { increment: 1 } } 
        });
        
        console.log(`Coupon ${couponId} applied for ${sourceType} ${sourceId} - new redemption`);
      } else {
        // Increment usage count for existing redemption
        await tx.userCouponRedemption.update({
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
        
        console.log(`Coupon ${couponId} usage count incremented for ${sourceType} ${sourceId}`);
      }

      return true;
    });
  } catch (error) {
    console.error(`Failed to apply coupon usage for ${sourceType} ${sourceId}:`, error);
    throw error;
  }
}

/**
 * Remove coupon usage when an order/subscription/purchase is cancelled
 */
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

      if (redemption.usageCount > 1) {
        // Decrement usage count
        await tx.userCouponRedemption.update({
          where: {
            userId_couponId: {
              userId,
              couponId
            }
          },
          data: {
            usageCount: { decrement: 1 }
          }
        });
        
        console.log(`Coupon ${couponId} usage count decremented for ${sourceType} ${sourceId}`);
      } else {
        // Delete the redemption record and decrement total redemptions
        await tx.userCouponRedemption.delete({
          where: {
            userId_couponId: {
              userId,
              couponId
            }
          }
        });
        
        await tx.coupon.update({
          where: { id: couponId },
          data: {
            totalRedemptions: { decrement: 1 }
          }
        });
        
        console.log(`Coupon ${couponId} redemption removed for ${sourceType} ${sourceId}`);
      }

      return true;
    });
  } catch (error) {
    console.error(`Failed to remove coupon usage for ${sourceType} ${sourceId}:`, error);
    throw error;
  }
}

/**
 * Get accurate coupon usage statistics
 */
export async function getCouponUsageStats(couponId) {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        redeemedBy: true,
        orders: {
          where: { status: { not: 'CANCELLED' } }
        },
        subscriptions: {
          where: { status: 'ACTIVE' }
        },
        programmePurchases: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    if (!coupon) return null;

    // Calculate actual usage from active orders/subscriptions/purchases
    const activeOrdersCount = coupon.orders.length;
    const activeSubscriptionsCount = coupon.subscriptions.length;
    const activeProgrammePurchasesCount = coupon.programmePurchases.length;
    
    // Calculate total usage count from redemption records
    const totalUsageFromRedemptions = coupon.redeemedBy.reduce((sum, redemption) => {
      return sum + redemption.usageCount;
    }, 0);

    return {
      couponId,
      totalRedemptions: coupon.totalRedemptions,
      actualUsage: totalUsageFromRedemptions,
      activeOrders: activeOrdersCount,
      activeSubscriptions: activeSubscriptionsCount,
      activeProgrammePurchases: activeProgrammePurchasesCount,
      isConsistent: coupon.totalRedemptions === totalUsageFromRedemptions
    };
  } catch (error) {
    console.error('Failed to get coupon usage stats:', error);
    throw error;
  }
}

/**
 * Sync coupon usage statistics (fix any inconsistencies)
 */
export async function syncCouponUsageStats(couponId) {
  try {
    const stats = await getCouponUsageStats(couponId);
    if (!stats) return null;

    if (!stats.isConsistent) {
      await prisma.coupon.update({
        where: { id: couponId },
        data: {
          totalRedemptions: stats.actualUsage
        }
      });
      
      console.log(`Synced coupon ${couponId} usage stats: ${stats.totalRedemptions} -> ${stats.actualUsage}`);
    }

    return stats;
  } catch (error) {
    console.error('Failed to sync coupon usage stats:', error);
    throw error;
  }
}

/**
 * Get all coupons with accurate usage statistics
 */
export async function getAllCouponsWithUsageStats() {
  try {
    const coupons = await prisma.coupon.findMany({
      include: {
        redeemedBy: true,
        orders: {
          where: { status: { not: 'CANCELLED' } }
        },
        subscriptions: {
          where: { status: 'ACTIVE' }
        },
        programmePurchases: {
          where: { status: 'ACTIVE' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return coupons.map(coupon => {
      const totalUsageFromRedemptions = coupon.redeemedBy.reduce((sum, redemption) => {
        return sum + redemption.usageCount;
      }, 0);

      return {
        ...coupon,
        actualUsage: totalUsageFromRedemptions,
        activeOrders: coupon.orders.length,
        activeSubscriptions: coupon.subscriptions.length,
        activeProgrammePurchases: coupon.programmePurchases.length,
        isConsistent: coupon.totalRedemptions === totalUsageFromRedemptions
      };
    });
  } catch (error) {
    console.error('Failed to get all coupons with usage stats:', error);
    throw error;
  }
}
