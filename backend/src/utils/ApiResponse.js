/**
 * Helper class for formatting standardized HTTP API success responses.
 */
class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 200, 201)
   * @param {any} data - Payload containing the returned resource or object
   * @param {string} message - Human-readable success message
   */
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.success = statusCode < 400; // True if status is 2xx or 3xx
    this.message = message;
    this.data = data;
  }
}

export default ApiResponse;
