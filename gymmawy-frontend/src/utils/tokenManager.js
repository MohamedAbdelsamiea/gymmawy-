import { jwtDecode } from 'jwt-decode';
import authService from '../services/authService';

class TokenManager {
  constructor() {
    this.refreshTimer = null;
    this.refreshThreshold = 5 * 60 * 1000; // Refresh 5 minutes before expiration
  }

  // Check if token is expired or will expire soon
  isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      const expirationTime = decoded.exp;
      
      // Check if token expires within the refresh threshold
      return (expirationTime - currentTime) < (this.refreshThreshold / 1000);
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  }

  // Get time until token expires (in milliseconds)
  getTimeUntilExpiration(token) {
    if (!token) return 0;
    
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
    
    const token = authService.getToken();
    if (!token) return;

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

  // Stop automatic token refresh
  stopTokenRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Refresh token
  async refreshToken() {
    try {
      console.log('Refreshing token...');
      const newToken = await authService.refreshToken();
      
      if (newToken) {
        console.log('Token refreshed successfully');
        // Restart the refresh cycle with the new token
        this.startTokenRefresh();
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, clear tokens and redirect to login
      authService.removeToken();
      authService.removeRefreshToken();
      
      // Dispatch a custom event to notify the app
      window.dispatchEvent(new CustomEvent('tokenRefreshFailed'));
    }
  }

  // Check if token needs refresh and refresh if necessary
  async checkAndRefreshToken() {
    const token = authService.getToken();
    
    if (!token) return false;
    
    if (this.isTokenExpired(token)) {
      await this.refreshToken();
      return true;
    }
    
    return false;
  }
}

// Create and export a singleton instance
const tokenManager = new TokenManager();
export default tokenManager;
