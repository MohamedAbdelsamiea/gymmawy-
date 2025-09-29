import apiClient from './apiClient';

class OrderService {
  async getOrders(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/orders${queryParams ? `?${queryParams}` : ''}`;
      return await apiClient.get(endpoint);
    } catch (error) {
      throw new Error(`Orders fetch error: ${error.message}`);
    }
  }

  async getOrder(id) {
    try {
      return await apiClient.get(`/orders/${id}`);
    } catch (error) {
      throw new Error(`Order fetch error: ${error.message}`);
    }
  }

  async createOrder(orderData) {
    try {
      return await apiClient.post('/orders', orderData);
    } catch (error) {
      throw new Error(`Order creation error: ${error.message}`);
    }
  }

  async updateOrder(id, orderData) {
    try {
      return await apiClient.patch(`/orders/${id}`, orderData);
    } catch (error) {
      throw new Error(`Order update error: ${error.message}`);
    }
  }

  async cancelOrder(id) {
    try {
      return await apiClient.patch(`/orders/${id}/cancel`);
    } catch (error) {
      throw new Error(`Order cancellation error: ${error.message}`);
    }
  }

  async getOrderTracking(id) {
    try {
      return await apiClient.get(`/orders/${id}/tracking`);
    } catch (error) {
      throw new Error(`Order tracking fetch error: ${error.message}`);
    }
  }
}

export default new OrderService();
