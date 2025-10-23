import { getPrismaClient } from '../../config/db.js';
import cron from 'node-cron';

const prisma = getPrismaClient();

/**
 * Payment Cleanup Service
 * Handles cleanup of expired pending payments and programme purchases
 */

// Configuration
const PAYMENT_TIMEOUT_MINUTES = 30; // 30 minutes timeout for payments
const CLEANUP_INTERVAL_MINUTES = 15; // Run cleanup every 15 minutes

/**
 * Clean up expired pending programme purchases
 * @returns {Promise<Object>} Cleanup result
 */
export async function cleanupExpiredProgrammePurchases() {
  try {
    const timeoutDate = new Date();
    timeoutDate.setMinutes(timeoutDate.getMinutes() - PAYMENT_TIMEOUT_MINUTES);

    console.log(`🧹 [PAYMENT CLEANUP] Cleaning up programme purchases older than ${PAYMENT_TIMEOUT_MINUTES} minutes`);

    // Find expired pending programme purchases
    const expiredPurchases = await prisma.programmePurchase.findMany({
      where: {
        status: 'PENDING',
        purchasedAt: {
          lt: timeoutDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        programme: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (expiredPurchases.length === 0) {
      console.log(`✅ [PAYMENT CLEANUP] No expired programme purchases found`);
      return { cleanedCount: 0, message: 'No expired purchases found' };
    }

    console.log(`🔍 [PAYMENT CLEANUP] Found ${expiredPurchases.length} expired programme purchases`);

    // Update expired purchases to CANCELLED status
    const updateResult = await prisma.programmePurchase.updateMany({
      where: {
        status: 'PENDING',
        purchasedAt: {
          lt: timeoutDate
        }
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        rejectionReason: 'Payment timeout - no payment confirmation received'
      }
    });

    // Log details of cleaned up purchases
    expiredPurchases.forEach(purchase => {
      console.log(`❌ [PAYMENT CLEANUP] Cancelled expired purchase:`, {
        purchaseId: purchase.id,
        purchaseNumber: purchase.purchaseNumber,
        userEmail: purchase.user.email,
        programmeName: purchase.programme.name?.en || purchase.programme.name?.ar || 'Unknown',
        purchasedAt: purchase.purchasedAt,
        timeoutMinutes: PAYMENT_TIMEOUT_MINUTES
      });
    });

    console.log(`✅ [PAYMENT CLEANUP] Successfully cancelled ${updateResult.count} expired programme purchases`);

    return {
      cleanedCount: updateResult.count,
      message: `Successfully cancelled ${updateResult.count} expired programme purchases`,
      expiredPurchases: expiredPurchases.map(p => ({
        id: p.id,
        purchaseNumber: p.purchaseNumber,
        userEmail: p.user.email,
        programmeName: p.programme.name?.en || p.programme.name?.ar || 'Unknown'
      }))
    };

  } catch (error) {
    console.error('❌ [PAYMENT CLEANUP] Error cleaning up expired programme purchases:', error);
    throw error;
  }
}

/**
 * Clean up expired pending payments
 * @returns {Promise<Object>} Cleanup result
 */
export async function cleanupExpiredPayments() {
  try {
    const timeoutDate = new Date();
    timeoutDate.setMinutes(timeoutDate.getMinutes() - PAYMENT_TIMEOUT_MINUTES);

    console.log(`🧹 [PAYMENT CLEANUP] Cleaning up payments older than ${PAYMENT_TIMEOUT_MINUTES} minutes`);

    // Find expired pending payments
    const expiredPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: timeoutDate
        }
      },
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
    });

    if (expiredPayments.length === 0) {
      console.log(`✅ [PAYMENT CLEANUP] No expired payments found`);
      return { cleanedCount: 0, message: 'No expired payments found' };
    }

    console.log(`🔍 [PAYMENT CLEANUP] Found ${expiredPayments.length} expired payments`);

    // Update expired payments to FAILED status
    const updateResult = await prisma.payment.updateMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: timeoutDate
        }
      },
      data: {
        status: 'FAILED',
        processedAt: new Date(),
        metadata: {
          failure_reason: 'Payment timeout - no confirmation received',
          timeout_minutes: PAYMENT_TIMEOUT_MINUTES,
          cleaned_at: new Date().toISOString()
        }
      }
    });

    // Log details of cleaned up payments
    expiredPayments.forEach(payment => {
      console.log(`❌ [PAYMENT CLEANUP] Failed expired payment:`, {
        paymentId: payment.id,
        paymentReference: payment.paymentReference,
        userEmail: payment.user.email,
        amount: payment.amount.toString(),
        currency: payment.currency,
        method: payment.method,
        paymentableType: payment.paymentableType,
        createdAt: payment.createdAt,
        timeoutMinutes: PAYMENT_TIMEOUT_MINUTES
      });
    });

    console.log(`✅ [PAYMENT CLEANUP] Successfully failed ${updateResult.count} expired payments`);

    return {
      cleanedCount: updateResult.count,
      message: `Successfully failed ${updateResult.count} expired payments`,
      expiredPayments: expiredPayments.map(p => ({
        id: p.id,
        paymentReference: p.paymentReference,
        userEmail: p.user.email,
        amount: p.amount.toString(),
        currency: p.currency,
        method: p.method
      }))
    };

  } catch (error) {
    console.error('❌ [PAYMENT CLEANUP] Error cleaning up expired payments:', error);
    throw error;
  }
}

/**
 * Run complete payment cleanup
 * @returns {Promise<Object>} Complete cleanup result
 */
export async function runPaymentCleanup() {
  try {
    console.log(`🚀 [PAYMENT CLEANUP] Starting payment cleanup process`);

    const [programmeResult, paymentResult] = await Promise.all([
      cleanupExpiredProgrammePurchases(),
      cleanupExpiredPayments()
    ]);

    const totalCleaned = programmeResult.cleanedCount + paymentResult.cleanedCount;

    console.log(`✅ [PAYMENT CLEANUP] Cleanup completed:`, {
      totalCleaned,
      programmePurchases: programmeResult.cleanedCount,
      payments: paymentResult.cleanedCount
    });

    return {
      success: true,
      totalCleaned,
      programmePurchases: programmeResult,
      payments: paymentResult,
      message: `Cleanup completed: ${totalCleaned} items processed`
    };

  } catch (error) {
    console.error('❌ [PAYMENT CLEANUP] Error in payment cleanup process:', error);
    throw error;
  }
}

/**
 * Initialize the payment cleanup service with cron job
 */
export function initializePaymentCleanupService() {
  if (process.env.NODE_ENV === 'development') {
    console.log('[PAYMENT CLEANUP] Initializing payment cleanup service...');
  }

  // Run initial cleanup
  runPaymentCleanup().catch(error => {
    console.error('[PAYMENT CLEANUP] Initial cleanup failed:', error);
  });

  // Schedule regular cleanup every 15 minutes
  cron.schedule(`*/${CLEANUP_INTERVAL_MINUTES} * * * *`, async () => {
    console.log(`[PAYMENT CLEANUP] Running scheduled cleanup (every ${CLEANUP_INTERVAL_MINUTES} minutes)...`);
    try {
      await runPaymentCleanup();
    } catch (error) {
      console.error('[PAYMENT CLEANUP] Scheduled cleanup failed:', error);
    }
  });

  if (process.env.NODE_ENV === 'development') {
    console.log(`[PAYMENT CLEANUP] Payment cleanup service initialized with ${CLEANUP_INTERVAL_MINUTES}-minute cron job`);
  }
}

/**
 * Get cleanup statistics
 * @returns {Promise<Object>} Cleanup statistics
 */
export async function getCleanupStats() {
  try {
    const timeoutDate = new Date();
    timeoutDate.setMinutes(timeoutDate.getMinutes() - PAYMENT_TIMEOUT_MINUTES);

    const [pendingProgrammePurchases, pendingPayments, expiredProgrammePurchases, expiredPayments] = await Promise.all([
      prisma.programmePurchase.count({
        where: { status: 'PENDING' }
      }),
      prisma.payment.count({
        where: { status: 'PENDING' }
      }),
      prisma.programmePurchase.count({
        where: {
          status: 'PENDING',
          purchasedAt: { lt: timeoutDate }
        }
      }),
      prisma.payment.count({
        where: {
          status: 'PENDING',
          createdAt: { lt: timeoutDate }
        }
      })
    ]);

    return {
      pendingProgrammePurchases,
      pendingPayments,
      expiredProgrammePurchases,
      expiredPayments,
      timeoutMinutes: PAYMENT_TIMEOUT_MINUTES,
      cleanupIntervalMinutes: CLEANUP_INTERVAL_MINUTES
    };

  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    throw error;
  }
}
