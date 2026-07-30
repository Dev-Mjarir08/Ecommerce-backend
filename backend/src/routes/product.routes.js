import { Router } from 'express';
import productController from '../controllers/product/product.controller.js';
import protect from '../middlewares/auth.middleware.js';
import isAdmin from '../middlewares/admin.middleware.js';
import upload from '../middlewares/upload.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createProductValidator,
  updateProductValidator,
  reviewValidator,
} from '../validations/product.validation.js';

const router = Router();

// Public Routes
router.get('/', productController.list);
router.get('/search', productController.search);
router.get('/:slug', productController.read);

// User Protected Routes
router.post('/:slug/reviews', protect, reviewValidator, validate, productController.createReview);

// Admin-Only Routes
router.post('/bulk', protect, isAdmin, productController.bulkCreate);
router.post(
  '/',
  protect,
  isAdmin,
  upload.array('images', 5), // Allow up to 5 images upload
  createProductValidator,
  validate,
  productController.create
);
router.put(
  '/:slug',
  protect,
  isAdmin,
  upload.array('images', 5),
  updateProductValidator,
  validate,
  productController.update
);
router.delete('/all/clear', protect, isAdmin, productController.deleteAll);
router.delete('/:slug', protect, isAdmin, productController.delete);

export default router;
