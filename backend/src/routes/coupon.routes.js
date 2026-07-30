import { Router } from 'express';
import couponController from '../controllers/coupon/coupon.controller.js';
import protect from '../middlewares/auth.middleware.js';
import isAdmin from '../middlewares/admin.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createCouponValidator, validateCouponValidator } from '../validations/coupon.validation.js';

const router = Router();

// Apply protect middleware globally
router.use(protect);

// Customer endpoints
router.post('/validate', validateCouponValidator, validate, couponController.validate);

// Admin-Only endpoints
router.post('/', isAdmin, createCouponValidator, validate, couponController.create);
router.get('/', isAdmin, couponController.list);
router.delete('/all/clear', isAdmin, couponController.deleteAll);
router.delete('/:id', isAdmin, couponController.delete);

export default router;
