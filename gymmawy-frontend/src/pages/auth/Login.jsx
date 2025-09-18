import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthCard, FloatingInput, AuthButton, AuthLink } from '../../components/auth';
import { isValidEmail } from '../../utils/validators';
import authService from '../../services/authService';

const Login = () => {
  const { t } = useTranslation("auth");
  const { login, loading, error, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect authenticated users to home page
  useEffect(() => {
    if (isAuthenticated && user) {
      const returnUrl = searchParams.get('returnUrl');
      if (returnUrl) {
        navigate(returnUrl);
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate, searchParams]);

  // Show loading while checking authentication
  if (loading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gymmawy-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = t('login.errors.emailRequired');
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = t('login.errors.invalidEmail');
    }

    if (!formData.password.trim()) {
      newErrors.password = t('login.errors.passwordRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await login({
      email: formData.email,
      password: formData.password,
    });
    
    if (result.success) {
      // Redirect to returnUrl if provided, otherwise to home page
      const returnUrl = searchParams.get('returnUrl');
      if (returnUrl) {
        navigate(returnUrl);
      } else {
        // Redirect to home page after successful login
        navigate('/');
      }
    } else {
      setErrors({ 
        general: result.error || t('login.errors.invalidCredentials'), 
      });
    }
  };


  return (
    <AuthCard 
      title={t('login.title')} 
      subtitle={t('login.subtitle')}
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
          label={t('login.email')}
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
          required
        />

        {/* Password Input */}
        <FloatingInput
          label={t('login.password')}
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          required
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300 rounded"
            />
            <span className="ltr:ml-2 rtl:mr-2 text-sm text-gray-600">
              {t('login.rememberMe')}
            </span>
          </label>

          <AuthLink to="/auth/forgot-password" variant="default">
            {t('login.forgotPassword')}
          </AuthLink>
        </div>

        {/* Submit Button */}
        <AuthButton
          type="submit"
          loading={loading}
          className="mt-8"
        >
          {t('login.signIn')}
        </AuthButton>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            {t('login.noAccount')}{' '}
            <AuthLink to="/auth/register">
              {t('login.signUp')}
            </AuthLink>
          </p>
        </div>
      </form>
    </AuthCard>
  );
};

export default Login;
