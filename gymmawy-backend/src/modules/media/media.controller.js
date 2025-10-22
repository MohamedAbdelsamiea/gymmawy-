import * as service from './media.service.js';
import { z } from 'zod';
import { parseOrThrow } from '../../utils/validation.js';

// ============================================================================
// FILE ACCESS & DISPLAY
// ============================================================================

/**
 * Get file as data URL for authenticated access
 * Handles both images and videos with proper access control
 */
export const getFileAsDataUrl = async (req, res) => {
  try {
    const filePath = req.params.filePath;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    // Decode the file path
    const decodedPath = decodeURIComponent(filePath);
    
    // Check access permissions
    const hasAccess = await service.checkFileAccess(decodedPath, userId, userRole);
    
    if (!hasAccess) {
      return res.status(403).json({ error: { message: "Access denied" } });
    }
    
    // Get file as data URL
    const dataUrl = await service.getFileAsDataUrl(decodedPath);
    
    if (!dataUrl) {
      return res.status(404).json({ error: { message: "File not found" } });
    }
    
    res.json({ dataUrl });
  } catch (error) {
    console.error('Error getting file as data URL:', error);
    res.status(500).json({ error: { message: "Internal server error" } });
  }
};

/**
 * Get file info without serving the actual file
 */
export const getFileInfo = async (req, res) => {
  try {
    const filePath = req.params.filePath;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const decodedPath = decodeURIComponent(filePath);
    
    // Check access permissions
    const hasAccess = await service.checkFileAccess(decodedPath, userId, userRole);
    
    if (!hasAccess) {
      return res.status(403).json({ error: { message: "Access denied" } });
    }
    
    const fileInfo = await service.getFileInfo(decodedPath);
    
    if (!fileInfo) {
      return res.status(404).json({ error: { message: "File not found" } });
    }
    
    res.json(fileInfo);
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({ error: { message: "Internal server error" } });
  }
};

// ============================================================================
// IMAGE MANAGEMENT
// ============================================================================

export const uploadImage = async (req, res) => {
  try {
    const schema = z.object({
      url: z.string().url(),
      alt: z.string().optional(),
      category: z.string().optional()
    });
    
    const data = parseOrThrow(schema, req.body);
    const image = await service.uploadImageService(data);
    res.status(201).json(image);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const getImages = async (req, res) => {
  try {
    const images = await service.getImagesService();
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getImageById = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await service.getImageByIdService(id);
    
    if (!image) {
      return res.status(404).json({ error: { message: "Image not found" } });
    }
    
    res.json(image);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    await service.deleteImageService(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

// ============================================================================
// VIDEO MANAGEMENT
// ============================================================================

export const uploadVideo = async (req, res) => {
  try {
    const schema = z.object({
      videoUrl: z.string().url(),
      thumbnailAr: z.string().optional(),
      thumbnailEn: z.string().optional(),
      order: z.number().int().min(0).optional(),
      isActive: z.boolean().optional()
    });
    
    const data = parseOrThrow(schema, req.body);
    const video = await service.uploadVideoService(data);
    res.status(201).json(video);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const getVideos = async (req, res) => {
  try {
    const videos = await service.getVideosService();
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await service.getVideoByIdService(id);
    
    if (!video) {
      return res.status(404).json({ error: { message: "Video not found" } });
    }
    
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    await service.deleteVideoService(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

// ============================================================================
// MEDIA STATISTICS
// ============================================================================

export const getMediaStats = async (req, res) => {
  try {
    const stats = await service.getMediaStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};
