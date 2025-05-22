/**
 * Shared Middleware Index
 * Exports all middleware modules
 */

const authMiddleware = require('./auth.middleware');
const permissionMiddleware = require('./permission.middleware');
const responseMiddleware = require('./response.middleware');

module.exports = {
  // Auth middleware
  authenticate: authMiddleware.authenticate,
  authorize: authMiddleware.authorize,
  verifyActive: authMiddleware.verifyActive,
  requireMFA: authMiddleware.requireMFA,
  
  // Permission middleware
  hasPermission: permissionMiddleware.hasPermission,
  hasRoleLevel: permissionMiddleware.hasRoleLevel,
  isOwner: permissionMiddleware.isOwner,
  
  // Response middleware
  errorHandler: responseMiddleware.errorHandler,
  notFound: responseMiddleware.notFound,
  rateLimitExceeded: responseMiddleware.rateLimitExceeded,
  validationHandler: responseMiddleware.validationHandler
}; 