const Joi = require('joi');

/**
 * Validation schema for creating a new contract
 */
const createContract = Joi.object({
  job: Joi.string().required().messages({ 'any.required': 'Job ID is required' }),
  application: Joi.string().required().messages({ 'any.required': 'Application ID is required' }),
  startDate: Joi.date().required().messages({ 'any.required': 'Start date is required', 'date.base': 'Start date must be a valid date' }),
  paymentTerms: Joi.object({
    type: Joi.string().valid('fixed', 'hourly', 'milestone').required().messages({ 'any.only': 'Payment type must be fixed, hourly, or milestone', 'any.required': 'Payment type is required' }),
    rate: Joi.number().positive().required().messages({ 'number.base': 'Rate must be a number', 'number.positive': 'Rate must be positive', 'any.required': 'Rate is required' }),
    currency: Joi.string().optional()
  }).required().messages({ 'any.required': 'Payment terms are required' })
});

/**
 * Validation schema for updating an existing contract
 */
const updateContract = Joi.object({
  startDate: Joi.date().optional().messages({ 'date.base': 'Start date must be a valid date' }),
  endDate: Joi.date().optional().messages({ 'date.base': 'End date must be a valid date' }),
  status: Joi.string().valid('draft', 'pending', 'active', 'completed', 'terminated', 'cancelled').optional().messages({ 'any.only': 'Invalid contract status' }),
  terminationReason: Joi.string().optional(),
  notes: Joi.string().optional()
});

module.exports = {
  createContract,
  updateContract
}; 