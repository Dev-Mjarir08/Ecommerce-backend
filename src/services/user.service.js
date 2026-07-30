import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import cloudinaryService from './cloudinary.service.js';

class UserService {
  /**
   * Retrieves profile details of a specific user.
   */
  async getUserProfile(userId) {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new ApiError(404, 'User profile not found.');
    }
    return user;
  }

  /**
   * Updates basic profile details of a user, handles avatar replacement.
   */
  async updateUserProfile(userId, { name, email, phone }, avatarFile) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User profile not found.');
    }

    // Check unique constraints with a single query if updating email or phone
    if ((email && email !== user.email) || (phone && phone !== user.phone)) {
      const conditions = [];
      if (email && email !== user.email) conditions.push({ email });
      if (phone && phone !== user.phone) conditions.push({ phone });

      const existingUser = await User.findOne({ $or: conditions, _id: { $ne: userId } });
      if (existingUser) {
        if (email && existingUser.email === email) {
          throw new ApiError(400, 'User with this email already exists.');
        }
        throw new ApiError(400, 'User with this phone number already exists.');
      }

      if (email && email !== user.email) user.email = email;
      if (phone && phone !== user.phone) user.phone = phone;
    }

    if (name) user.name = name;

    // Handle avatar upload if file is provided
    if (avatarFile) {
      // Delete old avatar from Cloudinary if it exists
      if (user.avatar && user.avatar.publicId) {
        await cloudinaryService.deleteSingleImage(user.avatar.publicId);
      }

      // Upload new avatar
      const uploadResult = await cloudinaryService.uploadSingleImage(avatarFile, 'avatars');
      if (uploadResult) {
        user.avatar = {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
        };
      }
    }

    await user.save();
    return user;
  }

  /**
   * Address Management Methods
   */
  async getAddresses(userId) {
    const user = await User.findById(userId).select('addresses');
    if (!user) throw new ApiError(404, 'User not found.');
    return user.addresses || [];
  }

  async addAddress(userId, addressData) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found.');

    if (!user.addresses) user.addresses = [];

    // If this is the first address or marked default, reset other default flags
    if (addressData.isDefault || user.addresses.length === 0) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
      addressData.isDefault = true;
    }

    user.addresses.push(addressData);
    await user.save();
    return user.addresses;
  }

  async updateAddress(userId, addressId, addressData) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found.');

    const target = user.addresses.id(addressId);
    if (!target) throw new ApiError(404, 'Address record not found.');

    if (addressData.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    Object.assign(target, addressData);
    await user.save();
    return user.addresses;
  }

  async deleteAddress(userId, addressId) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found.');

    const target = user.addresses.id(addressId);
    if (!target) throw new ApiError(404, 'Address record not found.');

    const wasDefault = target.isDefault;
    user.addresses.pull(addressId);

    // If deleted address was default, set new first address as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return user.addresses;
  }

  async setDefaultAddress(userId, addressId) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found.');

    const target = user.addresses.id(addressId);
    if (!target) throw new ApiError(404, 'Address record not found.');

    user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === addressId.toString();
    });

    await user.save();
    return user.addresses;
  }

  /**
   * Recently Viewed Products Methods
   */
  async getRecentlyViewed(userId) {
    const user = await User.findById(userId).populate('recentlyViewed').select('recentlyViewed');
    if (!user) throw new ApiError(404, 'User not found.');
    return user.recentlyViewed || [];
  }

  async addRecentlyViewed(userId, productId) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found.');

    if (!user.recentlyViewed) user.recentlyViewed = [];

    user.recentlyViewed = user.recentlyViewed.filter((id) => id.toString() !== productId.toString());
    user.recentlyViewed.unshift(productId);

    if (user.recentlyViewed.length > 10) {
      user.recentlyViewed = user.recentlyViewed.slice(0, 10);
    }

    await user.save();
    return user.recentlyViewed;
  }

  /**
   * Admin: Retrieves a list of all registered users.
   */
  async getAllUsers() {
    return await User.find({})
      .select('name email phone role isBlocked avatar createdAt')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Admin: Blocks or unblocks a user account.
   */
  async toggleUserBlockStatus(userId, isBlocked) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    user.isBlocked = isBlocked;
    await user.save();
    return user;
  }

  /**
   * Admin: Deletes a user profile and cleans up their avatar.
   */
  async deleteUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    // Clean up media
    if (user.avatar && user.avatar.publicId) {
      await cloudinaryService.deleteSingleImage(user.avatar.publicId);
    }

    await User.findByIdAndDelete(userId);
    return true;
  }
}

export default new UserService();
