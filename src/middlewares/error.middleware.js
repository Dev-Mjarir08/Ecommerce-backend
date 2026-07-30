import ApiError from '../utils/ApiError.js';

/**
 * Global Error Handling Middleware for Express.
 * Catches all errors passed to next(), normalizes them to ApiError format, and sends a standard JSON error response.
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // If the error is not an instance of our custom ApiError class, normalize it
  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    let message = error.message || 'Something went wrong on the server.';

    // Handle Mongoose duplicate key error
    if (error.code === 11000) {
      statusCode = 400;
      const keyObj = error.keyValue || error.keyPattern || {};
      const field = Object.keys(keyObj)[0] || 'field';
      message = `Duplicate field value entered for '${field}'. Please use another value.`;
    }

    // Handle Multer upload errors
    if (error.name === 'MulterError') {
      statusCode = 400;
      message = error.message;
    }

    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  const response = {
    success: false,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  res.status(error.statusCode).json(response);
};

export default errorHandler;
