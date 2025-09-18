import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthButton } from './AuthButton';

const AuthDemo = () => {
  const navigate = useNavigate();

  const authPages = [
    { path: '/auth/login', label: 'Login Page', description: 'User sign-in with email and password' },
    { path: '/auth/register', label: 'Register Page', description: 'New user registration form' },
    { path: '/auth/forgot-password', label: 'Forgot Password', description: 'Password reset request' },
    { path: '/auth/reset-password?token=demo', label: 'Reset Password', description: 'New password setup' },
    { path: '/auth/email-verification?email=demo@example.com', label: 'Email Verification', description: 'Email verification page' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gymmawy-primary mb-4">
            Gymmawy Authentication Pages
          </h1>
          <p className="text-gray-600 text-lg">
            Complete authentication system with modern design and full functionality
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {authPages.map((page, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-semibold text-gymmawy-primary mb-2">
                {page.label}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {page.description}
              </p>
              <AuthButton
                onClick={() => navigate(page.path)}
                variant="outline"
                className="w-full"
              >
                View Page
              </AuthButton>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gymmawy-primary mb-4">
            Features Included
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Design & UI</h3>
              <ul className="space-y-2 text-gray-600">
                <li>✅ Gymmawy theme integration</li>
                <li>✅ Responsive design</li>
                <li>✅ RTL support for Arabic</li>
                <li>✅ Floating label inputs</li>
                <li>✅ Modern card-based layout</li>
                <li>✅ Loading states & animations</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Functionality</h3>
              <ul className="space-y-2 text-gray-600">
                <li>✅ Form validation</li>
                <li>✅ Error handling</li>
                <li>✅ Success messages</li>
                <li>✅ API integration</li>
                <li>✅ Multilingual support</li>
                <li>✅ Navigation between pages</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <AuthButton
            onClick={() => navigate('/')}
            variant="primary"
            className="px-8"
          >
            Back to Home
          </AuthButton>
        </div>
      </div>
    </div>
  );
};

export default AuthDemo;
