import express from 'express';
import multer from 'multer';
import { upload, videoUpload, processImage, processDocument, processVideo, deleteUploadedFile, serveUploadedFiles, handleMulterErrors } from '../../middlewares/uploadMiddleware.js';
import { requireAuth, requireAdmin } from '../../middlewares/authMiddleware.js';
import {
  uploadPublicImage,
  uploadAdminImage,
  uploadPublicDocument,
  uploadAdminDocument,
  uploadAdminVideo,
  uploadPaymentProof,
  getUpload,
  getUserUploads,
  getPublicUploadsController,
  getAdminUploadsController,
  deleteUploadController,
  cleanupOrphanedFilesController,
  getUploadStatsController,
  getUploadsByCategoryController,
  getPaymentProofsController,
  getPublicImagesController,
  getPrivateImagesController,
  servePaymentProof
} from './upload.controller.js';

const router = express.Router();

// Public routes
router.post('/public/images', handleMulterErrors(upload.single('image')), processImage, uploadPublicImage);
router.post('/public/documents', handleMulterErrors(upload.single('document')), processDocument, uploadPublicDocument);
router.get('/public/images', getPublicImagesController);
router.get('/public', getPublicUploadsController);
router.get('/public/:fileName', serveUploadedFiles);

// Protected user routes
router.post('/payment-proof', requireAuth, handleMulterErrors(upload.single('file')), processImage, uploadPaymentProof);
router.get('/user', requireAuth, getUserUploads);

// Admin routes
router.post('/admin/images', requireAuth, requireAdmin, handleMulterErrors(upload.single('image')), processImage, uploadAdminImage);
router.post('/admin/documents', requireAuth, requireAdmin, handleMulterErrors(upload.single('document')), processDocument, uploadAdminDocument);
router.post('/admin/videos', requireAuth, requireAdmin, handleMulterErrors(videoUpload.single('video')), processVideo, uploadAdminVideo);
router.get('/admin/images', requireAuth, requireAdmin, getPrivateImagesController);
router.get('/admin/payment-proofs', requireAuth, requireAdmin, getPaymentProofsController);
router.get('/admin/category', requireAuth, requireAdmin, getUploadsByCategoryController);
router.get('/admin/uploads', requireAuth, requireAdmin, getAdminUploadsController);
router.post('/admin/cleanup', requireAuth, requireAdmin, cleanupOrphanedFilesController);
router.get('/admin/stats', requireAuth, requireAdmin, getUploadStatsController);
router.get('/admin/:fileName', requireAuth, requireAdmin, serveUploadedFiles);

// Admin payment proof viewer
router.get('/payment-proof/:filename', requireAuth, requireAdmin, servePaymentProof);

// Generic routes (must be last)
router.get('/:id', requireAuth, getUpload);
router.delete('/:id', requireAuth, deleteUploadController);

export default router;
