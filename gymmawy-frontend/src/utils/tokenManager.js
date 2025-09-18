import { jwtDecode } from 'jwt-decode';
import authService from '../services/authService';

class TokenManager {
  constructor() {
    this.refreshTimer = null;
    this.periodicCheckTimer = null;
    this.refreshThreshold = 10 * 60 * 1000; // Refresh 10 minutes before expiration
    this.periodicCheckInterval = 5 * 60 * 1000; // Check every 5 minutes
    this.isRefreshing = false; // Prevent multiple simultaneous refresh attempts
  }

  // Check if token is expired or will expire soon
  isTokenExpired(token) {
    if (!token) {
      return true;
    }
    
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      const expirationTime = decoded.exp;
      
      // Check if token is already expired
      if (expirationTime <= currentTime) {
        console.log(`Token is already expired: current=${currentTime}, expires=${expirationTime}`);
        return true;
      }
      
      // Check if token expires within the refresh threshold
      const timeUntilExpiration = expirationTime - currentTime;
      const isExpired = timeUntilExpiration < (this.refreshThreshold / 1000);
      console.log(`Token expiration check: current=${currentTime}, expires=${expirationTime}, timeUntilExpiration=${timeUntilExpiration}s, isExpired=${isExpired}`);
      return isExpired;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  }

  // Get time until token expires (in milliseconds)
  getTimeUntilExpiration(token) {
    if (!token) {
return 0;
}
    
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      const expirationTime = decoded.exp;
      
      return Math.max(0, (expirationTime - currentTime) * 1000);
    } catch (error) {
      console.error('Error decoding token:', error);
      return 0;
    }
  }

  // Start automatic token refresh
  startTokenRefresh() {
    this.stopTokenRefresh(); // Clear any existing timer
    this.startPeriodicCheck(); // Start periodic checks
    
    const token = authService.getToken();
    if (!token) {
return;
}

    const timeUntilExpiration = this.getTimeUntilExpiration(token);
    
    if (timeUntilExpiration <= this.refreshThreshold) {
      // Token expires soon, refresh immediately
      this.refreshToken();
    } else {
      // Set timer to refresh before expiration
      const refreshTime = timeUntilExpiration - this.refreshThreshold;
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
      
      console.log(`Token refresh scheduled in ${Math.round(refreshTime / 1000)} seconds`);
    }
  }

  // Start periodic token checks
  startPeriodicCheck() {
    this.stopPeriodicCheck(); // Clear any existing timer
    
    this.periodicCheckTimer = setInterval(async() => {
      await this.checkTokenAndRefresh();
    }, this.periodicCheckInterval);
    
    // Listen for visibility changes to refresh token when user comes back
    this.setupVisibilityListener();
    
    console.log(`Periodic token check started (every ${this.periodicCheckInterval / 1000} seconds)`);
  }

  // Setup visibility change listener
  setupVisibilityListener() {
    if (typeof window !== 'undefined') {
      const handleVisibilityChange = async() => {
        if (!document.hidden) {
          console.log('Page became visible, checking token...');
          await this.checkTokenAndRefresh();
        }
      };
      
      const handleFocus = async() => {
        console.log('Window focused, checking token...');
        await this.checkTokenAndRefresh();
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      
      // Store the handlers for cleanup
      this.visibilityHandler = handleVisibilityChange;
      this.focusHandler = handleFocus;
    }
  }

  // Remove visibility change listener
  removeVisibilityListener() {
    if (typeof window !== 'undefined') {
      if (this.visibilityHandler) {
        document.removeEventListener('visibilitychange', this.visibilityHandler);
        this.visibilityHandler = null;
      }
      if (this.focusHandler) {
        window.removeEventListener('focus', this.focusHandler);
        this.focusHandler = null;
      }
    }
  }

  // Stop periodic token checks
  stopPeriodicCheck() {
    if (this.periodicCheckTimer) {
      clearInterval(this.periodicCheckTimer);
      this.periodicCheckTimer = null;
    }
  }

  // Check if token is about to expire and refresh if needed
  async checkTokenAndRefresh() {
    const token = authService.getToken();
    if (!token) {
return false;
}

    if (this.isTokenExpired(token)) {
      console.log('Token is expired or about to expire, refreshing...');
      return await this.refreshToken();
    }
    return true;
  }

  // Stop automatic token refresh
  stopTokenRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.stopPeriodicCheck();
    this.removeVisibilityListener();
  }

  // Refresh token
  async refreshToken() {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      console.log('Token refresh already in progress, skipping...');
      return false;
    }

    try {
      this.isRefreshing = true;
      
      // Check if refresh token exists before attempting refresh
      if (!authService.hasRefreshToken()) {
        console.log('No refresh token available');
        authService.removeToken();
        authService.removeRefreshToken();
        window.dispatchEvent(new CustomEvent('tokenRefreshFailed'));
        return false;
      }

      console.log('Refreshing token...');
      const response = await authService.refreshToken();
      
      if (response && response.accessToken) {
        console.log('Token refreshed successfully');
        // Restart the refresh cycle with the new token
        this.startTokenRefresh();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // Only clear tokens and dispatch event if it's a real auth failure
      // Don't clear tokens for network errors or temporary issues
      if (error.message.includes('401') || error.message.includes('403') || 
          error.message.includes('Token refresh failed') || 
          error.message.includes('No refresh token available') ||
          error.message.includes('Invalid or expired refresh token') ||
          error.message.includes('Refresh token required')) {
        console.log('Authentication failed, clearing tokens');
        authService.removeToken();
        authService.removeRefreshToken();
        window.dispatchEvent(new CustomEvent('tokenRefreshFailed'));
      } else {
        console.log('Token refresh failed due to network error, will retry later');
        // Schedule a retry in 30 seconds for network errors
        setTimeout(() => {
          this.startTokenRefresh();
        }, 30000);
      }
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Check if token needs refresh and refresh if necessary
  async checkAndRefreshToken() {
    const token = authService.getToken();
    
    if (!token) {
return false;
}
    
    if (this.isTokenExpired(token)) {
      const refreshSuccess = await this.refreshToken();
      return refreshSuccess;
    }
    
    return false;
  }

  // Force refresh token (for debugging)
  async forceRefreshToken() {
    console.log('Force refreshing token...');
    return await this.refreshToken();
  }
}

// Create and export a singleton instance
const tokenManager = new TokenManager();

// Expose token manager for debugging in browser console
if (typeof window !== 'undefined') {
  window.tokenManager = tokenManager;
  // Import authService dynamically for debugging
  import('../services/authService.js').then(module => {
    window.authService = module.default;
  });
}

export default tokenManager;
