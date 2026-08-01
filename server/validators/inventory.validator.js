import { body } from 'express-validator';
import validate from '../middleware/validate.js';

export const createInventoryValidator = [
  body('product').isMongoId().withMessage('Valid product ID is required'),
  body('supplier').optional().isMongoId().withMessage('Valid supplier ID is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive integer'),
  body('unitCost').isFloat({ min: 0 }).withMessage('Unit cost cannot be negative'),
  body('expiryDate').optional().isISO8601().withMessage('Valid expiry date is required'),
  body('batchNo').trim().notEmpty().withMessage('Batch number is required'),
  body('location').optional().trim(),
  validate
];

export const updateInventoryValidator = [
  body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a positive integer'),
  body('unitCost').optional().isFloat({ min: 0 }).withMessage('Unit cost cannot be negative'),
  body('expiryDate').optional().isISO8601().withMessage('Valid expiry date is required'),
  body('location').optional().trim(),
  validate
];

export const adjustInventoryValidator = [
  body('delta').isInt().withMessage('Delta must be an integer').custom(val => val !== 0).withMessage('Delta cannot be zero'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
  validate
];
