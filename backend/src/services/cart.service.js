import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';

class CartService {
  /**
   * Retrieves a user's active shopping cart. Creates one if it does not exist.
   */
  async getCartByUser(userId) {
    let cart = await Cart.findOne({ user: userId }).populate(
      'items.product',
      'title slug price discountPrice images stock brand'
    ).lean();

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    return cart;
  }

  /**
   * Appends or updates a product item inside the user's shopping cart.
   */
  async addItemToCart(userId, { productId, quantity = 1 }) {
    // 1. Verify product exists and is in stock
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found.');
    }

    if (product.stock < quantity) {
      throw new ApiError(400, `Insufficient stock. Only ${product.stock} items remaining.`);
    }

    // 2. Fetch or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    // 3. Check if product already exists in cart
    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);

    if (itemIndex > -1) {
      // Increment quantity
      const newQuantity = cart.items[itemIndex].quantity + Number(quantity);
      if (product.stock < newQuantity) {
        throw new ApiError(400, `Insufficient stock. Cannot add. Available: ${product.stock}`);
      }
      cart.items[itemIndex].quantity = newQuantity;
    } else {
      // Append new item
      cart.items.push({ product: productId, quantity: Number(quantity) });
    }

    await cart.save();
    // Populate the saved doc directly instead of re-querying the entire cart
    await cart.populate('items.product', 'title slug price discountPrice images stock brand');
    return cart;
  }

  /**
   * Updates the exact quantity of a product item inside the cart.
   */
  async updateItemQuantity(userId, { productId, quantity }) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found.');
    }

    if (product.stock < quantity) {
      throw new ApiError(400, `Insufficient stock. Only ${product.stock} items available.`);
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw new ApiError(404, 'Cart not found.');
    }

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (itemIndex === -1) {
      throw new ApiError(404, 'Product not found in cart.');
    }

    cart.items[itemIndex].quantity = Number(quantity);
    await cart.save();
    // Populate the saved doc directly instead of re-querying the entire cart
    await cart.populate('items.product', 'title slug price discountPrice images stock brand');
    return cart;
  }

  /**
   * Removes a product item from the user's cart.
   */
  async removeItemFromCart(userId, productId) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw new ApiError(404, 'Cart not found.');
    }

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    await cart.save();
    // Populate the saved doc directly instead of re-querying the entire cart
    await cart.populate('items.product', 'title slug price discountPrice images stock brand');
    return cart;
  }

  /**
   * Empties the user's shopping cart.
   */
  async clearUserCart(userId) {
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    return cart;
  }
}

export default new CartService();
