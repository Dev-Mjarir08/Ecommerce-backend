import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import cloudinaryService from './cloudinary.service.js';

class BrandService {
  /**
   * Creates a new Brand, handles logo upload and assigned categories.
   */
  async createBrand({ name, description, website, categories, logoUrl, logo, imageUrl, image }, logoFile) {
    if (!name) {
      throw new ApiError(400, 'Brand name is required.');
    }

    let logoData = { url: null, publicId: null };
    const defaultLogo = 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop';
    const rawUrl = logoUrl || logo || imageUrl || image;

    if (logoFile) {
      const uploadResult = await cloudinaryService.uploadSingleImage(logoFile, 'brands');
      if (uploadResult) {
        logoData = {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
        };
      }
    } else if (rawUrl) {
      let finalUrl = typeof rawUrl === 'string' ? rawUrl.trim() : rawUrl?.url;
      if (finalUrl) {
        logoData = { url: finalUrl, publicId: 'url_image' };
      }
    } else {
      logoData = { url: defaultLogo, publicId: 'default_brand' };
    }

    let categoriesArray = [];
    if (categories) {
      if (typeof categories === 'string') {
        categoriesArray = categories.split(',').map((id) => id.trim()).filter(Boolean);
      } else if (Array.isArray(categories)) {
        categoriesArray = categories;
      }
    }

    const brand = await Brand.create({
      name,
      description: description || '',
      website: website || '',
      logo: logoData,
      categories: categoriesArray,
    });

    return await brand.populate('categories', 'name slug');
  }

  /**
   * Admin: Bulk creates brand items safely.
   */
  async bulkCreateBrands(brandsArray) {
    if (!Array.isArray(brandsArray) || brandsArray.length === 0) {
      throw new ApiError(400, 'Please provide a non-empty array of brands.');
    }

    const defaultLogo = 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop';
    const allCategories = await Category.find();

    // Pre-fetch existing brands to prevent duplicate name/slug crashes
    const existing = await Brand.find({}).select('name slug').lean();
    const existingNames = new Set(existing.map((b) => b.name.toLowerCase()));

    const normalized = [];

    for (let i = 0; i < brandsArray.length; i++) {
      const b = brandsArray[i];
      if (!b || !b.name || !String(b.name).trim()) continue;

      let name = String(b.name).trim();
      if (name.length > 50) {
        name = name.substring(0, 50).trim();
      }

      if (existingNames.has(name.toLowerCase())) {
        continue;
      }
      existingNames.add(name.toLowerCase());

      let categoryIds = [];
      if (b.categories) {
        let catInputs = [];
        if (typeof b.categories === 'string') {
          catInputs = b.categories.split(',').map((s) => s.trim()).filter(Boolean);
        } else if (Array.isArray(b.categories)) {
          catInputs = b.categories;
        }

        for (const input of catInputs) {
          const str = String(input).trim();
          if (mongoose.Types.ObjectId.isValid(str)) {
            categoryIds.push(str);
          } else {
            const matched = allCategories.find(
              (c) =>
                c._id.toString() === str ||
                c.name.toLowerCase() === str.toLowerCase() ||
                c.slug.toLowerCase() === str.toLowerCase()
            );
            if (matched) categoryIds.push(matched._id);
          }
        }
      }

      const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const uniqueSlug = `${baseSlug || 'brand'}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}-${i + 1}`;
      const logoUrl = b.logoUrl || b.logo || defaultLogo;

      normalized.push({
        name,
        slug: uniqueSlug,
        description: b.description ? String(b.description).trim() : '',
        website: b.website ? String(b.website).trim() : '',
        logo: { url: logoUrl, publicId: 'url_image' },
        categories: categoryIds,
      });
    }

    if (normalized.length === 0) {
      return [];
    }

    return await Brand.insertMany(normalized, { ordered: false });
  }

  /**
   * Retrieves brands sorted alphabetically, optionally filtered by category ID or category slug.
   */
  async getBrands(categoryId) {
    const query = {};
    if (categoryId) {
      if (mongoose.Types.ObjectId.isValid(categoryId)) {
        query.categories = categoryId;
      } else {
        const catDoc = await Category.findOne({
          $or: [{ slug: categoryId.toLowerCase() }, { name: new RegExp(`^${categoryId.trim()}$`, 'i') }],
        });
        if (catDoc) {
          query.categories = catDoc._id;
        }
      }
    }

    return await Brand.find(query).populate('categories', 'name slug').sort({ name: 1 });
  }

  /**
   * Updates an existing Brand by ID.
   */
  async updateBrand(id, { name, description, website, categories, logoUrl, logo, imageUrl, image }, logoFile) {
    const brand = await Brand.findById(id);
    if (!brand) {
      throw new ApiError(404, 'Brand not found.');
    }

    if (name) brand.name = name;
    if (description !== undefined) brand.description = description;
    if (website !== undefined) brand.website = website;

    if (categories !== undefined) {
      let categoriesArray = [];
      if (typeof categories === 'string') {
        categoriesArray = categories.split(',').map((id) => id.trim()).filter(Boolean);
      } else if (Array.isArray(categories)) {
        categoriesArray = categories;
      }
      brand.categories = categoriesArray;
    }

    const rawUrl = logoUrl || logo || imageUrl || image;

    if (logoFile) {
      if (brand.logo && brand.logo.publicId && brand.logo.publicId !== 'default_brand' && brand.logo.publicId !== 'url_image') {
        await cloudinaryService.deleteSingleImage(brand.logo.publicId);
      }
      const uploadResult = await cloudinaryService.uploadSingleImage(logoFile, 'brands');
      if (uploadResult) {
        brand.logo = {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
        };
      }
    } else if (rawUrl) {
      let finalUrl = typeof rawUrl === 'string' ? rawUrl.trim() : rawUrl?.url;
      if (finalUrl) {
        brand.logo = { url: finalUrl, publicId: 'url_image' };
      }
    }

    await brand.save();
    return await brand.populate('categories', 'name slug');
  }

  /**
   * Deletes a Brand by ID.
   */
  async deleteBrand(id) {
    const brand = await Brand.findById(id);
    if (!brand) {
      throw new ApiError(404, 'Brand not found.');
    }

    if (brand.logo && brand.logo.publicId) {
      await cloudinaryService.deleteImage(brand.logo.publicId);
    }

    await brand.deleteOne();
    return true;
  }

  /**
   * Admin: Deletes all brands.
   */
  async deleteAllBrands() {
    const brands = await Brand.find({}).select('logo');
    for (const b of brands) {
      if (b.logo && b.logo.publicId && b.logo.publicId !== 'url_image') {
        await cloudinaryService.deleteImage(b.logo.publicId).catch(() => {});
      }
    }
    const result = await Brand.deleteMany({});
    return result.deletedCount;
  }
}

export default new BrandService();
