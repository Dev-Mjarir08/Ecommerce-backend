import { Router } from 'express';
import paymentController from '../controllers/payment/payment.controller.js';
import protect from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/create-razorpay-order', protect, paymentController.createRazorpayOrder);
router.post('/verify-razorpay-payment', protect, paymentController.verifyPayment);
router.post('/webhook', paymentController.webhook);

export default router;
