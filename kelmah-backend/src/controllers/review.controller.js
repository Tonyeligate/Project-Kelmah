const { Review } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Create a new review record
exports.createReview = async (req, res, next) => {
  try {
    const review = await Review.create(req.body);
    return successResponse(res, 201, 'Review created successfully', review);
  } catch (error) {
    next(error);
  }
};

// Retrieve all reviews with pagination
exports.getReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const { count, rows } = await Review.findAndCountAll({
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });
    return paginatedResponse(res, 200, 'Reviews retrieved successfully', rows, page, limit, count);
  } catch (error) {
    next(error);
  }
};

// Retrieve a single review by ID
exports.getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return errorResponse(res, 404, 'Review not found');
    }
    return successResponse(res, 200, 'Review retrieved successfully', review);
  } catch (error) {
    next(error);
  }
};

// Update a review by ID
exports.updateReview = async (req, res, next) => {
  try {
    const [updated] = await Review.update(req.body, {
      where: { id: req.params.id },
      returning: true
    });
    if (!updated) {
      return errorResponse(res, 404, 'Review not found');
    }
    const updatedReview = await Review.findByPk(req.params.id);
    return successResponse(res, 200, 'Review updated successfully', updatedReview);
  } catch (error) {
    next(error);
  }
};

// Delete a review by ID
exports.deleteReview = async (req, res, next) => {
  try {
    const deleted = await Review.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return errorResponse(res, 404, 'Review not found');
    }
    return successResponse(res, 200, 'Review deleted successfully');
  } catch (error) {
    next(error);
  }
}; 