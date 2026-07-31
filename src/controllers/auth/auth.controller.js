import authService from '../../services/auth.service.js';
import emailService from '../../services/email.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import generateTokensAndSetCookies from '../../utils/generateToken.js';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';
import { verifyTransporter } from '../../config/nodemailer.js';
import sendEmail from '../../utils/sendEmail.js';

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

    // Await email dispatches so Render / Vercel container keeps socket alive until completed
    await Promise.allSettled([
      emailService.sendWelcomeEmail(user.email, user.name),
      emailService.sendOtpEmail(user.email, user.name, otp),
    ]);

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

    // Await welcome email dispatch
    await emailService.sendWelcomeEmail(user.email, user.name).catch((err) => {
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

    // Construct reset URL pointing to frontend client application
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    // Await email dispatch to ensure completion before API response finishes
    await emailService.sendForgotPasswordEmail(user.email, user.name, resetUrl).catch((err) => {
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

    if (!password || password.length < 6) {
      throw new ApiError(400, 'New password must be at least 6 characters long.');
    }

    const user = await authService.resetUserPassword(token, password);

    // Await alert email dispatch
    await emailService.sendPasswordResetSuccessEmail(user.email, user.name).catch((err) => {
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

    if (!newPassword || newPassword.length < 6) {
      throw new ApiError(400, 'New password must be at least 6 characters long.');
    }

    const user = await authService.changeUserPassword(userId, oldPassword, newPassword);

    // Await alert email dispatch
    await emailService.sendPasswordResetSuccessEmail(user.email, user.name).catch((err) => {
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

    // Await OTP email dispatch
    await emailService.sendOtpEmail(user.email, user.name, otp).catch((err) => {
      console.error(`Resend OTP email dispatch failed for ${user.email}:`, err.message);
    });

    res.status(200).json(
      new ApiResponse(200, null, 'Verification OTP sent to your email.')
    );
  });

  /**
   * Health Check & Test Email Endpoint: GET /api/v1/auth/email/test
   */
  testEmail = asyncHandler(async (req, res) => {
    const targetEmail = (req.query.to || req.body?.email || process.env.SMTP_MAIL || process.env.EMAIL_USER || 'multanijarir08@gmail.com').toString().trim();
    let smtpConnected = false;
    let sendMailSuccess = false;
    let messageId = '';
    let responseText = '';
    let errorDetail = null;

    try {
      smtpConnected = await verifyTransporter();
      const info = await sendEmail({
        email: targetEmail,
        subject: '🧪 Render SMTP Health Check - Croma Clone',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #2563eb; margin-top: 0;">Render Email Gateway Verification</h2>
            <p style="color: #334155;">This is an automated test email confirming that your Nodemailer SMTP transport is configured correctly on Render.</p>
            <div style="background-color: #f8fafc; padding: 14px; border-radius: 8px; font-size: 13px; color: #475569;">
              <p style="margin: 4px 0;"><strong>Recipient:</strong> ${targetEmail}</p>
              <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              <p style="margin: 4px 0;"><strong>Environment:</strong> ${process.env.NODE_ENV || 'production'}</p>
              <p style="margin: 4px 0;"><strong>SMTP Host:</strong> ${process.env.SMTP_HOST || 'smtp.gmail.com'}</p>
              <p style="margin: 4px 0;"><strong>SMTP Port:</strong> ${process.env.SMTP_PORT || '587'}</p>
            </div>
            <p style="color: #64748b; font-size: 12px; margin-top: 20px;">© Croma Electronics. All rights reserved.</p>
          </div>
        `,
      });
      sendMailSuccess = true;
      messageId = info.messageId || '';
      responseText = info.response || '';
    } catch (err) {
      errorDetail = {
        name: err.name || 'Error',
        code: err.code || 'UNKNOWN_CODE',
        message: err.message,
        response: err.response || null,
        stack: err.stack,
      };
    }

    res.status(sendMailSuccess ? 200 : 500).json({
      success: sendMailSuccess,
      smtpConnected,
      sendMail: sendMailSuccess,
      messageId,
      response: responseText,
      error: errorDetail,
    });
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
      const secret = (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.trim())
        ? process.env.JWT_REFRESH_SECRET.trim()
        : ((process.env.JWT_SECRET && process.env.JWT_SECRET.trim()) ? process.env.JWT_SECRET.trim() : 'fallback_jwt_refresh_secret_key_123');
      const decoded = jwt.verify(rToken, secret);
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
