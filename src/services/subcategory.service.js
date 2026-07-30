import SubCategory from '../models/SubCategory.js';
import Category from '../models/Category.js';
import ApiError from '../utils/ApiError.js';
import mongoose from 'mongoose';

class SubCategoryService {
  /**
   * Creates a new subcategory linked to a parent category.
   */
  async createSubCategory({ name, category, description }) {
    if (!name || !category) {
      throw new ApiError(400, 'Subcategory name and parent category are required.');
    }

    const parentCategory = await Category.findById(category);
    if (!parentCategory) {
      throw new ApiError(404, 'Parent category not found.');
    }

    const subCategory = await SubCategory.create({
      name,
      category,
      description: description || '',
    });

    return subCategory.populate('category', 'name slug');
  }

  /**
   * Admin: Bulk creates subcategories safely.
   */
  async bulkCreateSubCategories(subCategoriesArray) {
    if (!Array.isArray(subCategoriesArray) || subCategoriesArray.length === 0) {
      throw new ApiError(400, 'Please provide a non-empty array of subcategories.');
    }

    let defaultCategory = await Category.findOne();
    if (!defaultCategory) {
      defaultCategory = await Category.create({ name: 'General', slug: 'general', description: 'General Store Products' });
    }

    const allCategories = await Category.find();

    // Pre-fetch existing subcategories to prevent duplicate insert crashes
    const existing = await SubCategory.find({}).select('name category').lean();
    const existingKeys = new Set(existing.map((s) => `${s.name.toLowerCase()}_${s.category.toString()}`));

    const normalized = [];

    for (let i = 0; i < subCategoriesArray.length; i++) {
      const item = subCategoriesArray[i];
      if (!item || !item.name || !String(item.name).trim()) continue;

      let name = String(item.name).trim();
      if (name.length > 50) {
        name = name.substring(0, 50).trim();
      }

      let parentId = defaultCategory._id;
      if (item.category) {
        const catStr = String(item.category).trim();
        if (mongoose.Types.ObjectId.isValid(catStr)) {
          parentId = catStr;
        } else {
          const matched = allCategories.find(
            (c) =>
              c._id.toString() === catStr ||
              c.name.toLowerCase() === catStr.toLowerCase() ||
              c.slug.toLowerCase() === catStr.toLowerCase()
          );
          if (matched) parentId = matched._id;
        }
      }

      const dupKey = `${name.toLowerCase()}_${parentId.toString()}`;
      if (existingKeys.has(dupKey)) {
        continue;
      }
      existingKeys.add(dupKey);

      const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const uniqueSlug = `${baseSlug || 'subcategory'}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}-${i + 1}`;

      normalized.push({
        name,
        slug: uniqueSlug,
        category: parentId,
        description: item.description ? String(item.description).trim() : '',
      });
    }

    if (normalized.length === 0) {
      return [];
    }

    return await SubCategory.insertMany(normalized, { ordered: false });
  }

  /**
   * Retrieves all subcategories, optionally filtered by parent category ID.
   */
  async getSubCategories(categoryId) {
    const query = {};
    if (categoryId) {
      if (mongoose.Types.ObjectId.isValid(categoryId)) {
        query.category = categoryId;
      } else {
        const catDoc = await Category.findOne({
          $or: [{ slug: categoryId.toLowerCase() }, { name: new RegExp(`^${categoryId.trim()}$`, 'i') }],
        });
        if (catDoc) query.category = catDoc._id;
      }
    }

    return await SubCategory.find(query).populate('category', 'name slug').sort({ name: 1 });
  }

  /**
   * Updates an existing subcategory by ID.
   */
  async updateSubCategory(id, { name, category, description }) {
    const subCat = await SubCategory.findById(id);
    if (!subCat) {
      throw new ApiError(404, 'Subcategory not found.');
    }

    if (name) subCat.name = name;
    if (category) {
      const parentCat = await Category.findById(category);
      if (!parentCat) throw new ApiError(404, 'Parent category not found.');
      subCat.category = category;
    }
    if (description !== undefined) subCat.description = description;

    await subCat.save();
    return subCat.populate('category', 'name slug');
  }

  /**
   * Deletes a subcategory by ID.
   */
  async deleteSubCategory(id) {
    const subCat = await SubCategory.findById(id);
    if (!subCat) {
      throw new ApiError(404, 'Subcategory not found.');
    }
    await subCat.deleteOne();
    return true;
  }

  /**
   * Admin: Deletes all subcategories.
   */
  async deleteAllSubCategories() {
    const result = await SubCategory.deleteMany({});
    return result.deletedCount;
  }
}

export default new SubCategoryService();
