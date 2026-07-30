import authService from '../../services/auth.service.js';
import emailService from '../../services/email.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import generateTokensAndSetCookies from '../../utils/generateToken.js';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';

/**
 * Controller class handling HTTP requests for user authentication operations.
 */
class AuthController {
  /**
   * Registers a new user account.
   */
  register = asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body;

    const { user, otp } = await authService.registerUser({ name, email, phone, password });
    const { accessToken, refreshToken } = await generateTokensAndSetCookies(user, res);

    // Async mail dispatch (non-blocking)
    emailService.sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.error(`Welcome email dispatch failed for ${user.email}:`, err.message);
    });
    emailService.sendOtpEmail(user.email, user.name, otp).catch((err) => {
      console.error(`OTP email dispatch failed for ${user.email}:`, err.message);
    });

    res.status(201).json(
      new ApiResponse(201, { user, accessToken, refreshToken }, 'User registered successfully. Verification OTP sent to email.')
    );
  });

  /**
   * Registers a new Admin account.
   */
  registerAdmin = asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body;

    // Check if user already exists — single combined query
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      if (existingUser.email === email) {
        throw new ApiError(400, 'User with this email already exists.');
      }
      throw new ApiError(400, 'User with this phone number already exists.');
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'Admin',
    });

    const { accessToken, refreshToken } = await generateTokensAndSetCookies(user, res);

    // Welcome email dispatch (non-blocking)
    emailService.sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.error(`Welcome email dispatch failed for ${user.email}:`, err.message);
    });

    res.status(201).json(
      new ApiResponse(201, { user, accessToken, refreshToken }, 'Admin registered successfully.')
    );
  });

  /**
   * Logins an existing user.
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await authService.loginUser({ email, password });
    const { accessToken, refreshToken } = await generateTokensAndSetCookies(user, res);

    res.status(200).json(
      new ApiResponse(200, { user, accessToken, refreshToken }, 'Logged in successfully.')
    );
  });

  /**
   * Logouts the logged-in user.
   */
  logout = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (userId) {
      // Clear refresh token in database
      await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
    }

    // Clear client cookies
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    res.status(200).json(
      new ApiResponse(200, null, 'Logged out successfully.')
    );
  });

  /**
   * Generates a reset password link.
   */
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const { user, resetToken } = await authService.generateResetToken(email);

    // Construct reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;

    // Async mail dispatch
    emailService.sendForgotPasswordEmail(user.email, user.name, resetUrl).catch((err) => {
      console.error(`Forgot password email dispatch failed for ${user.email}:`, err.message);
    });

    res.status(200).json(
      new ApiResponse(200, { resetToken, resetUrl }, 'Password reset link sent to your email.')
    );
  });

  /**
   * Resets the user password.
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const user = await authService.resetUserPassword(token, password);

    // Async mail alert dispatch
    emailService.sendPasswordResetSuccessEmail(user.email, user.name).catch((err) => {
      console.error(`Password reset success alert dispatch failed for ${user.email}:`, err.message);
    });

    res.status(200).json(
      new ApiResponse(200, null, 'Password reset successfully.')
    );
  });

  /**
   * Changes the password of the logged-in user.
   */
  changePassword = asyncHandler(async (req, res) => {
    const oldPassword = req.body.oldPassword || req.body.currentPassword;
    const { newPassword } = req.body;
    const userId = req.user._id;

    if (!oldPassword) {
      throw new ApiError(400, 'Current password is required.');
    }

    const user = await authService.changeUserPassword(userId, oldPassword, newPassword);

    // Async mail alert dispatch
    emailService.sendPasswordResetSuccessEmail(user.email, user.name).catch((err) => {
      console.error(`Password change success alert dispatch failed for ${user.email}:`, err.message);
    });

    res.status(200).json(
      new ApiResponse(200, null, 'Password changed successfully.')
    );
  });

  /**
   * Verifies account email with 6-digit OTP.
   */
  verifyOtp = asyncHandler(async (req, res) => {
    const { otp, email } = req.body;
    const userId = req.user?._id;
    const userEmail = req.user?.email || email;

    if (!otp) {
      throw new ApiError(400, 'OTP code is required.');
    }

    const user = await authService.verifyOtp(userId, userEmail, otp);

    res.status(200).json(
      new ApiResponse(200, user, 'Email verified successfully.')
    );
  });

  /**
   * Resends 6-digit OTP verification code to user email.
   */
  resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const userId = req.user?._id;
    const userEmail = req.user?.email || email;

    const { user, otp } = await authService.resendOtp(userId, userEmail);

    emailService.sendOtpEmail(user.email, user.name, otp).catch((err) => {
      console.error(`Resend OTP email dispatch failed for ${user.email}:`, err.message);
    });

    res.status(200).json(
      new ApiResponse(200, null, 'Verification OTP sent to your email.')
    );
  });

  /**
   * Retrieves profile details of the logged-in user.
   */
  getMe = asyncHandler(async (req, res) => {
    res.status(200).json(
      new ApiResponse(200, req.user, 'Logged-in user details retrieved successfully.')
    );
  });

  /**
   * Refreshes JWT tokens using the Refresh Token.
   */
  refreshToken = asyncHandler(async (req, res) => {
    const rToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!rToken) {
      throw new ApiError(401, 'Session expired. Please log in again.');
    }

    try {
      const decoded = jwt.verify(rToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id).select('+refreshToken');

      if (!user || user.refreshToken !== rToken) {
        throw new ApiError(401, 'Invalid session token. Please log in again.');
      }

      const { accessToken, refreshToken } = await generateTokensAndSetCookies(user, res);

      res.status(200).json(
        new ApiResponse(200, { accessToken, refreshToken }, 'Token refreshed successfully.')
      );
    } catch (error) {
      throw new ApiError(401, 'Session authentication failed. Please log in again.');
    }
  });
}

export default new AuthController();
