import { body } from 'express-validator';

/**
 * Validation rules for User Registration.
 */
export const registerValidator = [
  body('name')
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters.')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required.')
    .trim(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
];

/**
 * Validation rules for User Login.
 */
export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
];

/**
 * Validation rules for Forgot Password.
 */
export const forgotPasswordValidator = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
];

/**
 * Validation rules for Reset Password.
 */
export const resetPasswordValidator = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
];

/**
 * Validation rules for Change Password.
 */
export const changePasswordValidator = [
  body()
    .custom((val, { req }) => {
      const pass = req.body.oldPassword || req.body.currentPassword;
      if (!pass) {
        throw new Error('Current password is required.');
      }
      return true;
    }),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long.'),
];
