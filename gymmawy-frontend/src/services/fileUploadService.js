import apiClient from './apiClient';

class FileUploadService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
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
      
      // Upload routes are mounted directly at /uploads, not /api/uploads
      // So we need to bypass the apiClient's automatic /api prefix
      const uploadUrl = `${this.baseURL}${endpoint}`;
      
      const token = localStorage.getItem('accessToken');
      const userCurrencyPreference = localStorage.getItem('userCurrencyPreference');
      
      const headers = {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(userCurrencyPreference && { 'X-User-Currency': userCurrencyPreference }),
      };
      
      console.log('FileUploadService - Upload URL:', uploadUrl);
      console.log('FileUploadService - Headers:', headers);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } catch (parseError) {
          errorMessage = response.statusText || `HTTP error! status: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      console.log('FileUploadService - Full response:', responseData);
      
      return responseData;
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error(error.message || 'Upload failed');
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
      
      // Upload routes are mounted directly at /uploads, not /api/uploads
      const uploadUrl = `${this.baseURL}/uploads/admin/videos`;
      
      const token = localStorage.getItem('accessToken');
      const userCurrencyPreference = localStorage.getItem('userCurrencyPreference');
      
      const headers = {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(userCurrencyPreference && { 'X-User-Currency': userCurrencyPreference }),
      };
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } catch (parseError) {
          errorMessage = response.statusText || `HTTP error! status: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('Video upload error:', error);
      throw new Error(error.message || 'Video upload failed');
    }
  }

  /**
   * Upload a PDF file
   * @param {File} file - The PDF file to upload
   * @returns {Promise<Object>} Upload result
   */
  async uploadPDF(file) {
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      
      // Upload routes are mounted directly at /uploads, not /api/uploads
      const uploadUrl = `${this.baseURL}/uploads/admin/pdfs`;
      
      const token = localStorage.getItem('accessToken');
      const userCurrencyPreference = localStorage.getItem('userCurrencyPreference');
      
      const headers = {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(userCurrencyPreference && { 'X-User-Currency': userCurrencyPreference }),
      };
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } catch (parseError) {
          errorMessage = response.statusText || `HTTP error! status: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('PDF upload error:', error);
      throw new Error(error.message || 'PDF upload failed');
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
      
      // Upload routes are mounted directly at /uploads, not /api/uploads
      const uploadUrl = `${this.baseURL}/uploads/payment-proof`;
      
      const token = localStorage.getItem('accessToken');
      const userCurrencyPreference = localStorage.getItem('userCurrencyPreference');
      
      const headers = {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(userCurrencyPreference && { 'X-User-Currency': userCurrencyPreference }),
      };
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } catch (parseError) {
          errorMessage = response.statusText || `HTTP error! status: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('Payment proof upload error:', error);
      throw new Error(error.message || 'Payment proof upload failed');
    }
  }

  /**
   * Delete a file from the server
   * @param {string} fileId - The file ID to delete
   * @param {string} category - The file category (products, programmes, videos)
   * @returns {Promise<Object>} Delete result
   */
  async deleteFile(fileId, category = 'products') {
    try {
      // Use the CMS module DELETE route
      const deleteUrl = `${this.baseURL}/api/cms/files/${fileId}?category=${category}`;
      
      const token = localStorage.getItem('accessToken');
      const userCurrencyPreference = localStorage.getItem('userCurrencyPreference');
      
      const headers = {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(userCurrencyPreference && { 'X-User-Currency': userCurrencyPreference }),
      };
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('FileUploadService - Delete response:', responseData);
      return responseData;
    } catch (error) {
      console.error('File deletion error:', error);
      throw new Error(error.message || 'File deletion failed');
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
      const extension = filename.split('.')[1]; // Get extension
      
      // Determine category based on URL path and extension
      let category = 'products'; // default
      if (fileUrl.includes('/uploads/programmes/') || extension === 'pdf') {
        category = 'programmes';
      } else if (fileUrl.includes('/content/videos/')) {
        category = 'videos';
      }
      
      return await this.deleteFile(fileId, category);
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
      isVideo = false,
      isPDF = false
    } = options;

    const errors = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    // Check file type
    let allowedTypesForValidation;
    let typeList;
    
    if (isPDF) {
      allowedTypesForValidation = ['application/pdf'];
      typeList = 'PDF';
    } else if (isVideo) {
      allowedTypesForValidation = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
      typeList = 'MP4, WebM, OGG, AVI, MOV';
    } else {
      allowedTypesForValidation = allowedTypes;
      typeList = 'JPEG, PNG, GIF, WebP';
    }
      
    if (!allowedTypesForValidation.includes(file.type)) {
      errors.push(`File type must be one of: ${typeList}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new FileUploadService();
