const Joi = require('joi');

// Validation schemas for Plan entity
module.exports = {
  createPlan: Joi.object({
    name: Joi.string().trim().required(),
    price: Joi.number().precision(2).positive().required(),
    durationMonths: Joi.number().integer().min(1).required()
  }),

  updatePlan: Joi.object({
    name: Joi.string().trim().optional(),
    price: Joi.number().precision(2).positive().optional(),
    durationMonths: Joi.number().integer().min(1).optional()
  })
}; 