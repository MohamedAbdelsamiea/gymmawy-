import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthCard, AuthButton, AuthLink } from '../../components/auth';
import authService from '../../services/authService';

const EmailVerification = () => {
  const { t, i18n } = useTranslation("auth");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const email = searchParams.get('email');

  const handleResendEmail = async() => {
    if (!email) {
      setError('Email address not found. Please try registering again.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await authService.resendVerificationEmail(email, i18n.language);
      setSuccess(true);
    } catch (error) {
      setError(error.message || t('emailVerification.errors.resendFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard 
      title={t('emailVerification.title')} 
      subtitle={t('emailVerification.subtitle')}
    >
      <div className="text-center space-y-6">
        {/* Email Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gymmawy-primary bg-opacity-10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gymmawy-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            {t('emailVerification.checkEmail')}
          </p>
          
          {email && (
            <p className="text-gymmawy-primary font-medium text-sm">
              {email}
            </p>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 text-sm">
              {t('emailVerification.success')}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Resend Button */}
        <AuthButton
          onClick={handleResendEmail}
          loading={loading}
          variant="outline"
          className="w-full"
        >
          {t('emailVerification.resendEmail')}
        </AuthButton>

        {/* Back to Login Link */}
        <div className="text-center">
          <AuthLink to="/auth/login">
            {t('emailVerification.backToLogin')}
          </AuthLink>
        </div>
      </div>
    </AuthCard>
  );
};

export default EmailVerification;
