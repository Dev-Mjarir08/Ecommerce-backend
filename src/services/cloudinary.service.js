import uploadImage from '../utils/uploadImage.js';
import deleteImage from '../utils/deleteImage.js';

/**
 * Service managing CDN asset transfers (Cloudinary uploads & destructions).
 */
class CloudinaryService {
  /**
   * Uploads a single file to Cloudinary.
   *
   * @param {Object} file - Express Multer File Object
   * @param {string} folder - Destination folder name
   * @returns {Promise<Object>} Secure URL and Public ID
   */
  async uploadSingleImage(file, folder = 'general') {
    if (!file || !file.path) return null;
    return await uploadImage(file.path, folder);
  }

  /**
   * Uploads multiple files to Cloudinary in parallel.
   *
   * @param {Array<Object>} files - Array of Express Multer File Objects
   * @param {string} folder - Destination folder name
   * @returns {Promise<Array<Object>>} Array of uploaded image details
   */
  async uploadMultipleImages(files, folder = 'general') {
    if (!files || files.length === 0) return [];
    
    const uploadPromises = files.map((file) => uploadImage(file.path, folder));
    return await Promise.all(uploadPromises);
  }

  /**
   * Deletes a single file from Cloudinary.
   *
   * @param {string} publicId - Cloudinary Public ID of asset
   * @returns {Promise<Object>} Response confirmation
   */
  async deleteSingleImage(publicId) {
    if (!publicId) return null;
    return await deleteImage(publicId);
  }
}

export default new CloudinaryService();
