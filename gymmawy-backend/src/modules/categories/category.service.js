import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCategoriesService = async () => {
  return prisma.category.findMany({
    orderBy: { name: 'asc' }
  });
};

export const createCategoryService = async (data) => {
  return prisma.category.create({
    data: {
      name: data.name,
      description: data.description,
      image: data.image
    }
  });
};

export const updateCategoryService = async (id, data) => {
  return prisma.category.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      description: data.description,
      image: data.image
    }
  });
};

export const deleteCategoryService = async (id) => {
  return prisma.category.delete({
    where: { id: parseInt(id) }
  });
};
