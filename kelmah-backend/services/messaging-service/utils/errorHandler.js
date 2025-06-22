// Error handler utility
exports.handleError = (res, error) => {
  console.error('Error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format',
      error: error.message
    });
  }

  if (error.code === 11000) {
    return res.status(400).json({
      message: 'Duplicate entry',
      error: error.message
    });
  }

  // Default error response
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
};

// Custom error class for service-specific errors
class MessagingServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'MessagingServiceError';
    this.statusCode = statusCode;
  }
}

exports.MessagingServiceError = MessagingServiceError;

// Error types
exports.ErrorTypes = {
  CONVERSATION_NOT_FOUND: 'Conversation not found',
  MESSAGE_NOT_FOUND: 'Message not found',
  NOTIFICATION_NOT_FOUND: 'Notification not found',
  UNAUTHORIZED: 'Not authorized to perform this action',
  INVALID_INPUT: 'Invalid input provided',
  DUPLICATE_ENTRY: 'Duplicate entry found'
}; 