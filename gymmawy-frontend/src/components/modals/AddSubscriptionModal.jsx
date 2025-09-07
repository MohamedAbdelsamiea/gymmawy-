import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search, Edit } from 'lucide-react';
import adminApiService from '../../services/adminApiService';
import ImageUpload from '../common/ImageUpload';

const AddSubscriptionModal = ({ isOpen, onClose, onSuccess, editData = null, isEdit = false }) => {
  const [formData, setFormData] = useState({
    name: { en: '', ar: '' },
    description: { en: '', ar: '' },
    priceEGP: '',
    priceSAR: '',
    medicalEGP: '',
    medicalSAR: '',
    imageUrl: '',
    discountPercentage: 0,
    subscriptionPeriodDays: 30,
    giftPeriodDays: 0,
    loyaltyPointsAwarded: null,
    loyaltyPointsRequired: null,
    medicalLoyaltyPointsAwarded: null,
    medicalLoyaltyPointsRequired: null
  });
  const [periodType, setPeriodType] = useState('days');
  const [giftPeriodType, setGiftPeriodType] = useState('days');
  const [periodValue, setPeriodValue] = useState(30);
  const [giftPeriodValue, setGiftPeriodValue] = useState(0);
  const [benefits, setBenefits] = useState([]);
  const [availableBenefits, setAvailableBenefits] = useState([]);
  const [newBenefit, setNewBenefit] = useState({ en: '', ar: '' });
  const [showNewBenefit, setShowNewBenefit] = useState(false);
  const [benefitSearch, setBenefitSearch] = useState('');
  const [editingBenefit, setEditingBenefit] = useState(null);
  const [editBenefit, setEditBenefit] = useState({ en: '', ar: '' });
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
          name: { en: editData.name?.en || '', ar: editData.name?.ar || '' },
          description: { en: editData.description?.en || '', ar: editData.description?.ar || '' },
          priceEGP: editData.priceEGP || '',
          priceSAR: editData.priceSAR || '',
          medicalEGP: editData.medicalEGP || '',
          medicalSAR: editData.medicalSAR || '',
          imageUrl: editData.imageUrl || '',
          discountPercentage: editData.discountPercentage || 0,
          subscriptionPeriodDays: editData.subscriptionPeriodDays || 30,
          giftPeriodDays: editData.giftPeriodDays || 0,
          loyaltyPointsAwarded: editData.loyaltyPointsAwarded || null,
          loyaltyPointsRequired: editData.loyaltyPointsRequired || null,
          medicalLoyaltyPointsAwarded: editData.medicalLoyaltyPointsAwarded || null,
          medicalLoyaltyPointsRequired: editData.medicalLoyaltyPointsRequired || null
        });
        
        // Set period values
        const periodDays = editData.subscriptionPeriodDays || 30;
        const giftDays = editData.giftPeriodDays || 0;
        
        if (periodDays >= 30) {
          setPeriodType('months');
          setPeriodValue(Math.floor(periodDays / 30));
        } else if (periodDays >= 7) {
          setPeriodType('weeks');
          setPeriodValue(Math.floor(periodDays / 7));
        } else {
          setPeriodType('days');
          setPeriodValue(periodDays);
        }
        
        if (giftDays >= 30) {
          setGiftPeriodType('months');
          setGiftPeriodValue(Math.floor(giftDays / 30));
        } else if (giftDays >= 7) {
          setGiftPeriodType('weeks');
          setGiftPeriodValue(Math.floor(giftDays / 7));
        } else {
          setGiftPeriodType('days');
          setGiftPeriodValue(giftDays);
        }
        
        // Pre-populate benefits with existing plan benefits
        setBenefits(editData.benefits || []);
        const hasLoyaltyPoints = (editData.loyaltyPointsAwarded !== null && editData.loyaltyPointsAwarded > 0) || (editData.loyaltyPointsRequired !== null && editData.loyaltyPointsRequired > 0) || (editData.medicalLoyaltyPointsAwarded !== null && editData.medicalLoyaltyPointsAwarded > 0) || (editData.medicalLoyaltyPointsRequired !== null && editData.medicalLoyaltyPointsRequired > 0);
        setEnableLoyaltyPoints(hasLoyaltyPoints);
        setImageUrl(editData.imageUrl || '');
      } else {
        // Reset form when modal opens for new plan
        setFormData({
          name: { en: '', ar: '' },
          description: { en: '', ar: '' },
          priceEGP: '',
          priceSAR: '',
          medicalEGP: '',
          medicalSAR: '',
          imageUrl: '',
          discountPercentage: 0,
          subscriptionPeriodDays: 30,
          giftPeriodDays: 0,
          loyaltyPointsAwarded: null,
          loyaltyPointsRequired: null,
          medicalLoyaltyPointsAwarded: null,
          medicalLoyaltyPointsRequired: null
        });
        setPeriodType('days');
        setGiftPeriodType('days');
        setPeriodValue(30);
        setGiftPeriodValue(0);
        setBenefits([]);
        setEnableLoyaltyPoints(false);
        setImageUrl(''); // Reset imageUrl only for new plans
      }
      
      setNewBenefit({ en: '', ar: '' });
      setShowNewBenefit(false);
      setBenefitSearch('');
      setError(null);
      setEditingBenefit(null);
      setEditBenefit({ en: '', ar: '' });
      fetchBenefits();
    }
  }, [isOpen, isEdit, editData]);

  const fetchBenefits = async () => {
    try {
      const response = await adminApiService.getBenefits();
      console.log('Raw response:', response); // Debug log
      // The backend returns { items: [...], total: ... }
      const benefits = response.items || response.data || response || [];
      console.log('Fetched benefits:', benefits); // Debug log
      setAvailableBenefits(Array.isArray(benefits) ? benefits : []);
    } catch (err) {
      console.error('Error fetching benefits:', err);
      setAvailableBenefits([]);
    }
  };

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

  const convertToDays = (value, type) => {
    switch (type) {
      case 'weeks':
        return value * 7;
      case 'months':
        return value * 30; // Approximate
      case 'days':
      default:
        return value;
    }
  };

  const handlePeriodChange = (value, type) => {
    setPeriodValue(value);
    setPeriodType(type);
    const days = convertToDays(value, type);
    setFormData(prev => ({
      ...prev,
      subscriptionPeriodDays: days
    }));
  };

  const handleGiftPeriodChange = (value, type) => {
    setGiftPeriodValue(value);
    setGiftPeriodType(type);
    const days = convertToDays(value, type);
    setFormData(prev => ({
      ...prev,
      giftPeriodDays: days
    }));
  };


  const addExistingBenefit = (benefit) => {
    if (benefit && benefit.id && !benefits.find(b => b.id === benefit.id)) {
      setBenefits(prev => [...prev, benefit]);
    }
  };

  const addNewBenefit = async () => {
    if (newBenefit.en.trim() && newBenefit.ar.trim()) {
      try {
        const benefitData = {
          description: {
            en: newBenefit.en.trim(),
            ar: newBenefit.ar.trim()
          }
        };
        const response = await adminApiService.createBenefit(benefitData);
        const createdBenefit = response.benefit || response;
        if (createdBenefit && createdBenefit.id) {
          setBenefits(prev => [...prev, createdBenefit]);
          setAvailableBenefits(prev => Array.isArray(prev) ? [...prev, createdBenefit] : [createdBenefit]);
          setNewBenefit({ en: '', ar: '' });
          setShowNewBenefit(false);
        }
      } catch (err) {
        console.error('Error creating benefit:', err);
        setError('Failed to create benefit. Please try again.');
      }
    }
  };

  const removeBenefit = (id) => {
    setBenefits(prev => prev.filter(benefit => {
      const benefitId = benefit?.id || benefit?.benefit?.id;
      return benefitId !== id;
    }));
  };

  const startEditBenefit = (benefit) => {
    const benefitToEdit = benefit?.benefit || benefit;
    setEditingBenefit(benefitToEdit);
    setEditBenefit({
      en: benefitToEdit?.description?.en || '',
      ar: benefitToEdit?.description?.ar || ''
    });
  };

  const cancelEditBenefit = () => {
    setEditingBenefit(null);
    setEditBenefit({ en: '', ar: '' });
  };

  const saveEditBenefit = async () => {
    if (editBenefit.en.trim() && editBenefit.ar.trim() && editingBenefit) {
      try {
        const benefitData = {
          description: {
            en: editBenefit.en.trim(),
            ar: editBenefit.ar.trim()
          }
        };
        const response = await adminApiService.updateBenefit(editingBenefit.id, benefitData);
        const updatedBenefit = response.benefit || response;
        
        if (updatedBenefit && updatedBenefit.id) {
          // Update in selected benefits
          setBenefits(prev => prev.map(b => 
            b.id === editingBenefit.id ? updatedBenefit : b
          ));
          // Update in available benefits
          setAvailableBenefits(prev => prev.map(b => 
            b.id === editingBenefit.id ? updatedBenefit : b
          ));
          setEditingBenefit(null);
          setEditBenefit({ en: '', ar: '' });
        }
      } catch (err) {
        console.error('Error updating benefit:', err);
        setError('Failed to update benefit. Please try again.');
      }
    }
  };

  const handleDeleteBenefit = async (benefitId) => {
    if (window.confirm('Are you sure you want to delete this benefit? This action cannot be undone.')) {
      try {
        await adminApiService.deleteBenefit(benefitId);
        // Remove from selected benefits
        setBenefits(prev => prev.filter(b => b.id !== benefitId));
        // Remove from available benefits
        setAvailableBenefits(prev => prev.filter(b => b.id !== benefitId));
        // If we're editing this benefit, cancel edit mode
        if (editingBenefit?.id === benefitId) {
          setEditingBenefit(null);
          setEditBenefit({ en: '', ar: '' });
        }
      } catch (err) {
        console.error('Error deleting benefit:', err);
        setError('Failed to delete benefit. Please try again.');
      }
    }
  };

  const filteredBenefits = Array.isArray(availableBenefits) ? availableBenefits.filter(benefit => 
    benefit?.description?.en?.toLowerCase().includes(benefitSearch.toLowerCase()) ||
    benefit?.description?.ar?.toLowerCase().includes(benefitSearch.toLowerCase())
  ) : [];

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
      const subscriptionData = {
        ...formData,
        imageUrl: imageUrl || '', // Send empty string, backend will transform to undefined
        benefits: benefits.map(b => b.id).filter(Boolean),
        // Include loyalty points fields (null when disabled, actual values when enabled)
        loyaltyPointsAwarded: formData.loyaltyPointsAwarded,
        loyaltyPointsRequired: formData.loyaltyPointsRequired,
        medicalLoyaltyPointsAwarded: formData.medicalLoyaltyPointsAwarded,
        medicalLoyaltyPointsRequired: formData.medicalLoyaltyPointsRequired
      };

      if (isEdit && editData) {
        await adminApiService.updateSubscriptionPlan(editData.id, subscriptionData);
      } else {
        await adminApiService.createSubscriptionPlan(subscriptionData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to create subscription plan');
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
            {isEdit ? 'Edit Subscription Plan' : 'Add Subscription Plan'}
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
                  Plan Name (English) *
                </label>
                <input
                  type="text"
                  value={formData.name.en}
                  onChange={(e) => handleBilingualInputChange('name', 'en', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="Enter plan name in English"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name (Arabic) *
                </label>
                <input
                  type="text"
                  value={formData.name.ar}
                  onChange={(e) => handleBilingualInputChange('name', 'ar', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="أدخل اسم الخطة بالعربية"
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
                  placeholder="Enter plan description in English"
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
                  placeholder="أدخل وصف الخطة بالعربية"
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Regular Price (EGP) *
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
                    Regular Price (SAR) *
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical Price (EGP)
                  </label>
                  <input
                    type="number"
                    name="medicalEGP"
                    value={formData.medicalEGP}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical Price (SAR)
                  </label>
                  <input
                    type="number"
                    name="medicalSAR"
                    value={formData.medicalSAR}
                    onChange={handleInputChange}
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
                  name="discountPercentage"
                  value={formData.discountPercentage}
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
              <h3 className="text-lg font-medium text-gray-900">Plan Image</h3>
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                module="subscription-plans"
                showUrlInput={true}
                required={false}
                maxSize={5}
              />
            </div>
          </div>

          {/* Subscription Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Subscription Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Period *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={periodValue}
                    onChange={(e) => handlePeriodChange(parseInt(e.target.value) || 0, periodType)}
                    required
                    min="1"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  />
                  <select
                    value={periodType}
                    onChange={(e) => handlePeriodChange(periodValue, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  = {formData.subscriptionPeriodDays} days
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gift Period
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={giftPeriodValue}
                    onChange={(e) => handleGiftPeriodChange(parseInt(e.target.value) || 0, giftPeriodType)}
                    min="0"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  />
                  <select
                    value={giftPeriodType}
                    onChange={(e) => handleGiftPeriodChange(giftPeriodValue, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  = {formData.giftPeriodDays} days
                </p>
              </div>
            </div>
          </div>

          {/* Loyalty Points */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Loyalty Points & Rewards</h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={enableLoyaltyPoints}
                  onChange={(e) => {
                    setEnableLoyaltyPoints(e.target.checked);
                    if (!e.target.checked) {
                      // When disabling loyalty points, set all values to null
                      setFormData(prev => ({
                        ...prev,
                        loyaltyPointsAwarded: null,
                        loyaltyPointsRequired: null,
                        medicalLoyaltyPointsAwarded: null,
                        medicalLoyaltyPointsRequired: null
                      }));
                    } else {
                      // When enabling loyalty points, set minimum values
                      setFormData(prev => ({
                        ...prev,
                        loyaltyPointsAwarded: prev.loyaltyPointsAwarded || 0,
                        loyaltyPointsRequired: prev.loyaltyPointsRequired || 1,
                        medicalLoyaltyPointsAwarded: prev.medicalLoyaltyPointsAwarded || 0,
                        medicalLoyaltyPointsRequired: prev.medicalLoyaltyPointsRequired || 0
                      }));
                    }
                  }}
                  className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Enable loyalty points & rewards</span>
              </label>
            </div>
            
            {enableLoyaltyPoints ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Regular Points Awarded
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
                      Regular Points Required
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medical Points Awarded
                    </label>
                    <input
                      type="number"
                      name="medicalLoyaltyPointsAwarded"
                      value={formData.medicalLoyaltyPointsAwarded}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medical Points Required
                    </label>
                    <input
                      type="number"
                      name="medicalLoyaltyPointsRequired"
                      value={formData.medicalLoyaltyPointsRequired}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                      placeholder="Enter medical points required"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Medical plan loyalty points (optional)
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <div className="text-gray-500 mb-2">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-1">No Loyalty Rewards</h4>
                <p className="text-sm text-gray-600">
                  This subscription plan will not include any loyalty points or rewards system.
                </p>
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Plan Benefits</h3>
            
            {/* Search existing benefits */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={benefitSearch}
                  onChange={(e) => setBenefitSearch(e.target.value)}
                  placeholder="Search existing benefits..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                />
              </div>
              
              {benefitSearch && (
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                  {Array.isArray(filteredBenefits) && filteredBenefits.map((benefit) => (
                    <div
                      key={benefit?.id || Math.random()}
                      className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => addExistingBenefit(benefit)}
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {benefit?.description?.en || 'No English description'}
                          </div>
                          <div className="text-sm text-gray-600" dir="rtl">
                            {benefit?.description?.ar || 'لا يوجد وصف بالعربية'}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBenefit(benefit.id);
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="Delete benefit"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!Array.isArray(filteredBenefits) || filteredBenefits.length === 0) && (
                    <div className="p-3 text-sm text-gray-500">No benefits found</div>
                  )}
                </div>
              )}
            </div>

            {/* Add new benefit */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowNewBenefit(!showNewBenefit)}
                className="flex items-center gap-2 text-gymmawy-primary hover:text-gymmawy-secondary"
              >
                <Plus className="h-4 w-4" />
                {showNewBenefit ? 'Cancel' : 'Add New Benefit'}
              </button>

              {showNewBenefit && (
                <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Benefit (English) *
                    </label>
                    <input
                      type="text"
                      value={newBenefit.en}
                      onChange={(e) => setNewBenefit(prev => ({ ...prev, en: e.target.value }))}
                      placeholder="Enter benefit in English"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Benefit (Arabic) *
                    </label>
                    <input
                      type="text"
                      value={newBenefit.ar}
                      onChange={(e) => setNewBenefit(prev => ({ ...prev, ar: e.target.value }))}
                      placeholder="أدخل الميزة بالعربية"
                      dir="rtl"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addNewBenefit}
                    className="px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary transition-colors"
                  >
                    Create Benefit
                  </button>
                </div>
              )}
            </div>

            {/* Selected benefits */}
            {Array.isArray(benefits) && benefits.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Selected Benefits:</h4>
                {benefits.map((benefit) => {
                  const benefitId = benefit?.id || benefit?.benefit?.id;
                  const isEditing = editingBenefit?.id === benefitId;
                  return (
                  <div key={benefitId || Math.random()} className="bg-gray-50 px-3 py-2 rounded-lg">
                    {isEditing ? (
                      // Edit mode
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            English Description
                          </label>
                          <input
                            type="text"
                            value={editBenefit.en}
                            onChange={(e) => setEditBenefit(prev => ({ ...prev, en: e.target.value }))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gymmawy-primary focus:border-transparent"
                            placeholder="Enter English description"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Arabic Description
                          </label>
                          <input
                            type="text"
                            value={editBenefit.ar}
                            onChange={(e) => setEditBenefit(prev => ({ ...prev, ar: e.target.value }))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gymmawy-primary focus:border-transparent"
                            placeholder="أدخل الوصف بالعربية"
                            dir="rtl"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={saveEditBenefit}
                            disabled={!editBenefit.en.trim() || !editBenefit.ar.trim()}
                            className="px-3 py-1 text-xs bg-gymmawy-primary text-white rounded hover:bg-gymmawy-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditBenefit}
                            className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Display mode
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {(benefit?.benefit?.description?.en || benefit?.description?.en) || 'No English description'}
                          </div>
                          <div className="text-sm text-gray-600" dir="rtl">
                            {(benefit?.benefit?.description?.ar || benefit?.description?.ar) || 'لا يوجد وصف بالعربية'}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-2">
                          <button
                            type="button"
                            onClick={() => startEditBenefit(benefit)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit benefit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBenefit(benefitId)}
                            className="text-red-600 hover:text-red-800"
                            title="Remove benefit"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}
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
              {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Plan' : 'Create Plan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubscriptionModal;
