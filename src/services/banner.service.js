import Banner from '../models/Banner.js';
import ApiError from '../utils/ApiError.js';
import cloudinaryService from './cloudinary.service.js';

class BannerService {
  /**
   * Admin: Creates a new promotional banner, uploads image.
   */
  async createBanner({ title, link, imageUrl, image }, imageFile) {
    if (!title || !String(title).trim()) {
      throw new ApiError(400, 'Banner title is required.');
    }

    let imageData = { url: null, publicId: null };
    const defaultImg = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop';
    const rawUrl = imageUrl || image;

    if (imageFile) {
      const uploadResult = await cloudinaryService.uploadSingleImage(imageFile, 'banners');
      if (uploadResult) {
        imageData = { url: uploadResult.url, publicId: uploadResult.publicId };
      }
    } else if (rawUrl) {
      let finalUrl = typeof rawUrl === 'string' ? rawUrl.trim() : rawUrl?.url;
      if (finalUrl) {
        imageData = { url: finalUrl, publicId: 'url_image' };
      }
    } else {
      imageData = { url: defaultImg, publicId: 'default_banner' };
    }

    return await Banner.create({
      title: String(title).trim(),
      link: link || '/products',
      image: imageData,
    });
  }

  /**
   * Admin: Bulk creates promotional banners.
   */
  async bulkCreateBanners(bannersArray) {
    if (!Array.isArray(bannersArray) || bannersArray.length === 0) {
      throw new ApiError(400, 'Please provide a non-empty array of banners.');
    }

    const defaultImg = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop';
    const normalized = [];

    for (let i = 0; i < bannersArray.length; i++) {
      const b = bannersArray[i];
      if (!b || !b.title || !String(b.title).trim()) {
        throw new ApiError(400, `Banner at row ${i + 1} is missing a title.`);
      }

      const imgUrl = b.imageUrl || b.image || defaultImg;

      normalized.push({
        title: String(b.title).trim(),
        link: b.link ? String(b.link).trim() : '/products',
        image: { url: imgUrl, publicId: 'url_image' },
        isActive: b.isActive !== undefined ? Boolean(b.isActive) : true,
      });
    }

    return await Banner.insertMany(normalized);
  }

  /**
   * Public/Admin: Lists promotional banners.
   */
  async getBanners(onlyActive = true) {
    const filter = onlyActive ? { isActive: true } : {};
    return await Banner.find(filter).sort({ createdAt: -1 }).lean();
  }

  /**
   * Admin: Updates banner properties, handles image swap.
   */
  async updateBanner(bannerId, { title, link, imageUrl, image }, imageFile) {
    const banner = await Banner.findById(bannerId);
    if (!banner) {
      throw new ApiError(404, 'Banner not found.');
    }

    if (title) banner.title = title;
    if (link !== undefined) banner.link = link;

    const rawUrl = imageUrl || image;

    if (imageFile) {
      // Delete old banner image if not default or url image
      if (banner.image && banner.image.publicId && banner.image.publicId !== 'default_banner' && banner.image.publicId !== 'url_image') {
        await cloudinaryService.deleteSingleImage(banner.image.publicId);
      }

      // Upload new image
      const uploadResult = await cloudinaryService.uploadSingleImage(imageFile, 'banners');
      if (uploadResult) {
        banner.image = {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
        };
      }
    } else if (rawUrl) {
      let finalUrl = typeof rawUrl === 'string' ? rawUrl.trim() : rawUrl?.url;
      if (finalUrl) {
        banner.image = { url: finalUrl, publicId: 'url_image' };
      }
    }

    await banner.save();
    return banner;
  }

  /**
   * Admin: Deletes promotional banner and destroys image on cloud.
   */
  async deleteBanner(bannerId) {
    const banner = await Banner.findById(bannerId);
    if (!banner) {
      throw new ApiError(404, 'Banner not found.');
    }

    // Clean up CDN
    if (banner.image && banner.image.publicId) {
      await cloudinaryService.deleteSingleImage(banner.image.publicId);
    }

    await Banner.deleteOne({ _id: bannerId });
    return true;
  }

  /**
   * Admin: Deletes all promotional banners.
   */
  async deleteAllBanners() {
    const banners = await Banner.find({}).select('image');
    for (const b of banners) {
      if (b.image && b.image.publicId && b.image.publicId !== 'url_image') {
        await cloudinaryService.deleteSingleImage(b.image.publicId).catch(() => {});
      }
    }
    const result = await Banner.deleteMany({});
    return result.deletedCount;
  }
}

export default new BannerService();
