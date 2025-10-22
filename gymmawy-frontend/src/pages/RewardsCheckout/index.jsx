import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../hooks/useLanguage';
import rewardsService from '../../services/rewardsService';
import { useFormPersistence } from '../../hooks/useFormPersistence';
import CityAutocomplete from '../../components/common/CityAutocomplete';

import { 
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  User,
  Package,
  Truck,
  Gift,
  Coins,
  Shield,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import * as Accordion from "@radix-ui/react-accordion";

const RewardsCheckout = () => {
  const { t, i18n } = useTranslation(['checkout', 'common', 'rewards']);
  const { isArabic } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { showError, showSuccess, showInfo } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to get bilingual text
  const getBilingualText = (text, fallback = '') => {
    if (!text) return fallback;
    if (typeof text === 'object') {
      return i18n.language === 'ar' && text.ar 
        ? text.ar 
        : text.en || text.ar || fallback;
    }
    return text || fallback;
  };

  // Get reward data from location state
  const { itemId, category, name, pointsRequired, quantity = 1, size, image } = location.state || {};

  // Initialize form persistence for rewards checkout form
  const {
    hasStoredData,
    isLoading: isPersistenceLoading,
    saveData,
    loadData,
    clearData,
    debouncedSave,
    handleSubmit: handleSubmitWithPersistence
  } = useFormPersistence('rewards-checkout', {
    excludeFields: [],
    clearOnSubmit: true,
    autoSave: true,
    autoSaveDelay: 2000
  });

  // Form state
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    mobileNumber: user?.mobileNumber || '',
    
    // Shipping Address
    shippingBuilding: user?.building || '',
    shippingStreet: user?.street || '',
    shippingCity: user?.city || '',
    shippingCountry: user?.country || 'Egypt',
    shippingPostcode: user?.postcode || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isValid, setIsValid] = useState(false);

  // Load saved form data
  useEffect(() => {
    if (hasStoredData && !isPersistenceLoading) {
      const savedData = loadData();
      if (savedData) {
        setFormData(prev => ({ ...prev, ...savedData }));
      }
    }
  }, [hasStoredData, isPersistenceLoading, loadData]);

  // Validate form
  useEffect(() => {
    const errors = {};
    
    // Required fields validation
    if (!formData.firstName.trim()) errors.firstName = t('checkout:validation.firstNameRequired');
    if (!formData.lastName.trim()) errors.lastName = t('checkout:validation.lastNameRequired');
    if (!formData.email.trim()) errors.email = t('checkout:validation.emailRequired');
    if (!formData.mobileNumber.trim()) errors.mobileNumber = t('checkout:validation.mobileRequired');
    if (!formData.shippingBuilding.trim()) errors.shippingBuilding = t('checkout:validation.buildingRequired');
    if (!formData.shippingStreet.trim()) errors.shippingStreet = t('checkout:validation.streetRequired');
    if (!formData.shippingCity.trim()) errors.shippingCity = t('checkout:validation.cityRequired');
    if (!formData.shippingCountry.trim()) errors.shippingCountry = t('checkout:validation.countryRequired');

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('checkout:validation.emailInvalid');
    }

    // Mobile validation (basic)
    if (formData.mobileNumber && !/^[0-9+\-\s()]+$/.test(formData.mobileNumber)) {
      errors.mobileNumber = t('checkout:validation.mobileInvalid');
    }

    setValidationErrors(errors);
    setIsValid(Object.keys(errors).length === 0 && itemId && category && pointsRequired > 0);
  }, [formData, itemId, category, pointsRequired, t]);

  // Auto-save form data
  useEffect(() => {
    if (isValid && !isPersistenceLoading) {
      debouncedSave(formData);
    }
  }, [formData, isValid, debouncedSave, isPersistenceLoading]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle city selection from autocomplete
  const handleCitySelect = (city) => {
    setFormData(prev => ({ ...prev, shippingCity: city }));
  };

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = pointsRequired * quantity;
    const shipping = 0; // Free shipping for rewards
    const total = subtotal + shipping;

    return {
      subtotal,
      shipping,
      total,
      currency: 'GYMMAWY_COINS'
    };
  }, [pointsRequired, quantity]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isValid) {
      showError(t('checkout:validation.pleaseFillAllFields'));
      return;
    }

    if (!isAuthenticated) {
      showError(t('common:auth_required'));
      return;
    }

    try {
      setIsSubmitting(true);

      // Validate redemption first
      await rewardsService.validateRedemption(itemId, category, pointsRequired);

      // Process redemption
      const result = await rewardsService.redeemReward(
        itemId,
        category,
        {
          shippingBuilding: formData.shippingBuilding,
          shippingStreet: formData.shippingStreet,
          shippingCity: formData.shippingCity,
          shippingCountry: formData.shippingCountry,
          shippingPostcode: formData.shippingPostcode,
        },
        { 
          pointsRequired, 
          quantity, 
          size 
        }
      );

      // Clear saved form data
      clearData();

      showSuccess(t('rewards:redemptionSuccess'));
      
      // Navigate to success page
      navigate('/payment/success', {
        replace: true,
        state: {
          orderId: result?.orderId,
          orderNumber: result?.orderNumber,
          amount: totals.total,
          currency: 'GYMMAWY_COINS',
          method: 'GYMMAWY_COINS',
          fromRewards: true,
          rewardName: name
        }
      });

    } catch (error) {
      console.error('Redemption error:', error);
      showError(error?.message || t('rewards:redemption_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if no reward data
  if (!itemId || !category || !pointsRequired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            {t('rewards:noRewardSelected')}
          </h2>
          <p className="text-gray-500 mb-4">
            {t('rewards:pleaseSelectReward')}
          </p>
          <button
            onClick={() => navigate('/rewards')}
            className="bg-[#190143] text-white px-6 py-2 rounded-lg hover:bg-[#2a0a5c] transition-colors"
          >
            {t('rewards:backToRewards')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/rewards')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('common:back')}
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('rewards:rewardsCheckout')}
          </h1>
          <p className="text-gray-600">
            {t('rewards:completeRedemption')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-6">
                  <User className="h-6 w-6 text-[#190143] mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('checkout:personalInformation')}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('checkout:firstName')} *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#190143] focus:border-transparent ${
                        validationErrors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('checkout:enterFirstName')}
                    />
                    {validationErrors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('checkout:lastName')} *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#190143] focus:border-transparent ${
                        validationErrors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('checkout:enterLastName')}
                    />
                    {validationErrors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('checkout:email')} *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#190143] focus:border-transparent ${
                        validationErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('checkout:enterEmail')}
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('checkout:mobileNumber')} *
                    </label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#190143] focus:border-transparent ${
                        validationErrors.mobileNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('checkout:enterMobile')}
                    />
                    {validationErrors.mobileNumber && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.mobileNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-6">
                  <MapPin className="h-6 w-6 text-[#190143] mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('checkout:shippingAddress')}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('checkout:building')} *
                    </label>
                    <input
                      type="text"
                      name="shippingBuilding"
                      value={formData.shippingBuilding}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#190143] focus:border-transparent ${
                        validationErrors.shippingBuilding ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('checkout:enterBuilding')}
                    />
                    {validationErrors.shippingBuilding && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.shippingBuilding}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('checkout:street')} *
                    </label>
                    <input
                      type="text"
                      name="shippingStreet"
                      value={formData.shippingStreet}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#190143] focus:border-transparent ${
                        validationErrors.shippingStreet ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('checkout:enterStreet')}
                    />
                    {validationErrors.shippingStreet && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.shippingStreet}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('checkout:city')} *
                    </label>
                    <CityAutocomplete
                      value={formData.shippingCity}
                      onSelect={handleCitySelect}
                      onChange={(value) => setFormData(prev => ({ ...prev, shippingCity: value }))}
                      error={validationErrors.shippingCity}
                      placeholder={t('checkout:enterCity')}
                    />
                    {validationErrors.shippingCity && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.shippingCity}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('checkout:country')} *
                    </label>
                    <select
                      name="shippingCountry"
                      value={formData.shippingCountry}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#190143] focus:border-transparent ${
                        validationErrors.shippingCountry ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="Egypt">Egypt</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="UAE">UAE</option>
                      <option value="Other">Other</option>
                    </select>
                    {validationErrors.shippingCountry && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.shippingCountry}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('checkout:postcode')}
                    </label>
                    <input
                      type="text"
                      name="shippingPostcode"
                      value={formData.shippingPostcode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#190143] focus:border-transparent"
                      placeholder={t('checkout:enterPostcode')}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="w-full bg-[#190143] text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-[#2a0a5c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      {t('rewards:processing')}
                    </>
                  ) : (
                    <>
                      <Gift className="h-5 w-5 mr-3" />
                      {t('rewards:redeemNow')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {t('checkout:orderSummary')}
              </h2>

              {/* Reward Item */}
              <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
                {image ? (
                  <img
                    src={image}
                    alt={name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Gift className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{category}</p>
                  {quantity > 1 && (
                    <p className="text-sm text-gray-500">Qty: {quantity}</p>
                  )}
                  {size && (
                    <p className="text-sm text-gray-500">Size: {size}</p>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('checkout:subtotal')}</span>
                  <span className="font-medium flex items-center">
                    {totals.subtotal} <Coins className="h-4 w-4 ml-1 text-yellow-500" />
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('checkout:shipping')}</span>
                  <span className="font-medium text-green-600">
                    {t('checkout:free')}
                  </span>
                </div>

                <hr className="border-gray-200" />

                <div className="flex justify-between text-lg font-semibold">
                  <span>{t('checkout:total')}</span>
                  <span className="flex items-center text-[#190143]">
                    {totals.total} <Coins className="h-5 w-5 ml-1 text-yellow-500" />
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">
                    {t('rewards:paymentMethod')}
                  </span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  {t('rewards:gymmawyCoinsPayment')}
                </p>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      {t('rewards:secureRedemption')}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {t('rewards:secureRedemptionDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsCheckout;