/**
 * Subscription Service - Centralized subscription management
 * 
 * Handles subscription expiration, notifications, and status management
 * Replaces the scattered logic across middleware, cron, and extensions
 */

import cron from 'node-cron';
import { getPrismaClient } from '../config/db.js';

const prisma = getPrismaClient();

/**
 * Expire all subscriptions that have passed their end date
 * @returns {Promise<Object>} Result with count of expired subscriptions
 */
export async function expireExpiredSubscriptions() {
  try {
    const result = await prisma.subscription.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: new Date() }
      },
      data: {
        status: 'EXPIRED'
      }
    });

    // Log the expiration
    if (result.count > 0) {
      console.log(`[SUBSCRIPTION] Expired ${result.count} subscription(s)`);
    }
    return {
      expiredCount: result.count,
      message: `Successfully expired ${result.count} subscription(s)`
    };
  } catch (error) {
    // Always log errors, but with appropriate level
    console.error('[SUBSCRIPTION] Error expiring subscriptions:', error);
    throw error;
  }
}

/**
 * Check for expiring subscriptions and send notifications
 * @returns {Promise<Array>} Array of created notifications
 */
export async function checkExpiringSubscriptions() {
  try {
    // First expire any that are already past due
    await expireExpiredSubscriptions();
    
    // Then check for expiring ones (notification functionality removed)
    
    return { success: true };
  } catch (error) {
    console.error('[SUBSCRIPTION] Error checking expiring subscriptions:', error);
    throw error;
  }
}

/**
 * Get subscription status with computed fields
 * @param {Object} subscription - Subscription object from database
 * @returns {Object} Subscription with computed status fields
 */
export function getSubscriptionStatus(subscription) {
  const now = new Date();
  const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
  
  const isExpired = subscription.status === 'ACTIVE' && 
                   endDate && 
                   endDate < now;
  
  const computedStatus = isExpired ? 'EXPIRED' : subscription.status;
  
  return {
    ...subscription,
    isExpired,
    computedStatus
  };
}

/**
 * Get active (non-expired) subscriptions
 * @param {Object} args - Prisma findMany arguments
 * @returns {Promise<Array>} Array of active subscriptions
 */
export async function findActiveSubscriptions(args = {}) {
  // First expire any that are past due
  await expireExpiredSubscriptions();
  
  // Then return only active ones
  return prisma.subscription.findMany({
    ...args,
    where: {
      ...args.where,
      status: 'ACTIVE',
      endDate: { gte: new Date() }
    }
  });
}

/**
 * Initialize subscription management
 * Sets up cron jobs and performs initial cleanup
 */
export function initializeSubscriptionService() {
  if (process.env.NODE_ENV === 'development') {
    console.log('[SUBSCRIPTION] Initializing subscription service...');
  }
  
  // Run initial cleanup
  expireExpiredSubscriptions().catch(console.error);
  
  // Schedule daily subscription checks at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('[SUBSCRIPTION] Running daily subscription expiration check...');
    try {
      await checkExpiringSubscriptions();
    } catch (error) {
      console.error('[SUBSCRIPTION] Daily check failed:', error);
    }
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[SUBSCRIPTION] Subscription service initialized with daily cron job');
  }
}

// Note: Service is initialized explicitly in server.js
// This prevents double initialization
