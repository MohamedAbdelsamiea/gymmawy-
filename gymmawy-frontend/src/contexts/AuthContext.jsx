import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import tokenManager from '../utils/tokenManager';

const AuthContext = createContext();

export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already authenticated on app load
    checkAuthStatus();
    
    // Listen for token refresh failures
    const handleTokenRefreshFailed = () => {
      console.log('Token refresh failed, clearing user state');
      setUser(null);
      setError('Session expired. Please log in again.');
      // Ensure all tokens are cleared
      authService.removeToken();
      authService.removeRefreshToken();
    };

    // Listen for auth required events from API client
    const handleAuthRequired = () => {
      console.log('Authentication required, clearing user state');
      setUser(null);
      setError('Please log in to continue.');
      authService.removeToken();
      authService.removeRefreshToken();
    };
    
    window.addEventListener('tokenRefreshFailed', handleTokenRefreshFailed);
    window.addEventListener('authRequired', handleAuthRequired);
    
    return () => {
      window.removeEventListener('tokenRefreshFailed', handleTokenRefreshFailed);
      window.removeEventListener('authRequired', handleAuthRequired);
      tokenManager.stopTokenRefresh();
    };
  }, []);

  const checkAuthStatus = async() => {
    try {
      // Validate token storage consistency first
      authService.validateTokenStorage();
      
      // Check if we have valid tokens
      if (!authService.hasValidTokens()) {
        console.log('No valid tokens found');
        setUser(null);
        tokenManager.stopTokenRefresh();
        return;
      }

      const token = authService.getToken();
      
      // Check if token needs refresh
      const refreshSuccess = await tokenManager.checkAndRefreshToken();
      
      // If refresh was needed but failed, clear user state
      if (refreshSuccess === false && tokenManager.isTokenExpired(token)) {
        console.log('Token refresh failed, clearing user state');
        authService.removeToken();
        authService.removeRefreshToken();
        setUser(null);
        tokenManager.stopTokenRefresh();
        return;
      }
      
      // Verify token and get user data
      const userData = await authService.getProfile();
      setUser(userData.user || userData);
      
      // Start automatic token refresh
      tokenManager.startTokenRefresh();
    } catch (error) {
      console.error('Auth check failed:', error);
      // Only remove token if it's actually invalid (401/403)
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized') || error.message.includes('Token refresh failed')) {
        console.log('Invalid token, clearing user state');
        authService.removeToken();
        authService.removeRefreshToken();
        setUser(null);
        tokenManager.stopTokenRefresh();
      } else {
        // For other errors (network, etc.), don't clear user state immediately
        // Just log the error and let the periodic checks handle it
        console.log('Auth check failed due to network error, will retry');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async(credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      
      if (response.accessToken) {
        authService.setToken(response.accessToken);
        if (response.refreshToken) {
          authService.setRefreshToken(response.refreshToken);
        }
        
        // Fetch complete user profile data after successful login
        let completeUserData = response.user || response;
        try {
          const userData = await authService.getProfile();
          completeUserData = userData.user || userData;
          setUser(completeUserData);
        } catch (profileError) {
          console.error('Failed to fetch user profile after login:', profileError);
          // Fallback to basic user data from login response
          setUser(response.user || response);
        }
        
        // Start automatic token refresh
        tokenManager.startTokenRefresh();
        
        return { success: true, user: completeUserData };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async(userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.register(userData);
      
      // Registration successful - user needs to verify email
      return { success: true, message: response.message || 'Registration successful. Please check your email to verify your account.' };
    } catch (error) {
      console.error('Registration error in AuthContext:', error);
      setError(error.message);
      return { success: false, error: error };
    } finally {
      setLoading(false);
    }
  };

  const logout = async() => {
    try {
      console.log('AuthContext: Starting logout process...');
      await authService.logout();
      console.log('AuthContext: Server logout completed');
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
    } finally {
      // Always clear all tokens and user state on logout
      console.log('AuthContext: Clearing tokens and user state...');
      authService.removeToken();
      authService.removeRefreshToken();
      setUser(null);
      setError(null);
      tokenManager.stopTokenRefresh();
      
      // Force a re-render by updating loading state briefly
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        console.log('AuthContext: Logout cleanup completed');
      }, 50);
    }
  };

  const updateProfile = async(profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      console.error('Update profile error in AuthContext:', error);
      setError(error.message);
      return { success: false, error: error };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const refreshAuth = async() => {
    await checkAuthStatus();
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
