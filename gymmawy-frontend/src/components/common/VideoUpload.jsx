import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, AlertCircle, Play } from 'lucide-react';
import adminApiService from '../../services/adminApiService';
import { config } from '../../config';

const VideoUpload = ({ 
  value = '', 
  onChange, 
  module = 'general',
  className = '',
  disabled = false,
  showUrlInput = true,
  required = false,
  maxSize = 100, // MB
  acceptedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(value);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFilename, setUploadedFilename] = useState(null);
  const fileInputRef = useRef(null);

  // Sync preview with value prop changes
  useEffect(() => {
    setPreview(value);
    
    // If the value is a URL from our upload service, extract the filename
    if (value && isUploadedVideo(value)) {
      const filename = extractFilenameFromUrl(value);
      setUploadedFilename(filename);
    } else {
      setUploadedFilename(null);
    }
  }, [value]);

  // Helper functions
  const isUploadedVideo = (url) => {
    return url && (url.includes('/videos/videos/') || url.includes('/uploads/videos/'));
  };

  const extractFilenameFromUrl = (url) => {
    if (!url) {
return null;
}
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  const validateFile = (file) => {
    if (!file) {
      throw new Error('No file selected');
    }

    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types: ${acceptedTypes.join(', ')}`);
    }

    // Check file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`File size too large. Maximum size: ${maxSize}MB`);
    }
  };

  const createPreview = (file) => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      resolve(url);
    });
  };

  // Handle file selection
  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) {
return;
}

    try {
      setError('');
      
      // Validate file
      validateFile(selectedFile);
      
      // Create preview
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
      setFile(selectedFile);
      
      // Notify parent component about the selected file
      onChange?.({
        file: selectedFile,
        preview: previewUrl,
        originalName: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        isLocal: true
      });
    } catch (err) {
      console.error('File selection error:', err);
      setError(err.message);
      setPreview('');
      setFile(null);
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) {
return;
}
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  // Handle URL input change
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setPreview(url);
    onChange(url);
    setError('');
    
    // If URL is cleared, reset uploaded filename
    if (!url) {
      setUploadedFilename(null);
    }
  };

  // Remove video
  const handleRemove = () => {
    try {
      setError('');
      
      // Clean up preview URL if it's a local file
      if (preview && file) {
        URL.revokeObjectURL(preview);
      }
      
      // Clear local state
      setFile(null);
      setPreview('');
      setUploadedFilename(null);
      onChange(''); // Notify parent component that video was removed
      setError('');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error in remove process:', err);
      setError('Failed to remove video');
    }
  };

  // Open file dialog
  const handleClick = () => {
    if (disabled) {
return;
}
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-gymmawy-primary bg-gymmawy-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {preview ? (
          <div className="space-y-4">
            <div className="relative">
              <video
                src={preview}
                className="mx-auto h-32 w-48 object-cover rounded-lg"
                controls
                onError={(e) => {
                  console.error('Video failed to load:', preview);
                  setError('Failed to load video preview');
                }}
                onLoad={() => {
                  console.log('Video loaded successfully:', preview);
                  setError('');
                }}
              />
              {/* Play button overlay for better UX */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black bg-opacity-50 rounded-full p-2">
                  <Play className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-2">
              {deleting && (
                <div className="flex items-center text-sm text-orange-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                  Deleting...
                </div>
              )}
              {!disabled && !deleting && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className="text-red-600 hover:text-red-800 p-1"
                  title={uploadedFilename ? "Remove video (will delete from server)" : "Remove video"}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gymmawy-primary">Click to upload</span>
              <span className="text-gray-500"> or drag and drop</span>
            </div>
            <p className="text-xs text-gray-500">
              MP4, WebM, OGG, AVI, MOV up to {maxSize}MB
            </p>
          </div>
        )}
      </div>

      {/* URL Input */}
      {showUrlInput && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Or Video URL
          </label>
          <input
            type="text"
            value={value}
            onChange={handleUrlChange}
            placeholder="https://example.com/video.mp4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gymmawy-primary focus:border-transparent"
            disabled={disabled}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      {/* Required Indicator */}
      {required && !value && (
        <div className="text-sm text-gray-500">
          Video is required
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
