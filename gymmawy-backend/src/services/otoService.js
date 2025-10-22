import axios from 'axios';

/**
 * OTO Shipping API Service
 * Documentation: https://api.tryoto.com
 * Staging: https://staging-api.tryoto.com
 */
class OTOService {
  constructor() {
    this.baseURL = process.env.OTO_BASE_URL || 'https://api.tryoto.com';
    this.refreshToken = process.env.OTO_REFRESH_TOKEN;
    this.accessToken = process.env.OTO_ACCESS_TOKEN || null;
    this.secretKey = process.env.OTO_SECRET_KEY || process.env.OTO_WEBHOOK_SECRET;
    
    // Support both refresh token and direct API key
    this.apiKey = process.env.OTO_API_KEY;
    
    if (!this.refreshToken && !this.apiKey) {
      console.warn('⚠️  OTO_REFRESH_TOKEN or OTO_API_KEY not configured. OTO integration will not work.');
    }

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Add request interceptor for logging and token management
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Add authorization header
        const token = await this.getAccessToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        console.log(`OTO API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('OTO API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling and token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If 401 and we haven't retried yet, try refreshing token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            console.error('Failed to refresh OTO access token:', refreshError);
          }
        }
        
        const otoError = this.handleOTOError(error);
        return Promise.reject(otoError);
      }
    );
  }

  /**
   * Get valid access token (use cached or refresh if needed)
   */
  async getAccessToken() {
    // If we have an API key, use that instead
    if (this.apiKey) {
      return this.apiKey;
    }

    // If we have a valid access token, use it
    if (this.accessToken) {
      return this.accessToken;
    }

    // Otherwise, get a new access token using refresh token
    return await this.refreshAccessToken();
  }

  /**
   * Exchange refresh token for access token
   * Official OTO endpoint: POST /rest/v2/refreshToken
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('OTO_REFRESH_TOKEN not configured');
    }

    try {
      console.log('🔄 Refreshing OTO access token...');
      
      // Official OTO refresh token endpoint
      const response = await axios.post(
        `${this.baseURL}/rest/v2/refreshToken`,
        {
          refresh_token: this.refreshToken  // Note: underscore format as per OTO docs
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000
        }
      );

      // Extract access_token from response
      // Response format: { access_token, refresh_token, success, token_type, expires_in }
      this.accessToken = response.data.access_token;
      
      // Update refresh token if a new one is provided
      if (response.data.refresh_token) {
        this.refreshToken = response.data.refresh_token;
      }
      
      console.log('✅ OTO access token refreshed successfully');
      console.log(`   Token type: ${response.data.token_type}, Expires in: ${response.data.expires_in}s`);
      
      return this.accessToken;
    } catch (error) {
      console.error('❌ Failed to refresh OTO access token:', error.response?.data || error.message);
      throw new Error('Failed to refresh OTO access token');
    }
  }

  /**
   * Handle OTO API errors and convert them to a standard format
   */
  handleOTOError(error) {
    if (error.response) {
      const { status, data } = error.response;
      const otoErrorCode = data?.otoErrorCode;
      const otoErrorMessage = data?.otoErrorMessage || data?.message;
      
      return {
        status,
        otoErrorCode,
        message: otoErrorMessage || `OTO API Error: ${status}`,
        details: data,
        isOTOError: true
      };
    } else if (error.request) {
      return {
        status: 503,
        message: 'Unable to reach OTO API',
        details: error.message,
        isOTOError: true
      };
    } else {
      return {
        status: 500,
        message: error.message || 'Unknown error',
        isOTOError: true
      };
    }
  }

  /**
   * Update order in OTO (using updateOrder endpoint)
   * @param {Object} orderData - Order details
   * @returns {Promise<Object>} - Updated order response
   */
  async updateOrder(orderData) {
    try {
      const response = await this.axiosInstance.post('/rest/v2/updateOrder', orderData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Update Order Error:', error);
      throw error;
    }
  }

  /**
   * Create a shipment using createShipment endpoint
   * @param {Object} shipmentData - Shipment details with orderId and deliveryOptionId
   * @returns {Promise<Object>}
   */
  async createShipment(shipmentData) {
    try {
      const response = await this.axiosInstance.post('/rest/v2/createShipment', shipmentData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Create Shipment Error:', error);
      throw error;
    }
  }

  /**
   * Get order details by OTO Order ID
   * @param {string} orderId - OTO Order ID
   * @returns {Promise<Object>}
   */
  async getOrder(orderId) {
    try {
      const response = await this.axiosInstance.get(`/rest/v2/orders/${orderId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Get Order Error:', error);
      throw error;
    }
  }

  /**
   * Cancel an order
   * @param {string} orderId - OTO Order ID
   * @returns {Promise<Object>}
   */
  async cancelOrder(orderId) {
    try {
      const response = await this.axiosInstance.post(`/rest/v2/orders/${orderId}/cancel`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Cancel Order Error:', error);
      throw error;
    }
  }

  /**
   * Get delivery fee for an order
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>}
   */
  async getDeliveryFee(orderId) {
    try {
      const response = await this.axiosInstance.post('/rest/v2/getDeliveryFee', {
        orderId: orderId
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Get Delivery Fee Error:', error);
      throw error;
    }
  }

  /**
   * Get shipment details
   * @param {string} shipmentId - OTO Shipment ID
   * @returns {Promise<Object>}
   */
  async getShipment(shipmentId) {
    try {
      const response = await this.axiosInstance.get(`/rest/v2/shipments/${shipmentId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Get Shipment Error:', error);
      throw error;
    }
  }

  /**
   * Track a shipment by tracking number or order ID
   * @param {string} identifier - Tracking number or Order ID
   * @returns {Promise<Object>}
   */
  async trackShipment(identifier) {
    try {
      const response = await this.axiosInstance.get(`/rest/v2/tracking/${identifier}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Track Shipment Error:', error);
      throw error;
    }
  }

  /**
   * Get shipping label (AWB) for a shipment
   * @param {string} shipmentId - OTO Shipment ID
   * @param {string} format - Label format (pdf, zpl, etc.)
   * @returns {Promise<Object>}
   */
  async getShippingLabel(shipmentId, format = 'pdf') {
    try {
      const response = await this.axiosInstance.get(`/rest/v2/shipments/${shipmentId}/label`, {
        params: { format },
        responseType: 'arraybuffer'
      });
      return {
        success: true,
        data: response.data,
        contentType: response.headers['content-type']
      };
    } catch (error) {
      console.error('OTO Get Shipping Label Error:', error);
      throw error;
    }
  }

  /**
   * Assign a driver to orders (OTO Flex)
   * @param {Array<number>} orderIDs - Array of order IDs
   * @param {number} driverID - Driver ID
   * @returns {Promise<Object>}
   */
  async assignDriver(orderIDs, driverID) {
    try {
      const response = await this.axiosInstance.post('/rest/v2/assignDriver', {
        orderIDs,
        driverID
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Assign Driver Error:', error);
      throw error;
    }
  }

  /**
   * Get list of pickup locations
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>}
   */
  async getPickupLocations(filters = {}) {
    try {
      const response = await this.axiosInstance.get('/rest/v2/pickupLocations', {
        params: filters
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Get Pickup Locations Error:', error);
      throw error;
    }
  }

  /**
   * Create a pickup location
   * @param {Object} locationData - Pickup location details
   * @returns {Promise<Object>}
   */
  async createPickupLocation(locationData) {
    try {
      const response = await this.axiosInstance.post('/rest/v2/pickupLocations', locationData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Create Pickup Location Error:', error);
      throw error;
    }
  }

  /**
   * Update a pickup location
   * @param {string} locationId - Location ID
   * @param {Object} locationData - Updated location details
   * @returns {Promise<Object>}
   */
  async updatePickupLocation(locationId, locationData) {
    try {
      const response = await this.axiosInstance.put(`/rest/v2/pickupLocations/${locationId}`, locationData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Update Pickup Location Error:', error);
      throw error;
    }
  }

  /**
   * Register a webhook
   * @param {Object} webhookData - Webhook configuration
   * @returns {Promise<Object>}
   */
  async registerWebhook(webhookData) {
    try {
      const response = await this.axiosInstance.post('/rest/v2/webhooks', webhookData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Register Webhook Error:', error);
      throw error;
    }
  }

  /**
   * Get list of webhooks
   * @returns {Promise<Object>}
   */
  async getWebhooks() {
    try {
      const response = await this.axiosInstance.get('/rest/v2/webhooks');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Get Webhooks Error:', error);
      throw error;
    }
  }

  /**
   * Delete a webhook
   * @param {string} webhookId - Webhook ID
   * @returns {Promise<Object>}
   */
  async deleteWebhook(webhookId) {
    try {
      const response = await this.axiosInstance.delete(`/rest/v2/webhooks/${webhookId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Delete Webhook Error:', error);
      throw error;
    }
  }

  /**
   * Create a return shipment
   * @param {Object} returnData - Return shipment details
   * @returns {Promise<Object>}
   */
  async createReturnShipment(returnData) {
    try {
      const response = await this.axiosInstance.post('/rest/v2/returnShipments', returnData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Create Return Shipment Error:', error);
      throw error;
    }
  }

  /**
   * Health check - verify OTO API is accessible
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    try {
      const response = await this.axiosInstance.get('/rest/v2/healthCheck');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Health Check Error:', error);
      throw error;
    }
  }

  /**
   * Get account information (includes wallet balance)
   * @returns {Promise<Object>}
   */
  async getAccountInfo() {
    try {
      const response = await this.axiosInstance.get('/rest/v2/account');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Get Account Info Error:', error);
      throw error;
    }
  }

  /**
   * Get wallet balance
   * @returns {Promise<Object>}
   */
  async getWalletBalance() {
    try {
      const accountInfo = await this.getAccountInfo();
      return {
        success: true,
        balance: accountInfo.data.balance || 0,
        currency: accountInfo.data.currency || 'EGP',
        data: accountInfo.data
      };
    } catch (error) {
      console.error('OTO Get Wallet Balance Error:', error);
      throw error;
    }
  }

  /**
   * Check OTO delivery fee (with OTO rates)
   * @param {Object} feeData - Fee calculation data
   * @returns {Promise<Object>}
   */
  async checkOTODeliveryFee(feeData) {
    try {
      const response = await this.axiosInstance.post('/rest/v2/checkOTODeliveryFee', feeData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Check OTO Delivery Fee Error:', error);
      throw error;
    }
  }

  /**
   * Calculate shipping cost for checkout
   * @param {Object} shippingData - Shipping calculation data
   * @returns {Promise<Object>}
   */
  async calculateShippingCost(shippingData) {
    try {
      const response = await this.axiosInstance.post('/rest/v2/checkDeliveryFee', shippingData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Calculate Shipping Cost Error:', error);
      throw error;
    }
  }

  /**
   * Check delivery fee (with your own contract rates)
   * @param {Object} feeData - Fee calculation data
   * @returns {Promise<Object>}
   */
  async checkDeliveryFee(feeData) {
    try {
      const response = await this.axiosInstance.post('/rest/v2/checkDeliveryFee', feeData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Check Delivery Fee Error:', error);
      throw error;
    }
  }

  /**
   * Buy credit / charge wallet
   * @param {Object} creditData - Credit purchase data
   * @returns {Promise<Object>}
   */
  async buyCredit(creditData) {
    try {
      const response = await this.axiosInstance.post('/rest/v2/buyCredit', creditData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Buy Credit Error:', error);
      throw error;
    }
  }

  /**
   * Get delivery company list
   * @returns {Promise<Object>}
   */
  async getDeliveryCompanyList() {
    try {
      const response = await this.axiosInstance.get('/rest/v2/dcList');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Get Delivery Company List Error:', error);
      throw error;
    }
  }

  /**
   * Get available cities for delivery
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>}
   */
  async getAvailableCities(filters = {}) {
    try {
      const response = await this.axiosInstance.post('/rest/v2/availableCities', filters);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Get Available Cities Error:', error);
      throw error;
    }
  }

  /**
   * Get delivery options for a city
   * @param {string} city - City name
   * @returns {Promise<Object>}
   */
  async getDeliveryOptions(city) {
    try {
      const response = await this.axiosInstance.get('/rest/v2/getDeliveryOptions', {
        params: { city }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Get Delivery Options Error:', error);
      throw error;
    }
  }

  /**
   * Get delivery company configuration template
   * @param {string} companyCode - Delivery company code
   * @returns {Promise<Object>}
   */
  async getDeliveryCompanyConfig(companyCode) {
    try {
      const response = await this.axiosInstance.get('/rest/v2/dcConfig', {
        params: { companyCode }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Get Delivery Company Config Error:', error);
      throw error;
    }
  }

  /**
   * Activate delivery company integration
   * @param {Object} activationData - Activation configuration
   * @returns {Promise<Object>}
   */
  async activateDeliveryCompany(activationData) {
    try {
      const response = await this.axiosInstance.post('/rest/v2/dcActivation', activationData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Activate Delivery Company Error:', error);
      throw error;
    }
  }

  /**
   * Get order status (detailed)
   * @param {string} orderId - OTO Order ID
   * @returns {Promise<Object>}
   */
  async getOrderStatus(orderId) {
    try {
      const response = await this.axiosInstance.get('/rest/v2/orderStatus', {
        params: { orderId }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Get Order Status Error:', error);
      throw error;
    }
  }

  /**
   * Get order history (status changes)
   * @param {string} orderId - OTO Order ID
   * @returns {Promise<Object>}
   */
  async getOrderHistory(orderId) {
    try {
      const response = await this.axiosInstance.get('/rest/v2/orderHistory', {
        params: { orderId }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Get Order History Error:', error);
      throw error;
    }
  }

  /**
   * Create shipment separately (after creating order)
   * @param {Object} shipmentData - Shipment data with orderId and deliveryOptionId
   * @returns {Promise<Object>}
   */
  async createShipmentSeparately(shipmentData) {
    try {
      const response = await this.axiosInstance.post('/rest/v2/createShipment', shipmentData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Create Shipment Separately Error:', error);
      throw error;
    }
  }

  /**
   * Create complete order and shipment for Gymmawy
   * @param {Object} orderData - Complete order data
   * @returns {Promise<Object>}
   */
  async createGymmawyOrder(orderData) {
    try {
      // First update/create the order
      const orderResponse = await this.updateOrder(orderData);
      
      if (!orderResponse.success) {
        throw new Error('Failed to create order in OTO');
      }

      // Then create shipment
      const shipmentData = {
        orderId: orderData.orderId,
        deliveryOptionId: orderData.deliveryOptionId || null
      };

      const shipmentResponse = await this.createShipment(shipmentData);
      
      return {
        success: true,
        order: orderResponse.data,
        shipment: shipmentResponse.data
      };
    } catch (error) {
      console.error('OTO Create Gymmawy Order Error:', error);
      throw error;
    }
  }

  /**
   * Print AWB (get label URL)
   * @param {string} orderId - OTO Order ID
   * @returns {Promise<Object>}
   */
  async printAWB(orderId) {
    try {
      const response = await this.axiosInstance.get(`/rest/v2/print/${orderId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Print AWB Error:', error);
      throw error;
    }
  }

  /**
   * Get list of available brands
   * @returns {Promise<Object>}
   */
  async getBrands() {
    try {
      const response = await this.axiosInstance.get('/rest/v2/brands');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Get Brands Error:', error);
      throw error;
    }
  }

  /**
   * Update stock/inventory
   * @param {Object} stockData - Stock update details
   * @returns {Promise<Object>}
   */
  async updateStock(stockData) {
    try {
      const response = await this.axiosInstance.post('/rest/v2/stock', stockData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('OTO Update Stock Error:', error);
      throw error;
    }
  }

  /**
   * Validate webhook signature
   * @param {string} signature - Webhook signature from header
   * @param {Object} payload - Webhook payload
   * @returns {boolean}
   */
  validateWebhookSignature(signature, payload) {
    // Implement signature validation based on OTO's webhook security
    // This is a placeholder - update based on actual OTO implementation
    if (!this.secretKey) {
      console.warn('OTO Secret Key not configured for webhook validation');
      return false;
    }
    // Add actual validation logic here
    return true;
  }

  /**
   * Map OTO status to internal shipping status
   * @param {string} otoStatus - OTO status
   * @returns {string} - Internal ShippingStatus
   */
  mapOTOStatusToInternal(otoStatus) {
    const statusMap = {
      // Creation stages
      'new': 'PENDING',
      'searchingDriver': 'PENDING',
      'shipmentCreated': 'LABEL_CREATED',
      'goingToPickup': 'LABEL_CREATED',
      'arrivedPickup': 'LABEL_CREATED',
      
      // Pickup stages
      'pickedUp': 'PICKED_UP',
      
      // Transit stages
      'inTransit': 'IN_TRANSIT',
      'arrivedTerminal': 'IN_TRANSIT',
      'departedTerminal': 'IN_TRANSIT',
      'arrivedOriginTerminal': 'IN_TRANSIT',
      'arrivedDestinationTerminal': 'IN_TRANSIT',
      'outForDelivery': 'OUT_FOR_DELIVERY',
      'arrivedDestination': 'OUT_FOR_DELIVERY',
      
      // Delivery stages
      'delivered': 'DELIVERED',
      
      // Failed/Return stages
      'undeliveredAttempt': 'FAILED_DELIVERY',
      'returned': 'RETURNED',
      'returnProcessing': 'RETURNED',
      'returnShipmentProcessing': 'RETURNED',
      
      // Other
      'shipmentCanceled': 'FAILED_DELIVERY',
      'lostOrDamaged': 'FAILED_DELIVERY',
      'destroyed': 'FAILED_DELIVERY',
    };

    return statusMap[otoStatus] || 'PENDING';
  }
}

// Export singleton instance
export default new OTOService();
