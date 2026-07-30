import wishlistService from '../../services/wishlist.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class WishlistController {
  /**
   * Retrieves user wishlist items.
   */
  get = asyncHandler(async (req, res) => {
    const wishlist = await wishlistService.getWishlistByUser(req.user._id);
    res.status(200).json(
      new ApiResponse(200, wishlist, 'Wishlist retrieved successfully.')
    );
  });

  /**
   * Adds product item to wishlist.
   */
  add = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    const wishlist = await wishlistService.addItemToWishlist(req.user._id, productId);

    res.status(200).json(
      new ApiResponse(200, wishlist, 'Product added to wishlist successfully.')
    );
  });

  /**
   * Removes product item from wishlist.
   */
  remove = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const wishlist = await wishlistService.removeItemFromWishlist(req.user._id, productId);

    res.status(200).json(
      new ApiResponse(200, wishlist, 'Product removed from wishlist successfully.')
    );
  });
}

export default new WishlistController();
