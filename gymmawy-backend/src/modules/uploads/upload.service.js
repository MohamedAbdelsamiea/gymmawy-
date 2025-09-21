import fs from 'fs';
import path from 'path';

// Create upload record (no database storage needed for file uploads)
export const createUploadRecord = async (uploadData) => {
  // For now, we'll just return the upload data without database storage
  // This can be extended later if we need to track uploads in the database
  return {
    id: uploadData.id,
    originalName: uploadData.originalName,
    fileName: uploadData.fileName,
    url: uploadData.url,
    size: uploadData.size,
    mimetype: uploadData.mimetype,
    category: uploadData.category || 'images',
    isPublic: uploadData.isPublic,
    uploadedBy: uploadData.uploadedBy || null
  };
};

// Get upload by ID (placeholder - no database storage)
export const getUploadById = async (id) => {
  // Since we're not storing uploads in database, return null
  return null;
};

// Get uploads by user (placeholder - no database storage)
export const getUploadsByUser = async (userId) => {
  // Since we're not storing uploads in database, return empty array
  return [];
};

// Get public uploads (placeholder - no database storage)
export const getPublicUploads = async () => {
  // Since we're not storing uploads in database, return empty array
  return [];
};

// Get admin uploads (placeholder - no database storage)
export const getAdminUploads = async () => {
  // Since we're not storing uploads in database, return empty array
  return [];
};

// Delete upload file (no database record to delete)
export const deleteUpload = async (filePath) => {
  try {
    // Delete file from filesystem
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
      return { success: true, message: 'File deleted successfully' };
    } else {
      throw new Error('File not found');
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Clean up old files (simplified version without database)
export const cleanupOrphanedFiles = async () => {
  try {
    const uploadDirs = [
      'uploads/content/plans',
      'uploads/content/products',
      'uploads/content/programmes',
      'uploads/content/transformations',
      'uploads/content/videos',
      'uploads/content/documents',
      'uploads/payment-proofs',
      'uploads/temp'
    ];
    const cleanedFiles = [];

    for (const dir of uploadDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
          
          // Delete files older than 30 days
          if (ageInDays > 30) {
            fs.unlinkSync(filePath);
            cleanedFiles.push(filePath);
            console.log(`Cleaned up old file: ${filePath}`);
          }
        }
      }
    }

    return { 
      success: true, 
      message: `Cleaned up ${cleanedFiles.length} old files`,
      cleanedFiles 
    };
  } catch (error) {
    console.error('Error cleaning up old files:', error);
    throw error;
  }
};

// Get uploads by category (placeholder - no database storage)
export const getUploadsByCategory = async (category, isPublic = false) => {
  return [];
};

// Get payment proof uploads (placeholder - no database storage)
export const getPaymentProofs = async () => {
  return [];
};

// Get public images (placeholder - no database storage)
export const getPublicImages = async () => {
  return [];
};

// Get private images (placeholder - no database storage)
export const getPrivateImages = async () => {
  return [];
};

// Get upload statistics (placeholder - no database storage)
export const getUploadStats = async () => {
  return {
    totalUploads: 0,
    publicUploads: 0,
    privateUploads: 0,
    totalSize: 0,
    categoryStats: []
  };
};
