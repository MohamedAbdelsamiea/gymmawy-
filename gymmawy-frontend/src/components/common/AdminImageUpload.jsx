import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Eye, Trash2 } from 'lucide-react';
import adminApiService from '../../services/adminApiService';
import { config } from '../../config';

const AdminImageUpload = ({ 
  onImageUpload, 
  onImageRemove, 
  initialImage = null, 
  className = '',
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  showPreview = true,
  showDetails = true,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(initialImage);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const fileInputRef = useRef(null);

  // Update preview when initialImage changes
  useEffect(() => {
    console.log('🔍 AdminImageUpload - initialImage changed:', initialImage);
    if (initialImage) {
      // If initialImage only has URL (from existing data), fetch full metadata
      if (initialImage.url && !initialImage.originalName) {
        console.log('🔍 AdminImageUpload - Fetching metadata for URL:', initialImage.url);
        fetchImageMetadata(initialImage.url);
      } else {
        console.log('🔍 AdminImageUpload - Setting preview directly:', initialImage);
        setPreview(initialImage);
      }
    } else {
      console.log('🔍 AdminImageUpload - No initial image, clearing preview');
      setPreview(null);
    }
  }, [initialImage]);

  // Fetch image metadata from URL
  const fetchImageMetadata = async(imageUrl) => {
    try {
      console.log('🔍 AdminImageUpload - fetchImageMetadata called with:', imageUrl);
      // Extract filename from URL to get the upload ID
      const filename = imageUrl.split('/').pop();
      const uploadId = filename.split('.')[0]; // Remove .webp extension
      console.log('🔍 AdminImageUpload - Extracted uploadId:', uploadId);
      
      // Fetch upload details from server
      const response = await adminApiService.getImage(uploadId);
      console.log('🔍 AdminImageUpload - getImage response:', response);
      if (response.success) {
        setPreview(response.upload);
      } else {
        // If we can't fetch metadata, just use the URL
        console.log('🔍 AdminImageUpload - Using URL directly (no metadata)');
        setPreview({ url: imageUrl });
      }
    } catch (error) {
      console.warn('Could not fetch image metadata:', error);
      // If we can't fetch metadata, just use the URL
      console.log('🔍 AdminImageUpload - Error, using URL directly');
      setPreview({ url: imageUrl });
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = async(file) => {
    setError(null);
    
    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }
    
    // Validate file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('category', 'images'); // Specify category
      
      const response = await adminApiService.uploadImage(formData);
      
      if (response.success) {
        const uploadedImage = response.upload;
        setPreview(uploadedImage);
        onImageUpload?.(uploadedImage);
      } else {
        throw new Error(response.error?.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = async() => {
    if (preview?.id) {
      try {
        await adminApiService.deleteImage(preview.id);
        console.log('Image removed from server');
      } catch (err) {
        console.error('Error removing image from server:', err);
      }
    }
    
    setPreview(null);
    setError(null);
    onImageRemove?.();
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) {
return '0 Bytes';
}
    if (typeof bytes !== 'number') {
      return 'Invalid size';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        className="hidden"
      />
      
      {preview ? (
        <div className="space-y-3">
          {showPreview && (
            <div className="relative group">
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={preview.url.startsWith('http') ? preview.url : `${config.API_BASE_URL}${preview.url}`}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image load error:', e);
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center space-x-2">
                  <button
                    onClick={() => setShowFullPreview(true)}
                    className="opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-all duration-200"
                    type="button"
                    title="View full size"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleRemove}
                    className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-all duration-200"
                    type="button"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {showDetails && preview && preview.originalName && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">Image Details</h4>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  WebP
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Original:</span> {preview.originalName || 'Unknown'}</p>
                <p><span className="font-medium">Size:</span> {preview.size ? formatFileSize(preview.size) : 'Unknown'}</p>
                <p><span className="font-medium">Type:</span> {preview.mimetype || 'Unknown'}</p>
                <p><span className="font-medium">Uploaded:</span> {preview.createdAt ? new Date(preview.createdAt).toLocaleDateString() : 'Unknown'}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`relative w-full h-48 border-2 border-dashed rounded-lg transition-colors duration-200 cursor-pointer ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${uploading ? 'pointer-events-none' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                <p className="text-sm text-gray-600">Converting to WebP...</p>
                <p className="text-xs text-gray-500">Maintaining highest quality</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  {dragActive ? 'Drop image here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF, WebP up to {Math.round(maxSize / 1024 / 1024)}MB
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Will be converted to WebP with highest quality
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          <div className="flex items-center">
            <X className="w-4 h-4 mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* Full size preview modal */}
      {showFullPreview && preview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={preview.url.startsWith('http') ? preview.url : `${config.API_BASE_URL}${preview.url}`}
              alt="Full size preview"
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                console.error('Full preview image load error:', e);
                e.target.style.display = 'none';
              }}
            />
            <button
              onClick={() => setShowFullPreview(false)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminImageUpload;
