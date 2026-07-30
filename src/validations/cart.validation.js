import { body } from 'express-validator';

/**
 * Validation rules for adding items to the cart.
 */
export const addItemValidator = [
  body('productId')
    .isMongoId()
    .withMessage('ProductId must be a valid MongoDB ObjectId.'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer greater than or equal to 1.'),
];

/**
 * Validation rules for updating item quantities in the cart.
 */
export const updateQuantityValidator = [
  body('productId')
    .isMongoId()
    .withMessage('ProductId must be a valid MongoDB ObjectId.'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer greater than or equal to 1.'),
];
