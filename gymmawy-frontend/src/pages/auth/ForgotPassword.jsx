import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthCard, FloatingInput, AuthButton, AuthLink } from '../../components/auth';
import { isValidEmail } from '../../utils/validators';
import authService from '../../services/authService';

const ForgotPassword = () => {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = t('forgotPassword.errors.emailRequired');
    } else if (!isValidEmail(email)) {
      newErrors.email = t('forgotPassword.errors.invalidEmail');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (error) {
      setErrors({ 
        general: error.message || 'Failed to send reset email. Please try again.', 
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthCard 
        title={t('forgotPassword.title')} 
        subtitle="Check your email for reset instructions"
      >
        <div className="text-center space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-green-700 text-sm">
              If an account with this email exists, you will receive a password reset link shortly.
            </p>
          </div>

          <AuthLink to="/auth/login" className="block">
            {t('forgotPassword.backToLogin')}
          </AuthLink>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard 
      title={t('forgotPassword.title')} 
      subtitle={t('forgotPassword.subtitle')}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Email Input */}
        <FloatingInput
          label={t('forgotPassword.email')}
          type="email"
          name="email"
          value={email}
          onChange={handleInputChange}
          error={errors.email}
          required
        />

        {/* Submit Button */}
        <AuthButton
          type="submit"
          loading={loading}
          className="mt-8"
        >
          {t('forgotPassword.sendReset')}
        </AuthButton>

        {/* Back to Login Link */}
        <div className="text-center mt-6">
          <AuthLink to="/auth/login">
            {t('forgotPassword.backToLogin')}
          </AuthLink>
        </div>
      </form>
    </AuthCard>
  );
};

export default ForgotPassword;
