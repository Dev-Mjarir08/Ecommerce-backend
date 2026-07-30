import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required.'],
      trim: true,
      maxlength: [100, 'Product title cannot exceed 100 characters.'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required.'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required.'],
      min: [0, 'Price cannot be negative.'],
    },
    discountPrice: {
      type: Number,
      default: 0,
      validate: {
        validator: function (value) {
          if (value === undefined || value === null || value === 0) return true;
          if (this.price === undefined || this.price === null) return true;
          return value <= this.price;
        },
        message: 'Discount price ({VALUE}) must be less than or equal to the original price.',
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required.'],
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'Product brand name is required.'],
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, 'Product stock quantity is required.'],
      min: [0, 'Stock cannot be negative.'],
      default: 0,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          default: 'url_image',
        },
      },
    ],
    ratings: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    soldCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    subCategory: {
      type: String,
      trim: true,
      default: '',
    },
    color: {
      type: String,
      trim: true,
      default: '',
    },
    storage: {
      type: String,
      trim: true,
      default: '',
    },
    ram: {
      type: String,
      trim: true,
      default: '',
    },
    reviews: [ReviewSchema],
  },
  { timestamps: true }
);

// Indexing for search queries
ProductSchema.index({ title: 'text', description: 'text', brand: 'text' });

// Pre-validate hook to ensure unique slug is always generated
ProductSchema.pre('validate', function () {
  if (!this.slug && this.title) {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    this.slug = `${baseSlug || 'product'}-${Date.now().toString(36)}-${randomSuffix}`;
  }
});

const Product = mongoose.model('Product', ProductSchema);

export default Product;
