import { body } from 'express-validator';

/**
 * Validation rules for adding items to the wishlist.
 */
export const addWishlistValidator = [
  body('productId')
    .isMongoId()
    .withMessage('ProductId must be a valid MongoDB ObjectId.'),
];
