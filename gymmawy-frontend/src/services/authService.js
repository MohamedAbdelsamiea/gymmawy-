import { config } from '../config';
import apiClient from './apiClient';

const API_BASE_URL = config.API_BASE_URL;

class AuthService {
  async login(credentials) {
    try {
      // Transform email to identifier for backend compatibility
      const loginData = {
        identifier: credentials.email,
        password: credentials.password
      };
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error messages from the server
        const errorMessage = data.error?.message || data.message || 'Login failed';
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Create error object that preserves the full API response
        const error = new Error(data.error?.message || data.message || 'Registration failed');
        error.response = { data };
        throw error;
      }
      
      return data;
    } catch (error) {
      // If it's already our custom error with response data, re-throw it
      if (error.response) {
        throw error;
      }
      // Otherwise, create a new error
      throw new Error(error.message);
    }
  }

  async logout() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      
      this.removeToken();
      return response.ok;
    } catch (error) {
      console.error('Logout error:', error);
      this.removeToken();
    }
  }

  async refreshToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getRefreshToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      const data = await response.json();
      this.setToken(data.accessToken);
      
      // Store the new refresh token if provided
      if (data.refreshToken) {
        this.setRefreshToken(data.refreshToken);
      }
      
      return data;
    } catch (error) {
      throw new Error(`Token refresh error: ${error.message}`);
    }
  }

  async forgotPassword(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send reset email');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Forgot password error: ${error.message}`);
    }
  }

  async resetPassword(token, email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email, newPassword: password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error?.message || errorData.message || 'Failed to reset password');
        error.response = { data: errorData };
        throw error;
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      // If it's already our custom error with response data, re-throw it
      if (error.response) {
        throw error;
      }
      // Otherwise, create a new error
      throw new Error(`Reset password error: ${error.message}`);
    }
  }

  async resendVerificationEmail(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to resend verification email');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Resend verification error: ${error.message}`);
    }
  }

  async verifyEmail(token, email) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error?.message || data.message || 'Email verification failed';
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getProfile() {
    try {
      const data = await apiClient.get('/users/me');
      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw new Error(`Get profile error: ${error.message}`);
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error?.message || errorData.message || 'Failed to update profile');
        error.response = { data: errorData };
        throw error;
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      // If it's already our custom error with response data, re-throw it
      if (error.response) {
        throw error;
      }
      // Otherwise, create a new error
      throw new Error(`Update profile error: ${error.message}`);
    }
  }

  // Token management
  setToken(token) {
    localStorage.setItem('accessToken', token);
  }

  getToken() {
    return localStorage.getItem('accessToken');
  }

  setRefreshToken(token) {
    localStorage.setItem('refreshToken', token);
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  removeToken() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}

export default new AuthService();
