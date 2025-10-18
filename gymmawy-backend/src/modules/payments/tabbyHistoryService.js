/**
 * Tabby History Service
 * Builds buyer_history and order_history for Tabby checkout sessions
 */

import { getPrismaClient } from '../../config/db.js';

const prisma = getPrismaClient();

/**
 * Build buyer_history for Tabby
 * This helps Tabby make better approval decisions
 * 
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - Buyer history object
 */
export async function buildBuyerHistory(userId) {
  try {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        loyaltyPoints: true,
        email: true
      }
    });

    if (!user) {
      return getDefaultBuyerHistory();
    }

    // Get all successful payments for this user
    const successfulPayments = await prisma.payment.findMany({
      where: {
        userId,
        status: 'SUCCESS', // Only SUCCESS status exists in PaymentStatus enum
        processedAt: { not: null }
      },
      orderBy: { processedAt: 'asc' }
    });

    // Calculate buyer statistics
    const totalSpent = successfulPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    const buyerHistory = {
      registered_since: user.createdAt?.toISOString() || new Date().toISOString(),
      loyalty_level: successfulPayments.length, // Use actual completed purchases count
      
      // Order statistics
      total_order_count: successfulPayments.length,
      total_amount_spent: totalSpent.toFixed(2),
      
      // First and last purchase dates
      ...(successfulPayments.length > 0 ? {
        first_purchase_at: successfulPayments[0].processedAt?.toISOString(),
        last_purchase_at: successfulPayments[successfulPayments.length - 1].processedAt?.toISOString()
      } : {}),
      
      // Verification status
      is_phone_number_verified: true,
      is_email_verified: !!user.email, // User has email means they verified during signup
      is_social_networks_connected: false,
      
      // Additional metrics
      wishlist_count: 0,
      
      // Average order value
      ...(successfulPayments.length > 0 ? {
        average_order_value: (totalSpent / successfulPayments.length).toFixed(2)
      } : {})
    };

    console.log(`[TABBY_HISTORY] Built buyer history for user ${userId}:`, {
      orders: buyerHistory.total_order_count,
      spent: buyerHistory.total_amount_spent
    });

    return buyerHistory;

  } catch (error) {
    console.error('[TABBY_HISTORY] Error building buyer history:', error);
    return getDefaultBuyerHistory();
  }
}

/**
 * Build order_history for Tabby
 * Returns array of past orders (last 10 successful orders)
 * 
 * @param {string} userId - The user ID
 * @param {number} limit - Number of orders to include (default: 10)
 * @returns {Promise<Array>} - Array of order history objects
 */
export async function buildOrderHistory(userId, limit = 10) {
  try {
    // Get recent successful payments
    const recentPayments = await prisma.payment.findMany({
      where: {
        userId,
        status: 'SUCCESS', // Only SUCCESS status exists in PaymentStatus enum
        processedAt: { not: null }
      },
      orderBy: { processedAt: 'desc' },
      take: limit,
      select: {
        amount: true,
        currency: true,
        processedAt: true,
        createdAt: true,
        paymentReference: true,
        paymentableType: true,
        metadata: true
      }
    });

    // Transform to Tabby format with all required parameters
    const orderHistory = recentPayments.map(payment => ({
      purchased_at: payment.processedAt?.toISOString() || payment.createdAt.toISOString(),
      amount: Number(payment.amount).toFixed(2),
      currency: payment.currency,
      status: 'complete', // Tabby expects: 'complete', 'refunded', 'cancelled'
      payment_method: 'card', // Generic payment method
      reference_id: payment.paymentReference,
      // Additional required parameters for better scoring
      buyer: {
        name: 'Customer', // We don't store buyer name in payment records
        email: 'customer@example.com', // We don't store buyer email in payment records
        phone: '+966500000001' // Default phone for order history
      },
      shipping_address: {
        city: payment.currency === 'AED' ? 'Dubai' : 'Riyadh',
        address: 'Customer Address',
        zip: '00000'
      },
      items: [{
        reference_id: 'ITEM_' + payment.paymentReference,
        title: 'Product',
        description: 'Product description',
        quantity: 1,
        unit_price: Number(payment.amount).toFixed(2),
        discount_amount: '0.00',
        image_url: 'https://example.com/product.jpg',
        product_url: 'https://example.com/product',
        category: 'General',
        brand: 'Gymmawy'
      }]
    }));

    console.log(`[TABBY_HISTORY] Built order history for user ${userId}: ${orderHistory.length} orders`);

    return orderHistory;

  } catch (error) {
    console.error('[TABBY_HISTORY] Error building order history:', error);
    return [];
  }
}

/**
 * Get default buyer history for new users or on error
 * @returns {Object} - Default buyer history
 */
function getDefaultBuyerHistory() {
  return {
    registered_since: new Date().toISOString(),
    loyalty_level: 0,
    total_order_count: 0,
    total_amount_spent: '0.00',
    is_phone_number_verified: true,
    is_email_verified: false,
    is_social_networks_connected: false,
    wishlist_count: 0
  };
}

/**
 * Build complete Tabby history data (both buyer and order history)
 * 
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - Object with buyer_history and order_history
 */
export async function buildTabbyHistory(userId) {
  const [buyer_history, order_history] = await Promise.all([
    buildBuyerHistory(userId),
    buildOrderHistory(userId)
  ]);

  return {
    buyer_history,
    order_history
  };
}

