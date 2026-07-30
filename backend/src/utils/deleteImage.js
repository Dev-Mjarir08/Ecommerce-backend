import cloudinary from '../config/cloudinary.js';

/**
 * Removes an image from Cloudinary using its Public ID.
 *
 * @param {string} publicId - The Cloudinary public identifier of the image to destroy
 * @returns {Promise<Object>} Destruction confirmation payload
 */
const deleteImage = async (publicId) => {
  try {
    if (!publicId) return null;

    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    console.error('Cloudinary destruction failure:', error.message);
    throw error;
  }
};

export default deleteImage;
