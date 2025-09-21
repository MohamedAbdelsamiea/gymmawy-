import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads/content/plans',
    'uploads/content/products',
    'uploads/content/programmes',
    'uploads/content/transformations',
    'uploads/content/videos',
    'uploads/content/documents',
    'uploads/payment-proofs',
    'uploads/temp'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  // Check MIME type
  const isValidMimeType = allowedTypes.includes(file.mimetype);
  
  // Check file extension as fallback
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const isValidExtension = allowedExtensions.includes(fileExtension);
  
  if (isValidMimeType || isValidExtension) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};

// File filter for videos
const videoFileFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only video files (MP4, AVI, MOV, WMV, FLV, WebM, MKV) are allowed'), false);
  }
};

// Multer configuration for images
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  }
});

// Multer configuration for videos
const videoUpload = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
    files: 1 // Only one file at a time
  }
});

// Wrapper to handle multer errors
export const handleMulterErrors = (multerMiddleware) => {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
              error: { message: 'File too large. Maximum size is 10MB.' } 
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ 
              error: { message: 'Too many files. Only one file allowed.' } 
            });
          }
          return res.status(400).json({ 
            error: { message: err.message } 
          });
        }
        
        if (err.message === 'Only image files (JPEG, PNG, GIF, WebP) are allowed') {
          return res.status(400).json({ 
            error: { message: err.message } 
          });
        }
        
        return res.status(400).json({ 
          error: { message: err.message } 
        });
      }
      next();
    });
  };
};

// Middleware to process uploaded images with Sharp
export const processImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const { originalname, buffer, mimetype } = req.file;
    const fileId = uuidv4();
    const fileExtension = 'webp';
    const fileName = `${fileId}.${fileExtension}`;
    
    // Determine upload type and category based on route
    const isPaymentProof = req.path.includes('/payment-proof');
    const category = req.body.category || 'products'; // Default to products
    
    let uploadDir;
    if (isPaymentProof) {
      uploadDir = 'uploads/payment-proofs';
    } else {
      // All other uploads go to content with specified category
      uploadDir = `uploads/content/${category}`;
    }
    
    const filePath = path.join(uploadDir, fileName);
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Process image with Sharp - convert to WebP with highest quality
    await sharp(buffer)
      .webp({ 
        quality: 100, // Maximum quality
        effort: 6,    // Maximum compression effort
        lossless: false // Use lossy compression for smaller files but maintain quality
      })
      .resize(2048, 2048, { // Resize to max 2048x2048 while maintaining aspect ratio
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFile(filePath);

    // Generate URL based on upload type
    let url;
    if (isPaymentProof) {
      url = `/uploads/payment-proofs/${fileName}`;
    } else {
      url = `/uploads/content/${category}/${fileName}`;
    }

    // Store file information in request
    req.uploadedFile = {
      id: fileId,
      originalName: originalname,
      fileName,
      filePath,
      url,
      size: fs.statSync(filePath).size,
      mimetype: 'image/webp',
      isPublic: !isPaymentProof, // Content uploads are public, payment proofs are private
      category: category
    };

    next();
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(400).json({ 
      error: { 
        message: 'Failed to process image', 
        details: error.message 
      } 
    });
  }
};

// Middleware to process uploaded documents (non-images)
export const processDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const { originalname, buffer, mimetype } = req.file;
    const fileId = uuidv4();
    const fileExtension = path.extname(originalname).toLowerCase();
    const fileName = `${fileId}${fileExtension}`;
    
    // Determine upload type and category based on route
    const isPaymentProof = req.path.includes('/payment-proof');
    const category = req.body.category || 'documents'; // Default to documents
    
    let uploadDir;
    if (isPaymentProof) {
      uploadDir = 'uploads/payment-proofs';
    } else {
      // All other uploads go to content with specified category
      uploadDir = `uploads/content/${category}`;
    }
    
    const filePath = path.join(uploadDir, fileName);
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Write file to disk
    fs.writeFileSync(filePath, buffer);

    // Generate URL based on upload type
    let url;
    if (isPaymentProof) {
      url = `/uploads/payment-proofs/${fileName}`;
    } else {
      url = `/uploads/content/${category}/${fileName}`;
    }

    // Store file information in request
    req.uploadedFile = {
      id: fileId,
      originalName: originalname,
      fileName,
      filePath,
      url,
      size: buffer.length,
      mimetype,
      isPublic: !isPaymentProof, // Content uploads are public, payment proofs are private
      category: category
    };

    next();
  } catch (error) {
    console.error('Error processing document:', error);
    res.status(400).json({ 
      error: { 
        message: 'Failed to process document', 
        details: error.message 
      } 
    });
  }
};

// Process video file
export const processVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: { message: 'No video file uploaded' } 
      });
    }

    const { originalname, mimetype, buffer } = req.file;
    const fileId = uuidv4();
    const fileExtension = path.extname(originalname);
    const fileName = `${fileId}${fileExtension}`;
    
    // All videos go to content/videos (public)
    const videoDir = 'uploads/content/videos';
    
    // Create video directory if it doesn't exist
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }
    
    const filePath = path.join(videoDir, fileName);
    
    // Write file to disk
    fs.writeFileSync(filePath, buffer);
    
    // All videos are public
    const url = `/uploads/content/videos/${fileName}`;

    // Set uploaded file info
    req.uploadedFile = {
      id: fileId,
      originalName: originalname,
      fileName,
      filePath,
      url,
      size: buffer.length,
      mimetype,
      isPublic: true, // All videos are public
      category: 'videos'
    };

    next();
  } catch (error) {
    console.error('Error processing video:', error);
    res.status(400).json({ 
      error: { 
        message: 'Failed to process video', 
        details: error.message 
      } 
    });
  }
};

// Middleware to handle file deletion
export const deleteUploadedFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { category, isPaymentProof } = req.query;
    
    // Determine directory based on category
    let uploadDir;
    if (isPaymentProof === 'true') {
      uploadDir = 'uploads/payment-proofs';
    } else {
      uploadDir = `uploads/content/${category || 'products'}`;
    }
    
    const fileName = `${fileId}.webp`;
    const filePath = path.join(uploadDir, fileName);
    
    // Check if file exists and delete it
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
    }
    
    next();
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      error: { 
        message: 'Failed to delete file', 
        details: error.message 
      } 
    });
  }
};

// Middleware to serve static files with proper headers
export const serveUploadedFiles = (req, res, next) => {
  const { fileName } = req.params;
  const { category, isPaymentProof } = req.query;
  
  let filePath;
  
  // Handle specific content routes (e.g., /api/uploads/content/images/filename.webp)
  if (req.route && req.route.path.includes('/content/')) {
    // Extract the category from the route path
    const routePath = req.route.path;
    const categoryMatch = routePath.match(/\/content\/([^\/]+)/);
    const routeCategory = categoryMatch ? categoryMatch[1] : 'products';
    
    // Construct the file path
    filePath = path.join(process.cwd(), 'uploads', 'content', routeCategory, fileName);
  }
  // Handle full path format (e.g., /uploads/content/images/filename.webp)
  else if (fileName && fileName.includes('/')) {
    // Remove leading slash if present and use the full path
    const cleanPath = fileName.startsWith('/') ? fileName.slice(1) : fileName;
    filePath = path.join(process.cwd(), cleanPath);
  } else {
    // Handle legacy format with category parameter
    let uploadDir;
    if (isPaymentProof === 'true') {
      uploadDir = 'uploads/payment-proofs';
    } else {
      uploadDir = `uploads/content/${category || 'products'}`;
    }
    filePath = path.join(uploadDir, fileName);
  }
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: { message: 'File not found' } });
  }
  
  // Determine content type based on file extension
  const ext = path.extname(filePath).toLowerCase();
  let contentType = 'application/octet-stream';
  if (ext === '.webp') contentType = 'image/webp';
  else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  else if (ext === '.png') contentType = 'image/png';
  else if (ext === '.gif') contentType = 'image/gif';
  
  // Set proper headers for image serving
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
  res.setHeader('ETag', `"${path.basename(filePath)}"`);
  
  // Set CORS headers for static files
  const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [
    "http://localhost:3000", 
    "http://localhost:3001", 
    "http://localhost:5173"
  ];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes("*") || (origin && allowedOrigins.includes(origin))) {
    res.header('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
  }
  
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  // Send file
  res.sendFile(path.resolve(filePath));
};

export { upload, videoUpload };
