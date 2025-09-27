import React, { useState, useEffect } from 'react';
import { X, Upload, Play } from 'lucide-react';
import AdminImageUpload from '../common/AdminImageUpload';
import AdminVideoUpload from '../common/AdminVideoUpload';
import adminApiService from '../../services/adminApiService';
import fileUploadService from '../../services/fileUploadService';

const AddVideoModal = ({ isOpen, onClose, onSuccess, editData = null }) => {
  const [formData, setFormData] = useState({
    title: { en: '', ar: '' },
    videoUrl: '',
    thumbnailAr: '',
    thumbnailEn: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({
    video: null,
    thumbnailAr: null,
    thumbnailEn: null,
  });

  const isEdit = !!editData;

  useEffect(() => {
    if (isOpen) {
      if (isEdit && editData) {
        setFormData({
          title: editData.title || { en: '', ar: '' },
          videoUrl: editData.videoUrl || '',
          thumbnailAr: editData.thumbnailAr || '',
          thumbnailEn: editData.thumbnailEn || '',
        });
      } else {
        setFormData({
          title: { en: '', ar: '' },
          videoUrl: '',
          thumbnailAr: '',
          thumbnailEn: '',
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
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const cleanupSelectedFile = (fileData) => {
    if (fileData?.preview && fileData.isLocal) {
      URL.revokeObjectURL(fileData.preview);
    }
  };

  const cleanupAllSelectedFiles = () => {
    Object.values(selectedFiles)
      .filter(file => file && file.isLocal)
      .forEach(file => cleanupSelectedFile(file));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.en?.trim()) {
      newErrors.titleEn = 'English title is required';
    }

    if (!formData.title.ar?.trim()) {
      newErrors.titleAr = 'Arabic title is required';
    }

    if (!formData.videoUrl.trim()) {
      newErrors.videoUrl = 'Video file is required';
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

      // Prepare final form data
      const finalFormData = { ...formData };

      // Upload video file if selected
      if (selectedFiles.video?.file) {
        try {
          const uploadResult = await fileUploadService.uploadVideo(
            selectedFiles.video.file, 
            'videos'
          );
          
          if (uploadResult.success && uploadResult.upload) {
            finalFormData.videoUrl = fileUploadService.getFileUrl(uploadResult.upload.url);
          } else {
            throw new Error('Invalid upload response for video');
          }
        } catch (uploadError) {
          throw new Error(`Failed to upload video: ${uploadError.message}`);
        }
      }

      // Upload Arabic thumbnail if selected
      if (selectedFiles.thumbnailAr?.file) {
        try {
          const uploadResult = await fileUploadService.uploadFile(
            selectedFiles.thumbnailAr.file, 
            'videos', 
            true
          );
          
          if (uploadResult.success && uploadResult.upload) {
            finalFormData.thumbnailAr = fileUploadService.getFileUrl(uploadResult.upload.url);
          } else {
            throw new Error('Invalid upload response for Arabic thumbnail');
          }
        } catch (uploadError) {
          throw new Error(`Failed to upload Arabic thumbnail: ${uploadError.message}`);
        }
      }

      // Upload English thumbnail if selected
      if (selectedFiles.thumbnailEn?.file) {
        try {
          const uploadResult = await fileUploadService.uploadFile(
            selectedFiles.thumbnailEn.file, 
            'videos', 
            true
          );
          
          if (uploadResult.success && uploadResult.upload) {
            finalFormData.thumbnailEn = fileUploadService.getFileUrl(uploadResult.upload.url);
          } else {
            throw new Error('Invalid upload response for English thumbnail');
          }
        } catch (uploadError) {
          throw new Error(`Failed to upload English thumbnail: ${uploadError.message}`);
        }
      }

      if (isEdit) {
        await adminApiService.updateVideo(editData.id, finalFormData);
      } else {
        await adminApiService.createVideo(finalFormData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Clean up any selected files that weren't saved
    cleanupAllSelectedFiles();
    onClose();
  };

  if (!isOpen) {
return null;
}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Video' : 'Add New Video'}
          </h2>
          <button
            onClick={handleClose}
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
          {/* Bilingual Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">English Title</label>
                <input
                  type="text"
                  value={formData.title?.en ?? ''}
                  onChange={(e) => handleBilingualInputChange('title', 'en', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.titleEn ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter English title"
                />
                {errors.titleEn && (
                  <p className="mt-1 text-sm text-red-600">{errors.titleEn}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Arabic Title</label>
                <input
                  type="text"
                  value={formData.title?.ar ?? ''}
                  onChange={(e) => handleBilingualInputChange('title', 'ar', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.titleAr ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="أدخل العنوان بالعربية"
                  dir="rtl"
                />
                {errors.titleAr && (
                  <p className="mt-1 text-sm text-red-600">{errors.titleAr}</p>
                )}
              </div>
            </div>
          </div>

          {/* Video File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video File *
            </label>
            <AdminVideoUpload
              onVideoUpload={(videoData) => {
                // Clean up previous video if exists
                if (selectedFiles.video) {
                  cleanupSelectedFile(selectedFiles.video);
                }
                setFormData(prev => ({ ...prev, videoUrl: videoData.preview || videoData.url }));
                setSelectedFiles(prev => ({ ...prev, video: videoData }));
              }}
              onVideoRemove={() => {
                if (selectedFiles.video) {
                  cleanupSelectedFile(selectedFiles.video);
                }
                setFormData(prev => ({ ...prev, videoUrl: '' }));
                setSelectedFiles(prev => ({ ...prev, video: null }));
              }}
              initialVideo={formData.videoUrl ? { url: formData.videoUrl } : null}
              className="w-full"
              maxSize={100 * 1024 * 1024} // 100MB
            />
            {errors.videoUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.videoUrl}</p>
            )}
          </div>

          {/* Arabic Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arabic Thumbnail
            </label>
            <AdminImageUpload
              onImageUpload={(imageData) => {
                // Clean up previous thumbnail if exists
                if (selectedFiles.thumbnailAr) {
                  cleanupSelectedFile(selectedFiles.thumbnailAr);
                }
                setFormData(prev => ({ ...prev, thumbnailAr: imageData.preview || imageData.url }));
                setSelectedFiles(prev => ({ ...prev, thumbnailAr: imageData }));
              }}
              onImageRemove={() => {
                if (selectedFiles.thumbnailAr) {
                  cleanupSelectedFile(selectedFiles.thumbnailAr);
                }
                setFormData(prev => ({ ...prev, thumbnailAr: '' }));
                setSelectedFiles(prev => ({ ...prev, thumbnailAr: null }));
              }}
              initialImage={formData.thumbnailAr ? { url: formData.thumbnailAr } : null}
              className="w-full"
            />
          </div>

          {/* English Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              English Thumbnail
            </label>
            <AdminImageUpload
              onImageUpload={(imageData) => {
                // Clean up previous thumbnail if exists
                if (selectedFiles.thumbnailEn) {
                  cleanupSelectedFile(selectedFiles.thumbnailEn);
                }
                setFormData(prev => ({ ...prev, thumbnailEn: imageData.preview || imageData.url }));
                setSelectedFiles(prev => ({ ...prev, thumbnailEn: imageData }));
              }}
              onImageRemove={() => {
                if (selectedFiles.thumbnailEn) {
                  cleanupSelectedFile(selectedFiles.thumbnailEn);
                }
                setFormData(prev => ({ ...prev, thumbnailEn: '' }));
                setSelectedFiles(prev => ({ ...prev, thumbnailEn: null }));
              }}
              initialImage={formData.thumbnailEn ? { url: formData.thumbnailEn } : null}
              className="w-full"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gymmawy-primary text-white rounded-lg hover:bg-gymmawy-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Video' : 'Create Video')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVideoModal;