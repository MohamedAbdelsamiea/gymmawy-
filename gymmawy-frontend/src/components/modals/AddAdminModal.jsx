import React, { useState } from 'react';
import { X, UserPlus, Eye, EyeOff, Check, X as XIcon } from 'lucide-react';
import adminApiService from '../../services/adminApiService';
import { useToast } from '../../contexts/ToastContext';
import { validatePassword } from '../../utils/validators';

const AddAdminModal = ({ isOpen, onClose, onSuccess }) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    mobileNumber: '',
    building: '',
    street: '',
    city: '',
    country: '',
    postcode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({});
  const [realTimeErrors, setRealTimeErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
    
    // Real-time validation
    validateField(name, value);
  };

  const validateField = (fieldName, value) => {
    let validation = { isValid: true, error: null };
    
    switch (fieldName) {
      case 'password':
        validation = validatePassword(value, formData.firstName, formData.lastName, formData.email);
        setPasswordValidation(validation);
        break;
      case 'confirmPassword':
        if (value && formData.password !== value) {
          validation = { isValid: false, error: 'confirmPasswordMismatch' };
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          validation = { isValid: false, error: 'invalidEmail' };
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Basic validation
      if (!formData.email || !formData.password) {
        throw new Error('Email and password are required');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Password validation
      const passwordValidation = validatePassword(formData.password, formData.firstName, formData.lastName, formData.email);
      if (!passwordValidation.isValid) {
        const errorMessages = {
          passwordLength: 'Password must be at least 8 characters long',
          passwordUppercase: 'Password must contain at least one uppercase letter',
          passwordLowercase: 'Password must contain at least one lowercase letter',
          passwordNumber: 'Password must contain at least one number',
          passwordSpecial: 'Password must contain at least one special character (!@#$%^&*)',
          passwordCommon: 'Password is too common, please choose a stronger one',
          passwordPersonalInfo: 'Password should not contain personal information like your name or email'
        };
        throw new Error(errorMessages[passwordValidation.error] || 'Password does not meet requirements');
      }

      // Confirm password validation
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      await adminApiService.createAdmin(formData);
      showSuccess('Admin created successfully!');
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        mobileNumber: '',
        building: '',
        street: '',
        city: '',
        country: '',
        postcode: ''
      });
      setPasswordValidation({});
      setRealTimeErrors({});
    } catch (err) {
      setError(err.message || 'Failed to create admin');
      showError(err.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError(null);
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        mobileNumber: '',
        building: '',
        street: '',
        city: '',
        country: '',
        postcode: ''
      });
      setPasswordValidation({});
      setRealTimeErrors({});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-gymmawy-primary" />
            Add New Admin
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={8}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent ${
                      realTimeErrors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {realTimeErrors.password && (
                  <p className="text-xs text-red-600 mt-1">
                    {realTimeErrors.password === 'passwordLength' && 'Password must be at least 8 characters long'}
                    {realTimeErrors.password === 'passwordUppercase' && 'Password must contain at least one uppercase letter'}
                    {realTimeErrors.password === 'passwordLowercase' && 'Password must contain at least one lowercase letter'}
                    {realTimeErrors.password === 'passwordNumber' && 'Password must contain at least one number'}
                    {realTimeErrors.password === 'passwordSpecial' && 'Password must contain at least one special character (!@#$%^&*)'}
                    {realTimeErrors.password === 'passwordCommon' && 'Password is too common, please choose a stronger one'}
                    {realTimeErrors.password === 'passwordPersonalInfo' && 'Password should not contain personal information like your name or email'}
                  </p>
                )}
                {passwordValidation.isValid && formData.password && (
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    Password meets all requirements
                  </p>
                )}
                {!passwordValidation.isValid && formData.password && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-2">Password requirements:</p>
                    <div className="space-y-1">
                      <div className={`flex items-center text-xs ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                        {formData.password.length >= 8 ? <Check className="h-3 w-3 mr-1" /> : <XIcon className="h-3 w-3 mr-1" />}
                        At least 8 characters
                      </div>
                      <div className={`flex items-center text-xs ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                        {/[A-Z]/.test(formData.password) ? <Check className="h-3 w-3 mr-1" /> : <XIcon className="h-3 w-3 mr-1" />}
                        One uppercase letter
                      </div>
                      <div className={`flex items-center text-xs ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                        {/[a-z]/.test(formData.password) ? <Check className="h-3 w-3 mr-1" /> : <XIcon className="h-3 w-3 mr-1" />}
                        One lowercase letter
                      </div>
                      <div className={`flex items-center text-xs ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                        {/\d/.test(formData.password) ? <Check className="h-3 w-3 mr-1" /> : <XIcon className="h-3 w-3 mr-1" />}
                        One number
                      </div>
                      <div className={`flex items-center text-xs ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                        {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? <Check className="h-3 w-3 mr-1" /> : <XIcon className="h-3 w-3 mr-1" />}
                        One special character
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent ${
                      realTimeErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {realTimeErrors.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">
                    Passwords do not match
                  </p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && !realTimeErrors.confirmPassword && (
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    Passwords match
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="+1234567890"
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Building
                </label>
                <input
                  type="text"
                  name="building"
                  value={formData.building}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="Building name/number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street
                </label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="Country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postcode
                </label>
                <input
                  type="text"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="Postal code"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Admin
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAdminModal;
