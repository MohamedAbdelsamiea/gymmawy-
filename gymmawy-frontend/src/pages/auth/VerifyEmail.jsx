import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthCard, AuthButton, AuthLink } from '../../components/auth';
import authService from '../../services/authService';

const VerifyEmail = () => {
  const { t, i18n } = useTranslation("auth");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (token && email) {
      handleVerifyEmail();
    } else {
      setError(t('verifyEmail.errors.invalidLink'));
    }
  }, [token, email]);

  const handleVerifyEmail = async() => {
    if (!token || !email) {
      setError(t('verifyEmail.errors.invalidLink'));
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await authService.verifyEmail(token, email);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
    } catch (error) {
      // Handle different error scenarios
      if (error.message?.includes('already exists') || error.message?.includes('P2002')) {
        setError(t('verifyEmail.success.alreadyVerified'));
        // Still show success state for better UX
        setSuccess(true);
        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
      } else if (error.message?.includes('expired') || error.message?.includes('invalid')) {
        setError(t('verifyEmail.errors.expiredLink'));
      } else {
        setError(error.message || t('verifyEmail.errors.verificationFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async() => {
    if (!email) {
      setError(t('verifyEmail.errors.emailNotFound'));
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await authService.resendVerificationEmail(email, i18n.language);
      setSuccess(true);
    } catch (error) {
      setError(error.message || t('verifyEmail.errors.resendFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard 
      title={t('verifyEmail.title')} 
      subtitle={t('verifyEmail.subtitle')}
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

        {/* Loading State */}
        {loading && !success && (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              {t('verifyEmail.verifying')}
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gymmawy-primary"></div>
            </div>
          </div>
        )}

        {/* Success State */}
        {success && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-700 text-sm font-medium">
                  {error?.includes('already verified') ? 
                    t('verifyEmail.success.alreadyVerified') : 
                    t('verifyEmail.success.verified')
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State - only show if not in success state */}
        {error && !success && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            
            {email && (
              <AuthButton
                onClick={handleResendEmail}
                loading={loading}
                variant="outline"
                className="w-full"
              >
                {t('verifyEmail.resendEmail')}
              </AuthButton>
            )}
          </div>
        )}

        {/* Back to Login Link */}
        <div className="text-center">
          <AuthLink to="/auth/login">
            {t('verifyEmail.backToLogin')}
          </AuthLink>
        </div>
      </div>
    </AuthCard>
  );
};

export default VerifyEmail;
