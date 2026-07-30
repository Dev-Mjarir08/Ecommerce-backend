import mongoose from 'mongoose';

const BrandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required.'],
      unique: true,
      trim: true,
      maxlength: [50, 'Brand name cannot exceed 50 characters.'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    logo: {
      url: {
        type: String,
        default: null,
      },
      publicId: {
        type: String,
        default: null,
      },
    },
    website: {
      type: String,
      trim: true,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
  },
  { timestamps: true }
);

// Pre-validate hook to generate unique URL-friendly slug
BrandSchema.pre('validate', function () {
  if (!this.slug && this.name) {
    const baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    this.slug = `${baseSlug || 'brand'}-${Date.now().toString(36)}-${randomSuffix}`;
  }
});

const Brand = mongoose.model('Brand', BrandSchema);

export default Brand;
