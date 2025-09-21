import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const uploadImageService = async (data) => {
  return prisma.image.create({ data });
};

export const getImagesService = async () => {
  return prisma.image.findMany();
};

export const getImageByIdService = async (id) => {
  return prisma.image.findUnique({
    where: { id: parseInt(id) }
  });
};

export const deleteImageService = async (id) => {
  return prisma.image.delete({
    where: { id: parseInt(id) }
  });
};
