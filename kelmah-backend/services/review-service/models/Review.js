const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Review Model
 * Stores reviews that hirers leave for workers
 */
const ReviewSchema = new Schema(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reviewee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Index for fast lookup
ReviewSchema.index({ reviewee: 1 });
ReviewSchema.index({ job: 1 });

const Review = mongoose.model('Review', ReviewSchema);
module.exports = Review;
