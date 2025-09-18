import apiClient from './apiClient';

class PaymentService {
  constructor() {
    this.baseURL = '/payments';
  }

  // Process payment
  async processPayment(paymentData) {
    try {
      const response = await apiClient.post(`${this.baseURL}/process`, paymentData);
      return response;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  // Verify payment status
  async verifyPayment(paymentId) {
    try {
      const response = await apiClient.get(`${this.baseURL}/${paymentId}/verify`);
      return response;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  // Get payment history
  async getPaymentHistory(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(`${this.baseURL}/history?${queryString}`);
      return response;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  // Get payment by ID
  async getPaymentById(paymentId) {
    try {
      const response = await apiClient.get(`${this.baseURL}/${paymentId}`);
      return response;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  }

  // Get available payment methods
  async getPaymentMethods() {
    try {
      const response = await apiClient.get(`${this.baseURL}/methods`);
      return response;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  // Create payment intent
  async createPaymentIntent(amount, currency, orderId) {
    try {
      const response = await apiClient.post(`${this.baseURL}/intent`, {
        amount,
        currency,
        orderId,
      });
      return response;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Cancel payment
  async cancelPayment(paymentId) {
    try {
      const response = await apiClient.post(`${this.baseURL}/${paymentId}/cancel`);
      return response;
    } catch (error) {
      console.error('Error cancelling payment:', error);
      throw error;
    }
  }

  // Refund payment
  async refundPayment(paymentId, amount, reason) {
    try {
      const response = await apiClient.post(`${this.baseURL}/${paymentId}/refund`, {
        amount,
        reason,
      });
      return response;
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  }
}

export default new PaymentService();
