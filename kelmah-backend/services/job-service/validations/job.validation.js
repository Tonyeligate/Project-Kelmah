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
  budget: Joi.object({
    type: Joi.string().valid('fixed', 'hourly').required(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().default('GHS')
  }).required(),
  location: Joi.object({
    type: Joi.string().valid('remote', 'onsite', 'hybrid').required(),
    address: Joi.string().when('type', {
      is: Joi.valid('onsite', 'hybrid'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    coordinates: Joi.object({
      lat: Joi.number(),
      lng: Joi.number()
    }).optional()
  }).required(),
  skills: Joi.array().items(Joi.string()).min(1).required()
    .messages({
      'array.min': 'At least one skill is required'
    }),
  duration: Joi.object({
    type: Joi.string().valid('days', 'weeks', 'months').required(),
    value: Joi.number().positive().required()
  }).required(),
  requirements: Joi.array().items(Joi.string()).optional(),
  deadline: Joi.date().greater('now').optional()
});

// Update job validation schema
const updateJob = createJob.fork(['title', 'description', 'category', 'budget', 'location', 'skills', 'duration'], 
  (schema) => schema.optional()
);

// Change job status validation
const changeJobStatus = Joi.object({
  status: Joi.string().valid('active', 'paused', 'closed', 'cancelled').required()
});

// Job search/filter validation
const searchJobs = Joi.object({
  search: Joi.string().trim().optional(),
  category: Joi.string().optional(),
  location: Joi.string().optional(),
  budget_min: Joi.number().positive().optional(),
  budget_max: Joi.number().positive().optional(),
  budget_type: Joi.string().valid('fixed', 'hourly').optional(),
  skills: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  duration_type: Joi.string().valid('days', 'weeks', 'months').optional(),
  duration_min: Joi.number().positive().optional(),
  duration_max: Joi.number().positive().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  sort: Joi.string().valid('newest', 'oldest', 'budget_low', 'budget_high', 'deadline').default('newest')
});

module.exports = {
  createJob,
  updateJob,
  changeJobStatus,
  searchJobs
};