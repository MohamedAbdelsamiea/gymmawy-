import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthButton } from '../../components/auth';

const DashboardDemo = () => {
  const navigate = useNavigate();

  const dashboardFeatures = [
    {
      title: 'Admin Dashboard',
      description: 'Complete admin panel with analytics, user management, and content control',
      features: [
        '📊 Analytics & KPIs with charts',
        '👥 User & subscription management',
        '🛍️ Store & order management',
        '📝 Content management system',
        '🎁 Loyalty points administration',
        '📈 Lead tracking & conversion',
      ],
      path: '/dashboard/admin',
      color: 'from-purple-500 to-indigo-600',
    },
    {
      title: 'User Dashboard',
      description: 'Personal dashboard for members with subscription tracking and rewards',
      features: [
        '📋 Personal overview & stats',
        '🛒 Purchase history & tracking',
        '🎁 Loyalty points & rewards',
        '📦 Order tracking with timeline',
        '💳 Subscription management',
        '📊 Progress tracking',
      ],
      path: '/dashboard',
      color: 'from-blue-500 to-cyan-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gymmawy-primary mb-4">
            Gymmawy Dashboard System
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Complete dashboard solution with admin and user interfaces, built with modern design and full functionality
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {dashboardFeatures.map((dashboard, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${dashboard.color}`}></div>
              
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {dashboard.title}
                </h2>
                <p className="text-gray-600 mb-6">
                  {dashboard.description}
                </p>
                
                <div className="space-y-3 mb-8">
                  {dashboard.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center text-sm text-gray-700">
                      <span className="mr-3">{feature.split(' ')[0]}</span>
                      <span>{feature.substring(feature.indexOf(' ') + 1)}</span>
                    </div>
                  ))}
                </div>
                
                <AuthButton
                  onClick={() => navigate(dashboard.path)}
                  className="w-full"
                >
                  Explore {dashboard.title}
                </AuthButton>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Dashboard Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gymmawy-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Responsive Design</h3>
              <p className="text-sm text-gray-600">Mobile-first design that works perfectly on all devices</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gymmawy-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Gymmawy Theme</h3>
              <p className="text-sm text-gray-600">Consistent branding with your color palette and design system</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gymmawy-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌐</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">RTL Support</h3>
              <p className="text-sm text-gray-600">Full Arabic language support with proper text direction</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gymmawy-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Analytics & Charts</h3>
              <p className="text-sm text-gray-600">Interactive charts and analytics using Recharts library</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gymmawy-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Search & Filter</h3>
              <p className="text-sm text-gray-600">Advanced search and filtering capabilities for all data tables</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gymmawy-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📤</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Export Functionality</h3>
              <p className="text-sm text-gray-600">Export data to Excel and other formats for reporting</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <AuthButton
            onClick={() => navigate('/')}
            variant="outline"
            className="px-8"
          >
            Back to Home
          </AuthButton>
        </div>
      </div>
    </div>
  );
};

export default DashboardDemo;
