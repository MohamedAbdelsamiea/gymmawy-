import { config } from '../config';

const API_BASE_URL = config.API_BASE_URL;

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.isRefreshing = false;
    this.failedQueue = [];
  }

      // Get authorization headers
      getAuthHeaders(customHeaders = {}, isFormData = false) {
        const token = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const userCurrencyPreference = localStorage.getItem('userCurrencyPreference');
        
        
        const headers = {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...(userCurrencyPreference && { 'X-User-Currency': userCurrencyPreference }),
          ...customHeaders,
        };
    
    // Only set Content-Type if not FormData and not already set
    if (!isFormData && !customHeaders['Content-Type'] && !customHeaders['content-type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    console.log('API Client - Headers:', headers);
    return headers;
  }

  // Process failed requests queue
  processQueue(error, token = null) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  // Refresh token - independent implementation to avoid circular dependency
  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
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
      localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      
      return data.accessToken;
    } catch (error) {
      // Clear tokens on refresh failure
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw error;
    }
  }

  // Make API request with automatic token refresh
  async request(endpoint, options = {}) {
    // Ensure endpoint starts with / if it doesn't already
    const apiEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // Remove trailing slash from baseURL to prevent double slashes
    const baseURL = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
    // Automatically prepend /api to all requests
    const url = `${baseURL}/api${apiEndpoint}`;
    const isFormData = options.body instanceof FormData;
    const config = {
      headers: this.getAuthHeaders(options.headers || {}, isFormData),
      ...options,
    };

    console.log('API Client - Making request to:', url);
    console.log('API Client - Request config:', config);

    try {
      const response = await fetch(url, config);
      console.log('API Client - Response status:', response.status);
      console.log('API Client - Response headers:', response.headers);

      // If token is expired, try to refresh (but not for auth endpoints)
      if (response.status === 401 && !options._retry && !endpoint.startsWith('/auth/')) {
        // Check if we have a refresh token before attempting refresh
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          console.log('No refresh token available, redirecting to login');
          // Clear any existing tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          // Dispatch event to notify components that user needs to login
          window.dispatchEvent(new CustomEvent('authRequired'));
          throw new Error('No refresh token available');
        }

        if (this.isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then(token => {
            return this.request(endpoint, {
              ...options,
              headers: {
                ...config.headers,
                'Authorization': `Bearer ${token}`,
              },
              _retry: true,
            });
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        this.isRefreshing = true;

        try {
          const newToken = await this.refreshToken();
          this.processQueue(null, newToken);
          
          // Retry the original request with new token
          return this.request(endpoint, {
            ...options,
            headers: {
              ...config.headers,
              'Authorization': `Bearer ${newToken}`,
            },
            _retry: true,
          });
        } catch (refreshError) {
          this.processQueue(refreshError, null);
          throw refreshError;
        } finally {
          this.isRefreshing = false;
        }
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          // Handle both direct message and nested error.message structure
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } catch (parseError) {
          // If JSON parsing fails, use the status text or default message
          errorMessage = response.statusText || `HTTP error! status: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return { success: true };
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Convenience methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Utility method to check authentication status
  getAuthStatus() {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    return {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      isAuthenticated: !!accessToken,
      canRefresh: !!refreshToken,
      tokens: {
        accessToken: accessToken ? 'present' : 'missing',
        refreshToken: refreshToken ? 'present' : 'missing'
      }
    };
  }

  // Utility method to clear all authentication data
  clearAuth() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userCurrencyPreference');
    console.log('All authentication data cleared');
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();
export default apiClient;
