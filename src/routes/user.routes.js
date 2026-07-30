import { Router } from 'express';
import userController from '../controllers/user/user.controller.js';
import protect from '../middlewares/auth.middleware.js';
import isAdmin from '../middlewares/admin.middleware.js';
import upload from '../middlewares/upload.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { updateProfileValidator, toggleBlockValidator } from '../validations/user.validation.js';

const router = Router();

// Protected Routes (Customers/Users)
router.get('/profile', protect, userController.getProfile);
router.put(
  '/profile',
  protect,
  upload.single('avatar'),
  updateProfileValidator,
  validate,
  userController.updateProfile
);

// Address Management Routes
router.get('/addresses', protect, userController.getAddresses);
router.post('/addresses', protect, userController.addAddress);
router.put('/addresses/:addressId', protect, userController.updateAddress);
router.delete('/addresses/:addressId', protect, userController.deleteAddress);
router.patch('/addresses/:addressId/default', protect, userController.setDefaultAddress);

// Recently Viewed Routes
router.get('/recently-viewed', protect, userController.getRecentlyViewed);
router.post('/recently-viewed', protect, userController.addRecentlyViewed);

// Admin-Only Routes
router.get('/admin/users', protect, isAdmin, userController.adminGetAllUsers);
router.patch(
  '/admin/users/:id/block',
  protect,
  isAdmin,
  toggleBlockValidator,
  validate,
  userController.adminToggleBlock
);
router.delete('/admin/users/:id', protect, isAdmin, userController.adminDeleteUser);

export default router;
