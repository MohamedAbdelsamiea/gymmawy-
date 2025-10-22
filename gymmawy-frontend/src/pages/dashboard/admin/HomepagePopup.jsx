import React, { useState, useEffect } from 'react';
import { Save, Upload, Eye, EyeOff, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../contexts/ToastContext';
import ToggleSwitch from '../../../components/common/ToggleSwitch';
import AdminImageUpload from '../../../components/common/AdminImageUpload';
import popupService from '../../../services/popupService';
import fileUploadService from '../../../services/fileUploadService';
import apiClient from '../../../services/apiClient';
import { getFullImageUrl } from '../../../utils/imageUtils';
import { config } from '../../../config';

const AdminHomepagePopup = () => {
  const { t, i18n } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [popup, setPopup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removedImageUrl, setRemovedImageUrl] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    isActive: false,
    header: { en: '', ar: '' },
    subheader: { en: '', ar: '' },
    imageUrl: '',
    buttonText: { en: '', ar: '' },
    buttonLink: '',
    linkType: 'packages',
    customLink: ''
  });

  useEffect(() => {
    fetchPopup();
  }, []);

  const fetchPopup = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await popupService.getHomepagePopup();
      const popupData = response.popup;
      
      setPopup(popupData);
      // Determine link type and custom link from buttonLink
      let linkType = 'packages';
      let customLink = '';
      
      if (popupData.buttonLink) {
        if (popupData.buttonLink.includes('#packages')) {
          linkType = 'packages';
        } else if (popupData.buttonLink.includes('/programmes')) {
          linkType = 'programmes';
        } else if (popupData.buttonLink.includes('/store')) {
          linkType = 'store';
        } else {
          linkType = 'custom';
          customLink = popupData.buttonLink;
        }
      }

      setFormData({
        isActive: popupData.isActive || false,
        header: popupData.header || { en: '', ar: '' },
        subheader: popupData.subheader || { en: '', ar: '' },
        imageUrl: popupData.imageUrl || '',
        buttonText: popupData.buttonText || { en: '', ar: '' },
        buttonLink: popupData.buttonLink || '',
        linkType: linkType,
        customLink: customLink
      });

      if (popupData.imageUrl) {
        setImagePreview({
          url: getFullImageUrl(popupData.imageUrl),
          originalName: 'Existing image',
          size: 0,
          type: 'image'
        });
      }
    } catch (err) {
      console.error('Error fetching popup:', err);
      setError('Failed to load popup settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLinkTypeChange = (linkType) => {
    let buttonLink = '';
    
    switch (linkType) {
      case 'packages':
        buttonLink = '#packages';
        break;
      case 'programmes':
        buttonLink = '/programmes#programmes';
        break;
      case 'store':
        buttonLink = '/store#store';
        break;
      case 'custom':
        buttonLink = formData.customLink || '';
        break;
      default:
        buttonLink = '';
    }

    setFormData(prev => ({
      ...prev,
      linkType: linkType,
      buttonLink: buttonLink
    }));
  };

  const handleCustomLinkChange = (customLink) => {
    setFormData(prev => ({
      ...prev,
      customLink: customLink,
      buttonLink: prev.linkType === 'custom' ? customLink : prev.buttonLink
    }));
  };

  const handleMultilingualChange = (field, language, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [language]: value
      }
    }));
  };

  const handleImageUpload = (imageData) => {
    if (imageData.isLocal) {
      // If there's an existing image URL (not a local preview), track it for deletion
      if (formData.imageUrl && !formData.imageUrl.startsWith('blob:')) {
        setRemovedImageUrl(formData.imageUrl);
      }
      
      // Store the file for later upload when saving
      setSelectedImage(imageData);
      setFormData(prev => ({ ...prev, imageUrl: imageData.preview }));
      setImagePreview({
        url: imageData.preview,
        originalName: imageData.originalName,
        size: imageData.size,
        type: imageData.type
      });
    } else {
      // Handle existing image
      setSelectedImage(null);
      setFormData(prev => ({ ...prev, imageUrl: imageData.url }));
      setImagePreview({
        url: getFullImageUrl(imageData.url),
        originalName: imageData.originalName || 'Existing image',
        size: imageData.size || 0,
        type: imageData.type || 'image'
      });
      // Clear removed image URL since we're selecting an existing image
      setRemovedImageUrl(null);
    }
  };

  const handleImageRemove = () => {
    // Always track the current image URL for deletion if it exists and is not a local preview
    if (formData.imageUrl && !formData.imageUrl.startsWith('blob:')) {
      setRemovedImageUrl(formData.imageUrl);
    }
    
    setSelectedImage(null);
    setFormData(prev => ({
      ...prev,
      imageUrl: ''
    }));
    setImagePreview(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      let finalFormData = { ...formData };

      // Handle image operations
      if (selectedImage?.file) {
        // Upload new image if a file is selected
        try {
          const uploadResult = await fileUploadService.uploadFile(
            selectedImage.file, 
            'popup', 
            true
          );
          console.log('Upload result in HomepagePopup:', uploadResult);
          
          if (uploadResult && uploadResult.url) {
            finalFormData.imageUrl = fileUploadService.getFileUrl(uploadResult.url);
            // Clear selected image after successful upload
            setSelectedImage(null);
          } else {
            throw new Error('Invalid upload response');
          }
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          setError('Failed to upload image. Please try again.');
          return;
        }
      } else if (removedImageUrl && !selectedImage?.file) {
        // If image was removed and no new image is being uploaded, set imageUrl to empty string
        finalFormData.imageUrl = '';
      }

      // Clear removed image URL (backend will handle deletion)
      if (removedImageUrl) {
        setRemovedImageUrl(null);
      }

      // Update buttonLink based on linkType before saving
      let finalButtonLink = finalFormData.buttonLink;
      if (finalFormData.linkType !== 'custom') {
        switch (finalFormData.linkType) {
          case 'packages':
            finalButtonLink = '#packages';
            break;
          case 'programmes':
            finalButtonLink = '/programmes#programmes';
            break;
          case 'store':
            finalButtonLink = '/store#store';
            break;
        }
      }

      // Save the popup data with old image URL for deletion
      const saveData = {
        ...finalFormData,
        buttonLink: finalButtonLink,
        oldImageUrl: removedImageUrl
      };
      await popupService.updateHomepagePopup(saveData);
      console.log('Popup saved with data:', saveData);
      showSuccess('Popup settings saved successfully!');
      
      // Update form data with final image URL if uploaded
      if (finalFormData.imageUrl !== formData.imageUrl) {
        setFormData(prev => ({ ...prev, imageUrl: finalFormData.imageUrl }));
        
        if (finalFormData.imageUrl) {
          setImagePreview({
            url: getFullImageUrl(finalFormData.imageUrl),
            originalName: selectedImage?.originalName || 'Uploaded image',
            size: selectedImage?.size || 0,
            type: selectedImage?.type || 'image'
          });
        } else {
          setImagePreview(null);
        }
      }
      
    } catch (err) {
      console.error('Error saving popup:', err);
      setError('Failed to save popup settings');
    } finally {
      setSaving(false);
    }
  };

  const getLocalizedText = (textObj) => {
    if (!textObj) return '';
    return textObj[i18n.language] || textObj.en || textObj.ar || '';
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gymmawy-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading popup settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage Popup</h1>
          <p className="text-gray-600">Manage the popup that appears when users first visit the homepage</p>
        </div>
      </div>

      {/* Error Messages */}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {/* Toggle Switch */}
          <div className="flex items-center justify-between mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Enable Popup</h3>
              <p className="text-sm text-gray-600">Turn the homepage popup on or off</p>
            </div>
            <div className="flex items-center">
              <ToggleSwitch
                checked={formData.isActive}
                onChange={() => handleInputChange('isActive', !formData.isActive)}
              />
            </div>
          </div>

          {/* Form Fields - Only show when popup is active */}
          {formData.isActive && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image Upload - Full Width */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Popup Image
                </label>
                <AdminImageUpload
                  onImageUpload={handleImageUpload}
                  onImageRemove={handleImageRemove}
                  initialImage={imagePreview}
                  className="w-full"
                  maxSize={500 * 1024 * 1024} // 500MB
                  showPreview={true}
                  showDetails={true}
                />
              </div>

              {/* Header - English */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Header (English)
                </label>
                <input
                  type="text"
                  value={formData.header.en || ''}
                  onChange={(e) => handleMultilingualChange('header', 'en', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="Enter header text in English"
                />
              </div>

              {/* Header - Arabic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Header (Arabic)
                </label>
                <input
                  type="text"
                  value={formData.header.ar || ''}
                  onChange={(e) => handleMultilingualChange('header', 'ar', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent text-right"
                  placeholder="أدخل نص العنوان بالعربية"
                />
              </div>

              {/* Subheader - English */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subheader (English)
                </label>
                <textarea
                  value={formData.subheader.en || ''}
                  onChange={(e) => handleMultilingualChange('subheader', 'en', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="Enter subheader text in English"
                />
              </div>

              {/* Subheader - Arabic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subheader (Arabic)
                </label>
                <textarea
                  value={formData.subheader.ar || ''}
                  onChange={(e) => handleMultilingualChange('subheader', 'ar', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent text-right"
                  placeholder="أدخل نص العنوان الفرعي بالعربية"
                />
              </div>

              {/* Button Text - English */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Button Text (English)
                </label>
                <input
                  type="text"
                  value={formData.buttonText.en || ''}
                  onChange={(e) => handleMultilingualChange('buttonText', 'en', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                  placeholder="Enter button text in English"
                />
              </div>

              {/* Button Text - Arabic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Button Text (Arabic)
                </label>
                <input
                  type="text"
                  value={formData.buttonText.ar || ''}
                  onChange={(e) => handleMultilingualChange('buttonText', 'ar', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent text-right"
                  placeholder="أدخل نص الزر بالعربية"
                />
              </div>

              {/* Button Link Type - Full Width */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Button Link Destination
                </label>
                <select
                  value={formData.linkType}
                  onChange={(e) => handleLinkTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                >
                  <option value="packages">Packages Section</option>
                  <option value="programmes">Programmes Section</option>
                  <option value="store">Store Section</option>
                  <option value="custom">Custom Link</option>
                </select>
              </div>

              {/* Custom Link Input - Show only when custom is selected */}
              {formData.linkType === 'custom' && (
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Link
                  </label>
                  <input
                    type="text"
                    value={formData.customLink}
                    onChange={(e) => handleCustomLinkChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
                    placeholder="Enter custom link (e.g., /join-us or https://example.com)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use internal links (e.g., /join-us) or external URLs (e.g., https://example.com)
                  </p>
                </div>
              )}

            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-gymmawy-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-gymmawy-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHomepagePopup;
