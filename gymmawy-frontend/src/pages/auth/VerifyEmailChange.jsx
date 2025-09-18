import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthCard, AuthButton, AuthLink } from '../../components/auth';
import authService from '../../services/authService';

const VerifyEmailChange = () => {
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
      handleVerifyEmailChange();
    } else {
      setError('Invalid verification link. Please check your email and try again.');
    }
  }, [token, email]);

  const handleVerifyEmailChange = async() => {
    if (!token || !email) {
      setError('Invalid verification link. Please check your email and try again.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await authService.verifyEmailChange(token, email);
      setSuccess(true);
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      if (error.message?.includes('expired') || error.message?.includes('invalid')) {
        setError('This verification link has expired or is invalid. Please request a new email change.');
      } else {
        setError(error.message || 'Email change verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard 
      title="Verify Email Change" 
      subtitle="Confirm your new email address"
    >
      <div className="space-y-6">
        {loading && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gymmawy-primary"></div>
            <p className="mt-2 text-gray-600">Verifying your email change...</p>
          </div>
        )}

        {success && (
          <div className="text-center space-y-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Email Changed Successfully!</h3>
              <p className="mt-2 text-sm text-gray-600">
                Your email address has been updated to <strong>{email}</strong>. 
                You will be redirected to your dashboard shortly.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center space-y-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Verification Failed</h3>
              <p className="mt-2 text-sm text-gray-600">{error}</p>
            </div>
            <AuthButton
              onClick={() => navigate('/dashboard/profile')}
              className="w-full"
            >
              Go to Profile Settings
            </AuthButton>
          </div>
        )}

        {!loading && !success && !error && (
          <div className="text-center">
            <p className="text-gray-600">Processing your email change verification...</p>
          </div>
        )}
      </div>
    </AuthCard>
  );
};

export default VerifyEmailChange;
