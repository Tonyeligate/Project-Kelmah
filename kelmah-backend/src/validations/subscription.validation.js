const Joi = require('joi');

// Validation schemas for Subscription entity
module.exports = {
  createSubscription: Joi.object({
    userId: Joi.number().integer().required(),
    planId: Joi.number().integer().required(),
    status: Joi.string().trim().required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().optional()
  }),

  updateSubscription: Joi.object({
    userId: Joi.number().integer().optional(),
    planId: Joi.number().integer().optional(),
    status: Joi.string().trim().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional()
  })
}; 