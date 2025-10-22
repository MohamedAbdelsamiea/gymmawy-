import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../layouts/DashboardLayout';

// Lazy load dashboard components
const UserDashboard = lazy(() => import('../dashboard/UserDashboard'));
const AdminDashboard = lazy(() => import('../dashboard/AdminDashboard'));

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
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gymmawy-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/*" element={
            isAdmin ? <AdminDashboard /> : <UserDashboard />
          } />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
};

export default Dashboard;
