import { config } from '../config';
import apiClient from './apiClient';

const API_BASE_URL = config.API_BASE_URL;

class AuthService {
  async login(credentials) {
    try {
      // Transform email to identifier for backend compatibility
      const loginData = {
        identifier: credentials.email,
        password: credentials.password,
      };
      
      const data = await apiClient.post('/auth/login', loginData);
      return data;
    } catch (error) {
      console.error('Login service error:', error);
      
      // Provide user-friendly error messages
      if (error.message.includes('Invalid credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.message.includes('Account locked')) {
        throw new Error('Your account has been temporarily locked due to multiple failed login attempts. Please try again later.');
      } else if (error.message.includes('Email and password required')) {
        throw new Error('Please enter both email and password.');
      } else if (error.message.includes('No refresh token available')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.message.includes('HTTP error! status: 401')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else {
        // For any other error, provide a generic user-friendly message
        throw new Error('Login failed. Please check your credentials and try again.');
      }
    }
  }

  async register(userData) {
    try {
      const data = await apiClient.post('/auth/register', userData);
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
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.getRefreshToken(),
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Token refresh failed';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        
        // Add status code to error message for better debugging
        errorMessage += ` (${response.status})`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      this.setToken(data.accessToken);
      
      // Store the new refresh token if provided
      if (data.refreshToken) {
        this.setRefreshToken(data.refreshToken);
      }
      
      return data;
    } catch (error) {
      // Re-throw network errors as-is, but add context to other errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Network error during token refresh: ${error.message}`);
      }
      throw new Error(`Token refresh error: ${error.message}`);
    }
  }

  async forgotPassword(email) {
    try {
      const data = await apiClient.post('/auth/forgot-password', { email });
      return data;
    } catch (error) {
      throw new Error(`Forgot password error: ${error.message}`);
    }
  }

  async resetPassword(token, email, password) {
    try {
      const data = await apiClient.post('/auth/reset-password', { 
        token, 
        email, 
        newPassword: password, 
      });
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

  async resendVerificationEmail(email, language = 'en') {
    try {
      const data = await apiClient.post('/auth/resend-verification', { email, language });
      return data;
    } catch (error) {
      throw new Error(`Resend verification error: ${error.message}`);
    }
  }

  async verifyEmail(token, email) {
    try {
      const data = await apiClient.post('/auth/verify-email', { token, email });
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
      const data = await apiClient.patch('/users/me', profileData);
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
    console.log('Setting access token:', token ? 'present' : 'null');
    localStorage.setItem('accessToken', token);
  }

  getToken() {
    const token = localStorage.getItem('accessToken');
    console.log('Getting access token:', token ? 'present' : 'null');
    return token;
  }

  setRefreshToken(token) {
    console.log('Setting refresh token:', token ? 'present' : 'null');
    localStorage.setItem('refreshToken', token);
  }

  getRefreshToken() {
    const token = localStorage.getItem('refreshToken');
    console.log('Getting refresh token:', token ? 'present' : 'null');
    return token;
  }

  removeToken() {
    console.log('Removing both tokens');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  hasRefreshToken() {
    return !!this.getRefreshToken();
  }

  hasValidTokens() {
    return this.isAuthenticated() && this.hasRefreshToken();
  }

  async verifyEmailChange(token, email) {
    try {
      const data = await apiClient.post('/auth/verify-email-change', { token, email });
      return data;
    } catch (error) {
      throw new Error(`Email change verification error: ${error.message}`);
    }
  }
}

export default new AuthService();
