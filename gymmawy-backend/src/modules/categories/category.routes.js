import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from './category.controller.js';

const router = express.Router();

// GET /api/categories - Get all categories
router.get('/', getCategories);

// POST /api/categories - Create a new category
router.post('/', createCategory);

// PUT /api/categories/:id - Update a category
router.put('/:id', updateCategory);

// DELETE /api/categories/:id - Delete a category
router.delete('/:id', deleteCategory);

export default router;
