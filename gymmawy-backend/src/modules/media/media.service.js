import { getPrismaClient } from "../../config/db.js";
import fs from 'fs';
import path from 'path';

const prisma = getPrismaClient();

// ============================================================================
// FILE MANAGEMENT
// ============================================================================

/**
 * Create upload record (for tracking purposes)
 */
export const createUploadRecord = async (uploadData) => {
  return {
    id: uploadData.id,
    originalName: uploadData.originalName,
    fileName: uploadData.fileName,
    url: uploadData.url,
    size: uploadData.size,
    mimetype: uploadData.mimetype,
    category: uploadData.category || 'media',
    isPublic: uploadData.isPublic,
    uploadedBy: uploadData.uploadedBy || null
  };
};

/**
 * Delete file from disk
 */
export const deleteFile = async (fileId, category = 'media') => {
  try {
    const fileDir = path.join('uploads', 'content', category);
    const files = fs.readdirSync(fileDir);
    const file = files.find(f => f.startsWith(fileId));
    
    if (file) {
      const filePath = path.join(fileDir, file);
      fs.unlinkSync(filePath);
      console.log(`File deleted: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error deleting file ${fileId}:`, error);
    throw error;
  }
};

/**
 * Get file info without serving the actual file
 */
export const getFileInfo = async (filePath) => {
  try {
    const fullPath = path.join(process.cwd(), 'uploads', filePath);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const stats = fs.statSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    
    return {
      exists: true,
      size: stats.size,
      extension: ext,
      lastModified: stats.mtime,
      mimeType: getMimeType(ext)
    };
  } catch (error) {
    console.error(`Error getting file info for ${filePath}:`, error);
    return null;
  }
};

/**
 * Get file as data URL for frontend display
 */
export const getFileAsDataUrl = async (filePath) => {
  try {
    const fullPath = path.join(process.cwd(), 'uploads', filePath);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const mimeType = getMimeType(ext);
    const base64 = fileBuffer.toString('base64');
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`Error converting file to data URL: ${filePath}`, error);
    return null;
  }
};

/**
 * Get MIME type from file extension
 */
function getMimeType(ext) {
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.pdf': 'application/pdf'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

// ============================================================================
// IMAGE MANAGEMENT
// ============================================================================

export const uploadImageService = async (data) => {
  return prisma.image.create({ data });
};

export const getImagesService = async () => {
  return prisma.image.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

export const getImageByIdService = async (id) => {
  return prisma.image.findUnique({
    where: { id: parseInt(id) }
  });
};

export const deleteImageService = async (id) => {
  return prisma.image.delete({
    where: { id: parseInt(id) }
  });
};

// ============================================================================
// VIDEO MANAGEMENT
// ============================================================================

export const uploadVideoService = async (data) => {
  return prisma.video.create({ data });
};

export const getVideosService = async () => {
  return prisma.video.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

export const getVideoByIdService = async (id) => {
  return prisma.video.findUnique({
    where: { id: parseInt(id) }
  });
};

export const deleteVideoService = async (id) => {
  return prisma.video.delete({
    where: { id: parseInt(id) }
  });
};

// ============================================================================
// SECURE FILE ACCESS
// ============================================================================

/**
 * Check if user has access to a file (for payment proofs, etc.)
 */
export const checkFileAccess = async (filePath, userId, userRole) => {
  // Check if this is a payment proof file
  if (filePath.includes('/payment-proofs/')) {
    // Admin users can access all payment proofs
    if (userRole === 'ADMIN') {
      return true;
    }
    
    // Regular users can only access their own payment proofs
    const fileName = path.basename(filePath);
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { paymentProofUrl: { contains: fileName } },
          { paymentProofUrl: { contains: filePath } }
        ]
      }
    });

    return payment && payment.userId === userId;
  }
  
  // For other files, allow access
  return true;
};

/**
 * Get secure file access with authentication
 */
export const getSecureFile = async (filePath, userId, userRole) => {
  const hasAccess = await checkFileAccess(filePath, userId, userRole);
  
  if (!hasAccess) {
    throw new Error('Access denied');
  }
  
  return await getFileAsDataUrl(filePath);
};

// ============================================================================
// MEDIA STATISTICS
// ============================================================================

/**
 * Get media statistics
 */
export const getMediaStats = async () => {
  const [imageCount, videoCount] = await Promise.all([
    prisma.image.count(),
    prisma.video.count()
  ]);
  
  return {
    images: imageCount,
    videos: videoCount,
    total: imageCount + videoCount
  };
};
