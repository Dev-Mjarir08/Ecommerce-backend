import paymentService from '../../services/payment.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class PaymentController {
  createRazorpayOrder = asyncHandler(async (req, res) => {
    const { orderId, amount } = req.body;
    const razorpayData = await paymentService.createRazorpayOrder(orderId, amount);

    res.status(200).json(
      new ApiResponse(200, razorpayData, 'Razorpay order generated successfully.')
    );
  });

  verifyPayment = asyncHandler(async (req, res) => {
    const { dbOrderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const updatedOrder = await paymentService.verifyPayment({
      dbOrderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    res.status(200).json(
      new ApiResponse(200, updatedOrder, 'Payment verified and order marked as Paid.')
    );
  });

  webhook = asyncHandler(async (req, res) => {
    // Process Razorpay async webhook event payload
    console.log('⚡ [RAZORPAY WEBHOOK RECEIVED]:', req.body);
    res.status(200).json({ status: 'ok' });
  });
}

export default new PaymentController();
