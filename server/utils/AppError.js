class AppError extends Error {
  constructor(code, message, status = 500, details = undefined) {
    if (typeof message === 'number') {
      // Gracefully handle swapped arguments: (message, status, code)
      super(code);
      this.name = 'AppError';
      this.code = status;
      this.status = message;
      this.details = details;
    } else {
      super(message);
      this.name = 'AppError';
      this.code = code;
      this.status = status;
      this.details = details;
    }
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
