import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UnauthorizedAccess from './UnauthorizedAccess';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAuthenticated, loading, refreshAuth } = useAuth();
  const location = useLocation();

  // Refresh auth when route changes to ensure we have the latest user data
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Route changed, current user:', user);
    }
  }, [location.pathname, isAuthenticated, user]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gymmawy-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login required page
  if (!isAuthenticated) {
    return (
      <UnauthorizedAccess 
        type="login"
        title="Authentication Required"
        message="You need to be logged in to access this page."
      />
    );
  }

  // If admin access is required but user is not admin
  if (requireAdmin) {
    if (user?.role !== 'ADMIN' && user?.role !== 'admin') {
      return (
        <UnauthorizedAccess 
          type="admin"
          title="Access Denied"
          message="You don't have admin privileges to access this page."
        />
      );
    }
  }

  // If authenticated and has proper permissions, render the protected content
  return children;
};

export default ProtectedRoute;
