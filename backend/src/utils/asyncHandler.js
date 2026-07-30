/**
 * A wrapper utility that handles exceptions inside asynchronous Express route handlers
 * and forwards them to the global error handling middleware using `next()`.
 *
 * Eliminates the need for writing boilerplate try/catch blocks in every controller.
 *
 * @param {Function} requestHandler - Asynchronous Express middleware/controller function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler;
