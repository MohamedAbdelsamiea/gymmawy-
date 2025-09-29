import apiClient from './apiClient';

class UserService {
  async getProfile() {
    try {
      return await apiClient.get('/users/me');
    } catch (error) {
      throw new Error(`Profile fetch error: ${error.message}`);
    }
  }

  async updateProfile(profileData) {
    try {
      return await apiClient.patch('/users/me', profileData);
    } catch (error) {
      // Re-throw the error to preserve the original error response
      throw error;
    }
  }

  async changePassword(passwordData) {
    try {
      return await apiClient.put('/users/change-password', passwordData);
    } catch (error) {
      throw new Error(`Password change error: ${error.message}`);
    }
  }

  async changeEmail(newEmail) {
    try {
      return await apiClient.post('/users/change-email', { email: newEmail });
    } catch (error) {
      throw new Error(`Email change error: ${error.message}`);
    }
  }

  async deleteAccount() {
    try {
      return await apiClient.delete('/users/account');
    } catch (error) {
      throw new Error(`Account deletion error: ${error.message}`);
    }
  }

  async getSubscriptions() {
    try {
      return await apiClient.get('/subscriptions');
    } catch (error) {
      throw new Error(`Subscriptions fetch error: ${error.message}`);
    }
  }

  async getOrders() {
    try {
      return await apiClient.get('/orders');
    } catch (error) {
      throw new Error(`Orders fetch error: ${error.message}`);
    }
  }
}

export default new UserService();