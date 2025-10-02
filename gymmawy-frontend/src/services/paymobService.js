import apiClient from './apiClient.js';

class PaymobService {
  /**
   * Create a payment intention using Paymob's Unified Intention API
   * @param {Object} paymentData - Payment data
   * @param {number} paymentData.amount - Amount in currency units (e.g., 10.00)
   * @param {string} paymentData.currency - Currency code (SAR for KSA)
   * @param {string} paymentData.paymentMethod - 'card' or 'apple_pay'
   * @param {Array} paymentData.items - Array of items
   * @param {Object} paymentData.billingData - Customer billing information
   * @param {Object} paymentData.customer - Customer information
   * @param {Object} paymentData.extras - Additional data
   * @param {string} paymentData.orderId - Order ID (optional)
   * @param {string} paymentData.subscriptionPlanId - Subscription plan ID (optional)
   * @returns {Promise<Object>} Payment intention response
   */
  async createIntention(paymentData) {
    try {
      const response = await apiClient.post('/paymob/create-intention', paymentData);
      return response;
    } catch (error) {
      console.error('Error creating Paymob intention:', error);
      throw error;
    }
  }

  /**
   * Get payment intention status
   * @param {string} intentionId - Payment intention ID
   * @returns {Promise<Object>} Intention status
   */
  async getIntentionStatus(intentionId) {
    try {
      const response = await apiClient.get(`/paymob/intention/${intentionId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error fetching intention status:', error);
      throw error;
    }
  }

  /**
   * Refund a transaction
   * @param {string} transactionId - Transaction ID to refund
   * @param {number} amount - Amount to refund
   * @returns {Promise<Object>} Refund response
   */
  async refundTransaction(transactionId, amount) {
    try {
      const response = await apiClient.post('/paymob/refund', {
        transactionId,
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Get payment history for the current user
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.status - Payment status filter
   * @returns {Promise<Object>} Payment history
   */
  async getPaymentHistory(params = {}) {
    try {
      const response = await apiClient.get('/paymob/payments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  /**
   * Open Paymob checkout in a new window/tab
   * @param {string} checkoutUrl - Checkout URL from intention
   * @returns {Promise<Object>} Checkout result
   */
  async openCheckout(checkoutUrl) {
    return new Promise((resolve, reject) => {
      // Open checkout in a new window
      const checkoutWindow = window.open(
        checkoutUrl,
        'paymob_checkout',
        'width=800,height=600,scrollbars=yes,resizable=yes'
      );

      if (!checkoutWindow) {
        reject(new Error('Failed to open checkout window. Please check your popup blocker settings.'));
        return;
      }

      // Listen for window close
      const checkClosed = setInterval(() => {
        if (checkoutWindow.closed) {
          clearInterval(checkClosed);
          reject(new Error('Payment window was closed'));
        }
      }, 1000);

      // Listen for messages from the checkout window
      const messageHandler = (event) => {
        // Verify origin for security
        if (!event.origin.includes('paymob.com')) {
          return;
        }

        if (event.data && event.data.type === 'PAYMOB_PAYMENT_RESULT') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          
          if (event.data.success) {
            resolve({
              success: true,
              data: event.data.data
            });
          } else {
            reject(new Error(event.data.error || 'Payment failed'));
          }
        }
      };

      window.addEventListener('message', messageHandler);

      // Fallback: check for URL changes in the checkout window
      const checkUrl = setInterval(() => {
        try {
          if (checkoutWindow.closed) {
            clearInterval(checkUrl);
            return;
          }

          // Try to access the URL (may fail due to CORS)
          const url = checkoutWindow.location.href;
          
          // Check if we're redirected to success/failure page
          if (url.includes('/payment/result') || url.includes('/payment/success')) {
            clearInterval(checkUrl);
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            resolve({
              success: true,
              data: { url }
            });
          } else if (url.includes('/payment/failed') || url.includes('/payment/error')) {
            clearInterval(checkUrl);
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            reject(new Error('Payment failed'));
          }
        } catch (error) {
          // CORS error - continue checking
        }
      }, 2000);
    });
  }

  /**
   * Create payment intention and open checkout
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment result
   */
  async createAndPay(paymentData) {
    try {
      // Create intention
      const intentionResult = await this.createIntention(paymentData);
      
      if (!intentionResult || !intentionResult.success) {
        throw new Error('Failed to create payment intention');
      }

      if (!intentionResult.data || !intentionResult.data.checkoutUrl) {
        throw new Error('Checkout URL not found in response');
      }

      // Return checkout URL for the frontend to handle
      return {
        success: true,
        intentionId: intentionResult.data.intentionId,
        checkoutUrl: intentionResult.data.checkoutUrl,
        clientSecret: intentionResult.data.clientSecret
      };
    } catch (error) {
      console.error('Error in createAndPay:', error);
      throw error;
    }
  }

  /**
   * Validate payment data before creating intention
   * @param {Object} paymentData - Payment data to validate
   * @returns {Object} Validation result
   */
  validatePaymentData(paymentData) {
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

  /**
   * Format payment data for Paymob API
   * @param {Object} rawData - Raw payment data
   * @returns {Object} Formatted payment data
   */
  formatPaymentData(rawData) {
    return {
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
  }
}

export default new PaymobService();
