import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { CurrencyProvider } from './contexts/CurrencyContext.jsx';
import { CartProvider } from './contexts/CartContext';
import { AppRoutes } from './routes';
import { ToastContainer } from './components/common/Toast';
import SlimCurrencySelector from './components/SlimCurrencySelector';
import ScrollToTop from './components/common/ScrollToTop';
import { useTranslation } from 'react-i18next';
import { useEffect, Suspense } from 'react';
import { useLanguageInit } from './hooks/useLanguageInit';

// Component to handle RTL logic
const RTLHandler = () => {
  const location = useLocation();
  const { i18n } = useTranslation();
  
  useEffect(() => {
    // Use requestAnimationFrame to prevent layout thrashing
    const updateDirection = () => {
      requestAnimationFrame(() => {
        // Check if current route is admin dashboard
        const isAdminDashboard = location.pathname.startsWith('/dashboard/admin');
        
        // Only apply RTL to non-admin dashboard routes
        if (!isAdminDashboard) {
          const isRTL = i18n.language === 'ar';
          document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
          document.documentElement.lang = i18n.language;
          
          // Add/remove RTL class to body for additional styling control
          if (isRTL) {
            document.body.classList.add('rtl-active');
            document.body.classList.remove('ltr-active');
          } else {
            document.body.classList.add('ltr-active');
            document.body.classList.remove('rtl-active');
          }
        } else {
          // Force LTR for admin dashboard
          document.documentElement.dir = 'ltr';
          document.documentElement.lang = 'en';
          document.body.classList.add('ltr-active');
          document.body.classList.remove('rtl-active');
        }
      });
    };
    
    updateDirection();
  }, [i18n.language, location.pathname]);
  
  // Load currency namespace
  useEffect(() => {
    const loadCurrencyNamespace = async () => {
      try {
        await i18n.loadNamespaces('currency');
        console.log('✅ Currency namespace loaded in RTLHandler');
      } catch (error) {
        console.error('❌ Failed to load currency namespace in RTLHandler:', error);
      }
    };
    loadCurrencyNamespace();
  }, [i18n]);
  
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
  const { ready } = useTranslation();
  const isLanguageInitialized = useLanguageInit();

  // Don't render until i18n is ready and language is initialized
  if (!ready || !isLanguageInitialized) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <ToastProvider>
              <Router>
                <ScrollToTop />
                <RTLHandler />
                <AppRoutes />
                <SlimCurrencySelector />
                <ToastContainer />
              </Router>
            </ToastProvider>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </Suspense>
  );
}

export default App;
