import { Router } from 'express';
import orderController from '../controllers/order/order.controller.js';
import protect from '../middlewares/auth.middleware.js';
import isAdmin from '../middlewares/admin.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createOrderValidator, updateStatusValidator } from '../validations/order.validation.js';

const router = Router();

// Apply protect middleware globally to all order routes
router.use(protect);

// Admin-Only Routes
router.get('/admin/all', isAdmin, orderController.adminListAll);
router.patch('/:id/status', isAdmin, updateStatusValidator, validate, orderController.adminUpdateStatus);

// Customer Routes
router.post('/send-otp', orderController.sendOtp);
router.post('/', createOrderValidator, validate, orderController.create);
router.get('/my-orders', orderController.listMyOrders);
router.get('/:id', orderController.read);
router.patch('/:id/cancel', orderController.cancel);
router.post('/:id/return', orderController.return);

export default router;
