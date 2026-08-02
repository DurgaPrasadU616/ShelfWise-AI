import { body } from 'express-validator';
import validate from '../middleware/validate.js';

export const commitOcrValidator = [
  body('extractedItems')
    .isArray({ min: 1 })
    .withMessage('At least one item is required to commit'),

  body('extractedItems.*.productName')
    .trim()
    .notEmpty()
    .withMessage('Product name is required'),

  body('extractedItems.*.sku')
    .trim()
    .notEmpty()
    .withMessage('SKU is required'),

  body('extractedItems.*.category')
    .optional({ checkFalsy: true })
    .trim()
    .isString()
    .withMessage('Category must be a string'),

  body('extractedItems.*.quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),

  body('extractedItems.*.unitCost')
    .isFloat({ min: 0 })
    .withMessage('Unit cost must be a non-negative number'),

  body('extractedItems.*.purchaseDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Purchase date must be a valid ISO8601 date'),

  body('extractedItems.*.expiryDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Expiry date must be a valid ISO8601 date'),

  validate,
];
