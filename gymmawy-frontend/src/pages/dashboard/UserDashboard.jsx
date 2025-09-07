import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PurchaseHistory from './user/PurchaseHistory';

const UserDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<PurchaseHistory />} />
      <Route path="/orders" element={<PurchaseHistory />} />
      <Route path="/subscriptions" element={<PurchaseHistory />} />
    </Routes>
  );
};

export default UserDashboard;
