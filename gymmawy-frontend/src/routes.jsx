import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import Programmes from './pages/Programmes';
import Store from './pages/Store';
import ShopAll from './pages/ShopAll';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/Cart';
import JoinUs from './pages/JoinUs';
import ContactUs from './pages/ContactUs';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Checkout from './pages/Checkout';


import { ProtectedRoute } from './components/auth';

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
  { path: '/auth/*', element: <MainLayout><Auth /></MainLayout> },

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
