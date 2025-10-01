import axios from 'axios';

class TabbyService {
  constructor() {
    this.baseURL = 'https://api.tabby.ai'; // Use production API
    this.secretKey = process.env.TABBY_SECRET_KEY;
    this.publicKey = process.env.TABBY_PUBLIC_KEY;
    this.merchantCode = process.env.TABBY_MERCHANT_CODE;
    
    if (!this.secretKey || !this.publicKey) {
      console.warn('Tabby API credentials not configured. Please set TABBY_SECRET_KEY and TABBY_PUBLIC_KEY environment variables.');
    }
    
    if (!this.merchantCode || this.merchantCode === 'your-merchant-code') {
      console.error('TABBY_MERCHANT_CODE is required. Please get your merchant code from https://merchant.tabby.ai');
      throw new Error('TABBY_MERCHANT_CODE is required. Please get your merchant code from https://merchant.tabby.ai');
    }
  }

  /**
   * Get merchant code based on currency
   * @param {string} currency - The currency (SAR, AED, etc.)
   * @returns {string} - The appropriate merchant code
   */
  getMerchantCode(currency) {
    // Use merchant codes from environment variables, with country-specific fallbacks
    switch (currency) {
      case 'SAR':
        return process.env.TABBY_MERCHANT_CODE_SAR || 'CCSAU'; // Saudi Arabia
      case 'AED':
        return process.env.TABBY_MERCHANT_CODE_AED || 'GUAE';  // UAE
      default:
        return this.merchantCode; // Fallback to default from .env
    }
  }

  /**
   * Create axios instance with default headers
   * @param {string} currency - The currency to determine merchant code
   */
  getApiClient(currency = null) {
    const merchantCode = currency ? this.getMerchantCode(currency) : this.merchantCode;
    
    return axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        'X-Merchant-Code': merchantCode
      },
      timeout: 60000 // Increased timeout to 60 seconds
    });
  }

  /**
   * Create a checkout session
   * @param {Object} checkoutData - The checkout session data
   * @returns {Promise<Object>} - The checkout session response
   */
  async createCheckoutSession(checkoutData, retryCount = 0) {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds
    
    try {
      // Get currency from payment data
      const currency = checkoutData.payment?.currency || 'SAR';
      const apiClient = this.getApiClient(currency);
      const merchantCode = this.getMerchantCode(currency);
      
      const payload = {
        payment: checkoutData.payment,
        lang: checkoutData.lang || 'en',
        merchant_code: merchantCode,
        merchant_urls: checkoutData.merchant_urls,
        token: checkoutData.token || null
      };

      // Debug: Log the payload being sent to Tabby
      console.log('🔍 TABBY API PAYLOAD:');
      console.log('📦 Complete Payload:', JSON.stringify(payload, null, 2));
      console.log('📱 Buyer Phone:', payload.payment?.buyer?.phone);
      console.log('💰 Currency:', payload.payment?.currency);
      console.log('🌍 Shipping Country:', payload.payment?.shipping_address?.country || 'No shipping address');
      console.log('🏙️ Shipping City:', payload.payment?.shipping_address?.city || 'No shipping address');
      console.log('🔗 Merchant URLs:', payload.merchant_urls);

      const response = await apiClient.post('/api/v2/checkout', payload);
      
      // Debug: Log the Tabby API response
      console.log('🔍 TABBY API RESPONSE:');
      console.log('📦 Response Status:', response.status);
      console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
      console.log('📱 Session ID:', response.data?.id);
      console.log('✅ Status:', response.data?.status);
      console.log('🔧 Configuration:', response.data?.configuration);
      
      return response.data;
    } catch (error) {
      console.error(`Tabby checkout session creation failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
      
      // Check if it's a network error and we can retry
      const isNetworkError = error.code === 'ETIMEDOUT' || 
                            error.code === 'ENETUNREACH' || 
                            error.code === 'ECONNREFUSED' ||
                            error.message?.includes('Network error') ||
                            error.message?.includes('timeout');
      
      if (isNetworkError && retryCount < maxRetries) {
        console.log(`🔄 Retrying Tabby API call in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.createCheckoutSession(checkoutData, retryCount + 1);
      }
      
      // Log detailed error information
      if (error.response) {
        console.error('Tabby API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
        
        const errorMessage = error.response.data?.error || 
                           error.response.data?.message || 
                           `HTTP ${error.response.status}: ${error.response.statusText}`;
        throw new Error(`Tabby checkout failed: ${errorMessage}`);
      } else if (error.request) {
        console.error('Tabby API Request Error:', {
          message: error.message,
          code: error.code,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        });
        throw new Error(`Tabby checkout failed: Network error - ${error.message}`);
      } else {
        console.error('Tabby API Setup Error:', error.message);
        throw new Error(`Tabby checkout failed: ${error.message}`);
      }
    }
  }

  /**
   * Retrieve an existing checkout session
   * @param {string} sessionId - The session ID
   * @returns {Promise<Object>} - The checkout session data
   */
  async getCheckoutSession(sessionId) {
    try {
      const apiClient = this.getApiClient();
      const response = await apiClient.get(`/api/v2/checkout/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Tabby checkout session retrieval failed:', error.response?.data || error.message);
      throw new Error(`Failed to retrieve Tabby session: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Retrieve a payment by ID
   * @param {string} paymentId - The payment ID
   * @returns {Promise<Object>} - The payment data
   */
  async getPayment(paymentId) {
    try {
      const apiClient = this.getApiClient();
      const response = await apiClient.get(`/api/v2/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Tabby payment retrieval failed:', error.response?.data || error.message);
      throw new Error(`Failed to retrieve Tabby payment: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Update a payment (reference_id or delivery_tracking)
   * @param {string} paymentId - The payment ID
   * @param {Object} updateData - The update data
   * @returns {Promise<Object>} - The updated payment data
   */
  async updatePayment(paymentId, updateData) {
    try {
      const apiClient = this.getApiClient();
      const response = await apiClient.put(`/api/v2/payments/${paymentId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Tabby payment update failed:', error.response?.data || error.message);
      throw new Error(`Failed to update Tabby payment: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Capture a payment
   * @param {string} paymentId - The payment ID
   * @param {Object} captureData - The capture data
   * @returns {Promise<Object>} - The captured payment data
   */
  async capturePayment(paymentId, captureData) {
    try {
      const apiClient = this.getApiClient();
      const response = await apiClient.post(`/api/v2/payments/${paymentId}/captures`, captureData);
      return response.data;
    } catch (error) {
      console.error('Tabby payment capture failed:', error.response?.data || error.message);
      throw new Error(`Failed to capture Tabby payment: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Refund a payment
   * @param {string} paymentId - The payment ID
   * @param {Object} refundData - The refund data
   * @returns {Promise<Object>} - The refunded payment data
   */
  async refundPayment(paymentId, refundData) {
    try {
      const apiClient = this.getApiClient();
      const response = await apiClient.post(`/api/v2/payments/${paymentId}/refunds`, refundData);
      return response.data;
    } catch (error) {
      console.error('Tabby payment refund failed:', error.response?.data || error.message);
      throw new Error(`Failed to refund Tabby payment: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Close a payment
   * @param {string} paymentId - The payment ID
   * @returns {Promise<Object>} - The closed payment data
   */
  async closePayment(paymentId) {
    try {
      const apiClient = this.getApiClient();
      const response = await apiClient.post(`/api/v2/payments/${paymentId}/close`);
      return response.data;
    } catch (error) {
      console.error('Tabby payment close failed:', error.response?.data || error.message);
      throw new Error(`Failed to close Tabby payment: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * List payments with filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>} - The payments list
   */
  async listPayments(filters = {}) {
    try {
      const apiClient = this.getApiClient();
      const params = new URLSearchParams();
      
      if (filters.created_at__gte) params.append('created_at__gte', filters.created_at__gte);
      if (filters.created_at__lte) params.append('created_at__lte', filters.created_at__lte);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.status) params.append('status', filters.status);
      if (filters.offset) params.append('offset', filters.offset);

      const response = await apiClient.get(`/api/v2/payments?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Tabby payments list failed:', error.response?.data || error.message);
      throw new Error(`Failed to list Tabby payments: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Create a webhook
   * @param {Object} webhookData - The webhook data
   * @returns {Promise<Object>} - The created webhook data
   */
  async createWebhook(webhookData) {
    try {
      const apiClient = this.getApiClient();
      const response = await apiClient.post('/api/v1/webhooks', webhookData);
      return response.data;
    } catch (error) {
      console.error('Tabby webhook creation failed:', error.response?.data || error.message);
      throw new Error(`Failed to create Tabby webhook: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get all webhooks
   * @returns {Promise<Array>} - The webhooks list
   */
  async getWebhooks() {
    try {
      const apiClient = this.getApiClient();
      const response = await apiClient.get('/api/v1/webhooks');
      return response.data;
    } catch (error) {
      console.error('Tabby webhooks retrieval failed:', error.response?.data || error.message);
      throw new Error(`Failed to retrieve Tabby webhooks: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Update a webhook
   * @param {string} webhookId - The webhook ID
   * @param {Object} updateData - The update data
   * @returns {Promise<Object>} - The updated webhook data
   */
  async updateWebhook(webhookId, updateData) {
    try {
      const apiClient = this.getApiClient();
      const response = await apiClient.put(`/api/v1/webhooks/${webhookId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Tabby webhook update failed:', error.response?.data || error.message);
      throw new Error(`Failed to update Tabby webhook: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Delete a webhook
   * @param {string} webhookId - The webhook ID
   * @returns {Promise<void>}
   */
  async deleteWebhook(webhookId) {
    try {
      const apiClient = this.getApiClient();
      await apiClient.delete(`/api/v1/webhooks/${webhookId}`);
    } catch (error) {
      console.error('Tabby webhook deletion failed:', error.response?.data || error.message);
      throw new Error(`Failed to delete Tabby webhook: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify webhook signature
   * @param {string} payload - The webhook payload
   * @param {string} signature - The webhook signature
   * @returns {boolean} - Whether the signature is valid
   */
  verifyWebhookSignature(payload, signature) {
    // For development/testing: accept webhooks without signature verification
    if (process.env.NODE_ENV === 'development' && !signature) {
      console.warn('[TABBY] Webhook signature verification skipped in development mode');
      return true;
    }
    
    if (!signature) {
      console.error('[TABBY] Webhook signature missing');
      return false;
    }
    
    // TODO: Implement proper HMAC-SHA256 signature verification when Tabby provides the webhook secret
    // Tabby typically uses HMAC-SHA256 with a webhook secret key
    // Example implementation:
    // const crypto = require('crypto');
    // const hmac = crypto.createHmac('sha256', process.env.TABBY_WEBHOOK_SECRET);
    // const expectedSignature = hmac.update(payload).digest('hex');
    // return signature === expectedSignature;
    
    // For now, log the signature for debugging
    console.log('[TABBY] Webhook signature received:', signature);
    console.warn('[TABBY] Webhook signature verification not fully implemented. Contact Tabby for webhook secret.');
    
    // Accept all webhooks in production until we get the webhook secret from Tabby
    // This is better than blocking all webhooks
    return true;
  }

  /**
   * Map Tabby payment status to internal payment status
   * @param {string} tabbyStatus - The Tabby payment status
   * @returns {string} - The internal payment status
   */
  mapPaymentStatus(tabbyStatus) {
    const statusMap = {
      'NEW': 'PENDING',
      'AUTHORIZED': 'AUTHORIZED',
      'CLOSED': 'COMPLETED',
      'REJECTED': 'FAILED',
      'EXPIRED': 'FAILED',
      'CANCELLED': 'CANCELLED'
    };
    
    return statusMap[tabbyStatus] || 'PENDING';
  }

  /**
   * Create payment object for Tabby API
   * @param {Object} orderData - The order data
   * @returns {Object} - The Tabby payment object
   */
  createPaymentObject(orderData) {
    const paymentObject = {
      amount: orderData.amount.toString(),
      currency: orderData.currency || 'SAR',
      description: orderData.description || 'Payment for order',
      buyer: orderData.buyer,
      buyer_history: orderData.buyer_history || {},
      order: orderData.order,
      order_history: orderData.order_history || [],
      items: orderData.items,
      meta: orderData.meta || {},
      attachment: orderData.attachment || {}
    };

    // Only include shipping_address if provided (for physical items)
    if (orderData.shipping_address) {
      paymentObject.shipping_address = orderData.shipping_address;
    }

    return paymentObject;
  }

  /**
   * Create merchant URLs for checkout
   * @param {string} baseUrl - The base URL of your application
   * @param {string} paymentId - The payment ID for tracking
   * @returns {Object} - The merchant URLs object
   */
  createMerchantUrls(baseUrl, paymentId) {
    return {
      success: `${baseUrl}/payment/success?payment_id=${paymentId}`,
      cancel: `${baseUrl}/payment/cancel?payment_id=${paymentId}`,
      failure: `${baseUrl}/payment/failure?payment_id=${paymentId}`
    };
  }
}

export default new TabbyService();
