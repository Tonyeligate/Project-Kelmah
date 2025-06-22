/**
 * Request Validation Middleware
 * Validates request data using Joi schema
 */

const { AppError } = require('./error');

/**
 * Validate request data against a Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {String} property - Request property to validate (body, params, query)
 * @returns {Function} - Express middleware function
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });
    
    if (!error) {
      return next();
    }
    
    // Format validation errors
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    // Create error response
    const errorResponse = {
      success: false,
      message: 'Validation error',
      errors
    };
    
    res.status(400).json(errorResponse);
  };
};

module.exports = { validate }; 