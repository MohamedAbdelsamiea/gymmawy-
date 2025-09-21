/**
 * Subscription Service - Centralized subscription management
 * 
 * Handles subscription expiration, notifications, and status management
 * Replaces the scattered logic across middleware, cron, and extensions
 */

import cron from 'node-cron';
import { getPrismaClient } from '../config/db.js';
import * as notificationService from '../modules/notifications/notification.service.js';

const prisma = getPrismaClient();

/**
 * Expire all subscriptions that have passed their end date
 * @returns {Promise<Object>} Result with count of expired subscriptions
 */
export async function expireExpiredSubscriptions() {
  try {
    // Check if Subscription table exists before trying to access it
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Subscription'
      );
    `;
    
    if (!tableExists[0]?.exists) {
      console.log('Subscription table does not exist, skipping expiration check');
      return { count: 0 };
    }

    const result = await prisma.subscription.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: new Date() }
      },
      data: {
        status: 'EXPIRED'
      }
    });

    // Only log in development
    if (process.env.NODE_ENV === 'development') {
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
    
    // Check if Subscription table exists before checking notifications
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Subscription'
      );
    `;
    
    if (!tableExists[0]?.exists) {
      console.log('Subscription table does not exist, skipping notification check');
      return [];
    }
    
    // Then check for expiring ones and send notifications
    const notifications = await notificationService.checkExpiringSubscriptions();
    
    if (notifications.length > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[SUBSCRIPTION] Created ${notifications.length} expiring subscription notifications`);
    }
    
    return notifications;
  } catch (error) {
    console.error('[SUBSCRIPTION] Error checking expiring subscriptions:', error);
    // Don't throw error, just return empty array to prevent app crash
    return [];
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
  
  // Schedule daily subscription checks at 9 AM
  cron.schedule('0 9 * * *', async () => {
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

// Auto-initialize when imported
initializeSubscriptionService();
