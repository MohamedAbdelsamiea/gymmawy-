import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

const ImageUpload = ({ 
  onImageUpload, 
  onImageRemove, 
  initialImage = null, 
  isPublic = false, 
  className = '',
  maxSize = 100 * 1024 * 1024, // 100MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(initialImage);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

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
        <div className="relative group">
          <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={preview.url}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
              <button
                onClick={handleRemove}
                className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-all duration-200"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <p className="font-medium">{preview.originalName}</p>
            <p className="text-xs">{(preview.size / 1024 / 1024).toFixed(2)} MB</p>
            {preview.isLocal && (
              <p className="text-xs text-blue-600 font-medium">Ready to upload</p>
            )}
          </div>
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
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;