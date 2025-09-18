import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { CurrencyProvider } from './contexts/CurrencyContext.jsx';
import { AppRoutes } from './routes';
import { ToastContainer } from './components/common/Toast';
import i18n from './i18n/i18n';
import { useTranslation } from 'react-i18next';
import { useEffect, Suspense } from 'react';
import { useLanguageInit } from './hooks/useLanguageInit';
import Cookies from 'js-cookie';

// Component to handle RTL logic
const RTLHandler = () => {
  const location = useLocation();
  const { i18n } = useTranslation();
  
  useEffect(() => {
    // Check if current route is admin dashboard
    const isAdminDashboard = location.pathname.startsWith('/dashboard/admin');
    
    // Only apply RTL to non-admin dashboard routes
    if (!isAdminDashboard) {
      document.documentElement.dir = i18n.dir();
    } else {
      // Force LTR for admin dashboard
      document.documentElement.dir = 'ltr';
    }
  }, [i18n.language, location.pathname]);
  
  return null;
};

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  const { t, ready } = useTranslation();
  const isLanguageInitialized = useLanguageInit();

  // Don't render until i18n is ready and language is initialized
  if (!ready || !isLanguageInitialized) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthProvider>
        <CurrencyProvider>
          <ToastProvider>
            <Router>
              <RTLHandler />
              <AppRoutes />
              <ToastContainer />
            </Router>
          </ToastProvider>
        </CurrencyProvider>
      </AuthProvider>
    </Suspense>
  );
}

export default App;
