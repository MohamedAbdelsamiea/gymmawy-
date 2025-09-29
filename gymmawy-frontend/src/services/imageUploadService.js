import apiClient from './apiClient';

class ImageUploadService {
  constructor() {
    this.baseURL = ''; // Will be set by apiClient
  }

  // Upload image file
  async uploadImage(file, module = 'general') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('module', module);

      return await apiClient.post('/uploads/payment-proof', formData);
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
    // This will be handled by the backend URL construction
    return `/images/images/${module}/${filename}`;
  }

  // Validate file before upload
  validateFile(file, maxSizeMB = 100) {
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
