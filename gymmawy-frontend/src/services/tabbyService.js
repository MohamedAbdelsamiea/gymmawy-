import apiClient from './apiClient.js';

class TabbyService {
  constructor() {
    this.baseURL = '/tabby';
  }

  /**
   * Create a Tabby checkout session
   * @param {Object} checkoutData - The checkout session data
   * @returns {Promise<Object>} - The checkout session response
   */
  async createCheckoutSession(checkoutData) {
    try {
      console.log('🔍 TabbyService - Making request to:', `${this.baseURL}/checkout`);
      console.log('🔍 TabbyService - Request data:', checkoutData);
      
      const response = await apiClient.post(`${this.baseURL}/checkout`, checkoutData);
      
      console.log('🔍 TabbyService - Response received:', response);
      console.log('🔍 TabbyService - Response data:', response);
      
      // The API client returns the data directly, not wrapped in a 'data' property
      return response;
    } catch (error) {
      console.error('Tabby checkout creation failed:', error);
      throw error;
    }
  }

  /**
   * Get payment status from Tabby
   * @param {string} paymentId - The payment ID
   * @returns {Promise<Object>} - The payment status
   */
  async getPaymentStatus(paymentId) {
    try {
      const response = await apiClient.get(`${this.baseURL}/payment/${paymentId}/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get Tabby payment status:', error);
      throw error;
    }
  }

  /**
   * Capture a payment
   * @param {string} paymentId - The payment ID
   * @param {Object} captureData - The capture data
   * @returns {Promise<Object>} - The capture response
   */
  async capturePayment(paymentId, captureData) {
    try {
      const response = await apiClient.post(`${this.baseURL}/payment/${paymentId}/capture`, captureData);
      return response.data;
    } catch (error) {
      console.error('Failed to capture Tabby payment:', error);
      throw error;
    }
  }

  /**
   * Refund a payment
   * @param {string} paymentId - The payment ID
   * @param {Object} refundData - The refund data
   * @returns {Promise<Object>} - The refund response
   */
  async refundPayment(paymentId, refundData) {
    try {
      const response = await apiClient.post(`${this.baseURL}/payment/${paymentId}/refund`, refundData);
      return response.data;
    } catch (error) {
      console.error('Failed to refund Tabby payment:', error);
      throw error;
    }
  }

  /**
   * Close a payment
   * @param {string} paymentId - The payment ID
   * @returns {Promise<Object>} - The close response
   */
  async closePayment(paymentId) {
    try {
      const response = await apiClient.post(`${this.baseURL}/payment/${paymentId}/close`);
      return response.data;
    } catch (error) {
      console.error('Failed to close Tabby payment:', error);
      throw error;
    }
  }

  /**
   * Setup webhook
   * @param {Object} webhookData - The webhook data
   * @returns {Promise<Object>} - The webhook setup response
   */
  async setupWebhook(webhookData) {
    try {
      const response = await apiClient.post(`${this.baseURL}/webhook/setup`, webhookData);
      return response.data;
    } catch (error) {
      console.error('Failed to setup Tabby webhook:', error);
      throw error;
    }
  }

  /**
   * Create checkout data for different order types
   * @param {Object} orderData - The order data
   * @param {string} orderType - The type of order (product, subscription, programme)
   * @returns {Object} - The formatted checkout data
   */
  createCheckoutData(orderData, orderType = 'product') {
    const baseData = {
      amount: orderData.amount,
      currency: orderData.currency || 'EGP',
      description: orderData.description || `Payment for ${orderType}`,
      paymentableId: orderData.id,
      paymentableType: orderType.toUpperCase(),
      lang: orderData.lang || 'en',
      buyer: {
        phone: orderData.user?.mobileNumber || orderData.buyer?.phone,
        email: orderData.user?.email || orderData.buyer?.email,
        name: `${orderData.user?.firstName || ''} ${orderData.user?.lastName || ''}`.trim(),
        dob: orderData.user?.dateOfBirth ? 
          new Date(orderData.user.dateOfBirth).toISOString().split('T')[0] : 
          undefined
      },
      shipping_address: {
        line1: orderData.shippingAddress?.address || orderData.shippingAddress?.line1 || 'N/A',
        line2: orderData.shippingAddress?.line2 || '',
        city: orderData.shippingAddress?.city || 'Cairo',
        state: orderData.shippingAddress?.state || '',
        zip: orderData.shippingAddress?.postalCode || orderData.shippingAddress?.zip || '00000',
        country: orderData.shippingAddress?.country || 'EG'
      },
      items: this.formatOrderItems(orderData.items || [orderData]),
      metadata: {
        orderType,
        ...orderData.metadata
      }
    };

    return baseData;
  }

  /**
   * Format order items for Tabby
   * @param {Array} items - The order items
   * @returns {Array} - The formatted items
   */
  formatOrderItems(items) {
    return items.map(item => ({
      title: item.title || item.name || 'Item',
      description: item.description || '',
      quantity: item.quantity || 1,
      unit_price: (item.price || item.amount || 0).toString(),
      discount_amount: (item.discount || 0).toString(),
      reference_id: item.id || item.reference_id,
      image_url: item.imageUrl || item.image_url,
      product_url: item.productUrl || item.product_url,
      category: item.category || 'general'
    }));
  }

  /**
   * Handle payment success redirect
   * @param {string} paymentId - The payment ID from URL params
   * @returns {Promise<Object>} - The payment status
   */
  async handlePaymentSuccess(paymentId) {
    try {
      // Get payment status to verify
      const status = await this.getPaymentStatus(paymentId);
      
      // Redirect to success page or show success message
      return {
        success: true,
        payment: status,
        message: 'Payment completed successfully'
      };
    } catch (error) {
      console.error('Payment success handling failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Payment verification failed'
      };
    }
  }

  /**
   * Handle payment failure redirect
   * @param {string} paymentId - The payment ID from URL params
   * @returns {Promise<Object>} - The payment status
   */
  async handlePaymentFailure(paymentId) {
    try {
      // Get payment status to understand what happened
      const status = await this.getPaymentStatus(paymentId);
      
      return {
        success: false,
        payment: status,
        message: 'Payment was rejected or failed'
      };
    } catch (error) {
      console.error('Payment failure handling failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Payment failed'
      };
    }
  }

  /**
   * Handle payment cancellation redirect
   * @param {string} paymentId - The payment ID from URL params
   * @returns {Promise<Object>} - The payment status
   */
  async handlePaymentCancel(paymentId) {
    try {
      // Get payment status to understand what happened
      const status = await this.getPaymentStatus(paymentId);
      
      return {
        success: false,
        payment: status,
        message: 'Payment was cancelled by user'
      };
    } catch (error) {
      console.error('Payment cancellation handling failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Payment was cancelled'
      };
    }
  }

  /**
   * Validate checkout data before sending to API
   * @param {Object} checkoutData - The checkout data to validate
   * @returns {Object} - Validation result
   */
  validateCheckoutData(checkoutData) {
    const errors = [];

    // Required fields validation
    if (!checkoutData.amount || checkoutData.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!checkoutData.currency) {
      errors.push('Currency is required');
    }

    if (!checkoutData.paymentableId) {
      errors.push('Order ID is required');
    }

    if (!checkoutData.paymentableType) {
      errors.push('Order type is required');
    }

    // Buyer validation
    if (!checkoutData.buyer?.email) {
      errors.push('Buyer email is required');
    }

    if (!checkoutData.buyer?.phone) {
      errors.push('Buyer phone is required');
    }

    if (!checkoutData.buyer?.name) {
      errors.push('Buyer name is required');
    }

    // Shipping address validation
    if (!checkoutData.shipping_address?.line1) {
      errors.push('Shipping address line1 is required');
    }

    if (!checkoutData.shipping_address?.city) {
      errors.push('Shipping city is required');
    }

    if (!checkoutData.shipping_address?.country) {
      errors.push('Shipping country is required');
    }

    // Items validation
    if (!checkoutData.items || checkoutData.items.length === 0) {
      errors.push('At least one item is required');
    }

    checkoutData.items?.forEach((item, index) => {
      if (!item.title) {
        errors.push(`Item ${index + 1}: title is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: quantity must be greater than 0`);
      }
      if (!item.unit_price || parseFloat(item.unit_price) <= 0) {
        errors.push(`Item ${index + 1}: unit price must be greater than 0`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new TabbyService();
