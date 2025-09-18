import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useAsset } from '../hooks/useAsset';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Search,
  CreditCard,
  Truck,
  Video,
  Percent,
  UserCheck,
  Play,
  Home
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { t } = useTranslation("dashboard");
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Automatically determine user type based on role
  const userType = (user?.role === 'ADMIN' || user?.role === 'admin') ? 'admin' : 'user';
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  const logo = "/assets/common/logo.webp";

  // Navigation items based on user type
  const getNavigationItems = () => {
    if (userType === 'admin') {
      return [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
        { path: '/dashboard/users', icon: Users, label: 'Users' },
        { path: '/dashboard/products', icon: Package, label: 'Products' },
        { path: '/dashboard/orders', icon: ShoppingBag, label: 'Orders' },
        { path: '/dashboard/subscriptions', icon: UserCheck, label: 'Subscriptions' },
        { path: '/dashboard/programmes', icon: Play, label: 'Programmes' },
        { path: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
        { path: '/dashboard/leads', icon: Users, label: 'Leads' },
        { path: '/dashboard/coupons', icon: Percent, label: 'Coupons' },
        { path: '/dashboard/cms', icon: Video, label: 'CMS' },
        { path: '/dashboard/shipping', icon: Truck, label: 'Shipping' },
      ];
    } else {
      return [
        { path: '/dashboard', icon: ShoppingBag, label: t('user.purchaseHistory.title') }
      ];
    }
  };

  const navigationItems = getNavigationItems();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const isActive = (path) => {
    if (path === '/dashboard' || path === '/dashboard/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex ${userType === 'admin' ? 'admin-dashboard' : ''}`}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0 lg:z-auto lg:flex-shrink-0 lg:h-screen
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200 relative">
          <img 
            src={logo} 
            alt="Gymmawy" 
            className="h-8 w-auto filter brightness-0 contrast-200" 
          />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute right-4 p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                    ${isActive(item.path)
                      ? 'bg-gymmawy-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>


      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navbar */}
        <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Page title */}
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">
                {navigationItems.find(item => isActive(item.path))?.label || t('common.dashboard')}
              </h1>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Search - Only for admin users */}
              {userType === 'admin' && (
                <div className="hidden md:block">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('common.search')}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Notifications - Only for admin users */}
              {userType === 'admin' && (
                <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>
              )}

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 p-2 text-sm rounded-lg hover:bg-gray-100"
                >
                  <div className="h-8 w-8 rounded-full bg-gymmawy-primary flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.firstName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="hidden md:block text-gray-700">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {/* Dropdown menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      to="/"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <Home className="inline h-4 w-4 mr-2" />
                      {t('common.backToWebsite')}
                    </Link>
                    <Link
                      to="/dashboard/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <UserCheck className="inline h-4 w-4 mr-2" />
                      {t('common.profileSettings')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="inline h-4 w-4 mr-2" />
{t('common.signOut')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
