import { Router } from 'express';
import categoryController from '../controllers/category/category.controller.js';
import protect from '../middlewares/auth.middleware.js';
import isAdmin from '../middlewares/admin.middleware.js';
import upload from '../middlewares/upload.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createCategoryValidator, updateCategoryValidator } from '../validations/category.validation.js';

const router = Router();

// Public Routes
router.get('/', categoryController.list);
router.get('/:slug', categoryController.read);

// Admin Protected Routes
router.post('/bulk', protect, isAdmin, categoryController.bulkCreate);
router.post(
  '/',
  protect,
  isAdmin,
  upload.single('image'),
  createCategoryValidator,
  validate,
  categoryController.create
);
router.put(
  '/:slug',
  protect,
  isAdmin,
  upload.single('image'),
  updateCategoryValidator,
  validate,
  categoryController.update
);
router.delete('/all/clear', protect, isAdmin, categoryController.deleteAll);
router.delete('/:slug', protect, isAdmin, categoryController.delete);

export default router;
