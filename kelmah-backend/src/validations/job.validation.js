/**
 * Job Validation Schemas
 */

const Joi = require('joi');

// Create job validation schema
const createJob = Joi.object({
  title: Joi.string().trim().min(5).max(100).required()
    .messages({
      'string.empty': 'Job title is required',
      'string.min': 'Job title must be at least 5 characters',
      'string.max': 'Job title cannot exceed 100 characters',
      'any.required': 'Job title is required'
    }),
  description: Joi.string().trim().min(20).max(5000).required()
    .messages({
      'string.empty': 'Job description is required',
      'string.min': 'Job description must be at least 20 characters',
      'string.max': 'Job description cannot exceed 5000 characters',
      'any.required': 'Job description is required'
    }),
  category: Joi.string().trim().required()
    .messages({
      'string.empty': 'Job category is required',
      'any.required': 'Job category is required'
    }),
  skills: Joi.array().items(Joi.string().trim()).min(1).required()
    .messages({
      'array.min': 'At least one skill is required',
      'any.required': 'Skills are required'
    }),
  budget: Joi.number().positive().required()
    .messages({
      'number.base': 'Budget must be a number',
      'number.positive': 'Budget must be a positive number',
      'any.required': 'Budget is required'
    }),
  duration: Joi.object({
    value: Joi.number().positive().required()
      .messages({
        'number.base': 'Duration value must be a number',
        'number.positive': 'Duration value must be a positive number',
        'any.required': 'Duration value is required'
      }),
    unit: Joi.string().valid('hour', 'day', 'week', 'month').required()
      .messages({
        'string.empty': 'Duration unit is required',
        'any.only': 'Duration unit must be hour, day, week, or month',
        'any.required': 'Duration unit is required'
      })
  }).required(),
  paymentType: Joi.string().valid('fixed', 'hourly').required()
    .messages({
      'string.empty': 'Payment type is required',
      'any.only': 'Payment type must be fixed or hourly',
      'any.required': 'Payment type is required'
    }),
  location: Joi.object({
    type: Joi.string().valid('remote', 'onsite', 'hybrid').required()
      .messages({
        'string.empty': 'Location type is required',
        'any.only': 'Location type must be remote, onsite, or hybrid',
        'any.required': 'Location type is required'
      }),
    country: Joi.string().trim()
      .when('type', {
        is: Joi.valid('onsite', 'hybrid'),
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
    city: Joi.string().trim()
      .when('type', {
        is: Joi.valid('onsite', 'hybrid'),
        then: Joi.required(),
        otherwise: Joi.optional()
      })
  }).required(),
  status: Joi.string().valid('draft', 'open').default('open'),
  visibility: Joi.string().valid('public', 'private', 'invite-only').default('public'),
  attachments: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      url: Joi.string().required(),
      type: Joi.string().required(),
      size: Joi.number().required()
    })
  ).optional()
});

// Update job validation schema
const updateJob = Joi.object({
  title: Joi.string().trim().min(5).max(100)
    .messages({
      'string.min': 'Job title must be at least 5 characters',
      'string.max': 'Job title cannot exceed 100 characters'
    }),
  description: Joi.string().trim().min(20).max(5000)
    .messages({
      'string.min': 'Job description must be at least 20 characters',
      'string.max': 'Job description cannot exceed 5000 characters'
    }),
  category: Joi.string().trim(),
  skills: Joi.array().items(Joi.string().trim()).min(1)
    .messages({
      'array.min': 'At least one skill is required'
    }),
  budget: Joi.number().positive()
    .messages({
      'number.base': 'Budget must be a number',
      'number.positive': 'Budget must be a positive number'
    }),
  duration: Joi.object({
    value: Joi.number().positive()
      .messages({
        'number.base': 'Duration value must be a number',
        'number.positive': 'Duration value must be a positive number'
      }),
    unit: Joi.string().valid('hour', 'day', 'week', 'month')
      .messages({
        'any.only': 'Duration unit must be hour, day, week, or month'
      })
  }),
  paymentType: Joi.string().valid('fixed', 'hourly')
    .messages({
      'any.only': 'Payment type must be fixed or hourly'
    }),
  location: Joi.object({
    type: Joi.string().valid('remote', 'onsite', 'hybrid')
      .messages({
        'any.only': 'Location type must be remote, onsite, or hybrid'
      }),
    country: Joi.string().trim()
      .when('type', {
        is: Joi.valid('onsite', 'hybrid'),
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
    city: Joi.string().trim()
      .when('type', {
        is: Joi.valid('onsite', 'hybrid'),
        then: Joi.required(),
        otherwise: Joi.optional()
      })
  }),
  status: Joi.string().valid('draft', 'open'),
  visibility: Joi.string().valid('public', 'private', 'invite-only'),
  attachments: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      url: Joi.string().required(),
      type: Joi.string().required(),
      size: Joi.number().required()
    })
  )
});

// Change job status validation schema
const changeJobStatus = Joi.object({
  status: Joi.string().valid('open', 'in-progress', 'completed', 'cancelled').required()
    .messages({
      'string.empty': 'Status is required',
      'any.only': 'Status must be open, in-progress, completed, or cancelled',
      'any.required': 'Status is required'
    })
});

module.exports = {
  createJob,
  updateJob,
  changeJobStatus
};