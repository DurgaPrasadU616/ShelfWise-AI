import { body, param } from 'express-validator';
import { USER_ROLES } from '../models/user.model.js';

export const validateCreateUser = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be 2-80 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 64 })
    .withMessage('Password must be 8-64 characters'),
  body('role')
    .optional()
    .isIn(USER_ROLES)
    .withMessage(`Role must be one of: ${USER_ROLES.join(', ')}`),
];

export const validateUpdateUser = [
  param('id').isMongoId().withMessage('Invalid user id'),
  body('role')
    .optional()
    .isIn(USER_ROLES)
    .withMessage(`Role must be one of: ${USER_ROLES.join(', ')}`),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

export const validateUserId = [param('id').isMongoId().withMessage('Invalid user id')];

export default { validateCreateUser, validateUpdateUser, validateUserId };
