/**
 * Portfolio Model - MongoDB/Mongoose
 * Manages portfolio items for worker profiles
 */

const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  workerProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkerProfile',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  projectType: {
    type: String,
    enum: ['personal', 'professional', 'freelance', 'volunteer', 'academic'],
    default: 'professional'
  },
  primarySkillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    index: true
  },
  skillsUsed: {
    type: [String],
    default: []
  },
  mainImage: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        if (!v) return true;
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Main image must be a valid URL'
    }
  },
  images: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  videos: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  documents: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  projectValue: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'GHS',
    maxlength: 3
  },
  startDate: Date,
  endDate: {
    type: Date,
    validate: {
      validator: function (value) {
        return !value || !this.startDate || value >= this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  location: {
    type: String,
    maxlength: 255,
    trim: true
  },
  clientName: {
    type: String,
    maxlength: 100,
    trim: true
  },
  clientCompany: {
    type: String,
    maxlength: 100,
    trim: true
  },
  clientRating: {
    type: Number,
    min: 0,
    max: 5
  },
  clientTestimonial: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  challenges: String,
  solutions: String,
  outcomes: String,
  lessonsLearned: String,
  toolsUsed: {
    type: [String],
    default: []
  },
  teamSize: {
    type: Number,
    min: 1,
    max: 100
  },
  role: {
    type: String,
    maxlength: 100,
    trim: true
  },
  responsibilities: {
    type: [String],
    default: []
  },
  achievements: {
    type: [String],
    default: []
  },
  externalLinks: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'featured'],
    default: 'draft',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  likeCount: {
    type: Number,
    default: 0,
    min: 0
  },
  shareCount: {
    type: Number,
    default: 0,
    min: 0
  },
  sortOrder: Number,
  tags: {
    type: [String],
    default: []
  },
  keywords: {
    type: [String],
    default: []
  },
  seoTitle: {
    type: String,
    maxlength: 255
  },
  seoDescription: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
portfolioSchema.index({ workerProfileId: 1, status: 1, isActive: 1 });
portfolioSchema.index({ projectType: 1 });
portfolioSchema.index({ startDate: 1 });
portfolioSchema.index({ endDate: 1 });
portfolioSchema.index({ clientRating: 1 });
portfolioSchema.index({ projectValue: 1 });
portfolioSchema.index({ viewCount: 1 });
portfolioSchema.index({ skillsUsed: 1 });
portfolioSchema.index({ tags: 1 });
portfolioSchema.index({ keywords: 1 });
portfolioSchema.index({ toolsUsed: 1 });
portfolioSchema.index({ createdAt: -1 });

// Instance Methods
// Instance Methods

portfolioSchema.methods.getStatusText = function () {
  const statuses = {
    'draft': 'Draft',
    'published': 'Published',
    'archived': 'Archived',
    'featured': 'Featured'
  };
  return statuses[this.status] || 'Unknown';
};

portfolioSchema.methods.getMainImageUrl = function () {
  if (this.images && this.images.length > 0) {
    return this.images[0].url || this.images[0];
  }
  return this.mainImage;
};

portfolioSchema.methods.getAllImageUrls = function () {
  if (this.images && Array.isArray(this.images)) {
    return this.images.map(img =>
      typeof img === 'object' ? img.url : img
    ).filter(Boolean);
  }
  return this.mainImage ? [this.mainImage] : [];
};

portfolioSchema.methods.isVisible = function () {
  return this.status === 'published' && this.isActive;
};

portfolioSchema.methods.getDurationText = function () {
  if (!this.startDate) return 'Duration not specified';

  const start = new Date(this.startDate);
  const end = this.endDate ? new Date(this.endDate) : new Date();

  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months !== 1 ? 's' : ''}`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years !== 1 ? 's' : ''}`;
  }
};

portfolioSchema.methods.getSkillsUsed = function () {
  return this.skillsUsed || [];
};

portfolioSchema.methods.getComplexityScore = function () {
  let score = 1;

  if (this.projectValue) {
    if (this.projectValue > 10000) score += 3;
    else if (this.projectValue > 5000) score += 2;
    else if (this.projectValue > 1000) score += 1;
  }

  const skillsCount = this.getSkillsUsed().length;
  score += Math.min(skillsCount, 3);

  if (this.startDate && this.endDate) {
    const duration = new Date(this.endDate) - new Date(this.startDate);
    const days = duration / (1000 * 60 * 60 * 24);
    if (days > 90) score += 2;
    else if (days > 30) score += 1;
  }

  if (this.clientRating >= 5) score += 1;

  return Math.min(10, Math.max(1, score));
};

portfolioSchema.methods.getSummary = function () {
  return {
    id: this._id,
    title: this.title,
    description: this.description?.substring(0, 150) + '...',
    mainImage: this.getMainImageUrl(),
    imageCount: this.getAllImageUrls().length,
    projectValue: this.projectValue,
    currency: this.currency,
    duration: this.getDurationText(),
    skillsCount: this.getSkillsUsed().length,
    clientRating: this.clientRating,
    status: this.getStatusText(),
    isVisible: this.isVisible(),
    complexityScore: this.getComplexityScore(),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static Methods

portfolioSchema.statics.findByWorker = async function (workerProfileId, options = {}) {
  return await this.find({
    workerProfileId,
    isActive: true,
    ...options.where
  })
    .sort({ isFeatured: -1, sortOrder: 1, createdAt: -1 })
    .limit(options.limit)
    .skip(options.skip);
};

portfolioSchema.statics.searchPortfolio = async function (query, options = {}) {
  const searchRegex = new RegExp(query, 'i');

  return await this.find({
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { keywords: query.toLowerCase() },
      { tags: query.toLowerCase() }
    ],
    status: 'published',
    isActive: true,
    ...options.where
  })
    .sort({ isFeatured: -1, viewCount: -1, createdAt: -1 })
    .limit(options.limit || 10);
};

portfolioSchema.statics.getFeaturedPortfolio = async function (limit = 10) {
  return await this.find({
    isFeatured: true,
    status: 'published',
    isActive: true
  })
    .sort({ viewCount: -1, likeCount: -1, createdAt: -1 })
    .limit(limit);
};

portfolioSchema.statics.incrementView = async function (portfolioId) {
  return await this.findByIdAndUpdate(
    portfolioId,
    { $inc: { viewCount: 1 } },
    { new: true }
  );
};

portfolioSchema.statics.incrementLike = async function (portfolioId) {
  return await this.findByIdAndUpdate(
    portfolioId,
    { $inc: { likeCount: 1 } },
    { new: true }
  );
};

portfolioSchema.statics.incrementShare = async function (portfolioId) {
  return await this.findByIdAndUpdate(
    portfolioId,
    { $inc: { shareCount: 1 } },
    { new: true }
  );
};

// Hooks (Mongoose middleware)

portfolioSchema.pre('save', function (next) {
  // Generate keywords from title and description
  if (!this.keywords || this.keywords.length === 0) {
    const titleWords = this.title.toLowerCase().split(/\s+/);
    const descWords = this.description
      ? this.description.toLowerCase().split(/\s+/)
      : [];

    this.keywords = [...new Set([...titleWords, ...descWords])]
      .filter(word => word.length > 3)
      .slice(0, 20);
  }

  // Auto-generate tags from skills and project type
  if (!this.tags || this.tags.length === 0) {
    const tags = [];

    if (this.projectType) {
      tags.push(this.projectType);
    }

    if (this.skillsUsed && Array.isArray(this.skillsUsed)) {
      tags.push(...this.skillsUsed.slice(0, 5));
    }

    this.tags = [...new Set(tags)];
  }

  next();
});

portfolioSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  // Update keywords if title or description changed
  if (update.$set && (update.$set.title || update.$set.description)) {
    const titleWords = update.$set.title ? update.$set.title.toLowerCase().split(/\s+/) : [];
    const descWords = update.$set.description ? update.$set.description.toLowerCase().split(/\s+/) : [];

    update.$set.keywords = [...new Set([...titleWords, ...descWords])]
      .filter(word => word.length > 3)
      .slice(0, 20);
  }

  // Update tags if skills or project type changed
  if (update.$set && (update.$set.skillsUsed || update.$set.projectType)) {
    const tags = [];

    if (update.$set.projectType) {
      tags.push(update.$set.projectType);
    }

    if (update.$set.skillsUsed && Array.isArray(update.$set.skillsUsed)) {
      tags.push(...update.$set.skillsUsed.slice(0, 5));
    }

    update.$set.tags = [...new Set(tags)];
  }

  next();
});

// Use standard mongoose.model() - it auto-binds to the default connection
module.exports = mongoose.models.Portfolio || mongoose.model('Portfolio', portfolioSchema);