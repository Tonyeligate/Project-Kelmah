/**
 * Worker Rating Summary Model
 * Aggregated rating data for workers based on their reviews
 */

const mongoose = require('mongoose');

const workerRatingSchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    ref: 'User'
  },

  // Summary statistics
  totalReviews: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },

  // Detailed ratings breakdown
  ratings: {
    overall: { type: Number, default: 0 },
    quality: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    timeliness: { type: Number, default: 0 },
    professionalism: { type: Number, default: 0 }
  },

  // Rating distribution (count of 1-5 star ratings)
  ratingDistribution: {
    5: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    1: { type: Number, default: 0 }
  },

  // Category-specific ratings
  categoryRatings: [{
    category: String,
    averageRating: Number,
    reviewCount: Number
  }],

  // Trust metrics
  recommendationRate: { type: Number, default: 0 }, // Percentage who would recommend
  verifiedReviewsCount: { type: Number, default: 0 },
  responseRate: { type: Number, default: 0 }, // Percentage who respond to reviews
  recentRating: { type: Number, default: 0 }, // Average of last 10 reviews

  // Metadata
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for performance
workerRatingSchema.index({ workerId: 1 });
workerRatingSchema.index({ averageRating: -1 });
workerRatingSchema.index({ totalReviews: -1 });

module.exports = mongoose.model('WorkerRating', workerRatingSchema);