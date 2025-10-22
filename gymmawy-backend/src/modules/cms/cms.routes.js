import express from 'express';
import { requireAuth, requireAdmin } from '../../middlewares/authMiddleware.js';
import { getPrismaClient } from '../../config/db.js';
import fs from 'fs';
import path from 'path';
import { 
  getContent, 
  updateContent,
  getTransformations,
  createTransformation,
  getTransformationById,
  updateTransformation,
  deleteTransformation,
  getVideos,
  createVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  getHomepagePopup,
  updateHomepagePopup
} from './cms.controller.js';

const router = express.Router();
const prisma = getPrismaClient();

// Test DELETE route
router.delete('/test-delete', (req, res) => {
  console.log('CMS Test DELETE route hit!');
  res.json({ message: 'CMS Test DELETE route working' });
});

// Content management
router.get('/', getContent);
router.put('/:id', requireAuth, requireAdmin, updateContent);

// Transformations
router.get('/transformations', getTransformations);
router.post('/transformations', requireAuth, requireAdmin, createTransformation);
router.get('/transformations/:id', getTransformationById);
router.put('/transformations/:id', requireAuth, requireAdmin, updateTransformation);
router.delete('/transformations/:id', requireAuth, requireAdmin, deleteTransformation);

// Delete file by fileId (for draft upload system)
router.delete('/files/:fileId', requireAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { category } = req.query;
    
    console.log('Delete file request:', { fileId, category });

    // Find the transformation in database by looking for the filename pattern
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

// Content management
router.get('/', getContent);

router.put('/:id', requireAuth, requireAdmin, updateContent);
router.get('/videos', getVideos);
router.post('/videos', requireAuth, requireAdmin, createVideo);
router.get('/videos/:id', getVideoById);
router.put('/videos/:id', requireAuth, requireAdmin, updateVideo);
router.delete('/videos/:id', requireAuth, requireAdmin, deleteVideo);

// Homepage Popup
router.get('/homepage-popup', getHomepagePopup);
router.patch('/homepage-popup', requireAuth, requireAdmin, updateHomepagePopup);

export default router;
