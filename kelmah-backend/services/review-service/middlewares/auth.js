const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../utils/errors');
const config = require('../config');

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication invalid');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    req.user = {
      id: payload.userId,
      role: payload.role,
      email: payload.email
    };
    next();
  } catch (error) {
    throw new UnauthorizedError('Authentication invalid');
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new UnauthorizedError('Unauthorized to access this route');
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizeRoles
};
