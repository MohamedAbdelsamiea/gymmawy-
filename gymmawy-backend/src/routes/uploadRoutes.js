import express from "express";
import { upload, videoUpload, pdfUpload, handleMulterErrors, processImage, processVideo, processPDF } from "../middlewares/uploadMiddleware.js";
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware.js";
import { getPrismaClient } from "../config/db.js";
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const router = express.Router();
const prisma = getPrismaClient();

// ============================================================================
// PUBLIC IMAGE UPLOAD (for general use)
// ============================================================================

router.post('/public/images', 
  handleMulterErrors(upload.single('image')),
  async (req, res) => {
    try {
      console.log('Upload request received:', {
        hasFile: !!req.file,
        body: req.body,
        fileInfo: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : null
      });
      
      if (!req.file) {
        return res.status(400).json({ 
          error: { message: 'No file uploaded' } 
        });
      }

      const { originalname, buffer, mimetype } = req.file;
      const fileId = randomUUID();
      
      // Get the original file extension
      const originalExtension = path.extname(originalname).toLowerCase();
      const fileName = `${fileId}${originalExtension}`;
      
      const category = req.body.category || 'general';
      const uploadDir = `uploads/content/${category}`;
      
      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filePath = path.join(uploadDir, fileName);
      
      // Save the original file
      fs.writeFileSync(filePath, buffer);
      
      const url = `/uploads/content/${category}/${fileName}`;

      // Return file information without creating database record
      // The CMS system will handle database record creation separately
      res.json({
        url: url,
        originalName: originalname,
        fileName: fileName,
        size: buffer.length,
        mimetype: mimetype,
        category: category,
        isPublic: true
      });
    } catch (error) {
      console.error('Error uploading public image:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        error: { message: 'Failed to upload image', details: error.message } 
      });
    }
  }
);

// ============================================================================
// ADMIN IMAGE UPLOAD (for admin use)
// ============================================================================

router.post('/admin/images', 
  requireAuth,
  requireAdmin,
  handleMulterErrors(upload.single('image')),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: { message: 'No file uploaded' } 
        });
      }

      const { originalname, buffer, mimetype } = req.file;
      const fileId = randomUUID();
      
      // Get the original file extension
      const originalExtension = path.extname(originalname).toLowerCase();
      const fileName = `${fileId}${originalExtension}`;
      
      const category = req.body.category || 'admin';
      const uploadDir = `uploads/content/${category}`;
      
      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filePath = path.join(uploadDir, fileName);
      
      // Save the original file
      fs.writeFileSync(filePath, buffer);
      
      const url = `/uploads/content/${category}/${fileName}`;

      // Return file information without creating database record
      // The CMS system will handle database record creation separately
      res.json({
        url: url,
        originalName: originalname,
        fileName: fileName,
        size: buffer.length,
        mimetype: mimetype,
        category: category,
        isPublic: true
      });
    } catch (error) {
      console.error('Error uploading admin image:', error);
      res.status(500).json({ 
        error: { message: 'Failed to upload image' } 
      });
    }
  }
);

// ============================================================================
// ADMIN VIDEO UPLOAD (for admin use)
// ============================================================================

router.post('/admin/videos', 
  requireAuth,
  requireAdmin,
  handleMulterErrors(videoUpload.single('video')),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: { message: 'No video uploaded' } 
        });
      }

      const { originalname, buffer, mimetype } = req.file;
      const fileId = randomUUID();
      const fileExtension = path.extname(originalname);
      const fileName = `${fileId}${fileExtension}`;
      
      const category = req.body.category || 'videos';
      const uploadDir = `uploads/content/${category}`;
      
      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filePath = path.join(uploadDir, fileName);
      
      // Save the video file
      fs.writeFileSync(filePath, buffer);
      
      const url = `/uploads/content/${category}/${fileName}`;

      // Return file information without creating database record
      // The CMS system will handle database record creation separately
      res.json({
        videoUrl: url,
        originalName: originalname,
        fileName: fileName,
        size: buffer.length,
        mimetype: mimetype,
        category: category,
        isPublic: true
      });
    } catch (error) {
      console.error('Error uploading admin video:', error);
      res.status(500).json({ 
        error: { message: 'Failed to upload video' } 
      });
    }
  }
);

// ============================================================================
// ADMIN PDF UPLOAD (for admin use)
// ============================================================================

router.post('/admin/pdfs', 
  requireAuth,
  requireAdmin,
  handleMulterErrors(pdfUpload.single('pdf')),
  async (req, res) => {
    try {
      console.log('PDF upload request received:', {
        hasFile: !!req.file,
        body: req.body,
        fileInfo: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : null
      });

      if (!req.file) {
        return res.status(400).json({ 
          error: { message: 'No PDF file uploaded' } 
        });
      }

      const { originalname, buffer, mimetype } = req.file;
      const fileId = randomUUID();
      const fileExtension = path.extname(originalname);
      const fileName = `${fileId}${fileExtension}`;
      
      const category = req.body.category || 'programmes';
      const uploadDir = `uploads/${category}`;
      
      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filePath = path.join(uploadDir, fileName);
      
      // Save the PDF file
      fs.writeFileSync(filePath, buffer);
      
      const url = `/uploads/${category}/${fileName}`;

      console.log('PDF uploaded successfully:', {
        url,
        fileName,
        originalName: originalname,
        size: buffer.length,
        category
      });

      // Return file information without creating database record
      // The CMS system will handle database record creation separately
      res.json({
        url: url,
        originalName: originalname,
        fileName: fileName,
        size: buffer.length,
        mimetype: mimetype,
        category: category,
        isPublic: true
      });
    } catch (error) {
      console.error('Error uploading admin PDF:', error);
      res.status(500).json({ 
        error: { message: 'Failed to upload PDF', details: error.message } 
      });
    }
  }
);

// ============================================================================
// GET UPLOADS BY CATEGORY (Admin only)
// ============================================================================

router.get('/admin/category', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { category, isPublic } = req.query;
    
    let where = {};
    if (category) {
      where.category = category;
    }
    if (isPublic !== undefined) {
      where.isPublic = isPublic === 'true';
    }

    const transformations = await prisma.transformation.findMany({
      where: {
        isActive: true,
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(transformations);
  } catch (error) {
    console.error('Error getting uploads by category:', error);
    res.status(500).json({ 
      error: { message: 'Failed to get uploads' } 
    });
  }
});

// ============================================================================
// GET ALL IMAGES (Admin only)
// ============================================================================

router.get('/admin/images', requireAuth, requireAdmin, async (req, res) => {
  try {
    const transformations = await prisma.transformation.findMany({
      where: {
        isActive: true,
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(transformations);
  } catch (error) {
    console.error('Error getting images:', error);
    res.status(500).json({ 
      error: { message: 'Failed to get images' } 
    });
  }
});

// ============================================================================
// TEST DELETE ROUTE
// ============================================================================

router.delete('/test', (req, res) => {
  console.log('Test DELETE route hit!');
  res.json({ message: 'Test DELETE route working' });
});

// ============================================================================
// DELETE FILE BY ID
// ============================================================================

router.delete('/delete/:fileId', requireAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { category } = req.query;
    
    console.log('Delete file request:', { fileId, category });

    // Find the file in database by looking for the filename pattern in Transformation model
    const transformation = await prisma.transformation.findFirst({
      where: {
        imageUrl: {
          contains: fileId
        }
      }
    });

    if (!transformation) {
      console.log('Transformation not found in database for fileId:', fileId);
      return res.status(404).json({ 
        error: { message: 'File not found in database' } 
      });
    }

    // Delete the physical file
    const fullFilePath = path.join(process.cwd(), transformation.imageUrl);
    try {
      if (fs.existsSync(fullFilePath)) {
        fs.unlinkSync(fullFilePath);
        console.log('Physical file deleted:', fullFilePath);
      } else {
        console.log('Physical file not found:', fullFilePath);
      }
    } catch (fileError) {
      console.error('Error deleting physical file:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete the database record
    await prisma.transformation.delete({
      where: { id: transformation.id }
    });

    console.log('File deleted successfully:', fileId);
    res.json({ 
      success: true, 
      message: 'File deleted successfully',
      deletedFileId: fileId
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      error: { message: 'Failed to delete file', details: error.message } 
    });
  }
});

// ============================================================================
// PAYMENT PROOF UPLOAD (for payment verification)
// ============================================================================

router.post('/payment-proof', 
  requireAuth,
  handleMulterErrors(upload.single('file')),
  processImage,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: { message: 'No file uploaded' } 
        });
      }

      if (!req.uploadedFile) {
        return res.status(500).json({ 
          error: { message: 'File processing failed' } 
        });
      }

      const { url, fileName, size, originalName } = req.uploadedFile;

      res.json({
        upload: {
          url: url,
          originalName: originalName,
          fileName: fileName,
          size: size,
          mimetype: 'image/webp',
          isPublic: false, // Payment proofs are private
          category: 'payment-proof'
        }
      });
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      res.status(500).json({ 
        error: { message: 'Failed to upload payment proof', details: error.message } 
      });
    }
  }
);

// ============================================================================
// GET TRANSFORMATION BY ID
// ============================================================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const transformation = await prisma.transformation.findUnique({
      where: { id: id }
    });

    if (!transformation) {
      return res.status(404).json({ 
        error: { message: 'Transformation not found' } 
      });
    }

    res.json(transformation);
  } catch (error) {
    console.error('Error getting transformation:', error);
    res.status(500).json({ 
      error: { message: 'Failed to get transformation' } 
    });
  }
});

export default router;