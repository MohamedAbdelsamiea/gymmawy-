import { getPrismaClient } from "../../config/db.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";
import fs from "fs";
import path from "path";

const prisma = getPrismaClient();

/**
 * Get image as data URL for authenticated access
 * This allows images to be displayed in the frontend without CORS issues
 */
export const getImageAsDataUrl = async (req, res) => {
  try {
    // Get the file path from the parameter
    const filePath = req.params.filePath;
    const userId = req.user?.id;

    // Decode the file path
    const decodedPath = decodeURIComponent(filePath);
    
    // Check if this is a payment proof file
    if (decodedPath.includes('/payment-proofs/')) {
      // For admin users, allow access to all payment proofs
      if (req.user?.role === 'ADMIN') {
        // Admin access granted
      } else {
        const fileName = path.basename(decodedPath);
        const payment = await prisma.payment.findFirst({
          where: {
            OR: [
              { paymentProofUrl: { contains: fileName } },
              { paymentProofUrl: { contains: decodedPath } }
            ]
          }
        });

        if (!payment || payment.userId !== userId) {
          return res.status(403).json({ error: { message: "Access denied" } });
        }
      }
    }

    // Construct full file path
    // Remove 'uploads/' prefix if it exists since we're already in the uploads directory
    const cleanPath = decodedPath.startsWith('uploads/') ? decodedPath.substring(7) : decodedPath;
    const fullPath = path.join(process.cwd(), 'uploads', cleanPath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: { message: "File not found" } });
    }

    // Read file and convert to base64
    const fileBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    
    // Determine MIME type
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf'
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    const base64 = fileBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Return the data URL
    res.json({ dataUrl });

  } catch (error) {
    console.error('Error getting image as data URL:', error);
    res.status(500).json({ error: { message: "Internal server error" } });
  }
};

/**
 * Get image info without serving the actual file
 */
export const getImageInfo = async (req, res) => {
  try {
    // Get the file path from the parameter
    const filePath = req.params.filePath;
    const userId = req.user?.id;
    const decodedPath = decodeURIComponent(filePath);
    
    // Check access permissions for payment proofs
    if (decodedPath.startsWith('/payment-proofs/')) {
      const fileName = path.basename(decodedPath);
      const payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { paymentProofUrl: { contains: fileName } },
            { paymentProofUrl: { contains: decodedPath } }
          ]
        }
      });

      if (!payment || (payment.userId !== userId && req.user?.role !== 'ADMIN')) {
        return res.status(403).json({ error: { message: "Access denied" } });
      }
    }

    const fullPath = path.join(process.cwd(), 'uploads', decodedPath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: { message: "File not found" } });
    }

    const stats = fs.statSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    
    res.json({
      exists: true,
      size: stats.size,
      extension: ext,
      lastModified: stats.mtime
    });

  } catch (error) {
    console.error('Error getting image info:', error);
    res.status(500).json({ error: { message: "Internal server error" } });
  }
};

/**
 * Upload image (placeholder - implement as needed)
 */
export const uploadImage = async (req, res) => {
  try {
    // This would typically handle file upload
    res.json({ message: "Upload functionality not implemented yet" });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: { message: "Internal server error" } });
  }
};

/**
 * Get images (placeholder - implement as needed)
 */
export const getImages = async (req, res) => {
  try {
    // This would typically return a list of images
    res.json({ images: [] });
  } catch (error) {
    console.error('Error getting images:', error);
    res.status(500).json({ error: { message: "Internal server error" } });
  }
};

/**
 * Get image by ID (placeholder - implement as needed)
 */
export const getImageById = async (req, res) => {
  try {
    const { id } = req.params;
    // This would typically return a specific image
    res.json({ id, message: "Image not found" });
  } catch (error) {
    console.error('Error getting image by ID:', error);
    res.status(500).json({ error: { message: "Internal server error" } });
  }
};

/**
 * Delete image (placeholder - implement as needed)
 */
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    // This would typically delete an image
    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: { message: "Internal server error" } });
  }
};