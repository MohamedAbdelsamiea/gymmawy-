import { config } from '../config';
import authService from './authService';

const API_BASE_URL = config.API_BASE_URL;

class AdminService {
  async getUsers(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/users?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Users fetch error: ${error.message}`);
    }
  }

  async getUser(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`User fetch error: ${error.message}`);
    }
  }

  async updateUser(id, userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        throw new Error('User update failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`User update error: ${error.message}`);
    }
  }

  async deleteUser(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('User deletion failed');
      }
      
      return true;
    } catch (error) {
      throw new Error(`User deletion error: ${error.message}`);
    }
  }

  async getOrders(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/orders?${queryParams}`, {
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

  async updateOrder(id, orderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
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

  async getAnalytics(period = 'month') {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/analytics?period=${period}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Analytics fetch error: ${error.message}`);
    }
  }

  async getDashboardStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Dashboard stats fetch error: ${error.message}`);
    }
  }

  async getProducts(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/products?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Products fetch error: ${error.message}`);
    }
  }

  async createProduct(productData) {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        throw new Error('Product creation failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Product creation error: ${error.message}`);
    }
  }

  async updateProduct(id, productData) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        throw new Error('Product update failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Product update error: ${error.message}`);
    }
  }

  async deleteProduct(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Product deletion failed');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Product deletion error: ${error.message}`);
    }
  }
}

export default new AdminService();
