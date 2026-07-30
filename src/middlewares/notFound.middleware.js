import ApiError from '../utils/ApiError.js';

/**
 * Middleware to intercept requests targeting unregistered route paths.
 * Generates a 404 ApiError and hands it off to the global error middleware.
 */
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route not found - ${req.originalUrl}`);
  next(error);
};

export default notFound;
