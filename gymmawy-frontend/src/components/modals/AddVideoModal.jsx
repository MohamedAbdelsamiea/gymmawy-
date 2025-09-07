import React, { useState, useEffect } from 'react';
import { X, Upload, Video as VideoIcon, Play } from 'lucide-react';
import adminApiService from '../../services/adminApiService';
import ImageUpload from '../common/ImageUpload';
import VideoUpload from '../common/VideoUpload';

const AddVideoModal = ({ isOpen, onClose, onSuccess, video = null, isEdit = false }) => {
  
  const [formData, setFormData] = useState({
    title: { en: '', ar: '' },
    videoUrl: '',
    thumbnailEn: '',
    thumbnailAr: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Always reset form data first
      setFormData({
        title: { en: '', ar: '' },
        videoUrl: '',
        thumbnailEn: '',
        thumbnailAr: ''
      });
      setErrors({});
      
      // Then populate with video data if editing
      if (video && isEdit) {
        setFormData({
          title: video.title || { en: '', ar: '' },
          videoUrl: video.videoUrl || '',
          thumbnailEn: video.thumbnailEn || '',
          thumbnailAr: video.thumbnailAr || ''
        });
      }
    }
  }, [isOpen, video, isEdit]);

  // Additional effect to force reset when video becomes null
  useEffect(() => {
    if (isOpen && !video && !isEdit) {
      setFormData({
        title: { en: '', ar: '' },
        videoUrl: '',
        thumbnailEn: '',
        thumbnailAr: ''
      });
      setErrors({});
    }
  }, [isOpen, video, isEdit]);

  // Force reset when modal opens in create mode
  useEffect(() => {
    if (isOpen && !isEdit) {
      setFormData({
        title: { en: '', ar: '' },
        videoUrl: '',
        thumbnailEn: '',
        thumbnailAr: ''
      });
      setErrors({});
    }
  }, [isOpen, isEdit]);

  // Additional effect to force reset when isEdit becomes false
  useEffect(() => {
    if (isOpen && !isEdit && !video) {
      setFormData({
        title: { en: '', ar: '' },
        videoUrl: '',
        thumbnailEn: '',
        thumbnailAr: ''
      });
      setErrors({});
    }
  }, [isOpen, isEdit, video]);

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

    if (!formData.videoUrl.trim()) {
      newErrors.videoUrl = 'Video URL is required';
    }

    if (!formData.thumbnailEn.trim()) {
      newErrors.thumbnailEn = 'English thumbnail is required';
    }

    if (!formData.thumbnailAr.trim()) {
      newErrors.thumbnailAr = 'Arabic thumbnail is required';
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
        videoUrl: formData.videoUrl,
        thumbnailEn: formData.thumbnailEn,
        thumbnailAr: formData.thumbnailAr
      };

      if (isEdit && video) {
        await adminApiService.updateVideo(video.id, submitData);
      } else {
        await adminApiService.createVideo(submitData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving video:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!video || !isEdit) return;
    
    if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      setLoading(true);
      try {
        await adminApiService.deleteVideo(video.id);
        onSuccess();
        onClose();
      } catch (error) {
        console.error('Error deleting video:', error);
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
            {isEdit ? 'Edit Video' : 'Add New Video'}
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
              placeholder="Enter video title in English"
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
              placeholder="أدخل عنوان الفيديو بالعربية"
              dir="rtl"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video *
            </label>
            <VideoUpload
              value={formData.videoUrl}
              onChange={(url) => setFormData(prev => ({ ...prev, videoUrl: url }))}
              module="videos"
              required={true}
              className={errors.videoUrl ? 'border-red-300' : ''}
            />
            {errors.videoUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.videoUrl}</p>
            )}
          </div>

          {/* Thumbnail - English */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thumbnail (English) *
            </label>
            <ImageUpload
              value={formData.thumbnailEn}
              onChange={(url) => {
                setFormData(prev => ({
                  ...prev,
                  thumbnailEn: url
                }));
              }}
              module="videos"
              required={true}
              className={errors.thumbnailEn ? 'border-red-300' : ''}
            />
            {errors.thumbnailEn && (
              <p className="mt-1 text-sm text-red-600">{errors.thumbnailEn}</p>
            )}
          </div>

          {/* Thumbnail - Arabic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thumbnail (Arabic) *
            </label>
            <ImageUpload
              value={formData.thumbnailAr}
              onChange={(url) => {
                setFormData(prev => ({
                  ...prev,
                  thumbnailAr: url
                }));
              }}
              module="videos"
              required={true}
              className={errors.thumbnailAr ? 'border-red-300' : ''}
            />
            {errors.thumbnailAr && (
              <p className="mt-1 text-sm text-red-600">{errors.thumbnailAr}</p>
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
                  Delete Video
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

export default AddVideoModal;