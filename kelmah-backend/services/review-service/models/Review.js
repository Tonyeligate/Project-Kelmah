const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * Review Model
 * Stores reviews that hirers leave for workers
 */
const ReviewSchema = new Schema(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
    jobCategory: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'approved',
    },
    response: {
      comment: {
        type: String,
        trim: true,
      },
      timestamp: {
        type: Date,
      },
      workerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    moderationNotes: [
      {
        note: {
          type: String,
          trim: true,
          default: '',
        },
        moderatorId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    helpfulVoters: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Virtual for helpful votes count
ReviewSchema.virtual('helpfulVotes').get(function () {
  return this.helpfulVoters ? this.helpfulVoters.length : 0;
});

ReviewSchema.set('toJSON', { virtuals: true });
ReviewSchema.set('toObject', { virtuals: true });

// Index for fast lookup
ReviewSchema.index({ reviewee: 1 });
ReviewSchema.index({ job: 1 });

const Review = mongoose.model("Review", ReviewSchema);
module.exports = Review;
