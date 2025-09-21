import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getContentService = async () => {
  return prisma.cMSContent.findMany();
};

export const updateContentService = async (id, data) => {
  return prisma.cMSContent.update({
    where: { id: parseInt(id) },
    data: {
      title: data.title,
      content: data.content,
      type: data.type
    }
  });
};

// Transformations
export const getTransformationsService = async (filters = {}) => {
  const { isActive, language, pageSize, sortBy, sortOrder } = filters;
  
  // Build where clause
  const where = {};
  if (isActive !== undefined) {
    where.isActive = isActive;
  }
  
  // Build orderBy clause
  let orderBy = { createdAt: 'desc' };
  if (sortBy) {
    orderBy = { [sortBy]: sortOrder || 'desc' };
  }
  
  // Build query options
  const queryOptions = {
    where,
    orderBy
  };
  
  // Add pagination if pageSize is specified
  if (pageSize) {
    queryOptions.take = pageSize;
  }
  
  return prisma.transformation.findMany(queryOptions);
};

export const createTransformationService = async (data) => {
  return prisma.transformation.create({
    data: {
      title: data.title || { en: 'Transformation', ar: 'تحول' },
      imageUrl: data.imageUrl,
      isActive: data.isActive !== undefined ? data.isActive : true
    }
  });
};

export const getTransformationByIdService = async (id) => {
  return prisma.transformation.findUnique({
    where: { id: id }
  });
};

export const updateTransformationService = async (id, data) => {
  return prisma.transformation.update({
    where: { id: id },
    data: {
      title: data.title,
      imageUrl: data.imageUrl,
      isActive: data.isActive
    }
  });
};

export const deleteTransformationService = async (id) => {
  return prisma.transformation.delete({
    where: { id: id }
  });
};

// Videos
export const getVideosService = async () => {
  return prisma.video.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

export const createVideoService = async (data) => {
  return prisma.video.create({
    data: {
      title: data.title,
      videoUrl: data.videoUrl,
      thumbnailAr: data.thumbnailAr,
      thumbnailEn: data.thumbnailEn,
      isActive: data.isActive !== undefined ? data.isActive : true
    }
  });
};

export const getVideoByIdService = async (id) => {
  return prisma.video.findUnique({
    where: { id: id }
  });
};

export const updateVideoService = async (id, data) => {
  // If trying to set isActive to true, first set all other videos to false
  if (data.isActive === true) {
    await prisma.video.updateMany({
      where: {
        id: { not: id }
      },
      data: {
        isActive: false
      }
    });
  }
  
  return prisma.video.update({
    where: { id: id },
    data: {
      title: data.title,
      videoUrl: data.videoUrl,
      thumbnailAr: data.thumbnailAr,
      thumbnailEn: data.thumbnailEn,
      isActive: data.isActive
    }
  });
};

export const deleteVideoService = async (id) => {
  return prisma.video.delete({
    where: { id: id }
  });
};
