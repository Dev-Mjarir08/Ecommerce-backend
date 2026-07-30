import { body } from 'express-validator';

/**
 * Validation rules for creating a product catalog item.
 */
export const createProductValidator = [
  body('title')
    .notEmpty()
    .withMessage('Product title is required.')
    .isLength({ max: 100 })
    .withMessage('Product title cannot exceed 100 characters.')
    .trim(),
  body('description')
    .notEmpty()
    .withMessage('Product description is required.')
    .trim(),
  body('price')
    .isNumeric()
    .withMessage('Price must be a valid number.')
    .custom((value) => value >= 0)
    .withMessage('Price must be a non-negative number.'),
  body('discountPrice')
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage('Discount price must be a valid number.')
    .custom((value, { req }) => Number(value) <= Number(req.body.price))
    .withMessage('Discount price must be less than or equal to the original price.'),
  body('category')
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ObjectId.'),
  body('brand')
    .notEmpty()
    .withMessage('Brand name is required.')
    .trim(),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer.'),
];

/**
 * Validation rules for updating a product catalog item.
 */
export const updateProductValidator = [
  body('title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Product title cannot exceed 100 characters.')
    .trim(),
  body('description')
    .optional()
    .trim(),
  body('price')
    .optional()
    .isNumeric()
    .withMessage('Price must be a valid number.')
    .custom((value) => value >= 0)
    .withMessage('Price must be a non-negative number.'),
  body('discountPrice')
    .optional()
    .isNumeric()
    .withMessage('Discount price must be a valid number.'),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ObjectId.'),
  body('brand')
    .optional()
    .trim(),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer.'),
];

/**
 * Validation rules for product reviews.
 */
export const reviewValidator = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5.'),
  body('comment')
    .notEmpty()
    .withMessage('Review comment is required.')
    .trim(),
];
