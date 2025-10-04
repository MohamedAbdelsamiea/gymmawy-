import paymobService from '../../services/paymobService.js';
import { getPrismaClient } from '../../config/db.js';
import { generateUserFriendlyPaymentReference } from '../../utils/paymentReference.js';

const prisma = getPrismaClient();

/**
 * Enhanced payment service that supports both Tabby and Paymob
 */
class PaymentService {
  /**
   * Create a payment using the specified provider
   * @param {Object} paymentData - Payment data
   * @param {string} provider - Payment provider ('tabby' or 'paymob')
   * @returns {Promise<Object>} Payment result
   */
  async createPaymentWithProvider(paymentData, provider = 'paymob') {
    try {
      switch (provider.toLowerCase()) {
        case 'paymob':
          return await this.createPaymobPayment(paymentData);
        case 'tabby':
          return await this.createTabbyPayment(paymentData);
        default:
          throw new Error(`Unsupported payment provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error creating ${provider} payment:`, error);
      throw error;
    }
  }

  /**
   * Create a Paymob payment
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Paymob payment result
   */
  async createPaymobPayment(paymentData) {
    try {
      // Enforce SAR currency for Paymob
      if (paymentData.currency && paymentData.currency !== 'SAR') {
        throw new Error('Paymob only accepts SAR currency');
      }

      // Validate payment data
      const validation = paymobService.validatePaymentData(paymentData);
      if (!validation.isValid) {
        throw new Error(`Payment validation failed: ${validation.errors.join(', ')}`);
      }

      // Create Paymob intention
      const intentionResult = await paymobService.createIntention(paymentData);

      // Create payment record in database
      const payment = await prisma.payment.create({
        data: {
          amount: paymentData.amount,
          currency: 'SAR', // Always use SAR for Paymob
          method: 'PAYMOB',
          status: 'PENDING',
          gatewayId: intentionResult.data.id,
          transactionId: null, // Will be updated when webhook is received
          paymentReference: paymentData.specialReference || `paymob_${Date.now()}`,
          userId: paymentData.userId,
          customerInfo: paymentData.customer,
          metadata: {
            intentionId: intentionResult.data.id,
            clientSecret: intentionResult.data.client_secret,
            paymentMethod: paymentData.paymentMethod || 'card',
            billingData: paymentData.billingData,
            items: paymentData.items || [],
            checkoutUrl: intentionResult.checkoutUrl,
            orderId: paymentData.orderId,
            subscriptionPlanId: paymentData.subscriptionPlanId,
            extras: paymentData.extras || {}
          }
        }
      });

      return {
        success: true,
        provider: 'paymob',
        intentionId: intentionResult.data.id,
        checkoutUrl: intentionResult.checkoutUrl,
        paymentId: payment.id,
        clientSecret: intentionResult.data.client_secret
      };

    } catch (error) {
      console.error('Error creating Paymob payment:', error);
      throw error;
    }
  }

  /**
   * Create a Tabby payment (existing implementation)
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Tabby payment result
   */
  async createTabbyPayment(paymentData) {
    // This would integrate with your existing Tabby service
    // For now, return a placeholder
    return {
      success: true,
      provider: 'tabby',
      message: 'Tabby payment creation not implemented in this example'
    };
  }

  /**
   * Get available payment providers
   * @returns {Array} Available payment providers
   */
  getAvailableProviders() {
    return [
      {
        id: 'paymob',
        name: 'Paymob',
        description: 'Secure payment with cards and Apple Pay - SAR only',
        supportedMethods: ['card', 'apple_pay'],
        currencies: ['SAR'], // Only SAR is supported
        isAvailable: !!process.env.PAYMOB_SECRET_KEY
      },
      {
        id: 'tabby',
        name: 'Tabby',
        description: 'Buy now, pay later',
        supportedMethods: ['installments'],
        currencies: ['SAR', 'AED'],
        isAvailable: !!process.env.TABBY_SECRET_KEY
      }
    ];
  }

  /**
   * Get payment status
   * @param {string} paymentId - Payment ID
   * @param {string} provider - Payment provider
   * @returns {Promise<Object>} Payment status
   */
  async getPaymentStatus(paymentId, provider = 'paymob') {
    try {
      switch (provider.toLowerCase()) {
        case 'paymob':
          return await paymobService.getIntentionStatus(paymentId);
        case 'tabby':
          // Implement Tabby status check
          return { success: true, provider: 'tabby', status: 'not_implemented' };
      default:
          throw new Error(`Unsupported payment provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error getting ${provider} payment status:`, error);
      throw error;
    }
  }

  /**
   * Create a payment record in the database
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Created payment record
   */
  async createPayment(paymentData) {
    try {
      const payment = await prisma.payment.create({
        data: {
          amount: paymentData.amount,
          currency: paymentData.currency,
          method: paymentData.method,
          status: 'PENDING',
          gatewayId: paymentData.transactionId,
          transactionId: paymentData.transactionId,
          paymentReference: await generateUserFriendlyPaymentReference(),
          userId: paymentData.userId,
          customerInfo: paymentData.customerInfo || null,
          metadata: paymentData.metadata || {},
          paymentableId: paymentData.paymentableId,
          paymentableType: paymentData.paymentableType,
          paymentProofUrl: paymentData.paymentProofUrl || null
        }
      });

      // Return the payment object directly (not wrapped)
      return payment;
    } catch (error) {
      console.error('Error creating payment record:', error);
      throw error;
    }
  }

  /**
   * Process refund
   * @param {string} transactionId - Transaction ID
   * @param {number} amount - Refund amount
   * @param {string} provider - Payment provider
   * @returns {Promise<Object>} Refund result
   */
  async processRefund(transactionId, amount, provider = 'paymob') {
    try {
      switch (provider.toLowerCase()) {
        case 'paymob':
          return await paymobService.refundTransaction(transactionId, amount);
        case 'tabby':
          // Implement Tabby refund
          return { success: true, provider: 'tabby', message: 'Refund not implemented' };
        default:
          throw new Error(`Unsupported payment provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error processing ${provider} refund:`, error);
      throw error;
    }
  }

  /**
   * Get payment history for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Payment history
   */
  async getPaymentHistory(userId, filters = {}) {
    try {
      const whereClause = { userId };
      
      if (filters.provider) {
        // Add provider filter logic here
      }
      
      if (filters.status) {
        whereClause.status = filters.status;
      }

      const payments = await prisma.paymentIntention.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * (filters.limit || 10),
        take: filters.limit || 10,
        include: {
          order: {
            select: {
              id: true,
              status: true,
              items: true
            }
          },
          subscriptionPlan: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      });

      const total = await prisma.paymentIntention.count({
        where: whereClause
      });

      return {
        success: true,
        data: {
          payments,
          pagination: {
            page: filters.page || 1,
            limit: filters.limit || 10,
            total,
            pages: Math.ceil(total / (filters.limit || 10))
          }
        }
      };

        } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }
}

export default new PaymentService();