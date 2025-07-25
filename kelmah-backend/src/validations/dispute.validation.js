const Joi = require('joi');

// Validation schemas for Dispute entity
module.exports = {
  createDispute: Joi.object({
    contractId: Joi.number().integer().required(),
    raisedBy: Joi.number().integer().required(),
    reason: Joi.string().trim().required(),
    status: Joi.string().trim().required(),
    resolution: Joi.string().trim().optional()
  }),

  updateDispute: Joi.object({
    contractId: Joi.number().integer().optional(),
    raisedBy: Joi.number().integer().optional(),
    reason: Joi.string().trim().optional(),
    status: Joi.string().trim().optional(),
    resolution: Joi.string().trim().optional()
  })
}; 