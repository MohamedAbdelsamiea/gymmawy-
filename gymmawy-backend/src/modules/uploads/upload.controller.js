import fs from 'fs';
import path from 'path';
import { 
  createUploadRecord, 
  getUploadById, 
  getUploadsByUser, 
  getPublicUploads, 
  getAdminUploads, 
  deleteUpload, 
  cleanupOrphanedFiles, 
  getUploadStats,
  getUploadsByCategory,
  getPaymentProofs,
  getPublicImages,
  getPrivateImages
} from './upload.service.js';

// Upload image (public)
export const uploadPublicImage = async (req, res, next) => {
  try {
    if (!req.uploadedFile) {
      return res.status(400).json({ 
        error: { message: 'No file uploaded' } 
      });
    }

    const uploadData = {
      ...req.uploadedFile,
      isPublic: true,
      uploadedBy: req.user?.id || null
    };

    const upload = await createUploadRecord(uploadData);
    
    res.status(201).json({
      success: true,
      upload: {
        id: upload.id,
        originalName: upload.originalName,
        fileName: upload.fileName,
        url: upload.url,
        size: upload.size,
        mimetype: upload.mimetype,
        isPublic: upload.isPublic,
        createdAt: upload.createdAt
      }
    });
  } catch (error) {
    console.error('Error uploading public image:', error);
    res.status(500).json({ 
      error: { message: 'Failed to upload image' } 
    });
  }
};

// Upload image (admin)
export const uploadAdminImage = async (req, res, next) => {
  try {
    if (!req.uploadedFile) {
      return res.status(400).json({ 
        error: { message: 'No file uploaded' } 
      });
    }

    const uploadData = {
      ...req.uploadedFile,
      isPublic: false, // Admin uploads are private (only accessible by admins)
      uploadedBy: req.user?.id || null
    };

    const upload = await createUploadRecord(uploadData);
    
    res.status(201).json({
      success: true,
      upload: {
        id: upload.id,
        originalName: upload.originalName,
        fileName: upload.fileName,
        url: upload.url,
        size: upload.size,
        mimetype: upload.mimetype,
        category: upload.category,
        isPublic: upload.isPublic,
        createdAt: upload.createdAt
      }
    });
  } catch (error) {
    console.error('Error uploading admin image:', error);
    res.status(500).json({ 
      error: { message: 'Failed to upload image' } 
    });
  }
};

// Upload document (public)
export const uploadPublicDocument = async (req, res, next) => {
  try {
    if (!req.uploadedFile) {
      return res.status(400).json({ 
        error: { message: 'No file uploaded' } 
      });
    }

    const uploadData = {
      ...req.uploadedFile,
      isPublic: true,
      uploadedBy: req.user?.id || null
    };

    const upload = await createUploadRecord(uploadData);
    
    res.status(201).json({
      success: true,
      upload: {
        id: upload.id,
        originalName: upload.originalName,
        fileName: upload.fileName,
        url: upload.url,
        size: upload.size,
        mimetype: upload.mimetype,
        category: upload.category,
        isPublic: upload.isPublic,
        createdAt: upload.createdAt
      }
    });
  } catch (error) {
    console.error('Error uploading public document:', error);
    res.status(500).json({ 
      error: { message: 'Failed to upload document' } 
    });
  }
};

// Upload document (admin)
export const uploadAdminDocument = async (req, res, next) => {
  try {
    if (!req.uploadedFile) {
      return res.status(400).json({ 
        error: { message: 'No file uploaded' } 
      });
    }

    const uploadData = {
      ...req.uploadedFile,
      isPublic: false,
      uploadedBy: req.user?.id || null
    };

    const upload = await createUploadRecord(uploadData);
    
    res.status(201).json({
      success: true,
      upload: {
        id: upload.id,
        originalName: upload.originalName,
        fileName: upload.fileName,
        url: upload.url,
        size: upload.size,
        mimetype: upload.mimetype,
        category: upload.category,
        isPublic: upload.isPublic,
        createdAt: upload.createdAt
      }
    });
  } catch (error) {
    console.error('Error uploading admin document:', error);
    res.status(500).json({ 
      error: { message: 'Failed to upload document' } 
    });
  }
};

// Upload video (admin)
export const uploadAdminVideo = async (req, res, next) => {
  try {
    if (!req.uploadedFile) {
      return res.status(400).json({ 
        error: { message: 'No file uploaded' } 
      });
    }

    const uploadData = {
      ...req.uploadedFile,
      isPublic: true, // Videos should be public for UI display
      uploadedBy: req.user?.id || null
    };

    const upload = await createUploadRecord(uploadData);
    
    res.status(201).json({
      success: true,
      upload: {
        id: upload.id,
        originalName: upload.originalName,
        fileName: upload.fileName,
        url: upload.url,
        size: upload.size,
        mimetype: upload.mimetype,
        category: upload.category,
        isPublic: upload.isPublic,
        createdAt: upload.createdAt
      }
    });
  } catch (error) {
    console.error('Error uploading admin video:', error);
    res.status(500).json({ 
      error: { message: 'Failed to upload video' } 
    });
  }
};

// Get upload by ID - generate metadata from filesystem
export const getUpload = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Since we don't store uploads in database, we need to find the file by ID
    // and generate metadata from the filesystem
    const uploadDirs = [
      'uploads/content/images',
      'uploads/content/videos', 
      'uploads/content/documents',
      'uploads/admin/images',
      'uploads/admin/documents',
      'uploads/payment-proofs'
    ];
    
    let foundFile = null;
    let uploadDir = null;
    
    // Search for the file in all upload directories
    for (const dir of uploadDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        const matchingFile = files.find(file => file.startsWith(id));
        
        if (matchingFile) {
          foundFile = matchingFile;
          uploadDir = dir;
          break;
        }
      }
    }
    
    if (!foundFile) {
      return res.status(404).json({ 
        error: { message: 'Upload not found' } 
      });
    }
    
    const filePath = path.join(uploadDir, foundFile);
    const stats = fs.statSync(filePath);
    
    // Determine if it's public based on directory
    const isPublic = uploadDir.includes('content/');
    const isPaymentProof = uploadDir.includes('payment-proofs');
    
    // Generate URL based on directory structure
    let url;
    if (isPaymentProof) {
      url = `/uploads/payment-proofs/${foundFile}`;
    } else if (uploadDir.includes('content/')) {
      const subDir = uploadDir.replace('uploads/content/', '');
      url = `/uploads/content/${subDir}/${foundFile}`;
    } else if (uploadDir.includes('admin/')) {
      const subDir = uploadDir.replace('uploads/admin/', '');
      url = `/uploads/admin/${subDir}/${foundFile}`;
    } else {
      url = `/uploads/${foundFile}`;
    }
    
    // Determine category from directory
    let category = 'images';
    if (uploadDir.includes('videos')) category = 'videos';
    else if (uploadDir.includes('documents')) category = 'documents';
    else if (uploadDir.includes('payment-proofs')) category = 'payment-proof';
    
    // Determine mimetype from file extension
    const ext = path.extname(foundFile).toLowerCase();
    let mimetype = 'application/octet-stream';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      mimetype = `image/${ext.slice(1)}`;
    } else if (['.mp4', '.avi', '.mov', '.wmv'].includes(ext)) {
      mimetype = `video/${ext.slice(1)}`;
    } else if (['.pdf'].includes(ext)) {
      mimetype = 'application/pdf';
    }
    
    const upload = {
      id: id,
      originalName: foundFile, // We don't have the original name stored
      fileName: foundFile,
      url: url,
      size: stats.size,
      mimetype: mimetype,
      category: category,
      isPublic: isPublic,
      createdAt: stats.birthtime,
      updatedAt: stats.mtime
    };

    res.json({
      success: true,
      upload
    });
  } catch (error) {
    console.error('Error getting upload:', error);
    res.status(500).json({ 
      error: { message: 'Failed to get upload' } 
    });
  }
};

// Get user uploads
export const getUserUploads = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        error: { message: 'User not authenticated' } 
      });
    }

    const uploads = await getUploadsByUser(userId);
    
    res.json({
      success: true,
      uploads
    });
  } catch (error) {
    console.error('Error getting user uploads:', error);
    res.status(500).json({ 
      error: { message: 'Failed to get user uploads' } 
    });
  }
};

// Get public uploads
export const getPublicUploadsController = async (req, res, next) => {
  try {
    const uploads = await getPublicUploads();
    
    res.json({
      success: true,
      uploads
    });
  } catch (error) {
    console.error('Error getting public uploads:', error);
    res.status(500).json({ 
      error: { message: 'Failed to get public uploads' } 
    });
  }
};

// Get admin uploads
export const getAdminUploadsController = async (req, res, next) => {
  try {
    const uploads = await getAdminUploads();
    
    res.json({
      success: true,
      uploads
    });
  } catch (error) {
    console.error('Error getting admin uploads:', error);
    res.status(500).json({ 
      error: { message: 'Failed to get admin uploads' } 
    });
  }
};

// Delete upload
export const deleteUploadController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deleteUpload(id);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error deleting upload:', error);
    res.status(500).json({ 
      error: { message: 'Failed to delete upload' } 
    });
  }
};

// Cleanup orphaned files
export const cleanupOrphanedFilesController = async (req, res, next) => {
  try {
    const result = await cleanupOrphanedFiles();
    
    res.json({
      success: true,
      message: result.message,
      orphanedFiles: result.orphanedFiles
    });
  } catch (error) {
    console.error('Error cleaning up orphaned files:', error);
    res.status(500).json({ 
      error: { message: 'Failed to cleanup orphaned files' } 
    });
  }
};

// Get uploads by category
export const getUploadsByCategoryController = async (req, res, next) => {
  try {
    const { category, isPublic } = req.query;
    const uploads = await getUploadsByCategory(category, isPublic === 'true');
    
    res.json({
      success: true,
      uploads
    });
  } catch (error) {
    console.error('Error getting uploads by category:', error);
    res.status(500).json({ 
      error: { message: 'Failed to get uploads by category' } 
    });
  }
};

// Get payment proofs
export const getPaymentProofsController = async (req, res, next) => {
  try {
    const uploads = await getPaymentProofs();
    
    res.json({
      success: true,
      uploads
    });
  } catch (error) {
    console.error('Error getting payment proofs:', error);
    res.status(500).json({ 
      error: { message: 'Failed to get payment proofs' } 
    });
  }
};

// Get public images
export const getPublicImagesController = async (req, res, next) => {
  try {
    const uploads = await getPublicImages();
    
    res.json({
      success: true,
      uploads
    });
  } catch (error) {
    console.error('Error getting public images:', error);
    res.status(500).json({ 
      error: { message: 'Failed to get public images' } 
    });
  }
};

// Get private images
export const getPrivateImagesController = async (req, res, next) => {
  try {
    const uploads = await getPrivateImages();
    
    res.json({
      success: true,
      uploads
    });
  } catch (error) {
    console.error('Error getting private images:', error);
    res.status(500).json({ 
      error: { message: 'Failed to get private images' } 
    });
  }
};

// Upload payment proof
export const uploadPaymentProof = async (req, res, next) => {
  try {
    if (!req.uploadedFile) {
      return res.status(400).json({ 
        error: { message: 'No file uploaded' } 
      });
    }

    const uploadData = {
      ...req.uploadedFile,
      isPublic: false, // Payment proofs should be private
      category: 'payment-proof',
      uploadedBy: req.user?.id || null
    };

    const upload = await createUploadRecord(uploadData);
    
    res.status(201).json({
      success: true,
      upload: {
        id: upload.id,
        originalName: upload.originalName,
        fileName: upload.fileName,
        url: upload.url,
        size: upload.size,
        mimetype: upload.mimetype,
        category: upload.category,
        isPublic: upload.isPublic,
        createdAt: upload.createdAt
      }
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({ 
      error: { message: 'Failed to upload payment proof' } 
    });
  }
};

// Get upload statistics
export const getUploadStatsController = async (req, res, next) => {
  try {
    const stats = await getUploadStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting upload stats:', error);
    res.status(500).json({ 
      error: { message: 'Failed to get upload stats' } 
    });
  }
};

// Serve payment proof image for admin viewing
export const servePaymentProof = async (req, res, next) => {
  try {
    const { filename } = req.params;
    
    // Construct the file path
    const filePath = path.join('uploads', 'private', 'payment-proofs', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: { message: 'Payment proof not found' } 
      });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming payment proof:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: { message: 'Error serving payment proof' } 
        });
      }
    });
    
  } catch (error) {
    console.error('Error serving payment proof:', error);
    res.status(500).json({ 
      error: { message: 'Failed to serve payment proof' } 
    });
  }
};
