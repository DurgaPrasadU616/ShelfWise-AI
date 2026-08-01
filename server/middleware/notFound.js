import AppError from '../utils/AppError.js';

const notFoundHandler = (req, res, next) => {
  next(new AppError('NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`, 404));
};

export default notFoundHandler;
