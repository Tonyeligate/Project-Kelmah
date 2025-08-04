/**
 * User Service Helper Functions
 * Common utilities for validation and error handling
 */

/**
 * Validate input data against required fields
 * @param {Object} data - Input data to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Validation result
 */
const validateInput = (data, requiredFields = []) => {
  const errors = [];

  // Check required fields
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`${field} is required`);
    }
  });

  // Validate email format if present
  if (data.email && !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  // Validate phone format if present
  if (data.phone && !isValidPhone(data.phone)) {
    errors.push('Invalid phone number format');
  }

  // Validate hourly rate if present
  if (data.hourlyRate !== undefined) {
    const rate = parseFloat(data.hourlyRate);
    if (isNaN(rate) || rate < 0 || rate > 10000) {
      errors.push('Hourly rate must be between 0 and 10000');
    }
  }

  // Validate rating if present
  if (data.rating !== undefined) {
    const rating = parseFloat(data.rating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      errors.push('Rating must be between 0 and 5');
    }
  }

  // Validate coordinates if present
  if (data.latitude !== undefined) {
    const lat = parseFloat(data.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push('Latitude must be between -90 and 90');
    }
  }

  if (data.longitude !== undefined) {
    const lng = parseFloat(data.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push('Longitude must be between -180 and 180');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
const isValidPhone = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Check if it's a valid length (7-15 digits)
  return cleaned.length >= 7 && cleaned.length <= 15;
};

/**
 * Handle service errors consistently
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} defaultMessage - Default error message
 */
const handleServiceError = (res, error, defaultMessage = 'Service error occurred') => {
  console.error('Service error:', error);

  // Database errors
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors.map(err => err.message)
    });
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      field: error.errors[0]?.path
    });
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference to related resource'
    });
  }

  // Custom errors
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message || defaultMessage,
      code: error.code
    });
  }

  // Default server error
  return res.status(500).json({
    success: false,
    message: defaultMessage,
    code: 'INTERNAL_SERVER_ERROR'
  });
};

/**
 * Sanitize output data by removing sensitive fields
 * @param {Object} data - Data to sanitize
 * @param {Array} sensitiveFields - Fields to remove
 * @returns {Object} Sanitized data
 */
const sanitizeOutput = (data, sensitiveFields = ['password', 'tokenVersion']) => {
  if (!data) return data;

  const sanitized = { ...data };
  sensitiveFields.forEach(field => {
    delete sanitized[field];
  });

  return sanitized;
};

/**
 * Generate pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Pagination metadata
 */
const generatePagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null
  };
};

/**
 * Format search results for consistent API response
 * @param {Array} results - Search results
 * @param {Object} params - Search parameters
 * @param {Object} pagination - Pagination info
 * @returns {Object} Formatted response
 */
const formatSearchResults = (results, params, pagination) => {
  return {
    results,
    count: results.length,
    searchParams: params,
    pagination,
    suggestions: generateSearchSuggestions(params, results)
  };
};

/**
 * Generate search suggestions based on results
 * @param {Object} params - Search parameters
 * @param {Array} results - Search results
 * @returns {Array} Search suggestions
 */
const generateSearchSuggestions = (params, results) => {
  const suggestions = [];

  // If no results, suggest related terms
  if (results.length === 0 && params.query) {
    // This would integrate with a search suggestions service
    suggestions.push(`Try searching for "${params.query}" in a different location`);
    suggestions.push('Consider broadening your search criteria');
  }

  // If few results, suggest related skills or locations
  if (results.length < 5 && results.length > 0) {
    const locations = [...new Set(results.map(r => r.location).filter(Boolean))];
    const skills = [...new Set(results.flatMap(r => r.skills || []))];

    if (locations.length > 0) {
      suggestions.push(`Also try: ${locations.slice(0, 3).join(', ')}`);
    }

    if (skills.length > 0) {
      suggestions.push(`Related skills: ${skills.slice(0, 5).join(', ')}`);
    }
  }

  return suggestions;
};

/**
 * Calculate distance between two geographic points
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 100) / 100;
};

/**
 * Generate slug from text
 * @param {string} text - Text to convert to slug
 * @returns {string} URL-friendly slug
 */
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

/**
 * Validate file upload data
 * @param {Object} file - File object
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    maxFiles = 10
  } = options;

  const errors = [];

  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
  }

  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Check filename
  if (!file.originalname || file.originalname.length > 255) {
    errors.push('Invalid filename');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Parse and validate query parameters
 * @param {Object} query - Request query parameters
 * @param {Object} schema - Parameter schema
 * @returns {Object} Parsed and validated parameters
 */
const parseQueryParams = (query, schema = {}) => {
  const parsed = {};
  const errors = [];

  Object.keys(schema).forEach(key => {
    const value = query[key];
    const config = schema[key];

    if (config.required && !value) {
      errors.push(`${key} is required`);
      return;
    }

    if (value) {
      switch (config.type) {
        case 'number':
          const num = parseFloat(value);
          if (isNaN(num)) {
            errors.push(`${key} must be a number`);
          } else if (config.min !== undefined && num < config.min) {
            errors.push(`${key} must be at least ${config.min}`);
          } else if (config.max !== undefined && num > config.max) {
            errors.push(`${key} must be at most ${config.max}`);
          } else {
            parsed[key] = num;
          }
          break;

        case 'boolean':
          parsed[key] = value === 'true' || value === '1';
          break;

        case 'array':
          parsed[key] = value.split(',').map(item => item.trim());
          break;

        case 'string':
        default:
          if (config.minLength && value.length < config.minLength) {
            errors.push(`${key} must be at least ${config.minLength} characters`);
          } else if (config.maxLength && value.length > config.maxLength) {
            errors.push(`${key} must be at most ${config.maxLength} characters`);
          } else {
            parsed[key] = value.trim();
          }
          break;
      }
    } else if (config.default !== undefined) {
      parsed[key] = config.default;
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    data: parsed
  };
};

module.exports = {
  validateInput,
  isValidEmail,
  isValidPhone,
  handleServiceError,
  sanitizeOutput,
  generatePagination,
  formatSearchResults,
  generateSearchSuggestions,
  calculateDistance,
  generateSlug,
  validateFileUpload,
  parseQueryParams
};