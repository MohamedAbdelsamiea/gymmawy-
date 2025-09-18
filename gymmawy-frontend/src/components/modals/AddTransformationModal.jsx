import React, { useState, useEffect } from 'react';
import { X, Upload, Image } from 'lucide-react';
import AdminImageUpload from '../common/AdminImageUpload';
import adminApiService from '../../services/adminApiService';

const AddTransformationModal = ({ isOpen, onClose, onSuccess, editData = null }) => {
  const [formData, setFormData] = useState({
    title: { en: '', ar: '' },
    imageUrl: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  const isEdit = !!editData;

  useEffect(() => {
    if (isOpen) {
      if (isEdit && editData) {
        setFormData({
          title: editData.title || { en: '', ar: '' },
          imageUrl: editData.imageUrl || '',
          isActive: editData.isActive !== undefined ? editData.isActive : true,
        });
      } else {
        setFormData({
          title: { en: '', ar: '' },
          imageUrl: '',
          isActive: true,
        });
      }
      setError(null);
      setErrors({});
    }
  }, [isOpen, isEdit, editData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.en.trim()) {
      newErrors.titleEn = 'English title is required';
    }

    if (!formData.title.ar.trim()) {
      newErrors.titleAr = 'Arabic title is required';
    }

    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = 'Transformation image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEdit) {
        await adminApiService.updateTransformation(editData.id, formData);
      } else {
        await adminApiService.createTransformation(formData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
return null;
}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Transformation' : 'Add New Transformation'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title (English) *
              </label>
              <input
                type="text"
                value={formData.title.en}
                onChange={(e) => handleBilingualInputChange('title', 'en', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.titleEn ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter transformation title in English"
              />
              {errors.titleEn && (
                <p className="mt-1 text-sm text-red-600">{errors.titleEn}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title (Arabic) *
              </label>
              <input
                type="text"
                value={formData.title.ar}
                onChange={(e) => handleBilingualInputChange('title', 'ar', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.titleAr ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="أدخل عنوان التحول بالعربية"
                dir="rtl"
              />
              {errors.titleAr && (
                <p className="mt-1 text-sm text-red-600">{errors.titleAr}</p>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transformation Image *
            </label>
            <AdminImageUpload
              initialImage={formData.imageUrl ? { url: formData.imageUrl } : null}
              onImageUpload={(uploadedImage) => setFormData(prev => ({ ...prev, imageUrl: uploadedImage.url }))}
              onImageRemove={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
              maxSize={5 * 1024 * 1024}
              showPreview={true}
              showDetails={true}
            />
            {errors.imageUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active (Published)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Transformation' : 'Create Transformation')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransformationModal;