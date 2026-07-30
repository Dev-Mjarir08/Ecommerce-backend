/**
 * Custom Error class for standardizing HTTP error responses.
 * Extends the native Error class to include HTTP status codes, validation errors, and stack traces.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 404, 500)
   * @param {string} message - Human-readable error explanation
   * @param {Array} errors - Detailed validation or sub-errors (e.g., from express-validator)
   * @param {string} stack - Optional custom stack trace
   */
  constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.data = null; // Enforce empty data payload for errors
    this.success = false; // Always false for ApiError
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
