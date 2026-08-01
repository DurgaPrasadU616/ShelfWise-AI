import { validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

const validate = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }
  const fields = result.array().map((error) => ({
    path: error.path,
    message: error.msg,
  }));
  const error = new AppError(
    'VALIDATION_ERROR',
    'Validation failed',
    422,
    { fields }
  );
  return next(error);
};

export default validate;
