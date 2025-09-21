import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const uploadVideoService = async (data) => {
  return prisma.video.create({ data });
};

export const getVideosService = async () => {
  return prisma.video.findMany();
};

export const getVideoByIdService = async (id) => {
  return prisma.video.findUnique({
    where: { id: parseInt(id) }
  });
};

export const deleteVideoService = async (id) => {
  return prisma.video.delete({
    where: { id: parseInt(id) }
  });
};
