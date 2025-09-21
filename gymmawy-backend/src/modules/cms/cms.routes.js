import express from 'express';
import { requireAuth, requireAdmin } from '../../middlewares/authMiddleware.js';
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
  deleteVideo
} from './cms.controller.js';

const router = express.Router();

// Content management
router.get('/', getContent);
router.put('/:id', requireAuth, requireAdmin, updateContent);

// Transformations
router.get('/transformations', getTransformations);
router.post('/transformations', requireAuth, requireAdmin, createTransformation);
router.get('/transformations/:id', getTransformationById);
router.put('/transformations/:id', requireAuth, requireAdmin, updateTransformation);
router.delete('/transformations/:id', requireAuth, requireAdmin, deleteTransformation);

// Videos
router.get('/videos', getVideos);
router.post('/videos', requireAuth, requireAdmin, createVideo);
router.get('/videos/:id', getVideoById);
router.put('/videos/:id', requireAuth, requireAdmin, updateVideo);
router.delete('/videos/:id', requireAuth, requireAdmin, deleteVideo);

export default router;
