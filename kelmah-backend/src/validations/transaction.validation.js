const Joi = require('joi');

// Validation schemas for Transaction entity
module.exports = {
  createTransaction: Joi.object({
    userId: Joi.number().integer().required(),
    contractId: Joi.number().integer().required(),
    amount: Joi.number().precision(2).positive().required(),
    type: Joi.string().trim().required(),
    status: Joi.string().trim().required()
  }),

  updateTransaction: Joi.object({
    userId: Joi.number().integer().optional(),
    contractId: Joi.number().integer().optional(),
    amount: Joi.number().precision(2).positive().optional(),
    type: Joi.string().trim().optional(),
    status: Joi.string().trim().optional()
  })
}; 