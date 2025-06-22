const Joi = require('joi');

/**
 * Validation schema for creating a new review
 */
const createReview = Joi.object({
  job: Joi.string().required().messages({ 'any.required': 'Job ID is required' }),
  reviewee: Joi.string().required().messages({ 'any.required': 'Reviewee ID is required' }),
  rating: Joi.number().min(1).max(5).required().messages({ 'number.base': 'Rating must be a number', 'number.min': 'Rating must be at least 1', 'number.max': 'Rating cannot exceed 5', 'any.required': 'Rating is required' }),
  comment: Joi.string().max(5000).optional().messages({ 'string.max': 'Comment cannot exceed 5000 characters' })
});

module.exports = {
  createReview
}; 