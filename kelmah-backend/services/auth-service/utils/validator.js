/**
 * Validation Utility
 * Handles input validation for the authentication service
 */

const Joi = require('joi');
const { AppError } = require('./app-error');

// Common validation schemas
const commonSchemas = {
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required',
    'string.empty': 'Email cannot be empty'
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required',
      'string.empty': 'Password cannot be empty'
    }),
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required',
    'string.empty': 'Name cannot be empty'
  }),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).messages({
    'string.pattern.base': 'Please enter a valid phone number'
  }),
  role: Joi.string().valid('admin', 'hirer', 'worker', 'staff').messages({
    'any.only': 'Invalid role specified'
  })
};

// Validation schemas for different operations
const schemas = {
  register: Joi.object({
    firstName: commonSchemas.name,
    lastName: commonSchemas.name,
    email: commonSchemas.email,
    password: commonSchemas.password,
    phone: commonSchemas.phone,
    role: commonSchemas.role
  }),

  login: Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
      'string.empty': 'Password cannot be empty'
    })
  }),

  verifyEmail: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Verification token is required',
      'string.empty': 'Verification token cannot be empty'
    })
  }),

  resendVerification: Joi.object({
    email: commonSchemas.email
  }),

  forgotPassword: Joi.object({
    email: commonSchemas.email
  }),

  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Reset token is required',
      'string.empty': 'Reset token cannot be empty'
    }),
    password: commonSchemas.password
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required',
      'string.empty': 'Current password cannot be empty'
    }),
    newPassword: commonSchemas.password
  }),

  setupTwoFactor: Joi.object({
    secret: Joi.string().required().messages({
      'any.required': '2FA secret is required',
      'string.empty': '2FA secret cannot be empty'
    }),
    token: Joi.string().length(6).pattern(/^\d+$/).required().messages({
      'string.length': '2FA token must be 6 digits',
      'string.pattern.base': '2FA token must contain only numbers',
      'any.required': '2FA token is required',
      'string.empty': '2FA token cannot be empty'
    })
  }),

  verifyTwoFactor: Joi.object({
    token: Joi.string().length(6).pattern(/^\d+$/).required().messages({
      'string.length': '2FA token must be 6 digits',
      'string.pattern.base': '2FA token must contain only numbers',
      'any.required': '2FA token is required',
      'string.empty': '2FA token cannot be empty'
    })
  }),

  updateProfile: Joi.object({
    firstName: commonSchemas.name,
    lastName: commonSchemas.name,
    phone: commonSchemas.phone,
    dateOfBirth: Joi.date().iso().max('now').messages({
      'date.base': 'Please enter a valid date',
      'date.format': 'Date must be in ISO format',
      'date.max': 'Date of birth cannot be in the future'
    }),
    gender: Joi.string().valid('male', 'female', 'other').messages({
      'any.only': 'Invalid gender specified'
    }),
    address: Joi.string().max(200).messages({
      'string.max': 'Address cannot exceed 200 characters'
    }),
    city: Joi.string().max(100).messages({
      'string.max': 'City cannot exceed 100 characters'
    }),
    state: Joi.string().max(100).messages({
      'string.max': 'State cannot exceed 100 characters'
    }),
    country: Joi.string().max(100).messages({
      'string.max': 'Country cannot exceed 100 characters'
    }),
    postalCode: Joi.string().max(20).messages({
      'string.max': 'Postal code cannot exceed 20 characters'
    }),
    bio: Joi.string().max(500).messages({
      'string.max': 'Bio cannot exceed 500 characters'
    })
  })
};

/**
 * Validate request data against a schema
 * @param {Object} schema - Joi schema to validate against
 * @param {Object} data - Data to validate
 * @returns {Object} Validated data
 * @throws {AppError} If validation fails
 */
const validate = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw AppError.validationError(errors.join(', '));
  }

  return value;
};

module.exports = {
  schemas,
  validate
}; 