import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const useAuthRequired = () => {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const requireAuth = (callback) => {
    if (isAuthenticated) {
      callback();
    } else {
      setShowAuthModal(true);
    }
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  return {
    isAuthenticated,
    showAuthModal,
    requireAuth,
    closeAuthModal
  };
};

export default useAuthRequired;
