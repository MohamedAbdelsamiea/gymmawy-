/**
 * Subscription Extension - Prisma extension for subscription management
 * 
 * Provides computed fields and custom methods for subscription handling
 * Uses the centralized subscription service for expiration logic
 */

import { getPrismaClient } from '../config/db.js';
import { getSubscriptionStatus, findActiveSubscriptions } from '../services/subscriptionService.js';

const prisma = getPrismaClient();

// Extend Prisma with subscription-specific methods
const extendedPrisma = prisma.$extends({
  name: 'subscription-extension',
  
  // Add computed fields
  result: {
    subscription: {
      isExpired: {
        needs: { status: true, endDate: true },
        compute(subscription) {
          return getSubscriptionStatus(subscription).isExpired;
        }
      },
      computedStatus: {
        needs: { status: true, endDate: true },
        compute(subscription) {
          return getSubscriptionStatus(subscription).computedStatus;
        }
      }
    }
  },
  
  // Add custom methods
  model: {
    subscription: {
      // Method to get subscriptions with computed status
      async findManyWithComputedStatus(args = {}) {
        const subscriptions = await this.findMany(args);
        return subscriptions.map(getSubscriptionStatus);
      },
      
      // Method to get only active (non-expired) subscriptions
      async findActive(args = {}) {
        return findActiveSubscriptions(args);
      }
    }
  }
});

export default extendedPrisma;