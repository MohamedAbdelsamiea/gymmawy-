import apiClient from './apiClient';

class FileUploadService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  }

  /**
   * Upload a file with proper categorization
   * @param {File} file - The file to upload
   * @param {string} category - The category (plans, products, programmes, transformations, videos, etc.)
   * @param {boolean} isPublic - Whether the file should be public
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(file, category, isPublic = true) {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('category', category);
      
      const endpoint = isPublic ? '/uploads/public/images' : '/uploads/admin/images';
      const response = await apiClient.post(endpoint, formData);
      
      console.log('FileUploadService - Full response:', response);
      
      return response;
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error(error.response?.data?.error?.message || 'Upload failed');
    }
  }

  /**
   * Upload a video with proper categorization
   * @param {File} file - The video file to upload
   * @param {string} category - The category (videos, programmes, etc.)
   * @returns {Promise<Object>} Upload result
   */
  async uploadVideo(file, category = 'videos') {
    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('category', category);
      
      const response = await apiClient.post('/uploads/admin/videos', formData);
      
      return response;
    } catch (error) {
      console.error('Video upload error:', error);
      throw new Error(error.response?.data?.error?.message || 'Video upload failed');
    }
  }

  /**
   * Upload payment proof (always private)
   * @param {File} file - The payment proof file
   * @returns {Promise<Object>} Upload result
   */
  async uploadPaymentProof(file) {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await apiClient.post('/uploads/payment-proof', formData);
      
      return response;
    } catch (error) {
      console.error('Payment proof upload error:', error);
      throw new Error(error.response?.data?.error?.message || 'Payment proof upload failed');
    }
  }

  /**
   * Delete a file from the server
   * @param {string} fileId - The file ID to delete
   * @returns {Promise<Object>} Delete result
   */
  async deleteFile(fileId) {
    try {
      const response = await apiClient.delete(`/uploads/${fileId}`);
      return response.data;
    } catch (error) {
      console.error('File deletion error:', error);
      throw new Error(error.response?.data?.error?.message || 'File deletion failed');
    }
  }

  /**
   * Delete a file by URL (extracts filename and deletes)
   * @param {string} fileUrl - The file URL to delete
   * @returns {Promise<Object>} Delete result
   */
  async deleteFileByUrl(fileUrl) {
    try {
      // Extract filename from URL
      const filename = fileUrl.split('/').pop();
      const fileId = filename.split('.')[0]; // Remove extension
      
      return await this.deleteFile(fileId);
    } catch (error) {
      console.error('File deletion by URL error:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Get file URL for display
   * @param {string} filePath - The file path from server
   * @returns {string} Full URL
   */
  getFileUrl(filePath) {
    if (!filePath) return '';
    
    // If it's already a full URL, return as is
    if (filePath.startsWith('http')) {
      return filePath;
    }
    
    // If it's a relative path, prepend the base URL
    const baseURL = this.baseURL.replace('/api', '');
    return `${baseURL}${filePath}`;
  }

  /**
   * Validate file before upload
   * @param {File} file - The file to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateFile(file, options = {}) {
    const {
      maxSize = 100 * 1024 * 1024, // 100MB default
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      isVideo = false
    } = options;

    const errors = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    // Check file type
    const allowedTypesForValidation = isVideo 
      ? ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov']
      : allowedTypes;
      
    if (!allowedTypesForValidation.includes(file.type)) {
      const typeList = isVideo 
        ? 'MP4, WebM, OGG, AVI, MOV'
        : 'JPEG, PNG, GIF, WebP';
      errors.push(`File type must be one of: ${typeList}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new FileUploadService();
