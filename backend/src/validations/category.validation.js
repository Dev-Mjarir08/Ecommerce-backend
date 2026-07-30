import { body } from 'express-validator';

/**
 * Validation rules for creating a Category.
 */
export const createCategoryValidator = [
  body('name')
    .notEmpty()
    .withMessage('Category name is required.')
    .isLength({ min: 3, max: 32 })
    .withMessage('Category name must be between 3 and 32 characters.')
    .trim(),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string.')
    .trim(),
];

/**
 * Validation rules for updating a Category.
 */
export const updateCategoryValidator = [
  body('name')
    .optional()
    .isLength({ min: 3, max: 32 })
    .withMessage('Category name must be between 3 and 32 characters.')
    .trim(),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string.')
    .trim(),
];
