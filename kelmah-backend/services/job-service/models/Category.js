const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    icon: {
      type: String, // URL or icon identifier
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    metaData: {
      keywords: [String],
      seoDescription: String
    }
  },
  { timestamps: true }
);

// Create indexes for better query performance
CategorySchema.index({ slug: 1 });
CategorySchema.index({ parentCategory: 1 });

// Virtual for getting child categories
CategorySchema.virtual('subCategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

// Method to get a properly formatted slug
CategorySchema.statics.createSlug = function(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Auto-generate slug before saving if not provided
CategorySchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.constructor.createSlug(this.name);
  }
  next();
});

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;

