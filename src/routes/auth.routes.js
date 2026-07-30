import { Router } from 'express';
import authController from '../controllers/auth/auth.controller.js';
import protect from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} from '../validations/auth.validation.js';

const router = Router();

// Public Routes
router.post('/register', registerValidator, validate, authController.register);
router.post('/admin/register', registerValidator, validate, authController.registerAdmin);
router.post('/login', loginValidator, validate, authController.login);
router.post('/forgot-password', forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/reset-password/:token', resetPasswordValidator, validate, authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);

// Public / Flexible OTP Routes
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);

// Protected Routes (Require JWT Authentication)
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);
router.put('/change-password', protect, changePasswordValidator, validate, authController.changePassword);

export default router;
