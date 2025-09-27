import express from 'express';
import multer from 'multer';
import { upload, videoUpload, processImage, processVideo, deleteUploadedFile, serveUploadedFiles, handleMulterErrors } from '../../middlewares/uploadMiddleware.js';
import { requireAuth, requireAdmin } from '../../middlewares/authMiddleware.js';
import {
  uploadPublicImage,
  uploadAdminImage,
  uploadAdminVideo,
  uploadPaymentProof,
  getUpload,
  getUserUploads,
  getPublicUploadsController,
  getAdminUploadsController,
  deleteUploadController,
  cleanupOrphanedFilesController,
  cleanupOrphanedSubscriptionPlanImagesController,
  cleanupOrphanedProgrammeImagesController,
  cleanupOrphanedProductImagesController,
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
router.get('/public/images', getPublicImagesController);
router.get('/public', getPublicUploadsController);
router.get('/public/:fileName', serveUploadedFiles);

// Protected user routes
router.post('/payment-proof', requireAuth, handleMulterErrors(upload.single('file')), processImage, uploadPaymentProof);
router.get('/user', requireAuth, getUserUploads);

// Admin routes
router.post('/admin/images', requireAuth, requireAdmin, handleMulterErrors(upload.single('image')), processImage, uploadAdminImage);
router.post('/admin/videos', requireAuth, requireAdmin, handleMulterErrors(videoUpload.single('video')), processVideo, uploadAdminVideo);
router.get('/admin/images', requireAuth, requireAdmin, getPrivateImagesController);
router.get('/admin/payment-proofs', requireAuth, requireAdmin, getPaymentProofsController);
router.get('/admin/category', requireAuth, requireAdmin, getUploadsByCategoryController);
router.get('/admin/uploads', requireAuth, requireAdmin, getAdminUploadsController);
router.post('/admin/cleanup', requireAuth, requireAdmin, cleanupOrphanedFilesController);
router.post('/admin/cleanup/subscription-plans', requireAuth, requireAdmin, cleanupOrphanedSubscriptionPlanImagesController);

// Clean up orphaned programme images
router.post('/admin/cleanup/programmes', requireAuth, requireAdmin, cleanupOrphanedProgrammeImagesController);

// Clean up orphaned product images
router.post('/admin/cleanup/products', requireAuth, requireAdmin, cleanupOrphanedProductImagesController);
router.get('/admin/stats', requireAuth, requireAdmin, getUploadStatsController);
router.get('/admin/:fileName', requireAuth, requireAdmin, serveUploadedFiles);

// Admin payment proof viewer
router.get('/payment-proof/:filename', requireAuth, requireAdmin, servePaymentProof);

// Route for content images (e.g., /api/uploads/content/images/filename.webp)
router.get('/content/images/:fileName', serveUploadedFiles);
router.get('/content/products/:fileName', serveUploadedFiles);
router.get('/content/programmes/:fileName', serveUploadedFiles);
router.get('/content/transformations/:fileName', serveUploadedFiles);
router.get('/content/videos/:fileName', serveUploadedFiles);

// Generic routes (must be last)
router.get('/:id', requireAuth, getUpload);
router.delete('/:id', requireAuth, deleteUploadController);

export default router;
