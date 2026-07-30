import Category from '../models/Category.js';
import ApiError from '../utils/ApiError.js';
import cloudinaryService from './cloudinary.service.js';

// Escape regex special characters to prevent ReDoS attacks from user input
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class CategoryService {
  /**
   * Creates a new product category.
   */
  async createCategory({ name, description, imageUrl, image }, imageFile) {
    const generatedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existingCategory = await Category.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') } },
        { slug: generatedSlug }
      ]
    });

    if (existingCategory) {
      throw new ApiError(400, `Category '${name}' already exists.`);
    }

    let imageData = { url: null, publicId: null };
    if (imageFile) {
      const uploadResult = await cloudinaryService.uploadSingleImage(imageFile, 'categories');
      if (uploadResult) {
        imageData = {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
        };
      }
    } else if (imageUrl || image) {
      const rawUrl = imageUrl || image;
      let finalUrl = typeof rawUrl === 'string' ? rawUrl.trim() : rawUrl?.url;
      if (finalUrl) {
        imageData = { url: finalUrl, publicId: 'url_image' };
      }
    } else {
      imageData = {
        url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop',
        publicId: 'default_category',
      };
    }

    const category = await Category.create({
      name,
      description,
      image: imageData,
    });

    return category;
  }

  /**
   * Admin: Bulk creates product categories safely.
   */
  async bulkCreateCategories(categoriesArray) {
    if (!Array.isArray(categoriesArray) || categoriesArray.length === 0) {
      throw new ApiError(400, 'Please provide a non-empty array of categories.');
    }

    const defaultImg = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop';
    
    // Pre-fetch existing category names to skip duplicates automatically
    const existing = await Category.find({}).select('name slug').lean();
    const existingNames = new Set(existing.map((c) => c.name.toLowerCase()));

    const normalized = [];

    for (let i = 0; i < categoriesArray.length; i++) {
      const c = categoriesArray[i];
      if (!c || !c.name || !String(c.name).trim()) continue;

      let name = String(c.name).trim();
      // Ensure name does not exceed Mongoose schema 32-character limit
      if (name.length > 32) {
        name = name.substring(0, 32).trim();
      }

      // Skip duplicate names in DB or within current batch
      if (existingNames.has(name.toLowerCase())) {
        continue;
      }
      existingNames.add(name.toLowerCase());

      const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const uniqueSlug = `${baseSlug || 'category'}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}-${i + 1}`;
      const imgUrl = c.imageUrl || c.image || defaultImg;

      normalized.push({
        name,
        slug: uniqueSlug,
        description: c.description ? String(c.description).trim() : `${name} product collection`,
        image: { url: imgUrl, publicId: 'url_image' },
      });
    }

    if (normalized.length === 0) {
      return [];
    }

    return await Category.insertMany(normalized, { ordered: false });
  }

  /**
   * Retrieves all product categories.
   */
  async getCategories() {
    return await Category.find({}).sort({ createdAt: -1 }).lean();
  }

  /**
   * Retrieves profile details of a category by slug.
   */
  async getCategoryBySlug(slug) {
    const category = await Category.findOne({ slug }).lean();
    if (!category) {
      throw new ApiError(404, 'Category not found.');
    }
    return category;
  }

  /**
   * Updates an existing category by slug.
   */
  async updateCategory(slug, { name, description, imageUrl, image }, imageFile) {
    const category = await Category.findOne({ slug });
    if (!category) {
      throw new ApiError(404, 'Category not found.');
    }

    if (name && name !== category.name) {
      const generatedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const existingName = await Category.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') } },
          { slug: generatedSlug }
        ]
      });

      if (existingName) {
        throw new ApiError(400, `Category '${name}' already exists.`);
      }
      category.name = name;
    }

    if (description !== undefined) {
      category.description = description;
    }

    if (imageFile) {
      // Clean up previous image if it exists
      if (category.image && category.image.publicId && category.image.publicId !== 'default_category' && category.image.publicId !== 'url_image') {
        await cloudinaryService.deleteSingleImage(category.image.publicId);
      }

      // Upload new image
      const uploadResult = await cloudinaryService.uploadSingleImage(imageFile, 'categories');
      if (uploadResult) {
        category.image = {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
        };
      }
    } else if (imageUrl || image) {
      const rawUrl = imageUrl || image;
      let finalUrl = typeof rawUrl === 'string' ? rawUrl.trim() : rawUrl?.url;
      if (finalUrl) {
        category.image = { url: finalUrl, publicId: 'url_image' };
      }
    }

    await category.save();
    return category;
  }

  /**
   * Deletes a category and its media assets.
   */
  async deleteCategory(slug) {
    const category = await Category.findOne({ slug });
    if (!category) {
      throw new ApiError(404, 'Category not found.');
    }

    // Delete image from cloud
    if (category.image && category.image.publicId) {
      await cloudinaryService.deleteSingleImage(category.image.publicId);
    }

    await Category.deleteOne({ _id: category._id });
    return true;
  }

  /**
   * Admin: Deletes all categories.
   */
  async deleteAllCategories() {
    const categories = await Category.find({}).select('image');
    for (const c of categories) {
      if (c.image && c.image.publicId && c.image.publicId !== 'url_image') {
        await cloudinaryService.deleteSingleImage(c.image.publicId).catch(() => {});
      }
    }
    const result = await Category.deleteMany({});
    return result.deletedCount;
  }
}

export default new CategoryService();
