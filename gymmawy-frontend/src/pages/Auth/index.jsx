import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login, Register, ForgotPassword, ResetPassword, EmailVerification, VerifyEmail, VerifyEmailChange } from '../auth';

const Auth = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/email-verification" element={<EmailVerification />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/verify-email-change" element={<VerifyEmailChange />} />
    </Routes>
  );
};

export default Auth;
