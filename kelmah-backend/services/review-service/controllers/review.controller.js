const Review = require('../models/review.model');
const { StatusCodes } = require('http-status-codes');
const { NotFoundError, BadRequestError, UnauthorizedError } = require('../utils/errors');
const mongoose = require('mongoose');

const reviewController = {
  // Create a new review
  createReview: async (req, res) => {
    const { jobId, recipientId, rating, comment, reviewType } = req.body;
    const reviewerId = req.user.id;

    // Validate that the user hasn't already submitted a review for this job
    const existingReview = await Review.findOne({
      jobId,
      reviewerId,
      reviewType
    });

    if (existingReview) {
      throw new BadRequestError('You have already submitted a review for this job');
    }

    const review = new Review({
      jobId,
      reviewerId,
      recipientId,
      rating,
      comment,
      reviewType
    });

    await review.save();

    // Update user's average rating (this could be moved to a separate service)
    await updateUserAverageRating(recipientId);

    return res.status(StatusCodes.CREATED).json({ review });
  },

  // Get reviews for a specific user
  getUserReviews: async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10, reviewType } = req.query;

    const query = { recipientId: userId };
    
    // Add filter by review type if provided
    if (reviewType) {
      query.reviewType = reviewType;
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      populate: {
        path: 'reviewerId',
        select: 'firstName lastName profilePicture'
      }
    };

    const reviews = await Review.find(query)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .sort(options.sort)
      .populate(options.populate);

    const total = await Review.countDocuments(query);

    return res.status(StatusCodes.OK).json({
      reviews,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      totalReviews: total
    });
  },

  // Get reviews for a specific job
  getJobReviews: async (req, res) => {
    const { jobId } = req.params;

    const reviews = await Review.find({ jobId })
      .populate({
        path: 'reviewerId',
        select: 'firstName lastName profilePicture'
      })
      .sort({ createdAt: -1 });

    return res.status(StatusCodes.OK).json({ reviews });
  },

  // Update a review (only the owner can update)
  updateReview: async (req, res) => {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check if the user is the owner of the review
    if (review.reviewerId.toString() !== userId) {
      throw new UnauthorizedError('You are not authorized to update this review');
    }

    // Update the review
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.updatedAt = Date.now();

    await review.save();

    // Update user's average rating
    await updateUserAverageRating(review.recipientId);

    return res.status(StatusCodes.OK).json({ review });
  },

  // Delete a review (only the owner can delete)
  deleteReview: async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check if the user is the owner of the review
    if (review.reviewerId.toString() !== userId) {
      throw new UnauthorizedError('You are not authorized to delete this review');
    }

    await Review.findByIdAndDelete(reviewId);

    // Update user's average rating
    await updateUserAverageRating(review.recipientId);

    return res.status(StatusCodes.OK).json({ message: 'Review deleted successfully' });
  },

  // Get review statistics for a user
  getUserReviewStats: async (req, res) => {
    const { userId } = req.params;

    const stats = await Review.aggregate([
      { $match: { recipientId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          rating5Count: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          rating4Count: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          rating3Count: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          rating2Count: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          rating1Count: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
        }
      }
    ]);

    const reviewStats = stats.length > 0 ? stats[0] : {
      averageRating: 0,
      totalReviews: 0,
      rating5Count: 0,
      rating4Count: 0,
      rating3Count: 0,
      rating2Count: 0,
      rating1Count: 0
    };

    // Calculate rating percentages
    if (reviewStats.totalReviews > 0) {
      reviewStats.rating5Percent = (reviewStats.rating5Count / reviewStats.totalReviews) * 100;
      reviewStats.rating4Percent = (reviewStats.rating4Count / reviewStats.totalReviews) * 100;
      reviewStats.rating3Percent = (reviewStats.rating3Count / reviewStats.totalReviews) * 100;
      reviewStats.rating2Percent = (reviewStats.rating2Count / reviewStats.totalReviews) * 100;
      reviewStats.rating1Percent = (reviewStats.rating1Count / reviewStats.totalReviews) * 100;
    } else {
      reviewStats.rating5Percent = 0;
      reviewStats.rating4Percent = 0;
      reviewStats.rating3Percent = 0;
      reviewStats.rating2Percent = 0;
      reviewStats.rating1Percent = 0;
    }

    return res.status(StatusCodes.OK).json({ stats: reviewStats });
  }
};

// Helper function to update a user's average rating
async function updateUserAverageRating(userId) {
  const stats = await Review.aggregate([
    { $match: { recipientId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  const averageRating = stats.length > 0 ? stats[0].averageRating : 0;
  const totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;

  // This would update the user profile with the new average rating
  // We'll assume there's a User model that can be imported and used here
  // await User.findByIdAndUpdate(userId, { averageRating, totalReviews });
  
  // Since we don't have the User model imported here, we'll just log the update
  console.log(`Updated rating for user ${userId}: ${averageRating} (${totalReviews} reviews)`);
}

module.exports = reviewController;
