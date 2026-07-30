import { body } from 'express-validator';

/**
 * Validation rules for profile updates.
 */
export const updateProfileValidator = [
  body('name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters.')
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('phone')
    .optional()
    .notEmpty()
    .withMessage('Phone number cannot be empty.')
    .trim(),
];

/**
 * Validation rules for user blocking.
 */
export const toggleBlockValidator = [
  body('isBlocked')
    .isBoolean()
    .withMessage('isBlocked must be a boolean value.'),
];
