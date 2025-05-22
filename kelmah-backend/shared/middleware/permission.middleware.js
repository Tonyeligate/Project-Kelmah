/**
 * Permission Middleware
 * Provides granular permission-based access control
 */

const { response } = require('../utils/response');

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
        return response.error(res, 401, 'Authentication required');
      }
      
      // Convert single permission to array
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      // If user has no permissions field, we need to get them
      if (!req.user.permissions) {
        try {
          // Load role utilities (dynamically to avoid circular dependencies)
          const roleUtils = require('../../services/auth-service/utils/role.utils');
          
          // Get permissions for the user's role
          req.user.permissions = roleUtils.getPermissionsForRole(req.user.role);
        } catch (error) {
          console.error('Failed to load permissions:', error);
          return response.error(res, 500, 'Error checking permissions');
        }
      }

      // Admin bypass - admin role has all permissions
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user has at least one of the required permissions
      const hasRequired = permissions.some(permission => 
        req.user.permissions.includes(permission)
      );

      if (!hasRequired) {
        return response.error(res, 403, 'You do not have permission to perform this action');
      }

      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      return response.error(res, 500, 'Permission check failed');
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
        return response.error(res, 401, 'Authentication required');
      }

      // Load role utilities
      const roleUtils = require('../../services/auth-service/utils/role.utils');
      
      // Check if user has sufficient role level
      if (!roleUtils.hasRoleLevel(req.user.role, minRole)) {
        return response.error(res, 403, 'Insufficient permissions for this operation');
      }

      next();
    } catch (error) {
      console.error('Role level middleware error:', error);
      return response.error(res, 500, 'Role check failed');
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
        return response.error(res, 401, 'Authentication required');
      }

      // Admin bypass
      if (allowAdmin && req.user.role === 'admin') {
        return next();
      }

      // Get owner ID using the provided function
      const ownerId = await getResourceOwnerId(req);
      
      // Check if user is owner
      if (ownerId && ownerId === req.user.id) {
        return next();
      }

      return response.error(res, 403, 'You do not have permission to access this resource');
    } catch (error) {
      console.error('Ownership middleware error:', error);
      return response.error(res, 500, 'Ownership check failed');
    }
  };
}; 