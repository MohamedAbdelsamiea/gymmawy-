import { config } from '../config';
import apiClient from './apiClient';

const API_BASE_URL = config.API_BASE_URL;

class ImageUploadService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Upload image file
  async uploadImage(file, module = 'general') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('module', module);

      const response = await fetch(`${this.baseURL}/api/uploads/payment-proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Upload failed: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  // Delete image
  async deleteImage(filename, module = 'general') {
    try {
      const response = await apiClient.delete(`/images/${filename}?module=${module}`);
      return response;
    } catch (error) {
      console.error('Image delete error:', error);
      throw error;
    }
  }

  // Get image info
  async getImageInfo(filename, module = 'general') {
    try {
      const response = await apiClient.get(`/images/${filename}/info?module=${module}`);
      return response;
    } catch (error) {
      console.error('Get image info error:', error);
      throw error;
    }
  }

  // Generate image URL for display
  getImageUrl(filename, module = 'general') {
    if (!filename) {
return null;
}
    return `${this.baseURL}/images/images/${module}/${filename}`;
  }

  // Validate file before upload
  validateFile(file, maxSizeMB = 10) {
    const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    
    if (!file) {
      throw new Error('No file selected');
    }
    
    if (file.size > maxSize) {
      throw new Error(`File size must be less than ${maxSizeMB}MB`);
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, WebP, and GIF images are allowed');
    }
    
    return true;
  }

  // Create image preview
  createPreview(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // Extract filename from URL
  extractFilenameFromUrl(url) {
    if (!url) {
return null;
}
    const parts = url.split('/');
    return parts[parts.length - 1];
  }

  // Check if URL is from our upload service
  isUploadedImage(url) {
    if (!url) {
return false;
}
    return url.includes('/images/images/') || url.includes('/uploads/images/');
  }
}

// Create and export singleton instance
const imageUploadService = new ImageUploadService();
export default imageUploadService;
