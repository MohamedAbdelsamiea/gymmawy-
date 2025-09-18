import { config } from '../config';
import authService from './authService';

const API_BASE_URL = config.API_BASE_URL;

class UserService {
  async getProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
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
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error?.message || 'Profile update failed');
        error.response = { data: errorData };
        throw error;
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      // Re-throw the error to preserve the original error response
      throw error;
    }
  }

  async changePassword(passwordData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/change-password`, {
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

  async changeEmail(newEmail) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/change-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newEmail }),
      });
      
      if (!response.ok) {
        throw new Error('Email change request failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Email change error: ${error.message}`);
    }
  }

  async deleteAccount() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/account`, {
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
      const response = await fetch(`${API_BASE_URL}/api/subscriptions`, {
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
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
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

  async getUserStats() {
    try {
      // For now, return default stats since backend doesn't have this endpoint
      // TODO: Implement proper user stats endpoint in backend
      return {
        stats: {
          loyaltyPoints: 0,
          orders: { total: 0 },
          spending: { total: 0 },
          workoutsThisMonth: 0
        }
      };
    } catch (error) {
      throw new Error(`User stats fetch error: ${error.message}`);
    }
  }
}

export default new UserService();
