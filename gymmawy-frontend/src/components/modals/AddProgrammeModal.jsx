import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import adminApiService from '../../services/adminApiService';
import ImageUpload from '../common/ImageUpload';

const AddProgrammeModal = ({ isOpen, onClose, onSuccess, editData, isEdit = false }) => {
  const [formData, setFormData] = useState({
    name: { en: '', ar: '' },
    description: { en: '', ar: '' },
    imageUrl: '',
    priceEGP: '',
    priceSAR: '',
    discount: 0,
    loyaltyPointsAwarded: 0,
    loyaltyPointsRequired: 0
  });
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [enableLoyaltyPoints, setEnableLoyaltyPoints] = useState(false);
  const [errorField, setErrorField] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && editData) {
        // Populate form with edit data
        setFormData({
          name: editData.name || { en: '', ar: '' },
          description: editData.description || { en: '', ar: '' },
          imageUrl: editData.imageUrl || '',
          priceEGP: editData.priceEGP || '',
          priceSAR: editData.priceSAR || '',
          discount: editData.discount || 0,
          loyaltyPointsAwarded: editData.loyaltyPointsAwarded || 0,
          loyaltyPointsRequired: editData.loyaltyPointsRequired || 0
        });
        setEnableLoyaltyPoints((editData.loyaltyPointsAwarded > 0) || (editData.loyaltyPointsRequired > 0));
        setImageUrl(editData.imageUrl || '');
      } else {
        // Reset form when modal opens for new programme
        setFormData({
          name: { en: '', ar: '' },
          description: { en: '', ar: '' },
          imageUrl: '',
          priceEGP: '',
          priceSAR: '',
          discount: 0,
          loyaltyPointsAwarded: 0,
          loyaltyPointsRequired: 0
        });
        setEnableLoyaltyPoints(false);
        setImageUrl('');
      }
      
      setError(null);
      setErrorField(null);
    }
  }, [isOpen, isEdit, editData]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
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
        [language]: value
      }
    }));
  };

  const scrollToError = (fieldName) => {
    const element = document.querySelector(`[name="${fieldName}"]`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      element.focus();
    }
  };

  const showError = (message, fieldName = null) => {
    setError(message);
    setErrorField(fieldName);
    if (fieldName) {
      setTimeout(() => scrollToError(fieldName), 100);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorField(null);

    // Client-side validation for loyalty points
    if (enableLoyaltyPoints) {
      if (formData.loyaltyPointsRequired <= 0) {
        showError('Loyalty points required must be greater than 0', 'loyaltyPointsRequired');
        setLoading(false);
        return;
      }
    }

    try {
      // Extract loyalty points fields from formData to avoid spreading them
      const { loyaltyPointsAwarded, loyaltyPointsRequired, ...restFormData } = formData;
      
      const programmeData = {
        ...restFormData,
        imageUrl: imageUrl || '', // Send empty string, backend will transform to undefined
        // Convert string prices to numbers
        priceEGP: parseFloat(formData.priceEGP) || 0,
        priceSAR: parseFloat(formData.priceSAR) || 0,
        // Only include loyalty points if enabled, otherwise set to null
        ...(enableLoyaltyPoints ? {
          loyaltyPointsAwarded: parseFloat(loyaltyPointsAwarded) || 0,
          loyaltyPointsRequired: parseFloat(loyaltyPointsRequired) || 0
        } : {
          loyaltyPointsAwarded: null,
          loyaltyPointsRequired: null
        })
      };
      
      
      

      if (isEdit && editData) {
        await adminApiService.updateProgramme(editData.id, programmeData);
      } else {
        await adminApiService.createProgramme(programmeData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to create programme');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
                  value={formData.name.en}
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
                  value={formData.name.ar}
                  onChange={(e) => handleBilingualInputChange('name', 'ar', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="أدخل اسم البرنامج بالعربية"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (English)
                </label>
                <textarea
                  value={formData.description.en}
                  onChange={(e) => handleBilingualInputChange('description', 'en', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="Enter programme description in English"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Arabic)
                </label>
                <textarea
                  value={formData.description.ar}
                  onChange={(e) => handleBilingualInputChange('description', 'ar', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="أدخل وصف البرنامج بالعربية"
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (EGP) *
                  </label>
                  <input
                    type="number"
                    name="priceEGP"
                    value={formData.priceEGP}
                    onChange={handleInputChange}
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
                    name="priceSAR"
                    value={formData.priceSAR}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount (%)
                </label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
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
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                module="programmes"
                showUrlInput={true}
                required={false}
                maxSize={5}
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
                        loyaltyPointsRequired: 0
                      }));
                    } else {
                      // When enabling loyalty points, set minimum values
                      setFormData(prev => ({
                        ...prev,
                        loyaltyPointsAwarded: prev.loyaltyPointsAwarded || 0,
                        loyaltyPointsRequired: prev.loyaltyPointsRequired || 1
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
                    value={formData.loyaltyPointsAwarded}
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
                    value={formData.loyaltyPointsRequired}
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
