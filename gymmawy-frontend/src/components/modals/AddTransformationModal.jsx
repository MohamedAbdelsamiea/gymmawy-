import React, { useState, useEffect } from 'react';
import { X, Upload, Image } from 'lucide-react';
import AdminImageUpload from '../common/AdminImageUpload';
import adminApiService from '../../services/adminApiService';
import draftUploadService from '../../services/draftUploadService';

const AddTransformationModal = ({ isOpen, onClose, onSuccess, editData = null }) => {
  const [formData, setFormData] = useState({
    title: { en: '', ar: '' },
    imageUrl: '',
    isActive: true,
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [hasStagedChanges, setHasStagedChanges] = useState(false);

  const isEdit = !!editData;
  const FILE_KEY = 'transformationImage';

  useEffect(() => {
    if (isOpen) {
      // Reset draft service for this modal
      draftUploadService.reset();
      setHasStagedChanges(false);
      
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
        setSelectedImage(null);
      }
      setError(null);
      setErrors({});
    } else {
      // Clean up when modal closes
      draftUploadService.reset();
      setHasStagedChanges(false);
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

    // Check if we have either an existing image URL or a staged file
    const hasStagedFile = draftUploadService.isStaged(FILE_KEY);
    if (!formData.imageUrl && !hasStagedFile) {
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

      let finalFormData = { ...formData };

      // Commit all staged changes (upload new files and remove old ones)
      const commitResults = await draftUploadService.commitChanges();
      
      // Update image URL if we uploaded a new file
      if (commitResults.uploadResults[FILE_KEY]) {
        finalFormData.imageUrl = commitResults.uploadResults[FILE_KEY].uploadedUrl;
      }

      if (isEdit) {
        await adminApiService.updateTransformation(editData.id, finalFormData);
      } else {
        await adminApiService.createTransformation(finalFormData);
      }

      // Reset draft service after successful save
      draftUploadService.reset();
      setHasStagedChanges(false);
      
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
              onImageUpload={(imageData) => {
                if (imageData.isLocal && imageData.file) {
                  // Stage the file for upload
                  const stagedFile = draftUploadService.stageFile(
                    FILE_KEY,
                    imageData.file,
                    'transformations',
                    true
                  );
                  
                  setSelectedImage({
                    ...imageData,
                    isStaged: true,
                    stagedAt: stagedFile.stagedAt
                  });
                  
                  setFormData(prev => ({ ...prev, imageUrl: stagedFile.previewUrl }));
                  setHasStagedChanges(true);
                } else {
                  setSelectedImage(null);
                  setFormData(prev => ({ ...prev, imageUrl: imageData.url }));
                }
              }}
              onImageRemove={() => {
                // Stage removal of existing file
                if (formData.imageUrl) {
                  draftUploadService.stageRemoval(FILE_KEY, formData.imageUrl);
                }
                
                // Clear staged file
                draftUploadService.clearStagedFile(FILE_KEY);
                
                setSelectedImage(null);
                setFormData(prev => ({ ...prev, imageUrl: '' }));
                setHasStagedChanges(true);
              }}
              maxSize={100 * 1024 * 1024}
              showPreview={true}
              showDetails={true}
            />
            {errors.imageUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>
            )}
          </div>

          {/* Staged Changes Indicator */}
          {hasStagedChanges && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Upload className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    You have staged changes. Click "Save" to upload files and apply changes.
                  </p>
                </div>
              </div>
            </div>
          )}

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
              className="px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {hasStagedChanges ? 'Uploading & Saving...' : 'Saving...'}
                </>
              ) : (
                <>
                  {hasStagedChanges && <Upload className="h-4 w-4" />}
                  {isEdit ? 'Update Transformation' : 'Create Transformation'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransformationModal;