import { Router } from 'express';
import bannerController from '../controllers/banner/banner.controller.js';
import protect from '../middlewares/auth.middleware.js';
import isAdmin from '../middlewares/admin.middleware.js';
import upload from '../middlewares/upload.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createBannerValidator, updateBannerValidator } from '../validations/banner.validation.js';

const router = Router();

// Public endpoints
router.get('/', bannerController.listActive);

// Admin-Only endpoints
router.get('/admin/all', protect, isAdmin, bannerController.listAll);
router.post('/bulk', protect, isAdmin, bannerController.bulkCreate);
router.post(
  '/',
  protect,
  isAdmin,
  upload.single('image'),
  createBannerValidator,
  validate,
  bannerController.create
);
router.put(
  '/:id',
  protect,
  isAdmin,
  upload.single('image'),
  updateBannerValidator,
  validate,
  bannerController.update
);
router.delete('/all/clear', protect, isAdmin, bannerController.deleteAll);
router.delete('/:id', protect, isAdmin, bannerController.delete);

export default router;
