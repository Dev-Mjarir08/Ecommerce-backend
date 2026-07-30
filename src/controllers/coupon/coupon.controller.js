import couponService from '../../services/coupon.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class CouponController {
  /**
   * Admin: Creates a new coupon.
   */
  create = asyncHandler(async (req, res) => {
    const coupon = await couponService.createCoupon(req.body);
    res.status(201).json(
      new ApiResponse(201, coupon, 'Coupon created successfully.')
    );
  });

  /**
   * Admin: Lists all coupon codes.
   */
  list = asyncHandler(async (req, res) => {
    const coupons = await couponService.getCoupons();
    res.status(200).json(
      new ApiResponse(200, coupons, 'Coupons retrieved successfully.')
    );
  });

  /**
   * Customer: Validates a coupon code.
   */
  validate = asyncHandler(async (req, res) => {
    const { code, cartAmount } = req.body;
    const result = await couponService.validateCouponCode(code, cartAmount);

    res.status(200).json(
      new ApiResponse(200, result, 'Coupon applied successfully.')
    );
  });

  /**
   * Admin: Deletes a coupon code.
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await couponService.deleteCoupon(id);

    res.status(200).json(
      new ApiResponse(200, null, 'Coupon deleted successfully.')
    );
  });

  /**
   * Admin: Deletes all coupons.
   */
  deleteAll = asyncHandler(async (req, res) => {
    const count = await couponService.deleteAllCoupons();
    res.status(200).json(
      new ApiResponse(200, { deletedCount: count }, `All ${count} coupons deleted successfully.`)
    );
  });
}

export default new CouponController();
