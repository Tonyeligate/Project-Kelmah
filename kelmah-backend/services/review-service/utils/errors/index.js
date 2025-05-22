const { StatusCodes } = require('http-status-codes');

class CustomAPIError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends CustomAPIError {
  constructor(message) {
    super(message || 'Bad request');
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

class NotFoundError extends CustomAPIError {
  constructor(message) {
    super(message || 'Resource not found');
    this.statusCode = StatusCodes.NOT_FOUND;
  }
}

class UnauthorizedError extends CustomAPIError {
  constructor(message) {
    super(message || 'Unauthorized access');
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

class ForbiddenError extends CustomAPIError {
  constructor(message) {
    super(message || 'Forbidden access');
    this.statusCode = StatusCodes.FORBIDDEN;
  }
}

class InternalServerError extends CustomAPIError {
  constructor(message) {
    super(message || 'Internal server error');
    this.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  }
}

module.exports = {
  CustomAPIError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  InternalServerError
};
