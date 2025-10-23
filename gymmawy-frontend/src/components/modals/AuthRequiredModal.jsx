import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

const AuthRequiredModal = ({ isOpen, onClose, title, description }) => {
  const { t } = useTranslation('rewards');
  const navigate = useNavigate();
  const { isArabic } = useLanguage();

  const handleLogin = () => {
    navigate('/auth/login');
    onClose();
  };

  const handleSignup = () => {
    navigate('/auth/register');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-[#190143]">
            {title || t('loginRequired.title')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-8">
          {description || t('loginRequired.description')}
        </p>
        
        <div className="space-y-4">
          <button
            onClick={handleLogin}
            className="w-full bg-[#190143] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#2a0a5c] transition-colors duration-300"
          >
            {t('loginRequired.login')}
          </button>
          
          <button
            onClick={handleSignup}
            className="w-full bg-transparent border-2 border-[#190143] text-[#190143] py-3 px-6 rounded-lg font-semibold hover:bg-[#190143] hover:text-white transition-colors duration-300"
          >
            {t('loginRequired.signup')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthRequiredModal;
