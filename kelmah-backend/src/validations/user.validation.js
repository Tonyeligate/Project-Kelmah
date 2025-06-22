const Joi = require('joi');

// Validation for listing users (pagination)
const getUsers = Joi.object({
  page: Joi.number().integer().min(1).default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number().integer().min(1).default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1'
    })
});

// Validation for user ID param
const userId = Joi.object({
  id: Joi.string().uuid().required()
    .messages({
      'string.empty': 'User ID is required',
      'string.guid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required'
    })
});

// Validation for updating a user
const updateUser = Joi.object({
  firstName: Joi.string().trim().min(2).max(50)
    .messages({
      'string.empty': 'First name cannot be empty',
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters'
    }),
  lastName: Joi.string().trim().min(2).max(50)
    .messages({
      'string.empty': 'Last name cannot be empty',
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
  email: Joi.string().trim().email()
    .messages({
      'string.email': 'Please provide a valid email'
    }),
  role: Joi.string().valid('admin', 'hirer', 'worker', 'staff')
    .messages({
      'any.only': 'Role must be one of admin, hirer, worker, staff'
    }),
  phone: Joi.string().pattern(new RegExp('^(\\+\\d{1,3}[- ]?)?\\d{10}$'))
    .messages({
      'string.pattern.base': 'Phone number must be valid'
    })
})
.min(1)
.messages({
  'object.min': 'At least one field must be provided for update'
});

module.exports = {
  getUsers,
  userId,
  updateUser
}; 