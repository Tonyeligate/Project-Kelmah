const Review = require('../../services/review-service/models/Review');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

/**
 * Create a new review
 */
exports.createReview = async (req, res, next) => {
  try {
    const { job, reviewee, rating, comment } = req.body;
    const reviewer = req.user.id;

    // Prevent reviewing someone twice for same job
    const existing = await Review.findOne({ job, reviewer });
    if (existing) {
      return errorResponse(res, 400, 'You have already reviewed this job');
    }

    const review = await Review.create({ job, reviewer, reviewee, rating, comment });
    return successResponse(res, 201, 'Review created successfully', review);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get reviews for a specific worker
 */
exports.getReviewsForWorker = async (req, res, next) => {
  try {
    const { id: reviewee } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { reviewee };
    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('reviewer', 'firstName lastName profilePicture')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    return paginatedResponse(res, 200, 'Reviews retrieved successfully', reviews, page, limit, total);
  } catch (error) {
    return next(error);
  }
};

/**
 * Get reviews submitted by current user
 */
exports.getMyReviews = async (req, res, next) => {
  try {
    const reviewer = req.user.id;
    const reviews = await Review.find({ reviewer })
      .populate('reviewee', 'firstName lastName profilePicture')
      .sort('-createdAt');
    return successResponse(res, 200, 'My reviews retrieved successfully', reviews);
  } catch (error) {
    return next(error);
  }
}; 