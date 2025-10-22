import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const RedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Get redirect parameters from URL
    const searchParams = new URLSearchParams(location.search);
    const redirectTo = searchParams.get('redirect');
    const section = searchParams.get('section');

    if (user) {
      // User is logged in, redirect to home page
      navigate('/');
    } else {
      // User not logged in, redirect to login with return URL
      const returnUrl = redirectTo || location.pathname + location.search;
      navigate(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [user, navigate, location]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gymmawy-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};

export default RedirectHandler;
