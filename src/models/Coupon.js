import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required.'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ['Percentage', 'Flat'],
      default: 'Percentage',
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required.'],
      min: [0, 'Discount value cannot be negative.'],
    },
    minCartAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum cart amount cannot be negative.'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required.'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

const Coupon = mongoose.model('Coupon', CouponSchema);

export default Coupon;
