import axios from 'axios';
import crypto from 'crypto';

class PaymobService {
  constructor() {
    this.baseURL = 'https://ksa.paymob.com';
    this.secretKey = process.env.PAYMOB_SECRET_KEY;
    this.publicKey = process.env.PAYMOB_PUBLIC_KEY;
    // Use production integration IDs
    this.integrationIdCard = process.env.PAYMOB_MIGS_INTEGRATION_ID;
    this.integrationIdApplePay = process.env.PAYMOB_APPLEPAY_INTEGRATION_ID;
    this.hmacSecret = process.env.PAYMOB_HMAC_SECRET;
    
    if (!this.secretKey || !this.publicKey) {
      console.warn('Paymob configuration missing. Please set PAYMOB_SECRET_KEY and PAYMOB_PUBLIC_KEY in environment variables.');
    }
    
    if (!this.integrationIdCard) {
      console.warn('Paymob MIGS integration ID missing. Please set PAYMOB_MIGS_INTEGRATION_ID in environment variables.');
    }
    
    if (!this.integrationIdApplePay) {
      console.warn('Paymob Apple Pay integration ID missing. Please set PAYMOB_APPLEPAY_INTEGRATION_ID in environment variables.');
    }
    
    // Debug: Log integration IDs (without exposing actual values)
    console.log('Paymob Service initialized:');
    console.log('- MIGS Integration ID (Card):', this.integrationIdCard ? '✓ Configured' : '✗ Missing');
    console.log('- Apple Pay Integration ID:', this.integrationIdApplePay ? '✓ Configured' : '✗ Missing');
    console.log('- HMAC Secret:', this.hmacSecret ? '✓ Configured' : '✗ Missing');
  }

  /**
   * Create a payment intention using Paymob's Unified Intention API
   * @param {Object} paymentData - Payment data
   * @param {number} paymentData.amount - Amount in cents (e.g., 1000 = 10.00 SAR)
   * @param {string} paymentData.currency - Currency code (SAR for KSA)
   * @param {string} paymentData.paymentMethod - 'card' or 'apple_pay'
   * @param {Array} paymentData.items - Array of items
   * @param {Object} paymentData.billingData - Customer billing information
   * @param {Object} paymentData.customer - Customer information
   * @param {Object} paymentData.extras - Additional data
   * @param {string} paymentData.specialReference - Unique reference
   * @param {string} paymentData.notificationUrl - Webhook URL for callbacks
   * @param {string} paymentData.redirectionUrl - URL to redirect after payment
   * @returns {Promise<Object>} Payment intention response
   */
  async createIntention(paymentData) {
    try {
      const {
        amount,
        currency = 'SAR',
        paymentMethod = 'card',
        items = [],
        billingData,
        customer,
        extras = {},
        specialReference,
        notificationUrl,
        redirectionUrl
      } = paymentData;

      // Determine integration ID based on payment method
      const integrationId = paymentMethod === 'apple_pay' 
        ? this.integrationIdApplePay 
        : this.integrationIdCard;

      if (!integrationId) {
        throw new Error(`Integration ID not configured for payment method: ${paymentMethod}`);
      }

      const payload = {
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        payment_methods: [parseInt(integrationId)],
        items: items.map(item => ({
          name: item.name,
          amount: Math.round(item.amount * 100), // Convert to cents
          description: item.description || '',
          quantity: item.quantity || 1
        })),
        billing_data: {
          apartment: billingData.apartment || '',
          first_name: billingData.firstName,
          last_name: billingData.lastName,
          street: billingData.street || '',
          building: billingData.building || '',
          phone_number: billingData.phoneNumber,
          country: billingData.country || 'KSA',
          email: billingData.email,
          floor: billingData.floor || '',
          state: billingData.state || '',
          city: billingData.city || '',
          postal_code: billingData.postalCode || ''
        },
        customer: {
          first_name: customer.firstName,
          last_name: customer.lastName,
          email: customer.email,
          extras: customer.extras || {}
        },
        extras,
        ...(specialReference && { special_reference: specialReference }),
        ...(notificationUrl && { notification_url: notificationUrl }),
        ...(redirectionUrl && { redirection_url: redirectionUrl })
      };

      console.log('Creating Paymob intention with payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(`${this.baseURL}/v1/intention/`, payload, {
        headers: {
          'Authorization': `Token ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Paymob intention created successfully:', response.data.id);

      return {
        success: true,
        data: response.data,
        checkoutUrl: `${this.baseURL}/unifiedcheckout/?publicKey=${this.publicKey}&clientSecret=${response.data.client_secret}`
      };

    } catch (error) {
      console.error('Error creating Paymob intention:', error.response?.data || error.message);
      throw new Error(`Failed to create payment intention: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Verify HMAC signature for webhook callbacks
   * @param {string} receivedHmac - HMAC signature from webhook
   * @param {string} payload - Raw payload string
   * @returns {boolean} Whether HMAC is valid
   */
  verifyHmac(receivedHmac, payload) {
    if (!this.hmacSecret) {
      console.warn('HMAC secret not configured. Skipping HMAC verification.');
      return true; // Allow in development
    }

    if (!receivedHmac) {
      console.warn('No HMAC header received. Rejecting webhook.');
      return false;
    }

    try {
      const calculatedHmac = crypto
        .createHmac('sha512', this.hmacSecret)
        .update(payload, 'utf8')
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(receivedHmac, 'hex'),
        Buffer.from(calculatedHmac, 'hex')
      );

      console.log('HMAC verification:', {
        received: receivedHmac.substring(0, 16) + '...',
        calculated: calculatedHmac.substring(0, 16) + '...',
        isValid: isValid
      });

      return isValid;
    } catch (error) {
      console.error('Error verifying HMAC:', error.message);
      return false;
    }
  }

  /**
   * Parse webhook payload and verify HMAC
   * @param {string} rawPayload - Raw webhook payload
   * @param {string} hmacHeader - HMAC header from request
   * @returns {Object} Parsed and verified webhook data
   */
  processWebhook(rawPayload, hmacHeader) {
    try {
      console.log('Processing webhook:', {
        payloadLength: rawPayload.length,
        hasHmac: !!hmacHeader,
        hmacHeader: hmacHeader ? hmacHeader.substring(0, 16) + '...' : 'none'
      });

      // Verify HMAC if provided
      if (hmacHeader && !this.verifyHmac(hmacHeader, rawPayload)) {
        console.error('HMAC verification failed');
        return {
          success: false,
          error: 'Invalid HMAC signature',
          verified: false
        };
      }

      const webhookData = JSON.parse(rawPayload);
      
      console.log('Webhook data parsed successfully:', {
        type: webhookData.type,
        hasObj: !!webhookData.obj,
        transactionId: webhookData.obj?.id
      });
      
      return {
        success: true,
        data: webhookData,
        verified: !!hmacHeader
      };

    } catch (error) {
      console.error('Error processing webhook:', error.message);
      return {
        success: false,
        error: `Failed to process webhook: ${error.message}`,
        verified: false
      };
    }
  }

  /**
   * Get payment intention status
   * @param {string} intentionId - Payment intention ID
   * @returns {Promise<Object>} Intention status
   */
  async getIntentionStatus(intentionId) {
    try {
      const response = await axios.get(`${this.baseURL}/v1/intention/${intentionId}`, {
        headers: {
          'Authorization': `Token ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('Error fetching intention status:', error.response?.data || error.message);
      throw new Error(`Failed to fetch intention status: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Refund a transaction
   * @param {string} transactionId - Transaction ID to refund
   * @param {number} amount - Amount to refund in cents
   * @returns {Promise<Object>} Refund response
   */
  async refundTransaction(transactionId, amount) {
    try {
      const payload = {
        transaction_id: transactionId,
        amount: Math.round(amount * 100) // Convert to cents
      };

      const response = await axios.post(`${this.baseURL}/v1/refund`, payload, {
        headers: {
          'Authorization': `Token ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('Error processing refund:', error.response?.data || error.message);
      throw new Error(`Failed to process refund: ${error.response?.data?.detail || error.message}`);
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
}

export default new PaymobService();
