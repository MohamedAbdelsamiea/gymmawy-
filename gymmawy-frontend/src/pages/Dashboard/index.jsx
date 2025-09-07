import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import UserDashboard from '../dashboard/UserDashboard';
import AdminDashboard from '../dashboard/AdminDashboard';

const Dashboard = () => {
  const { user, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gymmawy-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Determine which dashboard to show based on user role
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/*" element={
          isAdmin ? <AdminDashboard /> : <UserDashboard />
        } />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;
