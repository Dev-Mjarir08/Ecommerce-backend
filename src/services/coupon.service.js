import Coupon from '../models/Coupon.js';
import ApiError from '../utils/ApiError.js';

class CouponService {
  /**
   * Admin: Creates a new coupon code.
   */
  async createCoupon(details) {
    const existingCoupon = await Coupon.findOne({ code: details.code.toUpperCase() });
    if (existingCoupon) {
      throw new ApiError(400, `Coupon code '${details.code}' already exists.`);
    }

    return await Coupon.create(details);
  }

  /**
   * Public/Admin: Lists all coupon codes.
   */
  async getCoupons() {
    return await Coupon.find({}).sort({ createdAt: -1 }).lean();
  }

  /**
   * Customer: Validates a coupon code against a shopping cart amount.
   */
  async validateCouponCode(code, cartAmount) {
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      throw new ApiError(404, 'Invalid coupon code or coupon is inactive.');
    }

    // Expiry check
    if (new Date(coupon.expiryDate) < new Date()) {
      throw new ApiError(400, 'This coupon has expired.');
    }

    // Min cart check
    if (cartAmount < coupon.minCartAmount) {
      throw new ApiError(
        400,
        `Minimum order value of $${coupon.minCartAmount} required to apply this coupon.`
      );
    }

    // Compute discount
    let discountAmount = 0;
    if (coupon.discountType === 'Percentage') {
      discountAmount = Number(((coupon.discountValue / 100) * cartAmount).toFixed(2));
    } else {
      discountAmount = coupon.discountValue;
    }

    // Enforce that discount cannot exceed cartAmount
    if (discountAmount > cartAmount) {
      discountAmount = cartAmount;
    }

    return {
      couponCode: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalAmount: Number((cartAmount - discountAmount).toFixed(2)),
    };
  }

  /**
   * Admin: Deletes a coupon code.
   */
  async deleteCoupon(couponId) {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      throw new ApiError(404, 'Coupon not found.');
    }

    await Coupon.deleteOne({ _id: couponId });
    return true;
  }

  /**
   * Admin: Deletes all coupons.
   */
  async deleteAllCoupons() {
    const result = await Coupon.deleteMany({});
    return result.deletedCount;
  }
}

export default new CouponService();
