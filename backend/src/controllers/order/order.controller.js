import orderService from '../../services/order.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class OrderController {
  /**
   * Customer: Sends Order Confirmation OTP to registered email.
   */
  sendOtp = asyncHandler(async (req, res) => {
    const message = await orderService.sendOrderOtp(req.user._id);
    res.status(200).json(
      new ApiResponse(200, null, message)
    );
  });

  /**
   * Customer: Places a new order from cart items.
   */
  create = asyncHandler(async (req, res) => {
    const { shippingAddress, paymentMethod, otp } = req.body;
    const order = await orderService.createOrder(req.user._id, {
      shippingAddress,
      paymentMethod,
      otp,
    });

    res.status(201).json(
      new ApiResponse(201, order, 'Order placed successfully.')
    );
  });

  /**
   * Customer/Admin: Retrieves details of a specific order.
   */
  read = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await orderService.getOrderDetails(id, req.user._id, req.user.role);

    res.status(200).json(
      new ApiResponse(200, order, 'Order details retrieved successfully.')
    );
  });

  /**
   * Customer: Lists all orders placed by the user.
   */
  listMyOrders = asyncHandler(async (req, res) => {
    const orders = await orderService.getMyOrders(req.user._id);
    res.status(200).json(
      new ApiResponse(200, orders, 'User orders retrieved successfully.')
    );
  });

  /**
   * Customer: Cancels an order before shipping.
   */
  cancel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await orderService.cancelOrder(id, req.user._id);
    res.status(200).json(
      new ApiResponse(200, order, 'Order has been cancelled successfully.')
    );
  });

  /**
   * Customer: Requests return for a delivered order.
   */
  return = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const order = await orderService.returnOrder(id, req.user._id, reason);
    res.status(200).json(
      new ApiResponse(200, order, 'Order return request submitted successfully.')
    );
  });

  /**
   * Admin: Lists all store orders.
   */
  adminListAll = asyncHandler(async (req, res) => {
    const orders = await orderService.getAllOrders();
    res.status(200).json(
      new ApiResponse(200, orders, 'All orders retrieved successfully.')
    );
  });

  /**
   * Admin: Updates status of an order.
   */
  adminUpdateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const order = await orderService.updateOrderStatus(id, status);

    res.status(200).json(
      new ApiResponse(200, order, 'Order status updated successfully.')
    );
  });
}

export default new OrderController();
