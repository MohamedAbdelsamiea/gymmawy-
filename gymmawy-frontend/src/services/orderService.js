import { config } from '../config';
import authService from './authService';

const API_BASE_URL = config.API_BASE_URL;

class OrderService {
  async getOrders(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/api/orders?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Orders fetch error: ${error.message}`);
    }
  }

  async getOrder(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Order fetch error: ${error.message}`);
    }
  }

  async createOrder(orderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error('Order creation failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Order creation error: ${error.message}`);
    }
  }

  async updateOrder(id, orderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error('Order update failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Order update error: ${error.message}`);
    }
  }

  async cancelOrder(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Order cancellation failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Order cancellation error: ${error.message}`);
    }
  }

  async getOrderTracking(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${id}/tracking`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch order tracking');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Order tracking fetch error: ${error.message}`);
    }
  }
}

export default new OrderService();
