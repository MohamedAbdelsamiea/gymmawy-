import apiClient from './apiClient';

class AdminService {
  async getUsers(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/users${queryParams ? `?${queryParams}` : ''}`;
      return await apiClient.get(endpoint);
    } catch (error) {
      throw new Error(`Users fetch error: ${error.message}`);
    }
  }

  async getUser(id) {
    try {
      return await apiClient.get(`/users/${id}`);
    } catch (error) {
      throw new Error(`User fetch error: ${error.message}`);
    }
  }

  async updateUser(id, userData) {
    try {
      return await apiClient.patch(`/users/${id}`, userData);
    } catch (error) {
      throw new Error(`User update error: ${error.message}`);
    }
  }

  async deleteUser(id) {
    try {
      await apiClient.delete(`/users/${id}`);
      return true;
    } catch (error) {
      throw new Error(`User deletion error: ${error.message}`);
    }
  }

  async getOrders(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/orders${queryParams ? `?${queryParams}` : ''}`;
      return await apiClient.get(endpoint);
    } catch (error) {
      throw new Error(`Orders fetch error: ${error.message}`);
    }
  }

  async updateOrder(id, orderData) {
    try {
      return await apiClient.patch(`/orders/${id}/status`, orderData);
    } catch (error) {
      throw new Error(`Order update error: ${error.message}`);
    }
  }

  async getAnalytics(period = 'month') {
    try {
      return await apiClient.get(`/admin/analytics?period=${period}`);
    } catch (error) {
      throw new Error(`Analytics fetch error: ${error.message}`);
    }
  }

  async getDashboardStats() {
    try {
      return await apiClient.get('/admin/dashboard/stats');
    } catch (error) {
      throw new Error(`Dashboard stats fetch error: ${error.message}`);
    }
  }

  async getProducts(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/products${queryParams ? `?${queryParams}` : ''}`;
      return await apiClient.get(endpoint);
    } catch (error) {
      throw new Error(`Products fetch error: ${error.message}`);
    }
  }

  async createProduct(productData) {
    try {
      return await apiClient.post('/products', productData);
    } catch (error) {
      throw new Error(`Product creation error: ${error.message}`);
    }
  }

  async updateProduct(id, productData) {
    try {
      return await apiClient.patch(`/products/${id}`, productData);
    } catch (error) {
      throw new Error(`Product update error: ${error.message}`);
    }
  }

  async deleteProduct(id) {
    try {
      await apiClient.delete(`/products/${id}`);
      return true;
    } catch (error) {
      throw new Error(`Product deletion error: ${error.message}`);
    }
  }
}

export default new AdminService();
