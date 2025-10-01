import apiClient from './apiClient.js';

class TabbyService {
  constructor() {
    this.baseURL = '/tabby';
  }

  /**
   * Perform background pre-scoring check via backend
   * @param {Object} orderData - The order data
   * @param {String} type - The order type
   * @returns {Promise<Object>} - The pre-scoring response
   */
  async performBackgroundPrescoring(orderData, type) {
    try {
      console.log('🔍 PRESCORING - Starting background pre-scoring check via backend');
      console.log('📦 Order Data:', JSON.stringify(orderData, null, 2));
      console.log('📱 Buyer Phone:', orderData.buyer?.phone);
      console.log('💰 Currency:', orderData.currency);
      console.log('🌍 Shipping Country:', orderData.shipping_address?.country || 'No shipping address');
      console.log('🏙️ Shipping City:', orderData.shipping_address?.city || 'No shipping address');
      console.log('🔗 API Endpoint: /tabby/prescoring');
      
      const response = await apiClient.post('/tabby/prescoring', {
        orderData,
        type
      });
      
      console.log('🔍 PRESCORING - Backend response received:');
      console.log('📦 Response Data:', JSON.stringify(response, null, 2));
      console.log('✅ Session Status:', response?.status);
      console.log('🔧 Configuration:', response?.configuration);
      console.log('❌ Rejection Reason:', response?.rejection_reason);
      
      return {
        success: response?.success || true,
        status: response?.status,
        configuration: response?.configuration,
        rejection_reason: response?.rejection_reason
      };
    } catch (error) {
      console.error('❌ PRESCORING - Failed:', error);
      console.log('📦 Error Response:', error.response?.data);
      console.log('📦 Error Status:', error.response?.status);
      console.log('📦 Error Message:', error.message);
      
      // Handle 400 errors as rejection rather than failure
      if (error.response?.status === 400) {
        console.log('❌ Tabby pre-scoring rejected with 400 error');
        console.log('📦 Rejection Details:', error.response.data);
        return {
          success: false,
          status: 'rejected',
          rejection_reason: 'not_available',
          error: error.message,
          errorDetails: error.response.data
        };
      }
      
      // For other errors, still show Tabby but let actual checkout handle it
      return {
        success: true,
        status: 'created',
        error: error.message
      };
    }
  }

  /**
   * Create a Tabby checkout session (after pre-scoring approval)
   * @param {Object} checkoutData - The checkout session data
   * @returns {Promise<Object>} - The checkout session response
   */
  async createCheckoutSession(checkoutData) {
    try {
      console.log('🔍 TabbyService - Creating checkout session:', checkoutData);
      
      const response = await apiClient.post(`${this.baseURL}/checkout`, checkoutData);
      
      console.log('🔍 TabbyService - Checkout session response:', response);
      
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
      return await apiClient.get(`${this.baseURL}/payment/${paymentId}/status`);
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
      return await apiClient.post(`${this.baseURL}/payment/${paymentId}/capture`, captureData);
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
      return await apiClient.post(`${this.baseURL}/payment/${paymentId}/refund`, refundData);
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
      return await apiClient.post(`${this.baseURL}/payment/${paymentId}/close`);
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
      return await apiClient.post(`${this.baseURL}/webhook/setup`, webhookData);
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
    const baseUrl = window.location.origin;
    
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
      // Only include shipping_address if provided (for physical items)
      ...(orderData.shippingAddress ? {
        shipping_address: {
          line1: orderData.shippingAddress.address || orderData.shippingAddress.line1 || 'N/A',
          line2: orderData.shippingAddress.line2 || '',
          city: orderData.shippingAddress.city || 'Cairo',
          state: orderData.shippingAddress.state || '',
          zip: orderData.shippingAddress.postalCode || orderData.shippingAddress.zip || '00000',
          country: orderData.shippingAddress.country || 'EG'
        }
      } : {}),
      items: this.formatOrderItems(orderData.items || [orderData]),
      merchant_urls: {
        success: `${baseUrl}/payment/success`,
        cancel: `${baseUrl}/payment/cancel`,
        failure: `${baseUrl}/payment/failure`
      },
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
      const response = await this.getPaymentStatus(paymentId);
      
      // Backend returns: { success: true, payment: {...}, local_status: ... }
      // We want to return the payment object directly
      return {
        success: response.success,
        payment: response.payment, // This is the actual payment data
        local_status: response.local_status,
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
      const response = await this.getPaymentStatus(paymentId);
      
      return {
        success: false,
        payment: response.payment, // Extract nested payment object
        local_status: response.local_status,
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
      const response = await this.getPaymentStatus(paymentId);
      
      return {
        success: false,
        payment: response.payment, // Extract nested payment object
        local_status: response.local_status,
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
   * Get rejection message based on rejection reason
   * @param {string} rejectionReason - The rejection reason from Tabby
   * @param {string} language - The language ('ar' or 'en')
   * @returns {Object} - The rejection message
   */
  getRejectionMessage(rejectionReason, language = 'en') {
    const messages = {
      'not_available': {
        en: 'Sorry, Tabby is unable to approve this purchase. Please use an alternative payment method for your order.',
        ar: 'نأسف، تابي غير قادرة على الموافقة على هذه العملية. الرجاء استخدام طريقة دفع أخرى.'
      },
      'order_amount_too_high': {
        en: 'This purchase is above your current spending limit with Tabby, try a smaller cart or use another payment method',
        ar: 'قيمة الطلب تفوق الحد الأقصى المسموح به حاليًا مع تابي. يُرجى تخفيض قيمة السلة أو استخدام وسيلة دفع أخرى.'
      },
      'order_amount_too_low': {
        en: 'The purchase amount is below the minimum amount required to use Tabby, try adding more items or use another payment method',
        ar: 'قيمة الطلب أقل من الحد الأدنى المطلوب لاستخدام خدمة تابي. يُرجى زيادة قيمة الطلب أو استخدام وسيلة دفع أخرى.'
      }
    };

    const message = messages[rejectionReason] || messages['not_available'];
    return {
      message: message[language] || message.en,
      reason: rejectionReason
    };
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
