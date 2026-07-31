import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Middleware that secures routes by verifying the presence and validity of a JWT Access Token.
 * Extracted from request cookies or the Authorization Header (Bearer token format).
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Attempt retrieval from cookie
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  // 2. Fallback to Authorization Header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized to access this resource. Please log in.');
  }

  try {
    // Verify token
    const secret = (process.env.JWT_SECRET && process.env.JWT_SECRET.trim())
      ? process.env.JWT_SECRET.trim()
      : 'fallback_jwt_access_secret_key_123';
    const decoded = jwt.verify(token, secret);

    // Fetch user and verify they exist and are active
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(401, 'User account no longer exists.');
    }

    if (user.isBlocked) {
      throw new ApiError(403, 'Your account has been blocked. Contact administrator.');
    }

    // Attach user to request context
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, 'Token verification failed. Access is unauthorized.');
  }
});

export default protect;
