import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { ProtectedRoute } from '../../components/auth';
import Coupons from './Coupons';
import Payments from './Payments';
import CMS from './CMS';

const Admin = () => {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-gray-100">
        <div className="flex">
          {/* Admin Sidebar */}
          <div className="w-64 bg-gray-800">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            </div>
            
            <nav className="mt-6">
              <Link
                to="/admin"
                className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <span>Dashboard</span>
              </Link>
              
              <Link
                to="/admin/users"
                className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <span>Users</span>
              </Link>
              
              <Link
                to="/admin/orders"
                className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <span>Orders</span>
              </Link>
              
              <Link
                to="/admin/products"
                className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <span>Products</span>
              </Link>
              
              <Link
                to="/admin/coupons"
                className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <span>Coupons</span>
              </Link>
              
              
              <Link
                to="/admin/payments"
                className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <span>Payments</span>
              </Link>
              
              <Link
                to="/admin/cms"
                className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <span>CMS</span>
              </Link>
              
              <Link
                to="/admin/analytics"
                className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <span>Analytics</span>
              </Link>
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 p-8">
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/users" element={<UsersManagement />} />
              <Route path="/orders" element={<OrdersManagement />} />
              <Route path="/products" element={<ProductsManagement />} />
              <Route path="/coupons" element={<Coupons />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/cms" element={<CMS />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

const AdminDashboard = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
        <p className="text-3xl font-bold text-blue-600">1,234</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900">Total Orders</h3>
        <p className="text-3xl font-bold text-green-600">567</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900">Revenue</h3>
        <p className="text-3xl font-bold text-purple-600">$45,678</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900">Products</h3>
        <p className="text-3xl font-bold text-orange-600">89</p>
      </div>
    </div>
  </div>
);

const UsersManagement = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900 mb-8">Users Management</h1>
    <p className="text-gray-600">User management interface will be implemented here.</p>
  </div>
);

const OrdersManagement = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900 mb-8">Orders Management</h1>
    <p className="text-gray-600">Order management interface will be implemented here.</p>
  </div>
);

const ProductsManagement = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900 mb-8">Products Management</h1>
    <p className="text-gray-600">Product management interface will be implemented here.</p>
  </div>
);

const Analytics = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics</h1>
    <p className="text-gray-600">Analytics dashboard will be implemented here.</p>
  </div>
);

export default Admin;
