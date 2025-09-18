import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthCard, FloatingInput, AuthButton, AuthLink } from '../../components/auth';
import CountryCodeSelector from '../../components/auth/CountryCodeSelector';
import { 
  isValidEmail, 
  isValidPassword, 
  isValidPhone, 
  isValidName,
  validateName,
  validateEmail,
  validatePhone,
  validatePassword,
  validateBirthDate,
} from '../../utils/validators';
import { getValidationErrors, getFieldError, getGeneralErrorMessage } from '../../utils/errorUtils';

const Register = () => {
  const { t, i18n } = useTranslation("auth");
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
    country: '', // No default value
    postcode: '',
  });

  const [errors, setErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [realTimeErrors, setRealTimeErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({});

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
  };

  const validateField = (fieldName, value) => {
    let validation = { isValid: true, error: null };
    
    switch (fieldName) {
      case 'firstName':
        validation = validateName(value, 'firstName');
        break;
      case 'lastName':
        validation = validateName(value, 'lastName');
        break;
      case 'email':
        validation = validateEmail(value);
        break;
      case 'phone':
        validation = validatePhone(value);
        break;
      case 'birthDate':
        validation = validateBirthDate(value);
        break;
      case 'password':
        validation = validatePassword(value, formData.firstName, formData.lastName, formData.email);
        setPasswordStrength(validation);
        break;
      case 'confirmPassword':
        if (value && formData.password !== value) {
          validation = { isValid: false, error: 'confirmPasswordMismatch' };
        }
        break;
      case 'building':
        if (value && value.trim().length > 0 && value.trim().length < 2) {
          validation = { isValid: false, error: 'buildingLength' };
        }
        break;
      case 'street':
        if (value && value.trim().length > 0 && value.trim().length < 5) {
          validation = { isValid: false, error: 'streetLength' };
        }
        break;
      case 'city':
        if (value && value.trim().length > 0 && value.trim().length < 2) {
          validation = { isValid: false, error: 'cityLength' };
        }
        break;
      case 'postcode':
        if (value && value.trim().length > 0 && value.trim().length < 3) {
          validation = { isValid: false, error: 'postcodeLength' };
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

  const handleCountryCodeChange = (countryCode) => {
    setFormData(prev => ({
      ...prev,
      countryCode,
    }));
    
    // Clear phone error when country code changes
    if (errors.phone) {
      setErrors(prev => ({
        ...prev,
        phone: '',
      }));
    }
    
    // Re-validate phone number with new country code
    if (formData.phone) {
      validateField('phone', formData.phone);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // First Name
    const firstNameValidation = validateName(formData.firstName, 'firstName');
    if (!firstNameValidation.isValid) {
      newErrors.firstName = t(`register.errors.${firstNameValidation.error}`);
    }

    // Last Name
    const lastNameValidation = validateName(formData.lastName, 'lastName');
    if (!lastNameValidation.isValid) {
      newErrors.lastName = t(`register.errors.${lastNameValidation.error}`);
    }

    // Email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = t(`register.errors.${emailValidation.error}`);
    }

    // Phone
    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.isValid) {
      newErrors.phone = t(`register.errors.${phoneValidation.error}`);
    }

    // Birth Date (optional but validate if provided)
    const birthDateValidation = validateBirthDate(formData.birthDate);
    if (!birthDateValidation.isValid) {
      newErrors.birthDate = t(`register.errors.${birthDateValidation.error}`);
    }

    // Address fields (optional but validate if provided)
    if (formData.building && formData.building.trim().length > 0 && formData.building.trim().length < 2) {
      newErrors.building = t('register.errors.buildingLength');
    }
    
    if (formData.street && formData.street.trim().length > 0 && formData.street.trim().length < 5) {
      newErrors.street = t('register.errors.streetLength');
    }
    
    if (formData.city && formData.city.trim().length > 0 && formData.city.trim().length < 2) {
      newErrors.city = t('register.errors.cityLength');
    }
    
    if (formData.postcode && formData.postcode.trim().length > 0 && formData.postcode.trim().length < 3) {
      newErrors.postcode = t('register.errors.postcodeLength');
    }

    // Password
    const passwordValidation = validatePassword(formData.password, formData.firstName, formData.lastName, formData.email);
    if (!passwordValidation.isValid) {
      newErrors.password = t(`register.errors.${passwordValidation.error}`);
    }

    // Confirm Password
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = t('register.errors.confirmPasswordEmpty');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('register.errors.confirmPasswordMismatch');
    }

    // Terms Agreement
    if (!agreeTerms) {
      newErrors.terms = t('register.errors.termsNotAgreed');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Remove leading zero from phone number when concatenating with country code
    const cleanPhone = formData.phone.startsWith('0') ? formData.phone.substring(1) : formData.phone;
    
    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      mobileNumber: formData.countryCode + cleanPhone,
      password: formData.password,
      birthDate: formData.birthDate || "",
      building: formData.building || "",
      street: formData.street || "",
      city: formData.city || "",
      country: formData.country || "",
      postcode: formData.postcode || "",
      language: i18n.language, // Include current language
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
        // Handle general errors - check multiple possible error structures
        let errorMessage = 'Registration failed. Please try again.';
        
        if (result.error?.response?.data?.message) {
          errorMessage = result.error.response.data.message;
        } else if (result.error?.response?.data?.error?.message) {
          errorMessage = result.error.response.data.error.message;
        } else if (result.error?.message) {
          errorMessage = result.error.message;
        } else if (typeof result.error === 'string') {
          errorMessage = result.error;
        }
        
        // Handle specific error cases
        if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
          const translatedMessage = t('register.errors.emailAlreadyExists');
          errorMessage = translatedMessage !== 'register.errors.emailAlreadyExists' ? translatedMessage : 'This email is already registered. Please use a different email or try logging in.';
        } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
          const translatedMessage = t('register.errors.invalidData');
          errorMessage = translatedMessage !== 'register.errors.invalidData' ? translatedMessage : 'Please check your information and try again.';
        }
        
        setErrors({ 
          general: errorMessage,
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
            error={errors.firstName || (realTimeErrors.firstName ? t(`register.errors.${realTimeErrors.firstName}`) : null) || getFieldError(validationErrors, 'firstName')}
            required
          />
          <FloatingInput
            label={t('register.lastName')}
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            error={errors.lastName || (realTimeErrors.lastName ? t(`register.errors.${realTimeErrors.lastName}`) : null) || getFieldError(validationErrors, 'lastName')}
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
          error={errors.email || (realTimeErrors.email ? t(`register.errors.${realTimeErrors.email}`) : null) || getFieldError(validationErrors, 'email')}
          required
        />

        {/* Phone Input with Country Code */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
            {t('register.phone')} <span className="text-red-500">*</span>
          </label>
          <div className="flex ltr:flex-row rtl:flex-row-reverse">
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
                placeholder={t('register.phonePlaceholder')}
                className={`
                  w-full px-3 py-2 border-b-2 bg-transparent text-lg md:text-xl 
                  focus:outline-none transition-colors duration-200
                  text-left ltr:rounded-r-md rtl:rounded-l-md
                  ${errors.phone || realTimeErrors.phone
                    ? 'border-red-500 text-red-500' 
                    : 'border-gray-300 text-gray-700 focus:border-gymmawy-primary'
                  }
                `}
                required
              />
            </div>
          </div>
          {(errors.phone || realTimeErrors.phone) && (
            <p className="text-xs text-red-500 mt-2 ltr:text-left rtl:text-right">
              {errors.phone || (realTimeErrors.phone ? t(`register.errors.${realTimeErrors.phone}`) : null)}
            </p>
          )}
        </div>

        {/* Birth Date */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
            {t('register.birthDate')}
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
              ${errors.birthDate || realTimeErrors.birthDate
                ? 'border-red-500 text-red-500' 
                : 'border-gray-300 text-gray-700 focus:border-gymmawy-primary'
              }
            `}
          />
          {(errors.birthDate || realTimeErrors.birthDate) && (
            <p className="text-xs text-red-500 mt-2 ltr:text-left rtl:text-right">
              {errors.birthDate || (realTimeErrors.birthDate ? t(`register.errors.${realTimeErrors.birthDate}`) : null)}
            </p>
          )}
        </div>

        {/* Address Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
            {t('register.addressInfo')}
          </h3>
          
          {/* Building and Street */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingInput
              label={t('register.building')}
              type="text"
              name="building"
              value={formData.building}
              onChange={handleInputChange}
              error={errors.building || (realTimeErrors.building ? t(`register.errors.${realTimeErrors.building}`) : null)}
            />
            <FloatingInput
              label={t('register.street')}
              type="text"
              name="street"
              value={formData.street}
              onChange={handleInputChange}
              error={errors.street || (realTimeErrors.street ? t(`register.errors.${realTimeErrors.street}`) : null)}
            />
          </div>

          {/* City, Country, and Postcode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FloatingInput
              label={t('register.city')}
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              error={errors.city || (realTimeErrors.city ? t(`register.errors.${realTimeErrors.city}`) : null)}
            />
            <FloatingInput
              label={t('register.country')}
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              error={errors.country}
            />
            <FloatingInput
              label={t('register.postcode')}
              type="text"
              name="postcode"
              value={formData.postcode}
              onChange={handleInputChange}
              error={errors.postcode || (realTimeErrors.postcode ? t(`register.errors.${realTimeErrors.postcode}`) : null)}
            />
          </div>
        </div>

        {/* Password Fields */}
        <div className="space-y-2">
          <FloatingInput
            label={t('register.password')}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            error={getFieldError(validationErrors, 'password')}
            required
          />
          
          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="space-y-1">
              <div className="text-xs text-gray-600">
                {t('register.errors.passwordRequirements')}
              </div>
              <div className="space-y-1 text-xs">
                {passwordStrength.allErrors && passwordStrength.allErrors.length > 0 ? (
                  passwordStrength.allErrors.map((error, index) => (
                    <div key={index} className="flex items-center text-red-500">
                      <span className="mr-1">✗</span>
                      <span>{t(`register.errors.${error}`)}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center text-green-500">
                    <span className="mr-1">✓</span>
                    <span>{t('register.errors.passwordMeetsRequirements')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <FloatingInput
            label={t('register.confirmPassword')}
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={errors.confirmPassword || (realTimeErrors.confirmPassword ? t(`register.errors.${realTimeErrors.confirmPassword}`) : null)}
            required
          />
          
          {/* Password Match Indicator */}
          {formData.confirmPassword && formData.password === formData.confirmPassword && (
            <div className="flex items-center text-green-500 text-xs">
              <span className="mr-1">✓</span>
              <span>{t('register.errors.passwordsMatch')}</span>
            </div>
          )}
        </div>

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
