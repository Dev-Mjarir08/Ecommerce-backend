import crypto from 'crypto';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

/**
 * Service class handling core business logic for user authentication operations.
 */
class AuthService {
  /**
   * Registers a new user.
   */
  async registerUser({ name, email, phone, password }) {
    // 1. Check if user already exists (by email or phone) — single query instead of two
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      if (existingUser.email === email) {
        throw new ApiError(400, 'User with this email already exists.');
      }
      throw new ApiError(400, 'User with this phone number already exists.');
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 3. Create the user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      isVerified: false,
      otp,
      otpExpire,
    });

    return { user, otp };
  }

  /**
   * Verifies an account using a 6-digit OTP code.
   */
  async verifyOtp(userId, email, otpInput) {
    let user;
    if (userId) {
      user = await User.findById(userId).select('+otp +otpExpire');
    } else if (email) {
      user = await User.findOne({ email }).select('+otp +otpExpire');
    }

    if (!user) {
      throw new ApiError(404, 'User account not found.');
    }

    if (user.isVerified) {
      return user; // Already verified
    }

    if (!user.otp || user.otp !== otpInput) {
      throw new ApiError(400, 'Invalid OTP code entered.');
    }

    if (user.otpExpire && new Date(user.otpExpire) < new Date()) {
      throw new ApiError(400, 'OTP code has expired. Please request a new code.');
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    return user;
  }

  /**
   * Resends a 6-digit OTP code for email verification.
   */
  async resendOtp(userId, email) {
    let user;
    if (userId) {
      user = await User.findById(userId);
    } else if (email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      throw new ApiError(404, 'User account not found.');
    }

    if (user.isVerified) {
      throw new ApiError(400, 'Your email is already verified.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpire = otpExpire;
    await user.save({ validateBeforeSave: false });

    return { user, otp };
  }

  /**
   * Logins a user and verifies credentials.
   */
  async loginUser({ email, password }) {
    // Find user and explicitly select password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    // Check if account is blocked
    if (user.isBlocked) {
      throw new ApiError(403, 'Your account has been blocked. Please contact admin.');
    }

    // Check password match
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    return user;
  }

  /**
   * Generates a password reset token and saves it to the database.
   */
  async generateResetToken(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, 'No account found with this email.');
    }

    // Create raw token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set on user schema
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    await user.save({ validateBeforeSave: false });

    return { user, resetToken };
  }

  /**
   * Resets a user's password using the token sent to their email.
   */
  async resetUserPassword(resetToken, newPassword) {
    // Hash token to compare with DB
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, 'Invalid or expired password reset token.');
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return user;
  }

  /**
   * Changes a user's password.
   */
  async changeUserPassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      throw new ApiError(400, 'Invalid old password.');
    }

    user.password = newPassword;
    await user.save();

    return user;
  }
}

export default new AuthService();
