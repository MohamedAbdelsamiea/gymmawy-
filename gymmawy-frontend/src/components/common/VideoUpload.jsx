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
  const [uploading, setUploading] = useState(false);
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
  const handleFileSelect = async(selectedFile) => {
    if (!selectedFile) {
return;
}

    try {
      setError('');
      
      // Delete old video from server if exists
      if (uploadedFilename) {
        console.log('Deleting old video before uploading new one:', uploadedFilename);
        try {
          await adminApiService.apiCall(`/videos/${uploadedFilename}?module=${module}`, {
            method: 'DELETE',
          });
          console.log('Old video deleted successfully from server');
        } catch (deleteError) {
          console.warn('Failed to delete old video from server:', deleteError.message);
          // Continue with upload even if deletion fails
        }
      } else if (preview && isUploadedVideo(preview)) {
        // Try to extract filename from the current preview URL
        const filename = extractFilenameFromUrl(preview);
        if (filename) {
          console.log('Deleting old video from preview URL before uploading new one:', filename);
          try {
            await adminApiService.apiCall(`/videos/${filename}?module=${module}`, {
              method: 'DELETE',
            });
            console.log('Old video deleted successfully from server');
          } catch (deleteError) {
            console.warn('Failed to delete old video from server:', deleteError.message);
            // Continue with upload even if deletion fails
          }
        }
      }
      
      // Validate file
      validateFile(selectedFile);
      
      // Create preview
      const previewUrl = await createPreview(selectedFile);
      setPreview(previewUrl);
      setFile(selectedFile);
      
      // Upload file
      setUploading(true);
      console.log('Uploading video:', selectedFile.name, 'to module:', module);
      const result = await adminApiService.uploadVideo(selectedFile, module);
      console.log('Upload result:', result);
      
      if (result.success) {
        // Use the uploaded URL - convert relative URL to full URL
        const baseURL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || config.API_BASE_URL;
        const videoUrl = result.data.url.startsWith('http') 
          ? result.data.url 
          : `${baseURL}${result.data.url}`;
        
        console.log('Final video URL:', videoUrl);
        
        // Store the uploaded filename for deletion
        setUploadedFilename(result.data.filename);
        
        // Update both preview and parent component
        setPreview(videoUrl);
        onChange(videoUrl);
        setError('');
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
      setPreview('');
      setFile(null);
    } finally {
      setUploading(false);
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
  const handleRemove = async() => {
    try {
      setDeleting(true);
      setError('');
      
      console.log('Starting video removal process...');
      console.log('uploadedFilename:', uploadedFilename);
      console.log('preview:', preview);
      console.log('module:', module);
      
      // If we have an uploaded filename, delete it from the server
      if (uploadedFilename) {
        console.log('Deleting uploaded video:', uploadedFilename, 'from module:', module);
        try {
          const result = await adminApiService.apiCall(`/videos/${uploadedFilename}?module=${module}`, {
            method: 'DELETE',
          });
          console.log('Video deleted successfully from server:', result);
        } catch (deleteError) {
          console.error('Failed to delete video from server:', deleteError);
          console.warn('Video might not exist on server, continuing with local cleanup');
        }
      } else if (preview && isUploadedVideo(preview)) {
        // Try to extract filename from the current preview URL
        const filename = extractFilenameFromUrl(preview);
        if (filename) {
          console.log('Deleting video from preview URL:', filename, 'from module:', module);
          try {
            const result = await adminApiService.apiCall(`/videos/${filename}?module=${module}`, {
              method: 'DELETE',
            });
            console.log('Video deleted successfully from server:', result);
          } catch (deleteError) {
            console.error('Failed to delete video from server:', deleteError);
            console.warn('Video might not exist on server, continuing with local cleanup');
          }
        } else {
          console.log('Could not extract filename from preview URL:', preview);
        }
      } else {
        console.log('No uploaded video to delete from server');
      }
    } catch (err) {
      console.error('Error in remove process:', err);
      // Don't show error to user for deletion failures, just log it
    } finally {
      setDeleting(false);
    }
    
    // Always clear the local state regardless of server deletion result
    console.log('Clearing local state...');
    setFile(null);
    setPreview('');
    setUploadedFilename(null);
    onChange(''); // Notify parent component that video was removed
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    console.log('Video removal process completed');
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
              {uploading && (
                <div className="flex items-center text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Uploading...
                </div>
              )}
              {deleting && (
                <div className="flex items-center text-sm text-orange-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                  Deleting...
                </div>
              )}
              {!disabled && !uploading && !deleting && (
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
