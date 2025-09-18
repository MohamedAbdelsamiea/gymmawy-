import { config } from '../config';

const API_BASE_URL = config.API_BASE_URL;

class CheckoutService {
  // Get authentication headers
  getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  // ==================== COUPONS ====================
  async validateCoupon(couponCode) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/coupons/validate/${couponCode}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || errorData.message || 'Failed to validate coupon');
      }

      const data = await response.json();
      return {
        valid: true,
        coupon: data.coupon,
        discount: data.discount,
        discountType: data.discountType,
        message: data.message,
      };
    } catch (error) {
      console.error('Coupon validation error:', error);
      return {
        valid: false,
        message: error.message || 'Invalid coupon code',
      };
    }
  }

  async applyCoupon(couponCode, amount) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/coupons/apply`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          couponCode,
          amount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to apply coupon');
      }

      return await response.json();
    } catch (error) {
      console.error('Coupon application error:', error);
      throw error;
    }
  }

  // ==================== PAYMENTS ====================
  async createPaymentIntent(amount, currency, planId, planType) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/intent`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          amount,
          currency,
          planId,
          planType,
          metadata: {
            planId,
            planType,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment intent');
      }

      return await response.json();
    } catch (error) {
      console.error('Payment intent creation error:', error);
      throw error;
    }
  }

  async processPayment(paymentData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/process`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment processing failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }

  async verifyPayment(paymentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/${paymentId}/verify`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment verification failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  async getPaymentMethods() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/methods`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch payment methods');
      }

      return await response.json();
    } catch (error) {
      console.error('Payment methods fetch error:', error);
      throw error;
    }
  }

  // ==================== SUBSCRIPTIONS ====================
  async createSubscription(subscriptionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/with-payment`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Subscription creation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Subscription creation error:', error);
      throw error;
    }
  }

  async getSubscriptionPlans() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/plans`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch subscription plans');
      }

      return await response.json();
    } catch (error) {
      console.error('Subscription plans fetch error:', error);
      throw error;
    }
  }

  // ==================== PROGRAMMES ====================
  async purchaseProgramme(programmeId, paymentData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/programmes/${programmeId}/purchase-with-payment`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Programme purchase API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.error?.message || errorData.message || 'Programme purchase failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Programme purchase error:', error);
      throw error;
    }
  }

  // ==================== ORDERS ====================
  async createOrder(orderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Order creation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Order creation error:', error);
      throw error;
    }
  }

  async getOrderById(orderId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch order');
      }

      return await response.json();
    } catch (error) {
      console.error('Order fetch error:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================
  async uploadPaymentProof(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'payment-proof');

      const response = await fetch(`${API_BASE_URL}/api/uploads/payment-proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'File upload failed');
      }

      return await response.json();
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  // Calculate total with discounts
  calculateTotal(amount, discountPercentage = 0, couponDiscount = 0) {
    const discountAmount = (amount * discountPercentage) / 100;
    const totalDiscount = discountAmount + couponDiscount;
    return Math.max(0, amount - totalDiscount);
  }

  // Format currency
  formatCurrency(amount, currency = 'EGP') {
    const symbols = {
      'EGP': 'L.E',
      'SAR': 'S.R',
      'USD': '$',
      'EUR': '€',
    };
    
    return `${symbols[currency] || currency} ${amount.toFixed(2)}`;
  }

  // ==================== PAYMENT PROOF UPLOAD ====================
  async uploadPaymentProof(paymentId, proofUrl) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/upload-proof`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          paymentId,
          proofUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || errorData.message || 'Failed to upload payment proof');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Payment proof upload error:', error);
      throw error;
    }
  }
}

export default new CheckoutService();
