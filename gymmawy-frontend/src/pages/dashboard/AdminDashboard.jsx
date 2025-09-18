import React from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  AdminOverview,
  AdminUsers,
  AdminProducts,
  AdminOrders,
  AdminSubscriptions,
  AdminProgrammes,
  AdminPayments,
  AdminLeads,
  AdminCoupons,
  AdminCMS,
  AdminShipping,
} from './admin';
import { Profile } from './user';

const AdminDashboard = () => {
  return (
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
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
};

export default AdminDashboard;
