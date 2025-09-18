import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UserDashboardMain from './user/Overview';
import Profile from './user/Profile';
import LoyaltyHistory from './user/LoyaltyHistory';

const UserDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<UserDashboardMain />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/loyalty-history" element={<LoyaltyHistory />} />
    </Routes>
  );
};

export default UserDashboard;
