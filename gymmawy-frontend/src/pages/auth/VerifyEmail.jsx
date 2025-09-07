import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthCard, AuthButton, AuthLink } from '../../components/auth';
import authService from '../../services/authService';

const VerifyEmail = () => {
  const { t } = useTranslation("auth");
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
      setError('Invalid verification link. Please check your email and try again.');
    }
  }, [token, email]);

  const handleVerifyEmail = async () => {
    if (!token || !email) {
      setError('Invalid verification link. Please check your email and try again.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await authService.verifyEmail(token, email);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
    } catch (error) {
      setError(error.message || 'Email verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError('Email address not found. Please try registering again.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await authService.resendVerificationEmail(email);
      setSuccess(true);
    } catch (error) {
      setError(error.message || 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard 
      title="Email Verification" 
      subtitle="Verify your email address"
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
              Verifying your email address...
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
              <p className="text-green-700 text-sm">
                Email verified successfully! Redirecting to login...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
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
                Resend Verification Email
              </AuthButton>
            )}
          </div>
        )}

        {/* Back to Login Link */}
        <div className="text-center">
          <AuthLink to="/auth/login">
            Back to Login
          </AuthLink>
        </div>
      </div>
    </AuthCard>
  );
};

export default VerifyEmail;
