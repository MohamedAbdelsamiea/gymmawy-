import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import imageUploadService from '../../services/imageUploadService';

const ImageUpload = ({ 
  value = '', 
  onChange, 
  module = 'general',
  className = '',
  disabled = false,
  showUrlInput = true,
  required = false,
  maxSize = 5, // MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFilename, setUploadedFilename] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef(null);

  // Sync preview with value prop changes
  useEffect(() => {
    setPreview(value);
    setImageLoadError(false); // Reset error state when value changes
    
    // If the value is a URL from our upload service, extract the filename
    if (value && imageUploadService.isUploadedImage(value)) {
      const filename = imageUploadService.extractFilenameFromUrl(value);
      setUploadedFilename(filename);
    } else {
      setUploadedFilename(null);
    }
  }, [value]);

  // Cleanup function to handle component unmount
  useEffect(() => {
    return () => {
      // If component unmounts and we have an uploaded file that's not being used,
      // we could potentially clean it up, but this might be too aggressive
      // as the user might just be navigating between tabs
      // For now, we'll leave this as a placeholder for future enhancement
    };
  }, []);

  // Handle file selection
  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;

    try {
      setError('');
      
      // Delete old image from server if exists
      if (uploadedFilename) {
        console.log('Deleting old image before uploading new one:', uploadedFilename);
        try {
          await imageUploadService.deleteImage(uploadedFilename, module);
          console.log('Old image deleted successfully from server');
        } catch (deleteError) {
          console.warn('Failed to delete old image from server:', deleteError.message);
          // Continue with upload even if deletion fails
        }
      } else if (preview && imageUploadService.isUploadedImage(preview)) {
        // Try to extract filename from the current preview URL
        const filename = imageUploadService.extractFilenameFromUrl(preview);
        if (filename) {
          console.log('Deleting old image from preview URL before uploading new one:', filename);
          try {
            await imageUploadService.deleteImage(filename, module);
            console.log('Old image deleted successfully from server');
          } catch (deleteError) {
            console.warn('Failed to delete old image from server:', deleteError.message);
            // Continue with upload even if deletion fails
          }
        }
      }
      
      // Validate file
      imageUploadService.validateFile(selectedFile, maxSize);
      
      // Create preview
      const previewUrl = await imageUploadService.createPreview(selectedFile);
      setPreview(previewUrl);
      setFile(selectedFile);
      
      // Upload file
      setUploading(true);
      console.log('Uploading file:', selectedFile.name, 'to module:', module);
      const result = await imageUploadService.uploadImage(selectedFile, module);
      console.log('Upload result:', result);
      
      if (result.success) {
        // Use the single optimized URL - convert relative URL to full URL
        const baseURL = imageUploadService.baseURL || 'http://localhost:3000';
        const imageUrl = result.data.url.startsWith('http') 
          ? result.data.url 
          : `${baseURL}${result.data.url}`;
        
        console.log('Final image URL:', imageUrl);
        
        // Store the uploaded filename for deletion
        setUploadedFilename(result.data.filename);
        
        // Update both preview and parent component
        setPreview(imageUrl);
        onChange(imageUrl);
        setError('');
        
        // Force a small delay to ensure the image is accessible
        setTimeout(() => {
          setPreview(imageUrl);
        }, 100);
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
    
    if (disabled) return;
    
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

  // Remove image
  const handleRemove = async () => {
    try {
      setDeleting(true);
      setError('');
      
      console.log('Starting image removal process...');
      console.log('uploadedFilename:', uploadedFilename);
      console.log('preview:', preview);
      console.log('module:', module);
      
      // If we have an uploaded filename, delete it from the server
      if (uploadedFilename) {
        console.log('Deleting uploaded file:', uploadedFilename, 'from module:', module);
        try {
          const result = await imageUploadService.deleteImage(uploadedFilename, module);
          console.log('File deleted successfully from server:', result);
        } catch (deleteError) {
          console.error('Failed to delete file from server:', deleteError);
          console.warn('File might not exist on server, continuing with local cleanup');
        }
      } else if (preview && imageUploadService.isUploadedImage(preview)) {
        // Try to extract filename from the current preview URL
        const filename = imageUploadService.extractFilenameFromUrl(preview);
        if (filename) {
          console.log('Deleting file from preview URL:', filename, 'from module:', module);
          try {
            const result = await imageUploadService.deleteImage(filename, module);
            console.log('File deleted successfully from server:', result);
          } catch (deleteError) {
            console.error('Failed to delete file from server:', deleteError);
            console.warn('File might not exist on server, continuing with local cleanup');
          }
        } else {
          console.log('Could not extract filename from preview URL:', preview);
        }
      } else {
        console.log('No uploaded file to delete from server');
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
    onChange(''); // Notify parent component that image was removed
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    console.log('Image removal process completed');
  };

  // Open file dialog
  const handleClick = () => {
    if (disabled) return;
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
              <img
                src={preview}
                alt="Preview"
                className="mx-auto h-32 w-32 object-cover rounded-lg"
                crossOrigin="anonymous"
                onError={(e) => {
                  console.error('Image failed to load:', preview);
                  setImageLoadError(true);
                  // Don't clear the preview immediately, try to handle CORS issues
                  if (preview.includes('/images/images/') || preview.includes('/uploads/images/')) {
                    console.warn('CORS issue detected, image may still be valid');
                    // Show a placeholder instead of hiding the image
                    e.target.style.display = 'none';
                    setError('Image preview blocked by CORS policy, but image is uploaded successfully');
                  } else {
                    setError('Failed to load image preview');
                    setPreview('');
                  }
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', preview);
                  setError('');
                  setImageLoadError(false);
                }}
              />
              {/* Fallback display for CORS-blocked images - only show when there's actually an error */}
              {imageLoadError && (preview.includes('/images/images/') || preview.includes('/uploads/images/')) && (
                <div className="mx-auto h-32 w-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-xs">Image uploaded</div>
                    <div className="text-xs">Preview blocked</div>
                  </div>
                </div>
              )}
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
                  title={uploadedFilename ? "Remove image (will delete from server)" : "Remove image"}
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
              PNG, JPG, WebP, GIF up to {maxSize}MB (converted to WebP)
            </p>
          </div>
        )}
      </div>

      {/* URL Input */}
      {showUrlInput && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Or Image URL
          </label>
          <input
            type="text"
            value={value}
            onChange={handleUrlChange}
            placeholder="https://example.com/image.jpg"
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
          Image is required
        </div>
      )}
    </div>
  );
};

export default ImageUpload;