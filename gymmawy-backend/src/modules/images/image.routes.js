import express from 'express';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { uploadImage, getImages, getImageById, deleteImage, getImageAsDataUrl, getImageInfo } from './image.controller.js';

const router = express.Router();

router.post('/upload', uploadImage);
router.get('/', getImages);

// Secure image access routes - using parameterized routes
router.get('/data/:filePath', requireAuth, getImageAsDataUrl);
router.get('/info/:filePath', requireAuth, getImageInfo);

// Generic routes (must be last to avoid conflicts)
router.get('/:id', getImageById);
router.delete('/:id', deleteImage);

export default router;
