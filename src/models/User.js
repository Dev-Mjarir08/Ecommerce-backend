import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const AddressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      default: 'Home',
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Street address is required.'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required.'],
      trim: true,
    },
    state: {
      type: String,
      default: '',
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required.'],
      trim: true,
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address.'],
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required.'],
      unique: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [6, 'Password must be at least 6 characters.'],
      select: false, // Prevents password from being returned in standard queries
    },
    avatar: {
      url: {
        type: String,
        default: 'https://res.cloudinary.com/demo/image/upload/v1672531190/default_avatar.png',
      },
      publicId: {
        type: String,
        default: null,
      },
    },
    role: {
      type: String,
      enum: {
        values: ['Admin', 'Customer', 'User'],
        message: '{VALUE} is not a valid role.',
      },
      default: 'User',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    addresses: [AddressSchema],
    recentlyViewed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    refreshToken: {
      type: String,
      select: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    otp: {
      type: String,
      select: false,
    },
    otpExpire: {
      type: Date,
      select: false,
    },
    orderOtp: {
      type: String,
      select: false,
    },
    orderOtpExpire: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        delete ret.otp;
        delete ret.otpExpire;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        delete ret.otp;
        delete ret.otpExpire;
        return ret;
      },
    },
  }
);

// Pre-save middleware to hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method to generate Access Token
UserSchema.methods.generateAccessToken = function () {
  const secret = (process.env.JWT_SECRET && process.env.JWT_SECRET.trim())
    ? process.env.JWT_SECRET.trim()
    : 'fallback_jwt_access_secret_key_123';
  const expiry = (process.env.JWT_EXPIRY && process.env.JWT_EXPIRY.trim())
    ? process.env.JWT_EXPIRY.trim()
    : '7d';

  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.role,
    },
    secret,
    {
      expiresIn: expiry,
    }
  );
};

// Instance method to generate Refresh Token
UserSchema.methods.generateRefreshToken = function () {
  const secret = (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.trim())
    ? process.env.JWT_REFRESH_SECRET.trim()
    : ((process.env.JWT_SECRET && process.env.JWT_SECRET.trim()) ? process.env.JWT_SECRET.trim() : 'fallback_jwt_refresh_secret_key_123');
  const expiry = (process.env.JWT_REFRESH_EXPIRY && process.env.JWT_REFRESH_EXPIRY.trim())
    ? process.env.JWT_REFRESH_EXPIRY.trim()
    : '30d';

  return jwt.sign(
    {
      id: this._id,
    },
    secret,
    {
      expiresIn: expiry,
    }
  );
};

const User = mongoose.model('User', UserSchema);

export default User;
