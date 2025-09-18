import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import adminApiService from '../../services/adminApiService';
import AdminImageUpload from '../common/AdminImageUpload';
import { useToast } from '../../contexts/ToastContext';

const AddProgrammeModal = ({ isOpen, onClose, onSuccess, editData, isEdit = false }) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    name: { en: '', ar: '' },
    imageUrl: '',
    discountPercentage: 0,
    loyaltyPointsAwarded: 0,
    loyaltyPointsRequired: 0,
  });
  
  // Pricing data for all currencies
  const [pricing, setPricing] = useState({
    EGP: '',
    SAR: '',
    AED: '',
    USD: ''
  });
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [enableLoyaltyPoints, setEnableLoyaltyPoints] = useState(false);
  const [errorField, setErrorField] = useState(null);

  // Effect to initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (isEdit && editData) {
        // Populate form with edit data
        setFormData({
          name: editData.name || { en: '', ar: '' },
          imageUrl: editData.imageUrl || '',
          discountPercentage: editData.discountPercentage || 0,
          loyaltyPointsAwarded: editData.loyaltyPointsAwarded || 0,
          loyaltyPointsRequired: editData.loyaltyPointsRequired || 0,
        });
        
        // Extract pricing from editData.prices array or fallback to old structure
        const programmePrices = {};
        if (editData.prices && Array.isArray(editData.prices)) {
          editData.prices.forEach(price => {
            programmePrices[price.currency] = Number(price.amount).toString();
          });
        } else {
          // Fallback to old structure for backward compatibility
          programmePrices.EGP = editData.priceEGP?.toString() || '';
          programmePrices.SAR = editData.priceSAR?.toString() || '';
          programmePrices.AED = editData.priceAED?.toString() || '';
          programmePrices.USD = editData.priceUSD?.toString() || '';
        }
        
        setPricing({
          EGP: programmePrices.EGP || '',
          SAR: programmePrices.SAR || '',
          AED: programmePrices.AED || '',
          USD: programmePrices.USD || ''
        });
        
        setEnableLoyaltyPoints((editData.loyaltyPointsAwarded > 0) || (editData.loyaltyPointsRequired > 0));
        setImageUrl(editData.imageUrl || '');
      } else {
        // Reset form when modal opens for new programme
        setFormData({
          name: { en: '', ar: '' },
          imageUrl: '',
          discountPercentage: 0,
          loyaltyPointsAwarded: 0,
          loyaltyPointsRequired: 0,
        });
        
        // Reset pricing
        setPricing({
          EGP: '',
          SAR: '',
          AED: '',
          USD: ''
        });
        
        setEnableLoyaltyPoints(false);
        setImageUrl('');
      }
      
      setError(null);
      setErrorField(null);
    }
  }, [isOpen, isEdit]); // Removed editData from dependencies

  // Separate effect to handle editData changes without resetting form
  useEffect(() => {
    if (isOpen && isEdit && editData) {
      const newFormData = {
        name: editData.name || { en: '', ar: '' },
        imageUrl: editData.imageUrl || '',
        discountPercentage: editData.discountPercentage || 0,
        loyaltyPointsAwarded: editData.loyaltyPointsAwarded || 0,
        loyaltyPointsRequired: editData.loyaltyPointsRequired || 0,
      };
      
      // Only update if the data has actually changed
      setFormData(prev => {
        const hasChanged = JSON.stringify(prev) !== JSON.stringify(newFormData);
        return hasChanged ? newFormData : prev;
      });
      
      // Extract pricing from editData.prices array or fallback to old structure
      const programmePrices = {};
      if (editData.prices && Array.isArray(editData.prices)) {
        editData.prices.forEach(price => {
          programmePrices[price.currency] = Number(price.amount).toString();
        });
      } else {
        // Fallback to old structure for backward compatibility
        programmePrices.EGP = editData.priceEGP?.toString() || '';
        programmePrices.SAR = editData.priceSAR?.toString() || '';
        programmePrices.AED = editData.priceAED?.toString() || '';
        programmePrices.USD = editData.priceUSD?.toString() || '';
      }
      
      const newPricing = {
        EGP: programmePrices.EGP || '',
        SAR: programmePrices.SAR || '',
        AED: programmePrices.AED || '',
        USD: programmePrices.USD || ''
      };
      
      // Only update pricing if it has changed
      setPricing(prev => {
        const hasChanged = JSON.stringify(prev) !== JSON.stringify(newPricing);
        return hasChanged ? newPricing : prev;
      });
      
      // Update loyalty points state only if it's different
      const newEnableLoyaltyPoints = (editData.loyaltyPointsAwarded > 0) || (editData.loyaltyPointsRequired > 0);
      setEnableLoyaltyPoints(prev => prev !== newEnableLoyaltyPoints ? newEnableLoyaltyPoints : prev);
      
      // Update image URL only if it's different
      const newImageUrl = editData.imageUrl || '';
      setImageUrl(prev => prev !== newImageUrl ? newImageUrl : prev);
    }
  }, [editData]); // Only depend on editData

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
    
    // Clear error when user starts typing in the field that had an error
    if (errorField === name) {
      setError(null);
      setErrorField(null);
    }
  };

  const handleBilingualInputChange = (field, language, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [language]: value,
      },
    }));
  };

  const handlePricingChange = (currency, value) => {
    setPricing(prev => ({
      ...prev,
      [currency]: value,
    }));
  };

  const scrollToError = (fieldName) => {
    const element = document.querySelector(`[name="${fieldName}"]`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center', 
      });
      element.focus();
    }
  };

  const showFormError = (message, fieldName = null) => {
    setError(message);
    setErrorField(fieldName);
    if (fieldName) {
      setTimeout(() => scrollToError(fieldName), 100);
    }
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorField(null);

    // Client-side validation for loyalty points
    if (enableLoyaltyPoints) {
      if (formData.loyaltyPointsRequired <= 0) {
        showFormError('Loyalty points required must be greater than 0', 'loyaltyPointsRequired');
        setLoading(false);
        return;
      }
    }

    // Client-side validation for pricing - all currencies are required
    const requiredCurrencies = ['EGP', 'SAR', 'AED', 'USD'];
    
    for (const currency of requiredCurrencies) {
      const amount = pricing[currency];
      if (!amount || parseFloat(amount) <= 0) {
        showFormError(`Price (${currency}) is required and must be greater than 0`, 'pricing');
        setLoading(false);
        return;
      }
    }

    try {
      // Extract loyalty points fields from formData to avoid spreading them
      const { loyaltyPointsAwarded, loyaltyPointsRequired, ...restFormData } = formData;
      
      // Prepare pricing data for submission
      const prices = [];
      Object.entries(pricing).forEach(([currency, amount]) => {
        if (amount && parseFloat(amount) > 0) {
          prices.push({
            amount: parseFloat(amount),
            currency: currency,
            type: 'NORMAL'
          });
        }
      });
      
      const programmeData = {
        ...restFormData,
        imageUrl: imageUrl || '', // Send empty string, backend will transform to undefined
        prices: prices,
        // Only include loyalty points if enabled, otherwise set to null
        ...(enableLoyaltyPoints ? {
          loyaltyPointsAwarded: parseFloat(loyaltyPointsAwarded) || 0,
          loyaltyPointsRequired: parseFloat(loyaltyPointsRequired) || 0,
        } : {
          loyaltyPointsAwarded: null,
          loyaltyPointsRequired: null,
        }),
      };
      
      
      

      if (isEdit && editData) {
        await adminApiService.updateProgramme(editData.id, programmeData);
        showSuccess('Programme updated successfully!');
      } else {
        await adminApiService.createProgramme(programmeData);
        showSuccess('Programme created successfully!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to create programme');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
return null;
}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Programme' : 'Add Programme'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 shadow-lg animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                    {errorField && (
                      <p className="text-xs text-red-600 mt-1">
                        Please check the highlighted field below
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setErrorField(null);
                  }}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Programme Name (English) *
                </label>
                <input
                  type="text"
                  value={formData.name.en ?? ''}
                  onChange={(e) => handleBilingualInputChange('name', 'en', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="Enter programme name in English"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Programme Name (Arabic) *
                </label>
                <input
                  type="text"
                  value={formData.name.ar ?? ''}
                  onChange={(e) => handleBilingualInputChange('name', 'ar', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="أدخل اسم البرنامج بالعربية"
                  dir="rtl"
                />
              </div>


              {/* Programme Pricing */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-800">Programme Pricing</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (EGP) *
                    </label>
                    <input
                      type="number"
                      value={pricing.EGP ?? ''}
                      onChange={(e) => handlePricingChange('EGP', e.target.value)}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (SAR) *
                    </label>
                    <input
                      type="number"
                      value={pricing.SAR ?? ''}
                      onChange={(e) => handlePricingChange('SAR', e.target.value)}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (AED) *
                    </label>
                    <input
                      type="number"
                      value={pricing.AED ?? ''}
                      onChange={(e) => handlePricingChange('AED', e.target.value)}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (USD) *
                    </label>
                    <input
                      type="number"
                      value={pricing.USD ?? ''}
                      onChange={(e) => handlePricingChange('USD', e.target.value)}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount (%)
                </label>
                <input
                  type="number"
                  name="discountPercentage"
                  value={formData.discountPercentage ?? ''}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Programme Image</h3>
              <AdminImageUpload
                initialImage={imageUrl ? { url: imageUrl } : null}
                onImageUpload={(uploadedImage) => setImageUrl(uploadedImage.url)}
                onImageRemove={() => setImageUrl('')}
                maxSize={5 * 1024 * 1024}
                showPreview={true}
                showDetails={true}
              />
            </div>
          </div>

          {/* Loyalty Points */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Loyalty Points</h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={enableLoyaltyPoints}
                  onChange={(e) => {
                    setEnableLoyaltyPoints(e.target.checked);
                    if (!e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        loyaltyPointsAwarded: 0,
                        loyaltyPointsRequired: 0,
                      }));
                    } else {
                      // When enabling loyalty points, set minimum values
                      setFormData(prev => ({
                        ...prev,
                        loyaltyPointsAwarded: prev.loyaltyPointsAwarded || 0,
                        loyaltyPointsRequired: prev.loyaltyPointsRequired || 1,
                      }));
                    }
                  }}
                  className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Enable loyalty points</span>
              </label>
            </div>
            
            {enableLoyaltyPoints && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points Awarded
                  </label>
                  <input
                    type="number"
                    name="loyaltyPointsAwarded"
                    value={formData.loyaltyPointsAwarded ?? ''}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points Required
                  </label>
                  <input
                    type="number"
                    name="loyaltyPointsRequired"
                    value={formData.loyaltyPointsRequired ?? ''}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent ${
                      errorField === 'loyaltyPointsRequired' 
                        ? 'border-red-500 bg-red-50 ring-2 ring-red-200' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter points required (minimum 1)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 1 point required for redemption
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors disabled:opacity-50"
            >
              {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Programme' : 'Create Programme')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProgrammeModal;
