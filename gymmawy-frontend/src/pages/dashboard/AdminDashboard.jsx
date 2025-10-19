import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load admin components
const AdminOverview = lazy(() => import('./admin').then(module => ({ default: module.AdminOverview })));
const AdminUsers = lazy(() => import('./admin').then(module => ({ default: module.AdminUsers })));
const AdminProducts = lazy(() => import('./admin').then(module => ({ default: module.AdminProducts })));
const AdminOrders = lazy(() => import('./admin').then(module => ({ default: module.AdminOrders })));
const AdminSubscriptions = lazy(() => import('./admin').then(module => ({ default: module.AdminSubscriptions })));
const AdminProgrammes = lazy(() => import('./admin').then(module => ({ default: module.AdminProgrammes })));
const AdminPayments = lazy(() => import('./admin').then(module => ({ default: module.AdminPayments })));
const AdminLeads = lazy(() => import('./admin').then(module => ({ default: module.AdminLeads })));
const AdminCoupons = lazy(() => import('./admin').then(module => ({ default: module.AdminCoupons })));
const AdminCMS = lazy(() => import('./admin').then(module => ({ default: module.AdminCMS })));
const AdminShipping = lazy(() => import('./admin').then(module => ({ default: module.AdminShipping })));
const AdminHomepagePopup = lazy(() => import('./admin/HomepagePopup'));
const Profile = lazy(() => import('./user').then(module => ({ default: module.Profile })));

const AdminDashboard = () => {
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
        <Route path="/" element={<AdminOverview />} />
        <Route path="/users" element={<AdminUsers />} />
        <Route path="/products" element={<AdminProducts />} />
        <Route path="/orders" element={<AdminOrders />} />
        <Route path="/subscriptions" element={<AdminSubscriptions />} />
        <Route path="/programmes" element={<AdminProgrammes />} />
        <Route path="/payments" element={<AdminPayments />} />
        <Route path="/leads" element={<AdminLeads />} />
        <Route path="/coupons" element={<AdminCoupons />} />
        <Route path="/cms" element={<AdminCMS />} />
        <Route path="/shipping" element={<AdminShipping />} />
        <Route path="/homepage-popup" element={<AdminHomepagePopup />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  );
};

export default AdminDashboard;
