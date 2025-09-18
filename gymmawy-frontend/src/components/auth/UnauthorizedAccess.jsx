import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, UserCheck, AlertTriangle, ArrowLeft } from 'lucide-react';

const UnauthorizedAccess = ({ 
  type = 'login', // 'login', 'admin', 'permission'
  title = 'Authentication Required',
  message = 'You need to be logged in to access this page.',
  showBackButton = true, 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'admin':
        return <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />;
      case 'permission':
        return <UserCheck className="h-16 w-16 text-yellow-400 mx-auto mb-4" />;
      default:
        return <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />;
    }
  };

  const getActions = () => {
    switch (type) {
      case 'admin':
        return (
          <div className="space-y-3">
            <Link
              to="/dashboard"
              className="w-full bg-gymmawy-primary text-white py-3 px-4 rounded-lg hover:bg-gymmawy-secondary transition-colors font-medium inline-block text-center"
            >
              Go to User Dashboard
            </Link>
            <Link
              to="/auth/login"
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium inline-block text-center"
            >
              Login as Admin
            </Link>
          </div>
        );
      case 'permission':
        return (
          <div className="space-y-3">
            <Link
              to="/dashboard"
              className="w-full bg-gymmawy-primary text-white py-3 px-4 rounded-lg hover:bg-gymmawy-secondary transition-colors font-medium inline-block text-center"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/contact"
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium inline-block text-center"
            >
              Contact Support
            </Link>
          </div>
        );
      default:
        return (
          <div className="space-y-3">
            <Link
              to="/auth/login"
              className="w-full bg-gymmawy-primary text-white py-3 px-4 rounded-lg hover:bg-gymmawy-secondary transition-colors font-medium inline-block text-center"
            >
              Login to Continue
            </Link>
            <Link
              to="/auth/register"
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium inline-block text-center"
            >
              Create Account
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          {getIcon()}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 mb-6">{message}</p>
        </div>
        
        {getActions()}
        
        {showBackButton && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              to="/"
              className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnauthorizedAccess;
