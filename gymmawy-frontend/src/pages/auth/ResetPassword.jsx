import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthCard, FloatingInput, AuthButton, AuthLink } from '../../components/auth';
import { 
  isValidPassword, 
  validatePassword, 
} from '../../utils/validators';
import { getValidationErrors, getFieldError, getGeneralErrorMessage } from '../../utils/errorUtils';
import authService from '../../services/authService';

const ResetPassword = () => {
  const { t } = useTranslation("auth");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [realTimeErrors, setRealTimeErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({});

  const token = searchParams.get('token');
  const email = searchParams.get('email');


  const validateField = (fieldName, value) => {
    let validation = { isValid: true, error: null };
    
    switch (fieldName) {
      case 'password':
        validation = validatePassword(value);
        setPasswordStrength(validation);
        break;
      case 'confirmPassword':
        if (value && formData.password !== value) {
          validation = { isValid: false, error: 'confirmPasswordMismatch' };
        }
        break;
      default:
        break;
    }
    
    setRealTimeErrors(prev => ({
      ...prev,
      [fieldName]: validation.isValid ? null : validation.error,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
    
    // Real-time validation
    validateField(name, value);
    
    // Re-validate confirm password when password changes
    if (name === 'password' && formData.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = t(`resetPassword.errors.${passwordValidation.error}`);
    }

    // Confirm Password
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = t('resetPassword.errors.confirmPasswordEmpty');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('resetPassword.errors.confirmPasswordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!token || !email) {
      setErrors({ 
        general: 'Invalid or missing reset token or email. Please request a new password reset.', 
      });
      return;
    }

    setLoading(true);
    
    try {
      await authService.resetPassword(token, email, formData.password);
      setSuccess(true);
    } catch (error) {
      console.error('Reset password error:', error);
      
      // Handle validation errors
      const validationErrs = getValidationErrors(error.response?.data || error);
      if (validationErrs.length > 0) {
        setValidationErrors(validationErrs);
        setErrors({});
      } else {
        // Handle general errors
        setErrors({ 
          general: getGeneralErrorMessage(error.response?.data || error) || 'Failed to reset password. Please try again or request a new reset link.', 
        });
        setValidationErrors([]);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthCard 
        title={t('resetPassword.title')} 
        subtitle={t('resetPassword.success')}
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
              {t('resetPassword.success')}
            </p>
          </div>

          <AuthButton
            onClick={() => navigate('/auth/login')}
            className="w-full"
          >
            {t('resetPassword.backToLogin')}
          </AuthButton>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard 
      title={t('resetPassword.title')} 
      subtitle={t('resetPassword.subtitle')}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-red-800 font-medium text-sm mb-2">Please fix the following errors:</h4>
            <ul className="text-red-600 text-sm space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="flex items-start">
                  <span className="font-medium mr-2">•</span>
                  <span>{error.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}


        {/* Password Input */}
        <FloatingInput
          label={t('resetPassword.password')}
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password || getFieldError(validationErrors, 'newPassword') || (realTimeErrors.password ? t(`resetPassword.errors.${realTimeErrors.password}`, t(`register.errors.${realTimeErrors.password}`, realTimeErrors.password)) : null)}
          required
        />

        {/* Confirm Password Input */}
        <FloatingInput
          label={t('resetPassword.confirmPassword')}
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          error={errors.confirmPassword || (realTimeErrors.confirmPassword ? t(`resetPassword.errors.${realTimeErrors.confirmPassword}`, t(`register.errors.${realTimeErrors.confirmPassword}`, realTimeErrors.confirmPassword)) : null)}
          required
        />

        {/* Password Match Indicator */}
        {formData.confirmPassword && formData.password === formData.confirmPassword && (
          <div className="text-green-600 text-sm flex items-center">
            <span className="mr-2">✓</span>
            {t('resetPassword.passwordsMatch', 'Passwords match')}
          </div>
        )}

        {/* Submit Button */}
        <AuthButton
          type="submit"
          loading={loading}
          className="mt-8"
        >
          {t('resetPassword.resetPassword')}
        </AuthButton>

        {/* Back to Login Link */}
        <div className="text-center mt-6">
          <AuthLink to="/auth/login">
            {t('resetPassword.backToLogin')}
          </AuthLink>
        </div>
      </form>
    </AuthCard>
  );
};

export default ResetPassword;
