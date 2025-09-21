import express from 'express';
import { uploadVideo, getVideos, getVideoById, deleteVideo } from './video.controller.js';

const router = express.Router();

router.post('/upload', uploadVideo);
router.get('/', getVideos);
router.get('/:id', getVideoById);
router.delete('/:id', deleteVideo);

export default router;
