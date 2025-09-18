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
    console.log('API Client - Token from localStorage:', token);
    const headers = {
      ...(token && { 'Authorization': `Bearer ${token}` }),
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

  // Refresh token
  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
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
    // Ensure endpoint starts with /api/ if it doesn't already
    const apiEndpoint = endpoint.startsWith('/api/') ? endpoint : `/api${endpoint}`;
    const url = `${this.baseURL}${apiEndpoint}`;
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
      console.log('API Client - Response data:', responseData);
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
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();
export default apiClient;
