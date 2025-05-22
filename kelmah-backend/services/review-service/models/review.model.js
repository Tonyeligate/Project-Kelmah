const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  reviewerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  reviewType: {
    type: String,
    enum: ['WORKER_REVIEW', 'HIRER_REVIEW'],
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index to optimize searches
reviewSchema.index({ recipientId: 1, reviewType: 1 });
reviewSchema.index({ jobId: 1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
