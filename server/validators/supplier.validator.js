import { body } from 'express-validator';
import validate from '../middleware/validate.js';

const optionalString = (field) => body(field).optional({ checkFalsy: true }).trim();

export const createSupplierValidator = [
  body('name').trim().notEmpty().withMessage('Supplier name is required'),
  optionalString('contactName'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please use a valid email address'),
  optionalString('phone'),
  optionalString('address'),
  validate,
];

export const updateSupplierValidator = [
  body('name').optional().trim().notEmpty().withMessage('Supplier name cannot be empty'),
  body('contactName').optional({ checkFalsy: true }).trim(),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please use a valid email address'),
  body('phone').optional({ checkFalsy: true }).trim(),
  body('address').optional({ checkFalsy: true }).trim(),
  validate,
];
