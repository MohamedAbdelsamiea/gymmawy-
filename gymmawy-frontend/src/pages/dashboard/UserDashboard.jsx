import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load user dashboard components
const UserDashboardMain = lazy(() => import('./user/Overview'));
const Profile = lazy(() => import('./user/Profile'));
const LoyaltyHistory = lazy(() => import('./user/LoyaltyHistory'));

const UserDashboard = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gymmawy-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <Routes>
        <Route path="/" element={<UserDashboardMain />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/loyalty-history" element={<LoyaltyHistory />} />
      </Routes>
    </Suspense>
  );
};

export default UserDashboard;
