/**
 * Validation Middleware
 * Handles validation of request data using express-validator
 */

const { validationResult } = require('express-validator');
const AppError = require('../utils/app-error');
const logger = require('../utils/logger');

/**
 * Validate request against express-validator rules
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    logger.warn(`Validation error: ${errorMessages.join(', ')}`);
    
    return next(new AppError(errorMessages.join(', '), 400));
  }
  
  next();
}; 