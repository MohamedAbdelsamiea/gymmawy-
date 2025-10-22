import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middlewares/authMiddleware.js";
import * as controller from "./media.controller.js";

const router = Router();

// ============================================================================
// FILE ACCESS ROUTES (Public with authentication)
// ============================================================================

// Get file as data URL (for frontend display)
router.get("/file/:filePath", requireAuth, controller.getFileAsDataUrl);

// Get file info without serving the file
router.get("/file/:filePath/info", requireAuth, controller.getFileInfo);

// ============================================================================
// IMAGE MANAGEMENT ROUTES (Admin only)
// ============================================================================

// Upload image
router.post("/images", requireAuth, requireAdmin, controller.uploadImage);

// Get all images
router.get("/images", requireAuth, requireAdmin, controller.getImages);

// Get image by ID
router.get("/images/:id", requireAuth, requireAdmin, controller.getImageById);

// Delete image
router.delete("/images/:id", requireAuth, requireAdmin, controller.deleteImage);

// ============================================================================
// VIDEO MANAGEMENT ROUTES (Admin only)
// ============================================================================

// Upload video
router.post("/videos", requireAuth, requireAdmin, controller.uploadVideo);

// Get all videos
router.get("/videos", requireAuth, requireAdmin, controller.getVideos);

// Get video by ID
router.get("/videos/:id", requireAuth, requireAdmin, controller.getVideoById);

// Delete video
router.delete("/videos/:id", requireAuth, requireAdmin, controller.deleteVideo);

// ============================================================================
// MEDIA STATISTICS ROUTES (Admin only)
// ============================================================================

// Get media statistics
router.get("/stats", requireAuth, requireAdmin, controller.getMediaStats);

export default router;
