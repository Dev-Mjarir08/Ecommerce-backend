import ApiError from '../utils/ApiError.js';

/**
 * Middleware that restricts access to Admin users only.
 * Requires the `protect` middleware to have run beforehand to populate `req.user`.
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    next(new ApiError(403, 'Forbidden. Access restricted to administrator accounts only.'));
  }
};

/**
 * Reusable role checker middleware helper to verify dynamic roles.
 * @param {...string} roles - List of allowed roles
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Forbidden. Role '${req.user ? req.user.role : 'Guest'}' is not authorized to access this route.`)
      );
    }
    next();
  };
};

export default isAdmin;
