import apiClient from './apiClient.js';
import paymobService from './paymobService.js';

class UnifiedPaymentService {
  /**
   * Get available payment providers
   * @returns {Promise<Object>} Available payment providers
   */
  async getPaymentProviders() {
    try {
      const response = await apiClient.get('/unified-payments/providers');
      return response.data;
    } catch (error) {
      console.error('Error fetching payment providers:', error);
      throw error;
    }
  }

  /**
   * Create a payment with the specified provider
   * @param {Object} paymentData - Payment data
   * @param {string} provider - Payment provider ('paymob' or 'tabby')
   * @returns {Promise<Object>} Payment result
   */
  async createPayment(paymentData, provider = 'paymob') {
    try {
      const response = await apiClient.post('/unified-payments/create', {
        provider,
        ...paymentData
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Get payment status
   * @param {string} paymentId - Payment ID
   * @param {string} provider - Payment provider
   * @returns {Promise<Object>} Payment status
   */
  async getPaymentStatus(paymentId, provider = 'paymob') {
    try {
      const response = await apiClient.get(`/unified-payments/${paymentId}/status`, {
        params: { provider }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment status:', error);
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
      const response = await apiClient.post('/unified-payments/refund', {
        transactionId,
        amount,
        provider
      });
      return response.data;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Get payment history
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Payment history
   */
  async getPaymentHistory(params = {}) {
    try {
      const response = await apiClient.get('/unified-payments/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics
   * @returns {Promise<Object>} Payment statistics
   */
  async getPaymentStats() {
    try {
      const response = await apiClient.get('/unified-payments/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      throw error;
    }
  }

  /**
   * Create and process payment with provider-specific handling
   * @param {Object} paymentData - Payment data
   * @param {string} provider - Payment provider
   * @returns {Promise<Object>} Payment result
   */
  async createAndProcessPayment(paymentData, provider = 'paymob') {
    try {
      // Create payment intention
      const createResult = await this.createPayment(paymentData, provider);

      if (!createResult.success) {
        throw new Error('Failed to create payment intention');
      }

      // Handle provider-specific payment processing
      switch (provider.toLowerCase()) {
        case 'paymob':
          return await this.processPaymobPayment(createResult.data);
        case 'tabby':
          return await this.processTabbyPayment(createResult.data);
        default:
          throw new Error(`Unsupported payment provider: ${provider}`);
      }

    } catch (error) {
      console.error('Error in createAndProcessPayment:', error);
      throw error;
    }
  }

  /**
   * Process Paymob payment (opens checkout)
   * @param {Object} paymentData - Payment data from create result
   * @returns {Promise<Object>} Payment result
   */
  async processPaymobPayment(paymentData) {
    try {
      // Use the existing Paymob service to open checkout
      const checkoutResult = await paymobService.openCheckout(paymentData.checkoutUrl);
      
      return {
        success: true,
        provider: 'paymob',
        intentionId: paymentData.intentionId,
        data: checkoutResult.data
      };
    } catch (error) {
      console.error('Error processing Paymob payment:', error);
      throw error;
    }
  }

  /**
   * Process Tabby payment
   * @param {Object} paymentData - Payment data from create result
   * @returns {Promise<Object>} Payment result
   */
  async processTabbyPayment(paymentData) {
    try {
      // This would integrate with your existing Tabby service
      // For now, return a placeholder
      return {
        success: true,
        provider: 'tabby',
        data: paymentData,
        message: 'Tabby payment processing not implemented'
      };
    } catch (error) {
      console.error('Error processing Tabby payment:', error);
      throw error;
    }
  }

  /**
   * Format payment data for the API
   * @param {Object} rawData - Raw payment data
   * @param {string} provider - Payment provider
   * @returns {Object} Formatted payment data
   */
  formatPaymentData(rawData, provider = 'paymob') {
    const baseData = {
      amount: parseFloat(rawData.amount),
      currency: rawData.currency || 'SAR',
      paymentMethod: rawData.paymentMethod || 'card',
      items: rawData.items || [],
      billingData: {
        firstName: rawData.billingData.firstName,
        lastName: rawData.billingData.lastName,
        email: rawData.billingData.email,
        phoneNumber: rawData.billingData.phoneNumber,
        street: rawData.billingData.street || '',
        building: rawData.billingData.building || '',
        apartment: rawData.billingData.apartment || '',
        floor: rawData.billingData.floor || '',
        city: rawData.billingData.city || '',
        state: rawData.billingData.state || '',
        country: rawData.billingData.country || 'KSA',
        postalCode: rawData.billingData.postalCode || ''
      },
      customer: {
        firstName: rawData.customer.firstName,
        lastName: rawData.customer.lastName,
        email: rawData.customer.email,
        extras: rawData.customer.extras || {}
      },
      extras: rawData.extras || {},
      orderId: rawData.orderId || null,
      subscriptionPlanId: rawData.subscriptionPlanId || null
    };

    // Provider-specific formatting
    switch (provider.toLowerCase()) {
      case 'paymob':
        return baseData;
      case 'tabby':
        // Add Tabby-specific formatting if needed
        return baseData;
      default:
        return baseData;
    }
  }

  /**
   * Validate payment data
   * @param {Object} paymentData - Payment data to validate
   * @param {string} provider - Payment provider
   * @returns {Object} Validation result
   */
  validatePaymentData(paymentData, provider = 'paymob') {
    const errors = [];

    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push('Amount is required and must be greater than 0');
    }

    if (!paymentData.billingData?.firstName) {
      errors.push('Customer first name is required');
    }

    if (!paymentData.billingData?.lastName) {
      errors.push('Customer last name is required');
    }

    if (!paymentData.billingData?.email) {
      errors.push('Customer email is required');
    }

    if (!paymentData.billingData?.phoneNumber) {
      errors.push('Customer phone number is required');
    }

    if (!paymentData.customer?.firstName) {
      errors.push('Customer first name is required');
    }

    if (!paymentData.customer?.lastName) {
      errors.push('Customer last name is required');
    }

    if (!paymentData.customer?.email) {
      errors.push('Customer email is required');
    }

    // Provider-specific validation
    switch (provider.toLowerCase()) {
      case 'paymob':
        // Use Paymob service validation
        return paymobService.validatePaymentData(paymentData);
      case 'tabby':
        // Add Tabby-specific validation if needed
        break;
    }

    // Validate items if provided
    if (paymentData.items && paymentData.items.length > 0) {
      const totalItemsAmount = paymentData.items.reduce((sum, item) => {
        return sum + (item.amount * (item.quantity || 1));
      }, 0);

      if (Math.abs(totalItemsAmount - paymentData.amount) > 0.01) {
        errors.push('Items total amount must match the total payment amount');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new UnifiedPaymentService();
