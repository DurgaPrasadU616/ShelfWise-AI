import { body, param } from 'express-validator';

export const validateCreateSale = [
  body('product').isMongoId().withMessage('Valid product id is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  body('saleDate').optional().isISO8601().withMessage('saleDate must be a valid date'),
  body('invoiceRef').optional().trim().isLength({ max: 80 }).withMessage('invoiceRef too long'),
];

export const validateUpdateSale = [
  param('id').isMongoId().withMessage('Invalid sale id'),
  body('product').optional().isMongoId().withMessage('Invalid product id'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  body('saleDate').optional().isISO8601().withMessage('saleDate must be a valid date'),
  body('invoiceRef').optional().trim().isLength({ max: 80 }).withMessage('invoiceRef too long'),
];

export const validateSaleId = [param('id').isMongoId().withMessage('Invalid sale id')];

export default { validateCreateSale, validateUpdateSale, validateSaleId };