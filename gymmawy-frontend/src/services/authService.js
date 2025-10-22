import apiClient from './apiClient';

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
        throw new Error('login.errors.invalidCredentials');
      } else if (error.message.includes('Account locked')) {
        throw new Error('login.errors.accountLocked');
      } else if (error.message.includes('Email and password required')) {
        throw new Error('login.errors.emailPasswordRequired');
      } else if (error.message.includes('No refresh token available')) {
        throw new Error('login.errors.invalidCredentials');
      } else if (error.message.includes('HTTP error! status: 401')) {
        throw new Error('login.errors.invalidCredentials');
      } else {
        // For any other error, provide a generic user-friendly message
        throw new Error('login.errors.loginFailed');
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
      await apiClient.post('/auth/logout');
      this.removeToken();
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      this.removeToken();
    }
  }

  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${apiClient.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Token refresh failed');
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

  // Debug method to check authentication status
  getDebugInfo() {
    const accessToken = this.getToken();
    const refreshToken = this.getRefreshToken();
    
    return {
      isAuthenticated: this.isAuthenticated(),
      hasRefreshToken: this.hasRefreshToken(),
      hasValidTokens: this.hasValidTokens(),
      tokens: {
        accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : 'missing',
        refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'missing'
      },
      localStorage: {
        accessToken: localStorage.getItem('accessToken') ? 'present' : 'missing',
        refreshToken: localStorage.getItem('refreshToken') ? 'present' : 'missing'
      }
    };
  }

  // Validate token storage consistency
  validateTokenStorage() {
    const accessToken = this.getToken();
    const refreshToken = this.getRefreshToken();
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    
    const isValid = {
      accessToken: accessToken === storedAccessToken,
      refreshToken: refreshToken === storedRefreshToken,
      bothPresent: !!(accessToken && refreshToken),
      bothMissing: !accessToken && !refreshToken
    };
    
    console.log('Token storage validation:', isValid);
    
    if (!isValid.accessToken || !isValid.refreshToken) {
      console.warn('Token storage inconsistency detected, clearing tokens');
      this.removeToken();
      this.removeRefreshToken();
    }
    
    return isValid;
  }

  // Force clear all authentication data
  forceLogout() {
    console.log('Force logout: clearing all authentication data');
    this.removeToken();
    this.removeRefreshToken();
    localStorage.removeItem('userCurrencyPreference');
  }
}

export default new AuthService();
