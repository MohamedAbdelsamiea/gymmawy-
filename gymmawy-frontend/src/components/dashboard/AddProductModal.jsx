import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Upload } from 'lucide-react';
import AdminImageUpload from '../common/AdminImageUpload';
import adminApiService from '../../services/adminApiService';
import draftUploadService from '../../services/draftUploadService';
import { useToast } from '../../contexts/ToastContext';
import { config } from '../../config';

const AddProductModal = ({ isOpen, onClose, onSave }) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    name: { en: '' },
    discountPercentage: 0,
    loyaltyPointsAwarded: 0,
    loyaltyPointsRequired: 0,
    stock: 0,
    weight: '',
    length: '',
    width: '',
    height: '',
  });
  
  // Pricing data for all currencies
  const [pricing, setPricing] = useState({
    EGP: '',
    SAR: '',
    AED: '',
    USD: ''
  });
  
  const [imageUrl, setImageUrl] = useState('');
  const [carouselImages, setCarouselImages] = useState([]);
  const [selectedMainImage, setSelectedMainImage] = useState(null);
  const [selectedCarouselImages, setSelectedCarouselImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [enableLoyaltyPoints, setEnableLoyaltyPoints] = useState(false);
  const [hasStagedChanges, setHasStagedChanges] = useState(false);

  // File keys for draft upload service
  const MAIN_IMAGE_KEY = 'productMainImage';
  const CAROUSEL_IMAGE_KEY_PREFIX = 'productCarouselImage';

  useEffect(() => {
    if (isOpen) {
      // Reset draft service for this modal
      draftUploadService.reset();
      setHasStagedChanges(false);
      
      // Reset form when modal opens
      setFormData({
        name: { en: '' },
        discountPercentage: 0,
        loyaltyPointsAwarded: 0,
        loyaltyPointsRequired: 0,
        stock: 0,
        weight: '',
        length: '',
        width: '',
        height: '',
      });
      setPricing({
        EGP: '',
        SAR: '',
        AED: '',
        USD: ''
      });
      setImageUrl('');
      setCarouselImages([]);
      setSelectedMainImage(null);
      setSelectedCarouselImages([]);
      setErrors({});
      setEnableLoyaltyPoints(false);
    } else {
      // Clean up when modal closes
      draftUploadService.reset();
      setHasStagedChanges(false);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
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

  const handleCarouselImageUpload = (file) => {
    try {
      // Create a unique key for this carousel image
      const carouselKey = `${CAROUSEL_IMAGE_KEY_PREFIX}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Stage the file for upload
      const stagedFile = draftUploadService.stageFile(
        carouselKey,
        file,
        'products',
        true
      );
      
      const imageData = {
        file: file,
        preview: stagedFile.previewUrl,
        url: stagedFile.previewUrl, // For display purposes
        name: file.name,
        size: file.size,
        type: file.type,
        isLocal: true,
        isStaged: true,
        stagedAt: stagedFile.stagedAt,
        carouselKey: carouselKey
      };
      
      setSelectedCarouselImages(prev => [...prev, imageData]);
      setCarouselImages(prev => [...prev, imageData]);
      setHasStagedChanges(true);
    } catch (error) {
      console.error('AddModal - Error adding carousel image:', error);
      showError(error.message || 'Failed to add carousel image');
    }
  };

  const handleCarouselImageRemove = (imageToRemove) => {
    // If it's a staged file, clear it from draft service
    if (imageToRemove.isStaged && imageToRemove.carouselKey) {
      draftUploadService.clearStagedFile(imageToRemove.carouselKey);
    }
    
    // If it's an existing uploaded file, stage it for removal
    if (!imageToRemove.isLocal && imageToRemove.url) {
      draftUploadService.stageRemoval(imageToRemove.carouselKey || 'unknown', imageToRemove.url);
    }
    
    // Clean up preview URL if it's a local file
    if (imageToRemove.isLocal && imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    setCarouselImages(prev => prev.filter(img => img.url !== imageToRemove.url));
    setSelectedCarouselImages(prev => prev.filter(img => img.url !== imageToRemove.url));
    setHasStagedChanges(true);
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate name - English required
    if (!formData.name.en?.trim()) {
      newErrors.name = 'Name is required';
    }

    // Validate stock
    if (formData.stock < 0) {
      newErrors.stock = 'Stock cannot be negative';
    }

    // Validate discount percentage
    if (formData.discountPercentage < 0 || formData.discountPercentage > 100) {
      newErrors.discountPercentage = 'Discount percentage must be between 0 and 100';
    }

    // Validate loyalty points only if enabled
    if (enableLoyaltyPoints) {
      if (formData.loyaltyPointsAwarded < 0) {
        newErrors.loyaltyPointsAwarded = 'Gymmawy Coins awarded cannot be negative';
      }
      if (formData.loyaltyPointsRequired < 1) {
        newErrors.loyaltyPointsRequired = 'Gymmawy Coins required must be at least 1';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setUploadingImages(true);
    
    try {
      // Commit all staged changes (upload new files and remove old ones)
      const commitResults = await draftUploadService.commitChanges();
      
      let uploadedImageUrl = imageUrl;
      let uploadedCarouselImages = [...carouselImages];

      // Update main image URL if we uploaded a new file
      if (commitResults.uploadResults[MAIN_IMAGE_KEY]) {
        uploadedImageUrl = commitResults.uploadResults[MAIN_IMAGE_KEY].uploadedUrl;
      }

      // Update carousel images if we uploaded new files
      const carouselUploadResults = Object.entries(commitResults.uploadResults)
        .filter(([key]) => key.startsWith(CAROUSEL_IMAGE_KEY_PREFIX))
        .map(([key, result]) => result.uploadedUrl);
      
      if (carouselUploadResults.length > 0) {
        uploadedCarouselImages = carouselUploadResults.map(url => ({ url }));
      }

      // Extract loyalty points fields from formData to avoid spreading them
      const { loyaltyPointsAwarded, loyaltyPointsRequired, ...restFormData } = formData;
      
      // Prepare pricing data for submission
      const prices = [];
      Object.entries(pricing).forEach(([currency, amount]) => {
        if (amount && parseFloat(amount) > 0) {
          prices.push({
            amount: parseFloat(amount),
            currency: currency
          });
        }
      });
      
      const productData = {
        ...restFormData,
        // Ensure numeric fields are properly converted
        stock: parseInt(formData.stock) || 0,
        discountPercentage: parseInt(formData.discountPercentage) || 0,
        imageUrl: uploadedImageUrl || '', // Send empty string, backend will transform to undefined
        carouselImages: uploadedCarouselImages.map(img => img.url), // Send array of carousel image URLs
        prices: prices,
        // Always include loyalty points - set to 0 if disabled
        loyaltyPointsAwarded: enableLoyaltyPoints ? (parseFloat(loyaltyPointsAwarded) || 0) : 0,
        loyaltyPointsRequired: enableLoyaltyPoints ? (parseFloat(loyaltyPointsRequired) || 0) : 0,
        // Shipping dimensions and weight
        weight: formData.weight ? parseFloat(formData.weight) : null,
        length: formData.length ? parseFloat(formData.length) : null,
        width: formData.width ? parseFloat(formData.width) : null,
        height: formData.height ? parseFloat(formData.height) : null,
      };
      
      console.log('AddProductModal - Sending product data:', productData);
      console.log('AddProductModal - Stock:', productData.stock, 'Type:', typeof productData.stock);
      console.log('AddProductModal - Discount:', productData.discountPercentage, 'Type:', typeof productData.discountPercentage);
      console.log('AddProductModal - Prices:', productData.prices);
      console.log('AddProductModal - Weight:', productData.weight, 'Type:', typeof productData.weight);
      console.log('AddProductModal - Dimensions:', {
        length: productData.length,
        width: productData.width,
        height: productData.height
      });
      
      await onSave(productData);
      showSuccess('Product created successfully!');
      
      // Reset draft service after successful save
      draftUploadService.reset();
      setHasStagedChanges(false);
      
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      showError(error.message || 'Failed to save product. Please try again.');
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Product</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{errors.submit}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrors(prev => ({ ...prev, submit: null }))}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name.en ?? ''}
                onChange={(e) => handleBilingualInputChange('name', 'en', e.target.value)}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter product name"
              />
            </div>

          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
            
            {/* Stock and Discount - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent ${
                    errors.stock ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.stock && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.stock}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Percentage
                </label>
                <input
                  type="number"
                  name="discountPercentage"
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent ${
                    errors.discountPercentage ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.discountPercentage && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.discountPercentage}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Dimensions & Weight */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Shipping Information</h3>
            <p className="text-sm text-gray-600">These values are used for OTO shipping calculations</p>
            
            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                name="weight"
                min="0"
                step="0.01"
                value={formData.weight}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                placeholder="e.g., 0.5 for 500g"
              />
            </div>

            {/* Dimensions - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Length (cm)
                </label>
                <input
                  type="number"
                  name="length"
                  min="0"
                  step="0.01"
                  value={formData.length}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="e.g., 30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Width (cm)
                </label>
                <input
                  type="number"
                  name="width"
                  min="0"
                  step="0.01"
                  value={formData.width}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="e.g., 20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  name="height"
                  min="0"
                  step="0.01"
                  value={formData.height}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="e.g., 5"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Pricing</h3>
            
            {/* Price Fields - 2x2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (EGP)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricing.EGP}
                  onChange={(e) => handlePricingChange('EGP', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (SAR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricing.SAR}
                  onChange={(e) => handlePricingChange('SAR', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (AED)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricing.AED}
                  onChange={(e) => handlePricingChange('AED', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricing.USD}
                  onChange={(e) => handlePricingChange('USD', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-6">
            {/* Main Product Image */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Main Product Image</h3>
              <p className="text-sm text-gray-600">Upload the primary image that will be displayed in the product listing</p>
              <AdminImageUpload
                initialImage={imageUrl ? { url: imageUrl } : null}
                onImageUpload={(imageData) => {
                  if (imageData.isLocal && imageData.file) {
                    // Stage the file for upload
                    const stagedFile = draftUploadService.stageFile(
                      MAIN_IMAGE_KEY,
                      imageData.file,
                      'products',
                      true
                    );
                    
                    setSelectedMainImage({
                      ...imageData,
                      isStaged: true,
                      stagedAt: stagedFile.stagedAt
                    });
                    
                    setImageUrl(stagedFile.previewUrl);
                    setHasStagedChanges(true);
                  } else {
                    setImageUrl(imageData.url);
                    setSelectedMainImage(null);
                  }
                }}
                onImageRemove={() => {
                  // Stage removal of existing file
                  if (imageUrl) {
                    draftUploadService.stageRemoval(MAIN_IMAGE_KEY, imageUrl);
                  }
                  
                  // Clear staged file
                  draftUploadService.clearStagedFile(MAIN_IMAGE_KEY);
                  
                  setImageUrl('');
                  setSelectedMainImage(null);
                  setHasStagedChanges(true);
                }}
                maxSize={100 * 1024 * 1024}
                showPreview={true}
                showDetails={true}
              />
            </div>

            {/* Carousel Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Carousel Images</h3>
              <p className="text-sm text-gray-600">Upload additional images for the product carousel (optional)</p>
              
              {/* Upload New Carousel Images */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    files.forEach(file => {
                      if (file.size <= 100 * 1024 * 1024) { // 100MB limit
                        handleCarouselImageUpload(file);
                      } else {
                        showError('File size must be less than 100MB');
                      }
                    });
                    e.target.value = ''; // Reset input
                  }}
                  className="hidden"
                  id="carousel-upload"
                />
                <label
                  htmlFor="carousel-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-600">
                    {uploadingImages ? (
                      <span className="font-medium text-blue-600">Uploading images...</span>
                    ) : (
                      <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span>
                    )} or drag and drop
                  </div>
                  <div className="text-xs text-gray-500">Multiple images allowed (max 100MB each)</div>
                </label>
              </div>
              
              {/* Display Uploaded Carousel Images */}
              {carouselImages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Uploaded Carousel Images ({carouselImages.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {carouselImages.map((image, index) => {
                      // Construct proper image URL
                      let imageSrc = image.url;
                      if (image.url && !image.url.startsWith('http') && !image.url.startsWith('blob:')) {
                        imageSrc = image.url.startsWith('/') ? `${config.STATIC_BASE_URL}${image.url}` : `${config.STATIC_BASE_URL}/${image.url}`;
                      }
                      
                      return (
                        <div key={index} className="relative group">
                          <img
                            src={imageSrc}
                            alt={`Carousel ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleCarouselImageRemove(image)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Loyalty Points */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Gymmawy Coins & Rewards</h3>
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
                    }
                  }}
                  className="h-4 w-4 text-gymmawy-primary focus:ring-gymmawy-primary border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Enable Gymmawy Coins</span>
              </label>
            </div>

            {enableLoyaltyPoints && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coins Awarded
                  </label>
                  <input
                    type="number"
                    name="loyaltyPointsAwarded"
                    min="0"
                    value={formData.loyaltyPointsAwarded}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent ${
                      errors.loyaltyPointsAwarded ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                  {errors.loyaltyPointsAwarded && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.loyaltyPointsAwarded}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coins Required
                  </label>
                  <input
                    type="number"
                    name="loyaltyPointsRequired"
                    min="0"
                    value={formData.loyaltyPointsRequired}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent ${
                      errors.loyaltyPointsRequired ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                  {errors.loyaltyPointsRequired && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.loyaltyPointsRequired}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Staged Changes Indicator */}
          {hasStagedChanges && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mx-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Upload className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    You have staged changes. Click "Create Product" to upload files and create the product.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gymmawy-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-gymmawy-primary border border-transparent rounded-lg hover:bg-gymmawy-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gymmawy-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {hasStagedChanges ? 'Uploading & Creating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {hasStagedChanges && <Upload className="h-4 w-4 mr-2" />}
                  {!hasStagedChanges && <Save className="h-4 w-4 mr-2" />}
                  Create Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;