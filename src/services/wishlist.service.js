import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';

class WishlistService {
  /**
   * Retrieves user wishlist, initializes one if missing.
   */
  async getWishlistByUser(userId) {
    let wishlist = await Wishlist.findOne({ user: userId }).populate(
      'products',
      'title slug price discountPrice images stock brand'
    ).lean();

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    return wishlist;
  }

  /**
   * Appends product ID to user wishlist if not already present.
   */
  async addItemToWishlist(userId, productId) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(404, 'Product not found.');
    }

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    if (wishlist.products.includes(productId)) {
      throw new ApiError(400, 'Product is already in wishlist.');
    }

    wishlist.products.push(productId);
    await wishlist.save();
    // Populate the saved doc directly instead of re-querying the entire wishlist
    await wishlist.populate('products', 'title slug price discountPrice images stock brand');
    return wishlist;
  }

  /**
   * Removes a product ID from user wishlist.
   */
  async removeItemFromWishlist(userId, productId) {
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      throw new ApiError(404, 'Wishlist not found.');
    }

    wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);
    await wishlist.save();
    // Populate the saved doc directly instead of re-querying the entire wishlist
    await wishlist.populate('products', 'title slug price discountPrice images stock brand');
    return wishlist;
  }
}

export default new WishlistService();
