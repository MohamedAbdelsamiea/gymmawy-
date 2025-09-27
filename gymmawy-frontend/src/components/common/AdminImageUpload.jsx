import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Eye, Trash2 } from 'lucide-react';
import adminApiService from '../../services/adminApiService';
import { config } from '../../config';

const AdminImageUpload = ({ 
  onImageUpload, 
  onImageRemove, 
  initialImage = null, 
  className = '',
  maxSize = 100 * 1024 * 1024, // 100MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  showPreview = true,
  showDetails = true,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(initialImage);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const fileInputRef = useRef(null);

  // Update preview when initialImage changes
  useEffect(() => {
    if (initialImage) {
      // If initialImage only has URL (from existing data), fetch full metadata
      if (initialImage.url && !initialImage.originalName) {
        fetchImageMetadata(initialImage.url);
      } else {
        setPreview(initialImage);
      }
    } else {
      setPreview(null);
    }
  }, [initialImage]);

  // Fetch image metadata from URL
    const fetchImageMetadata = async(imageUrl) => {
      try {
        // For blob URLs or local URLs, just use them directly
        if (imageUrl.startsWith('blob:') || imageUrl.includes('localhost:5173')) {
          setPreview({ url: imageUrl });
          return;
        }

        // Only try to fetch metadata for URLs that look like our upload system
        if (!imageUrl.includes('/uploads/') && !imageUrl.includes('/content/')) {
          setPreview({ url: imageUrl });
          return;
        }

        // For newly uploaded images, we might not have metadata yet
        // Skip metadata fetching for now and just use the URL
        setPreview({ url: imageUrl });
        
        // TODO: Implement proper metadata fetching when the upload system is enhanced
        // This would require the upload system to store metadata in a database
        
      } catch (error) {
        // If we can't fetch metadata, just use the URL
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

  const handleFile = (file) => {
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

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Store file and preview
    setSelectedFile(file);
    setPreview({
      url: previewUrl,
      originalName: file.name,
      size: file.size,
      type: file.type,
      isLocal: true // Mark as local file
    });
    
    // Notify parent component about the selected file
    onImageUpload?.({
      file: file,
      preview: previewUrl,
      originalName: file.name,
      size: file.size,
      type: file.type,
      isLocal: true
    });
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    // Clean up preview URL if it's a local file
    if (preview?.isLocal && preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
    
    setPreview(null);
    setSelectedFile(null);
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
                  src={preview.url.startsWith('http') || preview.url.startsWith('blob:') ? preview.url : `${config.STATIC_BASE_URL}${preview.url}`}
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
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">
                {dragActive ? 'Drop image here' : 'Click to select or drag and drop'}
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF, WebP up to {Math.round(maxSize / 1024 / 1024)}MB
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Ready to upload on form submission
              </p>
            </div>
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
              src={preview.url.startsWith('http') || preview.url.startsWith('blob:') ? preview.url : `${config.API_BASE_URL}${preview.url}`}
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
