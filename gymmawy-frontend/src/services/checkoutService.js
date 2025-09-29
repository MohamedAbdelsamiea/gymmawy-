import apiClient from './apiClient';

class CheckoutService {

  // ==================== COUPONS ====================
  async validateCoupon(couponCode) {
    try {
      const data = await apiClient.get(`/coupons/validate/${couponCode}`);
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
      return await apiClient.post('/coupons/apply', {
        couponCode,
        amount,
      });
    } catch (error) {
      console.error('Coupon application error:', error);
      throw error;
    }
  }

  // ==================== PAYMENTS ====================
  async createPaymentIntent(amount, currency, planId, planType) {
    try {
      return await apiClient.post('/payments/intent', {
        amount,
        currency,
        planId,
        planType,
        metadata: {
          planId,
          planType,
        },
      });
    } catch (error) {
      console.error('Payment intent creation error:', error);
      throw error;
    }
  }

  async processPayment(paymentData) {
    try {
      return await apiClient.post('/payments/process', paymentData);
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }

  async verifyPayment(paymentId) {
    try {
      return await apiClient.get(`/payments/${paymentId}/verify`);
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  async getPaymentMethods() {
    try {
      return await apiClient.get('/payments/methods');
    } catch (error) {
      console.error('Payment methods fetch error:', error);
      throw error;
    }
  }

  // ==================== SUBSCRIPTIONS ====================
  async createSubscription(subscriptionData) {
    try {
      return await apiClient.post('/subscriptions/with-payment', subscriptionData);
    } catch (error) {
      console.error('Subscription creation error:', error);
      throw error;
    }
  }

  async getSubscriptionPlans() {
    try {
      return await apiClient.get('/subscriptions/plans');
    } catch (error) {
      console.error('Subscription plans fetch error:', error);
      throw error;
    }
  }

  // ==================== PROGRAMMES ====================
  async purchaseProgramme(programmeId, paymentData) {
    try {
      return await apiClient.post(`/programmes/${programmeId}/purchase-with-payment`, paymentData);
    } catch (error) {
      console.error('Programme purchase error:', error);
      throw error;
    }
  }

  // ==================== ORDERS ====================
  async createOrder(orderData) {
    try {
      return await apiClient.post('/orders', orderData);
    } catch (error) {
      console.error('Order creation error:', error);
      throw error;
    }
  }

  async createOrderFromCart(orderData) {
    try {
      return await apiClient.post('/orders/from-cart', orderData);
    } catch (error) {
      console.error('Order creation from cart error:', error);
      throw error;
    }
  }

  async getOrderById(orderId) {
    try {
      return await apiClient.get(`/orders/${orderId}`);
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

      return await apiClient.post('/uploads/payment-proof', formData);
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
      'SAR': 'SAR',
      'USD': '$',
      'EUR': '€',
    };
    
    return `${symbols[currency] || currency} ${amount.toFixed(2)}`;
  }

  // ==================== PAYMENT PROOF UPLOAD ====================
  async uploadPaymentProof(paymentId, proofUrl) {
    try {
      return await apiClient.post('/payments/upload-proof', {
        paymentId,
        proofUrl,
      });
    } catch (error) {
      console.error('Payment proof upload error:', error);
      throw error;
    }
  }
}

export default new CheckoutService();
