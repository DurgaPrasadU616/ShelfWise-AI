import logger from '../utils/logger.js';

const errorHandler = (err, req, res, _next) => {
  const isOperational = err.isOperational === true;
  const status = err.status || 500;
  const code = err.code || 'INTERNAL';

  if (!isOperational) {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
  } else {
    logger.warn(`Operational error [${code}]`, { error: err.message, path: req.path });
  }

  if (res.headersSent) {
    return _next(err);
  }

  const payload = {
    success: false,
    error: {
      code,
      message: status === 500 && !isOperational ? 'Internal server error' : err.message,
      ...(err.details !== undefined && { details: err.details }),
    },
  };

  return res.status(status).json(payload);
};

export default errorHandler;
