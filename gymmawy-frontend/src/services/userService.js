import { config } from '../config';
import authService from './authService';

const API_BASE_URL = config.API_BASE_URL;

class UserService {
  async getProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Profile fetch error: ${error.message}`);
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        throw new Error('Profile update failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Profile update error: ${error.message}`);
    }
  }

  async changePassword(passwordData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });
      
      if (!response.ok) {
        throw new Error('Password change failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Password change error: ${error.message}`);
    }
  }

  async deleteAccount() {
    try {
      const response = await fetch(`${API_BASE_URL}/users/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Account deletion failed');
      }
      
      authService.removeToken();
      return true;
    } catch (error) {
      throw new Error(`Account deletion error: ${error.message}`);
    }
  }

  async getSubscriptions() {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Subscriptions fetch error: ${error.message}`);
    }
  }

  async getOrders() {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
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
}

export default new UserService();
