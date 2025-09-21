import { getCategoriesService, createCategoryService, updateCategoryService, deleteCategoryService } from './category.service.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await getCategoriesService();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const createCategory = async (req, res) => {
  try {
    const category = await createCategoryService(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await updateCategoryService(id, req.body);
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteCategoryService(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};
