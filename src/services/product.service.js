import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import cloudinaryService from './cloudinary.service.js';

class ProductService {
  /**
   * Creates a new product catalog item, handles multiple image uploads or image URL fallback.
   */
  async createProduct(details, imageFiles) {
    let imagesData = [];
    const defaultImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop';

    if (imageFiles && imageFiles.length > 0) {
      const uploadResults = await cloudinaryService.uploadMultipleImages(imageFiles, 'products');
      imagesData = uploadResults.map((img) => ({
        url: img.url,
        publicId: img.publicId,
      }));
    } else if (details.imageUrl || details.image || details.thumbnail) {
      const rawUrl = details.imageUrl || details.image || details.thumbnail;
      let finalUrl = defaultImg;
      if (typeof rawUrl === 'string') finalUrl = rawUrl.trim();
      else if (typeof rawUrl === 'object' && rawUrl !== null) finalUrl = rawUrl.url || rawUrl.src || defaultImg;
      imagesData = [{ url: finalUrl, publicId: 'url_image' }];
    } else if (Array.isArray(details.images) && details.images.length > 0) {
      imagesData = details.images.map((img) =>
        typeof img === 'string'
          ? { url: img, publicId: 'url_image' }
          : { url: img.url || defaultImg, publicId: img.publicId || 'url_image' }
      );
    } else {
      imagesData = [{ url: defaultImg, publicId: 'url_image' }];
    }

    const product = await Product.create({
      ...details,
      images: imagesData,
    });

    return product;
  }

  /**
   * Admin: Creates multiple product listings in a single batch.
   */
  async bulkCreateProducts(productsArray) {
    if (!Array.isArray(productsArray) || productsArray.length === 0) {
      throw new ApiError(400, 'Please provide a non-empty array of products.');
    }

    // Ensure at least one default category exists in DB if needed
    let defaultCategory = await Category.findOne();
    if (!defaultCategory) {
      defaultCategory = await Category.create({ name: 'General', slug: 'general', description: 'General Store Products' });
    }

    const allCategories = await Category.find();

    const normalizedProducts = [];
    for (let i = 0; i < productsArray.length; i++) {
      const p = productsArray[i];
      if (
        !p ||
        !p.title ||
        !String(p.title).trim() ||
        !p.brand ||
        !String(p.brand).trim() ||
        p.price === undefined ||
        p.price === null ||
        p.price === ''
      ) {
        throw new ApiError(400, `Product at row ${i + 1} is missing required fields (title, brand, or price).`);
      }

      const numPrice = Number(p.price);
      if (isNaN(numPrice) || numPrice < 0) {
        throw new ApiError(400, `Product at row ${i + 1} ("${p.title}") has an invalid price.`);
      }

      let numDiscount = p.discountPrice ? Number(p.discountPrice) : 0;
      if (isNaN(numDiscount) || numDiscount < 0 || numDiscount > numPrice) {
        numDiscount = 0;
      }

      // Resolve Category ID
      let categoryId = defaultCategory._id;
      if (p.category) {
        const catStr = String(p.category).trim();
        if (mongoose.Types.ObjectId.isValid(catStr)) {
          categoryId = catStr;
        } else {
          const matched = allCategories.find(
            (c) =>
              c._id.toString() === catStr ||
              c.name.toLowerCase() === catStr.toLowerCase() ||
              c.slug.toLowerCase() === catStr.toLowerCase()
          );
          if (matched) {
            categoryId = matched._id;
          } else {
            const escapedCat = catStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const foundCat = await Category.findOne({
              $or: [
                { slug: catStr.toLowerCase() },
                { name: new RegExp(`^${escapedCat}$`, 'i') },
              ],
            });
            if (foundCat) {
              categoryId = foundCat._id;
            }
          }
        }
      }

      // Normalize images
      let imagesData = [];
      const defaultImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop';
      const rawUrl = p.imageUrl || p.image || p.thumbnail || p.src || p.photo;

      if (Array.isArray(p.images) && p.images.length > 0) {
        imagesData = p.images.map((img) =>
          typeof img === 'string'
            ? { url: img, publicId: 'url_image' }
            : { url: img.url || img.src || defaultImg, publicId: img.publicId || 'url_image' }
        );
      } else if (rawUrl) {
        let finalUrl = defaultImg;
        if (typeof rawUrl === 'string') finalUrl = rawUrl.trim();
        else if (typeof rawUrl === 'object' && rawUrl !== null) finalUrl = rawUrl.url || rawUrl.src || defaultImg;
        imagesData = [{ url: finalUrl, publicId: 'url_image' }];
      } else {
        imagesData = [{ url: defaultImg, publicId: 'url_image' }];
      }

      // Generate unique slug
      const baseSlug = String(p.title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      const uniqueSlug = `${baseSlug || 'product'}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}-${i + 1}`;

      normalizedProducts.push({
        title: String(p.title).trim(),
        slug: uniqueSlug,
        brand: String(p.brand).trim(),
        category: categoryId,
        price: numPrice,
        discountPrice: numDiscount,
        stock: p.stock !== undefined && p.stock !== '' && !isNaN(Number(p.stock)) ? Math.max(0, Number(p.stock)) : 10,
        sku: p.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}-${i + 1}`,
        description: p.description && String(p.description).trim() ? String(p.description).trim() : String(p.title).trim(),
        specifications: p.specifications || {},
        images: imagesData,
      });
    }

    const inserted = await Product.insertMany(normalizedProducts);
    return inserted;
  }

  /**
   * Retrieves products with support for advanced search filters, multi-attribute criteria, sorting, and pagination.
   */
  async getProducts({
    search,
    category,
    subCategory,
    brand,
    minPrice,
    maxPrice,
    rating,
    inStock,
    discount,
    color,
    storage,
    ram,
    processor,
    screenSize,
    displayType,
    sort,
    page = 1,
    limit = 12,
  }) {
    // Auto-fix any DB documents with missing slug
    const missingSlugProducts = await Product.find({
      $or: [{ slug: null }, { slug: '' }, { slug: { $exists: false } }],
    });
    if (missingSlugProducts.length > 0) {
      for (const doc of missingSlugProducts) {
        const baseSlug = (doc.title || 'product')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
        doc.slug = `${baseSlug || 'product'}-${doc._id.toString().substring(18)}`;
        await doc.save();
      }
    }
    const query = {};

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Category resolution: accepts ObjectId, slug, or name (e.g. "Televisions", "Laptops", "Smartphones")
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        const foundCategory = await Category.findOne({
          $or: [
            { slug: category.toLowerCase() },
            { name: new RegExp(`^${category.trim()}$`, 'i') },
          ],
        });
        if (foundCategory) {
          query.category = foundCategory._id;
        } else {
          // If no matching category document exists, assign non-matching ObjectId to return 0 items
          query.category = new mongoose.Types.ObjectId();
        }
      }
    }

    if (subCategory) {
      if (mongoose.Types.ObjectId.isValid(subCategory)) {
        query.subCategory = subCategory;
      } else {
        const foundSub = await SubCategory.findOne({
          $or: [
            { slug: subCategory.toLowerCase() },
            { name: new RegExp(`^${subCategory.trim()}$`, 'i') },
          ],
        });
        if (foundSub) {
          query.subCategory = foundSub._id;
        } else {
          query.subCategory = new RegExp(`^${subCategory.trim()}$`, 'i');
        }
      }
    }

    // Brand filter (supports comma-separated list or single value)
    if (brand) {
      const brandArray = Array.isArray(brand)
        ? brand
        : brand.split(',').map((b) => b.trim()).filter(Boolean);
      if (brandArray.length > 0) {
        query.brand = { $in: brandArray.map((b) => new RegExp(`^${b}$`, 'i')) };
      }
    }

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Rating filter (minimum rating)
    if (rating) {
      query.ratings = { $gte: Number(rating) };
    }

    // Availability / In Stock filter
    if (inStock === 'true' || inStock === true) {
      query.stock = { $gt: 0 };
    }

    // Discount filter
    if (discount === 'true' || discount === true) {
      query.discountPrice = { $gt: 0 };
    }

    // Specification filters (supports multi-select comma-separated values & matches fields / specifications / title)
    const applySpecFilter = (paramVal, fieldNames) => {
      if (!paramVal) return;
      const values = Array.isArray(paramVal)
        ? paramVal
        : String(paramVal).split(',').map((v) => v.trim()).filter(Boolean);
      if (values.length === 0) return;

      const regexes = values.map((v) => new RegExp(v.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i'));
      const conditions = fieldNames.map((field) => ({ [field]: { $in: regexes } }));
      
      if (!query.$and) {
        query.$and = [];
      }
      query.$and.push({ $or: conditions });
    };

    applySpecFilter(ram, ['ram', 'specifications.RAM', 'specifications.ram', 'title']);
    applySpecFilter(storage, ['storage', 'specifications.Storage', 'specifications.storage', 'title']);
    applySpecFilter(color, ['color', 'specifications.Color', 'specifications.color', 'title']);
    applySpecFilter(processor, ['processor', 'specifications.Processor', 'specifications.processor', 'title', 'description']);
    applySpecFilter(screenSize, ['screenSize', 'specifications.ScreenSize', 'specifications.screenSize', 'specifications.displaySize', 'title']);
    applySpecFilter(displayType, ['displayType', 'specifications.DisplayType', 'specifications.displayType', 'title']);

    // Execution options & pagination
    const skip = (Number(page) - 1) * Number(limit);
    let sortOption = { createdAt: -1 }; // default: newest first

    if (sort) {
      if (sort === 'newest') sortOption = { createdAt: -1 };
      else if (sort === 'popularity') sortOption = { numReviews: -1 };
      else if (sort === 'best-selling') sortOption = { soldCount: -1 };
      else if (sort === 'price-low') sortOption = { price: 1 };
      else if (sort === 'price-high') sortOption = { price: -1 };
      else if (sort === 'rating') sortOption = { ratings: -1 };
      else if (sort === 'discount') sortOption = { discountPrice: -1 };
    }

    // Run find and count in parallel
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query),
    ]);

    return {
      products,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
    };
  }

  /**
   * Live search suggestions with regex prefix matching across title, brand, and category.
   */
  async searchProducts(q) {
    if (!q || !q.trim()) {
      return { suggestions: [], popularSearches: ['Smartphones', 'Laptops', 'OLED TV', 'Headphones', 'Smartwatches'] };
    }

    const cleanQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(cleanQuery, 'i');

    const suggestions = await Product.find({
      $or: [{ title: regex }, { brand: regex }],
    })
      .select('title slug price discountPrice images brand category ratings stock')
      .populate('category', 'name slug')
      .limit(8)
      .lean();

    return {
      suggestions,
      popularSearches: ['Smartphones', 'Laptops', 'OLED TV', 'Headphones', 'Smartwatches'],
    };
  }

  /**
   * Retrieves profile details of a single product by slug or ObjectId.
   */
  async getProductBySlug(slug) {
    let product = await Product.findOne({ slug }).populate('category', 'name slug').lean();
    if (!product && mongoose.Types.ObjectId.isValid(slug)) {
      product = await Product.findById(slug).populate('category', 'name slug').lean();
    }
    if (!product) {
      throw new ApiError(404, 'Product not found.');
    }
    return product;
  }

  /**
   * Updates product details and uploads new image assets.
   */
  async updateProduct(slug, updates, imageFiles) {
    const product = await Product.findOne({ slug });
    if (!product) {
      throw new ApiError(404, 'Product not found.');
    }

    // Upload new images if provided and append to list
    if (imageFiles && imageFiles.length > 0) {
      const uploadResults = await cloudinaryService.uploadMultipleImages(imageFiles, 'products');
      const newImages = uploadResults.map((img) => ({
        url: img.url,
        publicId: img.publicId,
      }));
      product.images = [...product.images, ...newImages];
    }

    // Apply updates
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        product[key] = updates[key];
      }
    });

    await product.save();
    return product;
  }

  /**
   * Deletes a product catalog record and destroys associated CDN media.
   */
  async deleteProduct(slug) {
    const product = await Product.findOne({ slug });
    if (!product) {
      throw new ApiError(404, 'Product not found.');
    }

    // Destroy all images on Cloudinary in parallel
    if (product.images && product.images.length > 0) {
      const deletionPromises = product.images.map((img) =>
        cloudinaryService.deleteSingleImage(img.publicId)
      );
      await Promise.all(deletionPromises);
    }

    await Product.deleteOne({ _id: product._id });
    return true;
  }

  /**
   * Creates a new user review for a product, updates aggregate ratings.
   */
  async createProductReview(slug, userId, name, rating, comment) {
    const product = await Product.findOne({ slug });
    if (!product) {
      throw new ApiError(404, 'Product not found.');
    }

    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === userId.toString()
    );

    if (alreadyReviewed) {
      throw new ApiError(400, 'Product already reviewed by this user.');
    }

    const review = {
      user: userId,
      name,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    
    // Recalculate average rating
    product.ratings =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();
    return product;
  }

  /**
   * Admin: Deletes all products in the catalog.
   */
  async deleteAllProducts() {
    const products = await Product.find({}).select('images');
    for (const p of products) {
      if (p.images && p.images.length > 0) {
        for (const img of p.images) {
          if (img.publicId && img.publicId !== 'url_image') {
            await cloudinaryService.deleteSingleImage(img.publicId).catch(() => {});
          }
        }
      }
    }
    const result = await Product.deleteMany({});
    return result.deletedCount;
  }
}

export default new ProductService();
