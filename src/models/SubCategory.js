import mongoose from 'mongoose';

const SubCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subcategory name is required.'],
      trim: true,
      maxlength: [50, 'Subcategory name cannot exceed 50 characters.'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Parent category is required.'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Pre-validate hook to generate unique URL-friendly slug
SubCategorySchema.pre('validate', function () {
  if (!this.slug && this.name) {
    const baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    this.slug = `${baseSlug || 'subcategory'}-${Date.now().toString(36)}-${randomSuffix}`;
  }
});

const SubCategory = mongoose.model('SubCategory', SubCategorySchema);

export default SubCategory;
