import { param } from 'express-validator';
import mongoose from 'mongoose';
import validate from '../middleware/validate.js';

export const isObjectId = (value) => mongoose.isValidObjectId(value);

export const objectIdMessage = 'Invalid id format';

/**
 * Chain of express-validator rules validating a route param as a MongoDB ObjectId.
 * Use alongside `validate` middleware, e.g.:
 *   router.get('/:id', objectIdParam('id'), validate, getById)
 */
export const objectIdParam = (field = 'id') =>
  param(field).custom(isObjectId).withMessage(objectIdMessage);

export default { isObjectId, objectIdMessage, objectIdParam, validate };