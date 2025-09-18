import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Video, Loader2, Eye, Trash2, Play, Pause } from 'lucide-react';
import adminApiService from '../../services/adminApiService';
import { config } from '../../config';

const AdminVideoUpload = ({ 
  onVideoUpload, 
  onVideoRemove, 
  initialVideo = null, 
  className = '',
  maxSize = 100 * 1024 * 1024, // 100MB
  acceptedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'],
  showPreview = true,
  showDetails = true,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(initialVideo);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // Update preview when initialVideo changes
  useEffect(() => {
    console.log('🔍 AdminVideoUpload - initialVideo changed:', initialVideo);
    if (initialVideo) {
      // If initialVideo only has URL (from existing data), fetch full metadata
      if (initialVideo.url && !initialVideo.originalName) {
        console.log('🔍 AdminVideoUpload - Fetching metadata for URL:', initialVideo.url);
        fetchVideoMetadata(initialVideo.url);
      } else {
        console.log('🔍 AdminVideoUpload - Setting preview directly:', initialVideo);
        setPreview(initialVideo);
      }
    } else {
      console.log('🔍 AdminVideoUpload - No initial video, clearing preview');
      setPreview(null);
    }
  }, [initialVideo]);

  // Fetch video metadata from URL
  const fetchVideoMetadata = async(videoUrl) => {
    try {
      console.log('🔍 AdminVideoUpload - fetchVideoMetadata called with:', videoUrl);
      // Extract filename from URL to get the upload ID
      const filename = videoUrl.split('/').pop();
      const uploadId = filename.split('.')[0]; // Remove extension
      console.log('🔍 AdminVideoUpload - Extracted uploadId:', uploadId);
      
      // For now, just use the URL directly since we don't have a getVideo endpoint
      console.log('🔍 AdminVideoUpload - Using URL directly (no metadata)');
      setPreview({ url: videoUrl });
    } catch (error) {
      console.warn('Could not fetch video metadata:', error);
      // If we can't fetch metadata, just use the URL
      console.log('🔍 AdminVideoUpload - Error, using URL directly');
      setPreview({ url: videoUrl });
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
      setError('Please upload a valid video file (MP4, AVI, MOV, WMV, FLV, WebM, MKV)');
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
      formData.append('video', file);
      formData.append('module', 'videos');
      
      const response = await adminApiService.uploadVideo(formData);
      
      if (response.success) {
        const uploadedVideo = response.upload;
        setPreview(uploadedVideo);
        onVideoUpload?.(uploadedVideo);
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
        await adminApiService.deleteVideo(preview.id);
        console.log('Video removed from server');
      } catch (err) {
        console.error('Error removing video from server:', err);
      }
    }
    
    setPreview(null);
    setError(null);
    onVideoRemove?.();
    
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

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const getVideoUrl = (url) => {
    return url.startsWith('http') ? url : `${config.API_BASE_URL}${url}`;
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
                <video
                  ref={videoRef}
                  src={getVideoUrl(preview.url)}
                  className="w-full h-full object-cover"
                  onEnded={handleVideoEnded}
                  onError={(e) => {
                    console.error('Video load error:', e);
                    e.target.style.display = 'none';
                  }}
                  poster={preview.thumbnail || undefined}
                />
                
                {/* Video Controls Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <button
                    onClick={togglePlayPause}
                    className="opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-3 transition-all duration-200"
                    type="button"
                    title={isPlaying ? 'Pause video' : 'Play video'}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>
                </div>

                {/* Action Buttons Overlay */}
                <div className="absolute top-2 right-2 flex space-x-2">
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
                    title="Remove video"
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
                <h4 className="text-sm font-medium text-gray-900">Video Details</h4>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Video
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
                <p className="text-sm text-gray-600">Uploading video...</p>
                <p className="text-xs text-gray-500">Please wait</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Video className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  {dragActive ? 'Drop video here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500">
                  MP4, AVI, MOV, WMV, FLV, WebM, MKV up to {Math.round(maxSize / 1024 / 1024)}MB
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
            <video
              src={getVideoUrl(preview.url)}
              controls
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                console.error('Full preview video load error:', e);
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

export default AdminVideoUpload;
