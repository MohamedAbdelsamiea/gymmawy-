import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';
import MainLayout from './layouts/MainLayout';
import { ProtectedRoute } from './components/auth';

// Lazy load all page components
const Home = lazy(() => import('./pages/Home'));
const Programmes = lazy(() => import('./pages/Programmes'));
const Store = lazy(() => import('./pages/Store'));
const ShopAll = lazy(() => import('./pages/ShopAll'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CartPage = lazy(() => import('./pages/Cart'));
const JoinUs = lazy(() => import('./pages/JoinUs'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Rewards = lazy(() => import('./pages/Rewards'));
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess.jsx'));
const PaymentFailure = lazy(() => import('./pages/PaymentFailure.jsx'));
const PaymentCancel = lazy(() => import('./pages/PaymentCancel.jsx'));
const PaymobPaymentResult = lazy(() => import('./components/payment/PaymobPaymentResult.jsx'));

// Public routes with MainLayout
export const publicRoutes = [
  { path: '/', element: <MainLayout><Home /></MainLayout> },
  { path: '/programmes', element: <MainLayout><Programmes /></MainLayout> },
  { path: '/store', element: <MainLayout><Store /></MainLayout> },
  { path: '/shop-all', element: <MainLayout><ShopAll /></MainLayout> },
  { path: '/product/:id', element: <MainLayout><ProductPage /></MainLayout> },
  { path: '/cart', element: <MainLayout><CartPage /></MainLayout> },
  { path: '/join-us', element: <MainLayout><JoinUs /></MainLayout> },
  { path: '/contact', element: <MainLayout><ContactUs /></MainLayout> },
  { path: '/terms', element: <MainLayout><TermsAndConditions /></MainLayout> },
  { path: '/privacy', element: <MainLayout><PrivacyPolicy /></MainLayout> },
  { path: '/rewards', element: <MainLayout><Rewards /></MainLayout> },
  { path: '/auth/*', element: <MainLayout><Auth /></MainLayout> },
  { path: '/payment/success', element: <MainLayout><PaymentSuccess /></MainLayout> },
  { path: '/payment/failure', element: <MainLayout><PaymentFailure /></MainLayout> },
  { path: '/payment/cancel', element: <MainLayout><PaymentCancel /></MainLayout> },
  { path: '/payment/result', element: <MainLayout><PaymobPaymentResult /></MainLayout> },

];

// Protected routes (require authentication) with DashboardLayout
export const protectedRoutes = [
  { path: '/dashboard/*', element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
  { path: '/checkout', element: <ProtectedRoute><Checkout /></ProtectedRoute> },
];

// All routes combined
export const allRoutes = [
  ...publicRoutes,
  ...protectedRoutes,
];

// Route components for App.jsx
export const AppRoutes = () => (
  <Routes>
    {allRoutes.map((route, index) => (
      <Route key={index} path={route.path} element={route.element} />
    ))}
  </Routes>
);
