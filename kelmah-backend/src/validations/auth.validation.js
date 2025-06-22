/**
 * Authentication Validation Schemas
 */

const Joi = require('joi');

// Register validation schema
const register = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
  lastName: Joi.string().trim().min(2).max(50).required()
    .messages({
      'string.empty': 'Last name is required',
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),
  email: Joi.string().trim().email().required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
  password: Joi.string().min(8).required()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
      'any.required': 'Password is required'
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({
      'string.empty': 'Confirm password is required',
      'any.only': 'Passwords do not match',
      'any.required': 'Confirm password is required'
    }),
  role: Joi.string().valid('worker', 'hirer').default('worker')
    .messages({
      'any.only': 'Role must be either worker or hirer'
    })
});

// Login validation schema
const login = Joi.object({
  email: Joi.string().trim().email().required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
  password: Joi.string().required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
});

// Forgot password validation schema
const forgotPassword = Joi.object({
  email: Joi.string().trim().email().required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    })
});

// Reset password validation schema
const resetPassword = Joi.object({
  password: Joi.string().min(8).required()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
      'any.required': 'Password is required'
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({
      'string.empty': 'Confirm password is required',
      'any.only': 'Passwords do not match',
      'any.required': 'Confirm password is required'
    })
});

// Change password validation schema for logged-in users
const changePassword = Joi.object({
  currentPassword: Joi.string().required()
    .messages({
      'string.empty': 'Current password is required',
      'any.required': 'Current password is required'
    }),
  newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')).required()
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
      'any.required': 'New password is required'
    })
});

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword
};