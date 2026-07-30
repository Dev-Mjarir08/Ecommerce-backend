import userService from '../../services/user.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

class UserController {
  /**
   * Retrieves profile details of the logged-in user.
   */
  getProfile = asyncHandler(async (req, res) => {
    const user = await userService.getUserProfile(req.user._id);
    res.status(200).json(
      new ApiResponse(200, user, 'User profile retrieved successfully.')
    );
  });

  /**
   * Updates profile details and avatar of the logged-in user.
   */
  updateProfile = asyncHandler(async (req, res) => {
    const { name, email, phone } = req.body;
    const avatarFile = req.file; // Provided by multer middleware

    const updatedUser = await userService.updateUserProfile(
      req.user._id,
      { name, email, phone },
      avatarFile
    );

    res.status(200).json(
      new ApiResponse(200, updatedUser, 'Profile updated successfully.')
    );
  });

  /**
   * Customer Address Management Endpoints
   */
  getAddresses = asyncHandler(async (req, res) => {
    const addresses = await userService.getAddresses(req.user._id);
    res.status(200).json(
      new ApiResponse(200, addresses, 'User addresses retrieved successfully.')
    );
  });

  addAddress = asyncHandler(async (req, res) => {
    const addresses = await userService.addAddress(req.user._id, req.body);
    res.status(201).json(
      new ApiResponse(201, addresses, 'Address added successfully.')
    );
  });

  updateAddress = asyncHandler(async (req, res) => {
    const { addressId } = req.params;
    const addresses = await userService.updateAddress(req.user._id, addressId, req.body);
    res.status(200).json(
      new ApiResponse(200, addresses, 'Address updated successfully.')
    );
  });

  deleteAddress = asyncHandler(async (req, res) => {
    const { addressId } = req.params;
    const addresses = await userService.deleteAddress(req.user._id, addressId);
    res.status(200).json(
      new ApiResponse(200, addresses, 'Address deleted successfully.')
    );
  });

  setDefaultAddress = asyncHandler(async (req, res) => {
    const { addressId } = req.params;
    const addresses = await userService.setDefaultAddress(req.user._id, addressId);
    res.status(200).json(
      new ApiResponse(200, addresses, 'Default address set successfully.')
    );
  });

  /**
   * Customer Recently Viewed Products Controllers
   */
  getRecentlyViewed = asyncHandler(async (req, res) => {
    const products = await userService.getRecentlyViewed(req.user._id);
    res.status(200).json(
      new ApiResponse(200, products, 'Recently viewed products retrieved successfully.')
    );
  });

  addRecentlyViewed = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    const products = await userService.addRecentlyViewed(req.user._id, productId);
    res.status(200).json(
      new ApiResponse(200, products, 'Recently viewed product updated.')
    );
  });

  /**
   * Admin: Retrieves all registered users.
   */
  adminGetAllUsers = asyncHandler(async (req, res) => {
    const users = await userService.getAllUsers();
    res.status(200).json(
      new ApiResponse(200, users, 'Registered users retrieved successfully.')
    );
  });

  /**
   * Admin: Toggles block/unblock status of a user.
   */
  adminToggleBlock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isBlocked } = req.body;

    const user = await userService.toggleUserBlockStatus(id, isBlocked);
    const actionMessage = isBlocked ? 'blocked' : 'unblocked';

    res.status(200).json(
      new ApiResponse(200, user, `User has been successfully ${actionMessage}.`)
    );
  });

  /**
   * Admin: Deletes a user profile completely.
   */
  adminDeleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await userService.deleteUserProfile(id);

    res.status(200).json(
      new ApiResponse(200, null, 'User profile has been successfully deleted.')
    );
  });
}

export default new UserController();
