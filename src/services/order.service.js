import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import cartService from './cart.service.js';
import emailService from './email.service.js';

class OrderService {
  /**
   * Generates and dispatches a 6-digit Order Confirmation OTP to registered email.
   */
  async sendOrderOtp(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(440, 'User account not found.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.orderOtp = otp;
    user.orderOtpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    await emailService.sendOrderConfirmationOtpEmail(user.email, user.name, otp);
    return `Order confirmation OTP sent to ${user.email}.`;
  }

  /**
   * Compiles pricing details, verifies Order OTP, decreases product stocks, and creates a user Order.
   */
  async createOrder(userId, { shippingAddress, paymentMethod = 'COD', otp }) {
    // 0. Verify Order OTP
    const user = await User.findById(userId).select('+orderOtp +orderOtpExpire');
    if (!otp || !user.orderOtp || user.orderOtp !== otp.toString().trim() || !user.orderOtpExpire || user.orderOtpExpire < new Date()) {
      throw new ApiError(400, 'Invalid or expired Order Confirmation OTP. Please request a new code.');
    }

    // Clear order OTP
    user.orderOtp = undefined;
    user.orderOtpExpire = undefined;
    await user.save();

    // 1. Fetch user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, 'Cannot place order. Shopping cart is empty.');
    }

    // 2. Validate inventory stock levels & compute items price
    let itemsPrice = 0;
    const orderItems = [];
    const stockUpdates = []; // Collect bulk operations

    for (const cartItem of cart.items) {
      const product = cartItem.product;

      if (!product) {
        throw new ApiError(404, 'One or more products in your cart no longer exist.');
      }

      if (product.stock < cartItem.quantity) {
        throw new ApiError(
          400,
          `Insufficient inventory. '${product.title}' has only ${product.stock} items remaining.`
        );
      }

      // Queue stock deduction for bulk write (instead of N individual saves)
      stockUpdates.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $inc: { stock: -cartItem.quantity } },
        },
      });

      // Resolve current price (use discount price if present)
      const currentPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
      itemsPrice += currentPrice * cartItem.quantity;

      orderItems.push({
        product: product._id,
        name: product.title,
        quantity: cartItem.quantity,
        image: product.images && product.images[0] ? product.images[0].url : 'https://via.placeholder.com/150',
        price: currentPrice,
      });
    }

    // Batch deduct stock in a single DB operation (was N individual saves)
    if (stockUpdates.length > 0) {
      await Product.bulkWrite(stockUpdates);
    }

    // 3. Compute tax and shipping prices
    const taxPrice = Number((0.05 * itemsPrice).toFixed(2)); // 5% GST standard rate
    const shippingPrice = itemsPrice >= 1000 ? 0 : 99; // Free shipping over 1000, else 99
    const totalPrice = Number((itemsPrice + taxPrice + shippingPrice).toFixed(2));

    // 4. Create Order
    const order = await Order.create({
      user: userId,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    // 5. Clear cart
    await cartService.clearUserCart(userId);

    // 6. Trigger Order Invoice Confirmation Email
    try {
      const fullUser = await User.findById(userId);
      if (fullUser && fullUser.email) {
        await emailService.sendOrderPlacedInvoiceEmail(fullUser.email, fullUser.name, order);
      }
    } catch (emailErr) {
      console.error('⚠️ Order confirmation email dispatch error:', emailErr.message);
    }

    return order;
  }

  /**
   * Retrieves specific order details. Enforces authorization check.
   */
  async getOrderDetails(orderId, userId, userRole) {
    const order = await Order.findById(orderId).populate('user', 'name email').lean();
    if (!order) {
      throw new ApiError(404, 'Order not found.');
    }

    // Auth check: Admin can access any order, otherwise verify owner matches
    if (userRole !== 'Admin' && order.user._id.toString() !== userId.toString()) {
      throw new ApiError(403, 'Unauthorized access to this order details.');
    }

    return order;
  }

  /**
   * Retrieves all orders owned by a user.
   */
  async getMyOrders(userId) {
    return await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
  }

  /**
   * Admin: Retrieves all system orders.
   */
  async getAllOrders() {
    return await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Admin: Updates execution status of an order.
   */
  async updateOrderStatus(orderId, status) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, 'Order not found.');
    }

    if (order.status === 'Delivered') {
      throw new ApiError(400, 'Order has already been delivered and completed.');
    }

    order.status = status;

    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      // If payment method is COD, mark paid upon delivery
      if (order.paymentMethod === 'COD') {
        order.isPaid = true;
        order.paidAt = Date.now();
      }
    }

    await order.save();
    return order;
  }

  /**
   * Customer: Cancels an existing order (if not shipped or delivered), restoring product stocks.
   */
  async cancelOrder(orderId, userId) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, 'Order not found.');
    }

    if (order.user.toString() !== userId.toString()) {
      throw new ApiError(403, 'Unauthorized to cancel this order.');
    }

    if (['Shipped', 'Delivered', 'Cancelled', 'Returned'].includes(order.status)) {
      throw new ApiError(400, `Cannot cancel order with status '${order.status}'.`);
    }

    order.status = 'Cancelled';
    await order.save();

    // Restore stock inventory in bulk
    const stockRestorations = order.orderItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: item.quantity } },
      },
    }));

    if (stockRestorations.length > 0) {
      await Product.bulkWrite(stockRestorations);
    }

    return order;
  }

  /**
   * Customer: Requests return for a delivered order.
   */
  async returnOrder(orderId, userId, reason) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, 'Order not found.');
    }

    if (order.user.toString() !== userId.toString()) {
      throw new ApiError(403, 'Unauthorized to return this order.');
    }

    if (order.status !== 'Delivered') {
      throw new ApiError(400, 'Only delivered orders are eligible for return.');
    }

    order.status = 'Returned';
    await order.save();

    return order;
  }
}

export default new OrderService();
