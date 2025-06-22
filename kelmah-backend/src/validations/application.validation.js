const Joi = require('joi');

/**
 * Validation schema for applying to a job
 */
const applyToJob = Joi.object({
  proposedRate: Joi.number().positive().required()
    .messages({ 'number.base': 'Proposed rate must be a number', 'number.positive': 'Proposed rate must be positive', 'any.required': 'Proposed rate is required' }),
  coverLetter: Joi.string().trim().min(20).required()
    .messages({ 'string.empty': 'Cover letter is required', 'string.min': 'Cover letter must be at least 20 characters', 'any.required': 'Cover letter is required' }),
  estimatedDuration: Joi.object({
    value: Joi.number().positive().required()
      .messages({ 'number.base': 'Duration value must be a number', 'number.positive': 'Duration value must be positive', 'any.required': 'Duration value is required' }),
    unit: Joi.string().valid('hour', 'day', 'week', 'month').required()
      .messages({ 'any.only': 'Duration unit must be hour, day, week, or month', 'any.required': 'Duration unit is required' })
  }).required(),
  attachments: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    fileUrl: Joi.string().uri().required(),
    fileType: Joi.string().required(),
    uploadDate: Joi.date().optional()
  })).optional(),
  availabilityStartDate: Joi.date().optional(),
  questionResponses: Joi.array().items(Joi.object({
    question: Joi.string().required(),
    answer: Joi.string().required()
  })).optional()
});

/**
 * Validation schema for updating application status
 */
const updateStatus = Joi.object({
  status: Joi.string().valid('pending', 'under_review', 'accepted', 'rejected', 'withdrawn').required()
    .messages({ 'any.only': 'Invalid status value', 'any.required': 'Status is required' })
});

module.exports = {
  applyToJob,
  updateStatus
}; 