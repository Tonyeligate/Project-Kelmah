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

// Validation for contract templates
const createTemplate = Joi.object({
  title: Joi.string().required().messages({ 'any.required': 'Template title is required' }),
  description: Joi.string().allow('').optional(),
  milestones: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().required().messages({ 'any.required': 'Milestone title is required' }),
        description: Joi.string().allow('').optional(),
        dueDate: Joi.date().required().messages({ 'any.required': 'Due date is required', 'date.base': 'Due date must be a valid date' }),
        amount: Joi.number().positive().required().messages({ 'number.base': 'Amount must be a number', 'number.positive': 'Amount must be a positive number', 'any.required': 'Amount is required' })
      })
    )
    .optional()
});

// Validation for milestones
const createMilestone = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  dueDate: Joi.date().required(),
  amount: Joi.number().positive().required()
});

const updateMilestone = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().allow('').optional(),
  dueDate: Joi.date().optional(),
  amount: Joi.number().positive().optional()
});

// Validation for cancelling contracts
const cancelContract = Joi.object({
  reason: Joi.string().required().messages({ 'any.required': 'Cancellation reason is required' })
});

// Validation for signing contracts
const signContract = Joi.object({
  signature: Joi.string().required().messages({ 'any.required': 'Signature is required' })
});

// Validation for creating disputes
const createDispute = Joi.object({
  reason: Joi.string().required().messages({ 'any.required': 'Dispute reason is required' }),
  description: Joi.string().required().messages({ 'any.required': 'Dispute description is required' })
});

module.exports = {
  createContract,
  updateContract,
  createTemplate,
  createMilestone,
  updateMilestone,
  cancelContract,
  signContract,
  createDispute
}; 