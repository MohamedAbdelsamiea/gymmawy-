import express from "express";
import path from "path";
import fs from "fs/promises";
import { getPrismaClient } from "../config/db.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();
const prisma = getPrismaClient();

// Base uploads directory
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const PAYMENT_PROOFS_DIR = path.join(UPLOADS_DIR, 'payment-proofs');

/**
 * Secure route for serving payment proof files
 * GET /files/payment-proofs/:filename
 */
router.get('/payment-proofs/:filename', requireAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('🔍 Payment proof request:', {
      filename,
      userId,
      userRole,
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin
    });

    // Security: Validate filename to prevent path traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ 
        error: { message: "Invalid filename" } 
      });
    }

    // Security: Only allow alphanumeric, dots, hyphens, and underscores in filename
    const filenameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!filenameRegex.test(filename)) {
      return res.status(400).json({ 
        error: { message: "Invalid filename format" } 
      });
    }

    // Look up the payment in the database using the filename
    const payment = await prisma.payment.findFirst({
      where: {
        paymentProofUrl: {
          endsWith: filename
        }
      },
      select: {
        userId: true,
        paymentProofUrl: true
      }
    });

    console.log('🔍 Payment lookup result:', {
      found: !!payment,
      paymentUserId: payment?.userId,
      paymentProofUrl: payment?.paymentProofUrl,
      requestedFilename: filename
    });

    // If no payment is found, return 404
    if (!payment) {
      console.log('❌ Payment not found for filename:', filename);
      return res.status(404).json({ 
        error: { message: "File not found" } 
      });
    }

    // Check if user has access to this payment proof
    if (payment.userId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ 
        error: { message: "Access denied" } 
      });
    }

    // Construct the full file path
    const filePath = path.join(PAYMENT_PROOFS_DIR, filename);

    // Security: Double-check the resolved path is within the payment-proofs directory
    if (!filePath.startsWith(PAYMENT_PROOFS_DIR)) {
      return res.status(400).json({ 
        error: { message: "Invalid file path" } 
      });
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ 
          error: { message: "File not found" } 
        });
      }
      throw error;
    }

    // Get file stats for content length
    const stats = await fs.stat(filePath);

    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.mp4': 'video/mp4',
      '.avi': 'video/avi',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);

    // Serve the file using res.sendFile
    res.sendFile(filePath, (error) => {
      if (error) {
        console.error('Error serving file:', error);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: { message: "Error serving file" } 
          });
        }
      }
    });

  } catch (error) {
    console.error('Payment proof file access error:', error);
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: { message: "Database constraint violation" } 
      });
    }
    
    // Handle other database errors
    if (error.code && error.code.startsWith('P')) {
      return res.status(500).json({ 
        error: { message: "Database error" } 
      });
    }
    
    // Generic error handling
    if (!res.headersSent) {
      res.status(500).json({ 
        error: { message: "Internal server error" } 
      });
    }
  }
});

export default router;
