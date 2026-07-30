import { body } from 'express-validator';

/**
 * Validation rules for creating a Banner.
 */
export const createBannerValidator = [
  body('title')
    .notEmpty()
    .withMessage('Banner title is required.')
    .trim(),
  body('link')
    .optional()
    .trim(),
];

/**
 * Validation rules for updating a Banner.
 */
export const updateBannerValidator = [
  body('title')
    .optional()
    .trim(),
  body('link')
    .optional()
    .trim(),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value.'),
];
