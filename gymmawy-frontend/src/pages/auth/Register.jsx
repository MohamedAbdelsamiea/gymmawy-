import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthCard, FloatingInput, AuthButton, AuthLink } from '../../components/auth';
import CountryCodeSelector from '../../components/auth/CountryCodeSelector';
import { isValidEmail, isValidPassword, isValidPhone, isValidName } from '../../utils/validators';
import { getValidationErrors, getFieldError, getGeneralErrorMessage } from '../../utils/errorUtils';

const Register = () => {
  const { t } = useTranslation("auth");
  const { register, loading, error, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+20', // Default to Egypt
    phone: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
    // Address fields
    building: '',
    street: '',
    city: '',
    country: 'Egypt', // Default to Egypt
    postcode: ''
  });

  const [errors, setErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Redirect authenticated users to home page
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

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
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleCountryCodeChange = (countryCode) => {
    setFormData(prev => ({
      ...prev,
      countryCode
    }));
    
    // Clear phone error when country code changes
    if (errors.phone) {
      setErrors(prev => ({
        ...prev,
        phone: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // First Name
    if (!formData.firstName.trim()) {
      newErrors.firstName = t('register.errors.firstNameRequired');
    } else if (!isValidName(formData.firstName)) {
      newErrors.firstName = 'First name must be 2-50 characters';
    }

    // Last Name
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('register.errors.lastNameRequired');
    } else if (!isValidName(formData.lastName)) {
      newErrors.lastName = 'Last name must be 2-50 characters';
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = t('register.errors.emailRequired');
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = t('register.errors.invalidEmail');
    }

    // Phone
    if (!formData.phone.trim()) {
      newErrors.phone = t('register.errors.phoneRequired');
    } else {
      const fullPhone = formData.countryCode + formData.phone.trim();
      if (!isValidPhone(fullPhone)) {
        newErrors.phone = t('register.errors.invalidPhone');
      }
    }

    // Birth Date (optional but validate if provided)
    if (formData.birthDate && formData.birthDate.trim()) {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13) {
        newErrors.birthDate = 'You must be at least 13 years old';
      } else if (age > 120) {
        newErrors.birthDate = 'Please enter a valid birth date';
      }
    }

    // Address fields (optional but validate if provided)
    if (formData.building && formData.building.trim().length < 2) {
      newErrors.building = 'Building must be at least 2 characters';
    }
    
    if (formData.street && formData.street.trim().length < 5) {
      newErrors.street = 'Street must be at least 5 characters';
    }
    
    if (formData.city && formData.city.trim().length < 2) {
      newErrors.city = 'City must be at least 2 characters';
    }
    
    if (formData.postcode && formData.postcode.trim().length < 3) {
      newErrors.postcode = 'Postcode must be at least 3 characters';
    }

    // Password
    if (!formData.password.trim()) {
      newErrors.password = t('register.errors.passwordRequired');
    } else if (!isValidPassword(formData.password)) {
      newErrors.password = t('register.errors.weakPassword');
    }

    // Confirm Password
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = t('register.errors.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('register.errors.passwordMismatch');
    }

    // Terms Agreement
    if (!agreeTerms) {
      newErrors.terms = t('register.errors.termsRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      mobileNumber: formData.countryCode + formData.phone,
      password: formData.password,
      birthDate: formData.birthDate || "",
      building: formData.building || "",
      street: formData.street || "",
      city: formData.city || "",
      country: formData.country || "",
      postcode: formData.postcode || ""
    };

    const result = await register(userData);
    
    if (result.success) {
      // Redirect to email verification page with email parameter
      navigate(`/auth/email-verification?email=${encodeURIComponent(formData.email)}`);
    } else {
      // Handle validation errors
      const validationErrs = getValidationErrors(result.error?.response?.data || result.error);
      
      if (validationErrs.length > 0) {
        setValidationErrors(validationErrs);
        setErrors({});
      } else {
        // Handle general errors
        const errorMessage = result.error?.message || result.error?.response?.data?.error?.message || 'Registration failed. Please try again.';
        setErrors({ 
          general: errorMessage
        });
        setValidationErrors([]);
      }
    }
  };

  return (
    <AuthCard 
      title={t('register.title')} 
      subtitle={t('register.subtitle')}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Message */}
        {errors.general && (
          <div className={`border rounded-lg p-4 ${
            errors.general.includes('successful') || errors.general.includes('success') 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-sm ${
              errors.general.includes('successful') || errors.general.includes('success')
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>{errors.general}</p>
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

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FloatingInput
            label={t('register.firstName')}
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            error={errors.firstName || getFieldError(validationErrors, 'firstName')}
            required
          />
          <FloatingInput
            label={t('register.lastName')}
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            error={errors.lastName || getFieldError(validationErrors, 'lastName')}
            required
          />
        </div>

        {/* Email Input */}
        <FloatingInput
          label={t('register.email')}
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email || getFieldError(validationErrors, 'email')}
          required
        />

        {/* Phone Input with Country Code */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
            {t('register.phone')} <span className="text-red-500">*</span>
          </label>
          <div className="flex">
            <CountryCodeSelector
              value={formData.countryCode}
              onChange={handleCountryCodeChange}
              className="flex-shrink-0"
            />
            <div className="flex-1">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                className={`
                  w-full px-3 py-2 border-b-2 bg-transparent text-lg md:text-xl 
                  focus:outline-none transition-colors duration-200
                  ltr:text-left rtl:text-right rounded-r-md
                  ${errors.phone 
                    ? 'border-red-500 text-red-500' 
                    : 'border-gray-300 text-gray-700 focus:border-gymmawy-primary'
                  }
                `}
                required
              />
            </div>
          </div>
          {errors.phone && (
            <p className="text-xs text-red-500 mt-2 ltr:text-left rtl:text-right">
              {errors.phone}
            </p>
          )}
        </div>

        {/* Birth Date */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
            Birth Date
          </label>
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleInputChange}
            className={`
              w-full border-b-2 bg-transparent pt-2 pb-4 text-lg md:text-xl 
              focus:outline-none transition-colors duration-200
              ltr:text-left rtl:text-right
              ${errors.birthDate 
                ? 'border-red-500 text-red-500' 
                : 'border-gray-300 text-gray-700 focus:border-gymmawy-primary'
              }
            `}
          />
          {errors.birthDate && (
            <p className="text-xs text-red-500 mt-2 ltr:text-left rtl:text-right">
              {errors.birthDate}
            </p>
          )}
        </div>

        {/* Address Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
            Address Information (Optional)
          </h3>
          
          {/* Building and Street */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingInput
              label="Building"
              type="text"
              name="building"
              value={formData.building}
              onChange={handleInputChange}
              error={errors.building}
            />
            <FloatingInput
              label="Street"
              type="text"
              name="street"
              value={formData.street}
              onChange={handleInputChange}
              error={errors.street}
            />
          </div>

          {/* City, Country, and Postcode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FloatingInput
              label="City"
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              error={errors.city}
            />
            <FloatingInput
              label="Country"
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              error={errors.country}
            />
            <FloatingInput
              label="Postcode"
              type="text"
              name="postcode"
              value={formData.postcode}
              onChange={handleInputChange}
              error={errors.postcode}
            />
          </div>
        </div>

        {/* Password Fields */}
        <FloatingInput
          label={t('register.password')}
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password || getFieldError(validationErrors, 'password')}
          required
        />

        <FloatingInput
          label={t('register.confirmPassword')}
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          error={errors.confirmPassword}
          required
        />

        {/* Terms Agreement */}
        <div className="flex items-start">
          <input
            type="checkbox"
            id="agreeTerms"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300 rounded mt-1"
          />
          <label htmlFor="agreeTerms" className="ltr:ml-2 rtl:mr-2 text-sm text-gray-600">
            {t('register.agreeTerms')}
          </label>
        </div>
        {errors.terms && (
          <p className="text-red-500 text-xs mt-1">{errors.terms}</p>
        )}

        {/* Submit Button */}
        <AuthButton
          type="submit"
          loading={loading}
          className="mt-8"
        >
          {t('register.createAccount')}
        </AuthButton>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            {t('register.haveAccount')}{' '}
            <AuthLink to="/auth/login">
              {t('register.signIn')}
            </AuthLink>
          </p>
        </div>
      </form>
    </AuthCard>
  );
};

export default Register;
