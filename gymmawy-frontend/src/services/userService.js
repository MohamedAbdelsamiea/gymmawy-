import apiClient from './apiClient';

class UserService {
  async getProfile() {
    try {
      const response = await apiClient.request('/api/users/me', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      throw new Error(`Profile fetch error: ${error.message}`);
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await apiClient.request('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify(profileData),
      });
      return response;
    } catch (error) {
      // Re-throw the error to preserve the original error response
      throw error;
    }
  }

  async changePassword(passwordData) {
    try {
      const response = await apiClient.request('/api/users/change-password', {
        method: 'PUT',
        body: JSON.stringify(passwordData),
      });
      return response;
    } catch (error) {
      throw new Error(`Password change error: ${error.message}`);
    }
  }

  async changeEmail(newEmail) {
    try {
      const response = await apiClient.request('/api/users/change-email', {
        method: 'POST',
        body: JSON.stringify({ email: newEmail }),
      });
      return response;
    } catch (error) {
      throw new Error(`Email change error: ${error.message}`);
    }
  }

  async deleteAccount() {
    try {
      const response = await apiClient.request('/api/users/account', {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      throw new Error(`Account deletion error: ${error.message}`);
    }
  }

  async getSubscriptions() {
    try {
      const response = await apiClient.request('/api/subscriptions', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      throw new Error(`Subscriptions fetch error: ${error.message}`);
    }
  }

  async getOrders() {
    try {
      const response = await apiClient.request('/api/orders', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      throw new Error(`Orders fetch error: ${error.message}`);
    }
  }
}

export default new UserService();