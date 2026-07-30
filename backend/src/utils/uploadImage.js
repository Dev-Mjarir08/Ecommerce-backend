import fs from 'fs';
import cloudinary from '../config/cloudinary.js';

/**
 * Uploads a local file to Cloudinary and deletes the temporary local file.
 *
 * @param {string} localFilePath - Path to the temporarily saved file on disk
 * @param {string} folder - Target folder directory name in Cloudinary (e.g. 'users', 'products')
 * @returns {Promise<Object>} Object containing url and publicId of uploaded media
 */
const uploadImage = async (localFilePath, folder = 'general') => {
  try {
    if (!localFilePath) return null;

    // Upload to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: `ecommerce/${folder}`,
      resource_type: 'auto',
    });

    // Delete temporary local file
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return {
      url: response.secure_url,
      publicId: response.public_id,
    };
  } catch (error) {
    // Delete file if upload failed
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error('Cloudinary upload failure:', error.message);
    throw error;
  }
};

export default uploadImage;
