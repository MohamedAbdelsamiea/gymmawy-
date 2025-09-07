import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import ImageUpload from '../common/ImageUpload';
import adminApiService from '../../services/adminApiService';

const AddTransformationModal = ({ isOpen, onClose, onSuccess, transformation = null, isEdit = false }) => {
  const [formData, setFormData] = useState({
    title: { en: '', ar: '' },
    imageUrl: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (transformation && isEdit) {
        setFormData({
          title: transformation.title || { en: '', ar: '' },
          imageUrl: transformation.imageUrl || ''
        });
      } else {
        setFormData({
          title: { en: '', ar: '' },
          imageUrl: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, transformation, isEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTitleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      title: {
        ...prev.title,
        [field]: value
      }
    }));
    
    // Clear error when user starts typing
    if (errors.title) {
      setErrors(prev => ({
        ...prev,
        title: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.en.trim()) {
      newErrors.title = 'English title is required';
    }

    if (!formData.title.ar.trim()) {
      newErrors.title = 'Arabic title is required';
    }

    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = 'Image is required';
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
    try {
      const submitData = {
        title: formData.title,
        imageUrl: formData.imageUrl
      };

      if (isEdit && transformation) {
        await adminApiService.updateTransformation(transformation.id, submitData);
      } else {
        await adminApiService.createTransformation(submitData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving transformation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!transformation || !isEdit) return;
    
    if (window.confirm('Are you sure you want to delete this transformation? This action cannot be undone.')) {
      setLoading(true);
      try {
        await adminApiService.deleteTransformation(transformation.id);
        onSuccess();
        onClose();
      } catch (error) {
        console.error('Error deleting transformation:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Transformation' : 'Add New Transformation'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title - English */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title (English) *
            </label>
            <input
              type="text"
              value={formData.title.en}
              onChange={(e) => handleTitleChange('en', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter transformation title in English"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Title - Arabic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title (Arabic) *
            </label>
            <input
              type="text"
              value={formData.title.ar}
              onChange={(e) => handleTitleChange('ar', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="أدخل عنوان التحول بالعربية"
              dir="rtl"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transformation Image *
            </label>
            <ImageUpload
              value={formData.imageUrl}
              onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
              module="transformations"
              required={true}
              className={errors.imageUrl ? 'border-red-300' : ''}
            />
            {errors.imageUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>
            )}
          </div>



          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div>
              {isEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Delete Transformation
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary disabled:opacity-50 transition-colors"
              >
                {loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransformationModal;