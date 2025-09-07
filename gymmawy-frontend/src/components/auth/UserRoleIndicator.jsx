import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Shield, LogOut } from 'lucide-react';

const UserRoleIndicator = () => {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center">
          <User className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-gray-600">Not logged in</span>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className={`border rounded-lg p-4 ${isAdmin ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isAdmin ? (
            <Shield className="h-5 w-5 text-red-600 mr-2" />
          ) : (
            <User className="h-5 w-5 text-blue-600 mr-2" />
          )}
          <div>
            <p className={`font-medium ${isAdmin ? 'text-red-800' : 'text-blue-800'}`}>
              {user?.firstName} {user?.lastName}
            </p>
            <p className={`text-sm ${isAdmin ? 'text-red-600' : 'text-blue-600'}`}>
              Role: {user?.role || 'user'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default UserRoleIndicator;
