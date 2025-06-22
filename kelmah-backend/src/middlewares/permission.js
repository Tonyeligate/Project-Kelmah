/**
 * Permission Middleware
 * Provides granular permission-based access control
 */

const { AppError } = require('../utils/errorTypes');
const logger = require('../utils/logger');
const roleUtils = require('../utils/role');

/**
 * Check if the user has the required permission
 * @param {String|Array} requiredPermissions - Required permission(s)
 * @returns {Function} Express middleware
 */
exports.hasPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // Verify user is authenticated
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }
      
      // Convert single permission to array
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      // Admin bypass - admin role has all permissions
      if (req.user.role === 'admin') {
        return next();
      }

      // Get permissions for the user's role
      const userPermissions = roleUtils.getPermissionsForRole(req.user.role);
      
      // Check if user has at least one of the required permissions
      const hasRequired = permissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (!hasRequired) {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      next();
    } catch (error) {
      logger.error('Permission middleware error:', error);
      return next(new AppError('Permission check failed', 500));
    }
  };
};

/**
 * Check if the user has a role with sufficient level
 * @param {String} minRole - Minimum role required
 * @returns {Function} Express middleware
 */
exports.hasRoleLevel = (minRole) => {
  return async (req, res, next) => {
    try {
      // Verify user is authenticated
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }
      
      // Check if user has sufficient role level
      if (!roleUtils.hasRoleLevel(req.user.role, minRole)) {
        return next(new AppError('Insufficient permissions for this operation', 403));
      }

      next();
    } catch (error) {
      logger.error('Role level middleware error:', error);
      return next(new AppError('Role check failed', 500));
    }
  };
};

/**
 * Check if user has ownership of a resource
 * @param {Function} getResourceOwnerId - Function to get resource owner ID from request
 * @param {Boolean} allowAdmin - Whether to allow admin role to bypass check
 * @returns {Function} Express middleware
 */
exports.isOwner = (getResourceOwnerId, allowAdmin = true) => {
  return async (req, res, next) => {
    try {
      // Verify user is authenticated
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      // Admin bypass
      if (allowAdmin && req.user.role === 'admin') {
        return next();
      }

      // Get owner ID using the provided function
      const ownerId = await getResourceOwnerId(req);
      
      // Check if user is owner
      if (ownerId && ownerId.toString() === req.user.id.toString()) {
        return next();
      }

      return next(new AppError('You do not have permission to access this resource', 403));
    } catch (error) {
      logger.error('Ownership middleware error:', error);
      return next(new AppError('Ownership check failed', 500));
    }
  };
};
