import { body } from 'express-validator';

/**
 * Validation rules for creating a Coupon.
 */
export const createCouponValidator = [
  body('code')
    .notEmpty()
    .withMessage('Coupon code is required.')
    .trim(),
  body('discountType')
    .isIn(['Percentage', 'Flat'])
    .withMessage('discountType must be either Percentage or Flat.'),
  body('discountValue')
    .isNumeric()
    .withMessage('Discount value must be a valid number.')
    .custom((val) => val >= 0)
    .withMessage('Discount value cannot be negative.'),
  body('minCartAmount')
    .optional()
    .isNumeric()
    .withMessage('minCartAmount must be a valid number.')
    .custom((val) => val >= 0)
    .withMessage('minCartAmount cannot be negative.'),
  body('expiryDate')
    .isISO8601()
    .withMessage('Expiry date must be a valid ISO8601 Date.'),
];

/**
 * Validation rules for applying/validating a coupon.
 */
export const validateCouponValidator = [
  body('code')
    .notEmpty()
    .withMessage('Coupon code is required.')
    .trim(),
  body('cartAmount')
    .isNumeric()
    .withMessage('cartAmount must be a valid number.')
    .custom((val) => val > 0)
    .withMessage('cartAmount must be greater than 0.'),
];
