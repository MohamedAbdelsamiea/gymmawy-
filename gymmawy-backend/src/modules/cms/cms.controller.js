import { 
  getContentService, 
  updateContentService,
  getTransformationsService,
  createTransformationService,
  getTransformationByIdService,
  updateTransformationService,
  deleteTransformationService,
  getVideosService,
  createVideoService,
  getVideoByIdService,
  updateVideoService,
  deleteVideoService,
  getHomepagePopupService,
  updateHomepagePopupService
} from './cms.service.js';

export const getContent = async (req, res) => {
  try {
    const content = await getContentService();
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const content = await updateContentService(id, req.body);
    res.json(content);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

// Transformations
export const getTransformations = async (req, res) => {
  try {
    const { isActive, language, pageSize, sortBy, sortOrder } = req.query;
    const transformations = await getTransformationsService({
      isActive: isActive ? isActive === 'true' : undefined,
      language,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
      sortBy,
      sortOrder
    });
    res.json({ transformations });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const createTransformation = async (req, res) => {
  try {
    const transformation = await createTransformationService(req.body);
    res.status(201).json({ transformation });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const getTransformationById = async (req, res) => {
  try {
    const { id } = req.params;
    const transformation = await getTransformationByIdService(id);
    if (!transformation) return res.status(404).json({ error: { message: "Transformation not found" } });
    res.json({ transformation });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const updateTransformation = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the old transformation to check if imageUrl changed
    const oldTransformation = await getTransformationByIdService(id);
    if (!oldTransformation) {
      return res.status(404).json({ error: { message: 'Transformation not found' } });
    }
    
    // Update the transformation
    const transformation = await updateTransformationService(id, req.body);
    
    // If imageUrl changed, delete the old file
    if (oldTransformation.imageUrl && oldTransformation.imageUrl !== req.body.imageUrl) {
      try {
        // Extract file ID from the old imageUrl
        const oldImageUrl = oldTransformation.imageUrl;
        if (oldImageUrl.includes('/uploads/content/')) {
          const fileName = oldImageUrl.split('/').pop();
          const fileId = fileName.split('.')[0]; // Remove extension
          
          // Delete the old file
          const { deleteUpload } = await import('../uploads/upload.service.js');
          await deleteUpload(fileId, 'transformations');
          console.log(`Deleted old transformation image: ${fileId}`);
        }
      } catch (deleteError) {
        console.error('Error deleting old transformation image:', deleteError);
        // Don't fail the update if file deletion fails
      }
    }
    
    res.json({ transformation });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const deleteTransformation = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the transformation before deleting to access the imageUrl
    const transformation = await getTransformationByIdService(id);
    if (!transformation) {
      return res.status(404).json({ error: { message: 'Transformation not found' } });
    }
    
    // Delete the transformation from database
    await deleteTransformationService(id);
    
    // Delete the associated image file
    if (transformation.imageUrl) {
      try {
        const imageUrl = transformation.imageUrl;
        if (imageUrl.includes('/uploads/content/')) {
          const fileName = imageUrl.split('/').pop();
          const fileId = fileName.split('.')[0]; // Remove extension
          
          // Delete the file
          const { deleteUpload } = await import('../uploads/upload.service.js');
          await deleteUpload(fileId, 'transformations');
          console.log(`Deleted transformation image: ${fileId}`);
        }
      } catch (deleteError) {
        console.error('Error deleting transformation image:', deleteError);
        // Don't fail the deletion if file deletion fails
      }
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

// Videos
export const getVideos = async (req, res) => {
  try {
    const videos = await getVideosService();
    res.json({ videos });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const createVideo = async (req, res) => {
  try {
    const video = await createVideoService(req.body);
    res.status(201).json({ video });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await getVideoByIdService(id);
    if (!video) return res.status(404).json({ error: { message: "Video not found" } });
    res.json({ video });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the old video to check if URLs changed
    const oldVideo = await getVideoByIdService(id);
    if (!oldVideo) {
      return res.status(404).json({ error: { message: 'Video not found' } });
    }
    
    // Update the video
    const video = await updateVideoService(id, req.body);
    
    // If videoUrl changed, delete the old video file
    if (oldVideo.videoUrl && oldVideo.videoUrl !== req.body.videoUrl) {
      try {
        const oldVideoUrl = oldVideo.videoUrl;
        if (oldVideoUrl.includes('/uploads/content/videos/')) {
          const fileName = oldVideoUrl.split('/').pop();
          const fileId = fileName.split('.')[0]; // Remove extension
          
          // Delete the old video file
          const { deleteUpload } = await import('../uploads/upload.service.js');
          await deleteUpload(fileId, 'videos');
          console.log(`Deleted old video file: ${fileId}`);
        }
      } catch (deleteError) {
        console.error('Error deleting old video file:', deleteError);
        // Don't fail the update if file deletion fails
      }
    }
    
    // Handle thumbnail changes
    const oldThumbnails = [oldVideo.thumbnailAr, oldVideo.thumbnailEn].filter(Boolean);
    const newThumbnails = [req.body.thumbnailAr, req.body.thumbnailEn].filter(Boolean);
    
    // Find thumbnails that were removed
    const removedThumbnails = oldThumbnails.filter(oldThumb => 
      !newThumbnails.includes(oldThumb)
    );
    
    // Delete removed thumbnails
    for (const thumbnailUrl of removedThumbnails) {
      try {
        if (thumbnailUrl.includes('/uploads/content/')) {
          const fileName = thumbnailUrl.split('/').pop();
          const fileId = fileName.split('.')[0]; // Remove extension
          
          // Determine category from URL
          let category = 'videos';
          if (thumbnailUrl.includes('/transformations/')) category = 'transformations';
          else if (thumbnailUrl.includes('/products/')) category = 'products';
          else if (thumbnailUrl.includes('/programmes/')) category = 'programmes';
          
          // Delete the thumbnail file
          const { deleteUpload } = await import('../uploads/upload.service.js');
          await deleteUpload(fileId, category);
          console.log(`Deleted old video thumbnail: ${fileId}`);
        }
      } catch (deleteError) {
        console.error('Error deleting old video thumbnail:', deleteError);
        // Continue with other thumbnails even if one fails
      }
    }
    
    res.json({ video });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the video before deleting to access the file URLs
    const video = await getVideoByIdService(id);
    if (!video) {
      return res.status(404).json({ error: { message: 'Video not found' } });
    }
    
    // Delete the video from database
    await deleteVideoService(id);
    
    // Delete the video file
    if (video.videoUrl) {
      try {
        const videoUrl = video.videoUrl;
        if (videoUrl.includes('/uploads/content/videos/')) {
          const fileName = videoUrl.split('/').pop();
          const fileId = fileName.split('.')[0]; // Remove extension
          
          // Delete the video file
          const { deleteUpload } = await import('../uploads/upload.service.js');
          await deleteUpload(fileId, 'videos');
          console.log(`Deleted video file: ${fileId}`);
        }
      } catch (deleteError) {
        console.error('Error deleting video file:', deleteError);
        // Don't fail the deletion if file deletion fails
      }
    }
    
    // Delete thumbnail files
    const thumbnails = [video.thumbnailAr, video.thumbnailEn].filter(Boolean);
    for (const thumbnailUrl of thumbnails) {
      try {
        if (thumbnailUrl.includes('/uploads/content/')) {
          const fileName = thumbnailUrl.split('/').pop();
          const fileId = fileName.split('.')[0]; // Remove extension
          
          // Determine category from URL
          let category = 'videos';
          if (thumbnailUrl.includes('/transformations/')) category = 'transformations';
          else if (thumbnailUrl.includes('/products/')) category = 'products';
          else if (thumbnailUrl.includes('/programmes/')) category = 'programmes';
          
          // Delete the thumbnail file
          const { deleteUpload } = await import('../uploads/upload.service.js');
          await deleteUpload(fileId, category);
          console.log(`Deleted video thumbnail: ${fileId}`);
        }
      } catch (deleteError) {
        console.error('Error deleting video thumbnail:', deleteError);
        // Continue with other thumbnails even if one fails
      }
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

// Homepage Popup
export const getHomepagePopup = async (req, res) => {
  try {
    const popup = await getHomepagePopupService();
    res.json({ popup });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const updateHomepagePopup = async (req, res) => {
  try {
    // Import directly to avoid any caching issues
    const { getPrismaClient } = await import('../../config/db.js');
    const prisma = getPrismaClient();
    
    // If activating, deactivate all others first
    if (req.body.isActive) {
      await prisma.homepagePopup.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }
    
    // Check if popup exists
    let popup = await prisma.homepagePopup.findFirst();
    
    // Store old image URL for deletion if provided
    const oldImageUrl = req.body.oldImageUrl;
    
    if (popup) {
      // Update existing
      popup = await prisma.homepagePopup.update({
        where: { id: popup.id },
        data: {
          isActive: req.body.isActive,
          header: req.body.header,
          subheader: req.body.subheader,
          imageUrl: req.body.imageUrl,
          buttonText: req.body.buttonText,
          buttonLink: req.body.buttonLink
        }
      });
    } else {
      // Create new
      popup = await prisma.homepagePopup.create({
        data: {
          isActive: req.body.isActive || false,
          header: req.body.header || { en: "Welcome", ar: "مرحباً" },
          subheader: req.body.subheader || { en: "Start your journey", ar: "ابدأ رحلتك" },
          imageUrl: req.body.imageUrl || null,
          buttonText: req.body.buttonText || { en: "Get Started", ar: "ابدأ" },
          buttonLink: req.body.buttonLink || "/join-us"
        }
      });
    }
    
    // Delete old image if provided and different from new image
    if (oldImageUrl && oldImageUrl !== req.body.imageUrl) {
      try {
        const { deleteUpload } = await import('../uploads/upload.service.js');
        const fileName = oldImageUrl.split('/').pop();
        const fileId = fileName.split('.')[0]; // Remove extension
        await deleteUpload(fileId, 'popup');
        console.log(`Deleted old popup image: ${fileId}`);
      } catch (deleteError) {
        console.error('Error deleting old popup image:', deleteError);
        // Don't fail the operation if image deletion fails
      }
    }
    
    res.json({ popup });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};
