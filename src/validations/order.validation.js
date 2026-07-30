import { body } from 'express-validator';

/**
 * Validation rules for creating an Order.
 */
export const createOrderValidator = [
  body('shippingAddress.address')
    .notEmpty()
    .withMessage('Shipping address is required.')
    .trim(),
  body('shippingAddress.city')
    .notEmpty()
    .withMessage('Shipping city is required.')
    .trim(),
  body('shippingAddress.postalCode')
    .notEmpty()
    .withMessage('Shipping postal code is required.')
    .trim(),
  body('shippingAddress.country')
    .notEmpty()
    .withMessage('Shipping country is required.')
    .trim(),
  body('paymentMethod')
    .optional()
    .isIn(['COD', 'Card', 'UPI', 'Razorpay', 'Online', 'PayPal'])
    .withMessage('Invalid payment method selected.'),
];

/**
 * Validation rules for updating order status.
 */
export const updateStatusValidator = [
  body('status')
    .notEmpty()
    .withMessage('Order execution status is required.')
    .isIn(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'])
    .withMessage('Invalid order status value.'),
];
