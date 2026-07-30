import cartService from '../../services/cart.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class CartController {
  /**
   * Retrieves the shopping cart.
   */
  get = asyncHandler(async (req, res) => {
    const cart = await cartService.getCartByUser(req.user._id);
    res.status(200).json(
      new ApiResponse(200, cart, 'Cart retrieved successfully.')
    );
  });

  /**
   * Adds an item to the shopping cart.
   */
  add = asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;
    const cart = await cartService.addItemToCart(req.user._id, { productId, quantity });

    res.status(200).json(
      new ApiResponse(200, cart, 'Item added to cart successfully.')
    );
  });

  /**
   * Updates item quantity inside the shopping cart.
   */
  update = asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;
    const cart = await cartService.updateItemQuantity(req.user._id, { productId, quantity });

    res.status(200).json(
      new ApiResponse(200, cart, 'Cart item quantity updated successfully.')
    );
  });

  /**
   * Removes an item from the shopping cart.
   */
  remove = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const cart = await cartService.removeItemFromCart(req.user._id, productId);

    res.status(200).json(
      new ApiResponse(200, cart, 'Item removed from cart successfully.')
    );
  });

  /**
   * Clears the shopping cart.
   */
  clear = asyncHandler(async (req, res) => {
    const cart = await cartService.clearUserCart(req.user._id);
    res.status(200).json(
      new ApiResponse(200, cart, 'Cart cleared successfully.')
    );
  });
}

export default new CartController();
