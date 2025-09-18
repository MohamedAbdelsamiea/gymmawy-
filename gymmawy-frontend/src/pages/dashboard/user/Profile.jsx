import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import userService from '../../../services/userService';
import { 
  validateName, 
  validateEmail, 
  validatePhone, 
  validateBirthDate 
} from '../../../utils/validators';
import CountryCodeSelector from '../../../components/auth/CountryCodeSelector';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Save, 
  Edit3, 
  Camera,
  Shield,
} from 'lucide-react';

// Helper function to parse mobile number and extract country code and phone number
const parseMobileNumber = (mobileNumber) => {
  let countryCode = '+20'; // Default to Egypt
  let phone = '';
  
  if (mobileNumber) {
    // Find the country code from the mobile number
    const countryCodes = ['+966', '+971', '+965', '+973', '+974', '+968', '+962', '+961', '+963', '+964', '+98', '+972', '+970', '+212', '+213', '+216', '+218', '+249', '+251', '+254', '+234', '+27', '+1', '+52', '+44', '+33', '+49', '+39', '+34', '+31', '+32', '+41', '+43', '+45', '+46', '+47', '+358', '+48', '+420', '+421', '+36', '+40', '+359', '+385', '+386', '+381', '+382', '+387', '+389', '+355', '+383', '+7', '+380', '+375', '+370', '+371', '+372', '+353', '+351', '+30', '+90', '+91', '+86', '+81', '+82', '+65', '+60', '+66', '+84', '+63', '+62', '+880', '+92', '+93', '+977', '+975', '+94', '+960', '+95', '+855', '+856', '+673', '+670', '+976', '+850', '+886', '+852', '+853', '+61', '+64', '+679', '+685', '+676', '+678', '+687', '+689', '+55', '+54', '+56', '+57', '+58', '+51', '+591', '+593', '+598', '+595', '+597', '+592', '+506', '+502', '+504', '+505', '+503', '+507', '+501', '+20'];
    
    // Sort by length (longest first) to match longer codes first
    const sortedCodes = countryCodes.sort((a, b) => b.length - a.length);
    
    for (const code of sortedCodes) {
      if (mobileNumber.startsWith(code)) {
        countryCode = code;
        phone = mobileNumber.substring(code.length);
        break;
      }
    }
    
    // If no country code found, assume it's a local number
    if (!phone) {
      phone = mobileNumber;
    }
  }
  
  return { countryCode, phone };
};

const Profile = () => {
  const { t } = useTranslation("dashboard");
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [errors, setErrors] = useState({});
  const [realTimeErrors, setRealTimeErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+20', // Default to Egypt
    phone: '',
    mobileNumber: '', // Keep for backward compatibility
    birthDate: '',
    building: '',
    street: '',
    city: '',
    country: '',
    postcode: '',
  });

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      // Parse mobile number to extract country code and phone number
      const { countryCode, phone } = parseMobileNumber(user.mobileNumber);
      
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        countryCode: countryCode,
        phone: phone,
        mobileNumber: user.mobileNumber || '',
        birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
        building: user.building || '',
        street: user.street || '',
        city: user.city || '',
        country: user.country || '',
        postcode: user.postcode || '',
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
    
    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
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
      case 'building':
        if (value && value.trim().length > 0 && value.trim().length < 1) {
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
      case 'country':
        if (value && value.trim().length > 0 && value.trim().length < 2) {
          validation = { isValid: false, error: 'countryLength' };
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
    if (formData.firstName && !firstNameValidation.isValid) {
      newErrors.firstName = firstNameValidation.error;
    }

    // Last Name
    const lastNameValidation = validateName(formData.lastName, 'lastName');
    if (formData.lastName && !lastNameValidation.isValid) {
      newErrors.lastName = lastNameValidation.error;
    }

    // Email
    const emailValidation = validateEmail(formData.email);
    if (formData.email && !emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }

    // Phone Number
    const phoneValidation = validatePhone(formData.phone);
    if (formData.phone && !phoneValidation.isValid) {
      newErrors.phone = phoneValidation.error;
    }

    // Birth Date
    const birthDateValidation = validateBirthDate(formData.birthDate);
    if (formData.birthDate && !birthDateValidation.isValid) {
      newErrors.birthDate = birthDateValidation.error;
    }

    // Address fields
    if (formData.building && formData.building.trim().length > 0 && formData.building.trim().length < 1) {
      newErrors.building = 'buildingLength';
    }

    if (formData.street && formData.street.trim().length > 0 && formData.street.trim().length < 5) {
      newErrors.street = 'streetLength';
    }

    if (formData.city && formData.city.trim().length > 0 && formData.city.trim().length < 2) {
      newErrors.city = 'cityLength';
    }

    if (formData.postcode && formData.postcode.trim().length > 0 && formData.postcode.trim().length < 3) {
      newErrors.postcode = 'postcodeLength';
    }

    if (formData.country && formData.country.trim().length > 0 && formData.country.trim().length < 2) {
      newErrors.country = 'countryLength';
    }

    return newErrors;
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setErrors({});
    
    // Validate form before submission
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }
    
    try {
      // Check if email has changed
      const emailChanged = formData.email !== user?.email;

      if (emailChanged) {
        // If email changed, send verification email first
        await userService.changeEmail(formData.email);
        setSuccess('Verification email sent to your new email address. Please check your inbox and verify the new email to complete the change.');
        setIsEditing(false);
      } else {
        // If email didn't change, update profile normally
        const { email, countryCode, phone, ...updateData } = formData;
        
        // Combine country code and phone number
        const cleanPhone = phone.startsWith('0') ? phone.substring(1) : phone;
        const mobileNumber = countryCode + cleanPhone;
        
        // Filter out empty strings and undefined values
        const filteredData = {};
        Object.keys(updateData).forEach(key => {
          if (updateData[key] !== undefined && updateData[key] !== null && updateData[key] !== '') {
            filteredData[key] = updateData[key];
          }
        });
        
        // Only add mobileNumber if it's not empty
        if (mobileNumber && mobileNumber.trim() !== '') {
          filteredData.mobileNumber = mobileNumber;
        }
        
        const response = await userService.updateProfile(filteredData);
        setSuccess(response.message || 'Profile updated successfully');
        setIsEditing(false);
        
        // Update user context with new data
        if (response?.user) {
          // You might want to update the user context here
          // This would require adding an updateUser method to AuthContext
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Handle specific error messages
      if (error.message && error.message.includes('phone number is already in use')) {
        setErrors({ phone: 'phoneAlreadyExists' });
        setError('This phone number is already in use by another account. Please choose a different number.');
      } else if (error.response?.data?.error?.message && error.response.data.error.message.includes('phone number is already in use')) {
        setErrors({ phone: 'phoneAlreadyExists' });
        setError('This phone number is already in use by another account. Please choose a different number.');
      } else if (error.response?.data?.details) {
        // Handle validation errors from backend (direct details array)
        const validationErrors = {};
        error.response.data.details.forEach(detail => {
          if (detail.field === 'mobileNumber') {
            validationErrors.phone = 'phoneAlreadyExists';
          } else {
            validationErrors[detail.field] = detail.message;
          }
        });
        setErrors(validationErrors);
        setError('Please check the highlighted fields and try again.');
      } else if (error.response?.data?.error?.details) {
        // Handle validation errors from backend (nested in error object)
        const validationErrors = {};
        error.response.data.error.details.forEach(detail => {
          if (detail.field === 'mobileNumber') {
            validationErrors.phone = 'phoneAlreadyExists';
          } else {
            validationErrors[detail.field] = detail.message;
          }
        });
        setErrors(validationErrors);
        setError('Please check the highlighted fields and try again.');
      } else {
        setError(error.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Parse mobile number to extract country code and phone number
    const { countryCode, phone } = parseMobileNumber(user?.mobileNumber);
    
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      countryCode: countryCode,
      phone: phone,
      mobileNumber: user?.mobileNumber || '',
      birthDate: user?.birthDate ? user.birthDate.split('T')[0] : '',
      building: user?.building || '',
      street: user?.street || '',
      city: user?.city || '',
      country: user?.country || '',
      postcode: user?.postcode || '',
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    setErrors({});
    setRealTimeErrors({});
  };

  const getFieldError = (fieldName) => {
    return errors[fieldName] || realTimeErrors[fieldName];
  };

  const getErrorMessage = (fieldName) => {
    const errorKey = getFieldError(fieldName);
    if (!errorKey) return null;
    
    const errorMessages = {
      firstNameRequired: 'First name is required',
      firstNameLength: 'First name must be between 2 and 50 characters',
      firstNameInvalid: 'First name contains invalid characters',
      lastNameRequired: 'Last name is required',
      lastNameLength: 'Last name must be between 2 and 50 characters',
      lastNameInvalid: 'Last name contains invalid characters',
      emailRequired: 'Email is required',
      emailFormat: 'Please enter a valid email address',
      phoneRequired: 'Phone number is required',
      phoneFormat: 'Please enter a valid phone number',
      phoneLength: 'Phone number must be between 7 and 15 digits',
      phoneAlreadyExists: 'This phone number is already in use by another account',
      birthDateInvalid: 'Please enter a valid birth date',
      birthDateTooYoung: 'You must be at least 13 years old',
      birthDateTooOld: 'Please enter a valid birth date',
      buildingLength: 'Building must not be empty',
      streetLength: 'Street must be at least 5 characters',
      cityLength: 'City must be at least 2 characters',
      postcodeLength: 'Postcode must be at least 3 characters',
      countryLength: 'Country must be at least 2 characters',
    };
    
    return errorMessages[errorKey] || 'Invalid input';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your personal information and account details</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture & Basic Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="h-24 w-24 rounded-full bg-gymmawy-primary flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">
                    {user?.firstName?.charAt(0) || 'U'}
                  </span>
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 h-8 w-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50">
                    <Camera className="h-4 w-4 text-gray-600" />
                  </button>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <div className="mt-4 flex items-center justify-center">
                <Shield className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Verified Account</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-gymmawy-primary" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName ?? ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                      getFieldError('firstName') ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                  />
                  {getFieldError('firstName') && (
                    <p className="mt-1 text-sm text-red-600">{getErrorMessage('firstName')}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName ?? ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                      getFieldError('lastName') ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                  />
                  {getFieldError('lastName') && (
                    <p className="mt-1 text-sm text-red-600">{getErrorMessage('lastName')}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email ?? ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                      getFieldError('email') ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                  />
                  {getFieldError('email') && (
                    <p className="mt-1 text-sm text-red-600">{getErrorMessage('email')}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Changing your email will require verification of the new address.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="flex">
                    <CountryCodeSelector
                      value={formData.countryCode ?? '+20'}
                      onChange={handleCountryCodeChange}
                      className="flex-shrink-0"
                      disabled={!isEditing}
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone ?? ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter phone number"
                      className={`flex-1 px-3 py-2 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                        getFieldError('phone') ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 border-l-0'
                      }`}
                    />
                  </div>
                  {getFieldError('phone') && (
                    <p className="mt-1 text-sm text-red-600">{getErrorMessage('phone')}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate ?? ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                      getFieldError('birthDate') ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                  />
                  {getFieldError('birthDate') && (
                    <p className="mt-1 text-sm text-red-600">{getErrorMessage('birthDate')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-gymmawy-primary" />
                Address Information
              </h3>
              
              <div className="space-y-4">
                {/* Building and Street */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Building
                    </label>
                    <input
                      type="text"
                      name="building"
                      value={formData.building ?? ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                        getFieldError('building') ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                      }`}
                    />
                    {getFieldError('building') && (
                      <p className="mt-1 text-sm text-red-600">{getErrorMessage('building')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street
                    </label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street ?? ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                        getFieldError('street') ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                      }`}
                    />
                    {getFieldError('street') && (
                      <p className="mt-1 text-sm text-red-600">{getErrorMessage('street')}</p>
                    )}
                  </div>
                </div>

                {/* City, Country, and Postcode */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city ?? ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                        getFieldError('city') ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                      }`}
                    />
                    {getFieldError('city') && (
                      <p className="mt-1 text-sm text-red-600">{getErrorMessage('city')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country ?? ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                        getFieldError('country') ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                      }`}
                    />
                    {getFieldError('country') && (
                      <p className="mt-1 text-sm text-red-600">{getErrorMessage('country')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postcode
                    </label>
                    <input
                      type="text"
                      name="postcode"
                      value={formData.postcode ?? ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                        getFieldError('postcode') ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                      }`}
                    />
                    {getFieldError('postcode') && (
                      <p className="mt-1 text-sm text-red-600">{getErrorMessage('postcode')}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
