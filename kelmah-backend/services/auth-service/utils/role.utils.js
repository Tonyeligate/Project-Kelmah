/**
 * Role Utilities
 * Handles role-based permissions and access control
 */

const { logger } = require('./logger');

// Define all available roles
const ROLES = {
  ADMIN: 'admin',
  WORKER: 'worker',
  HIRER: 'hirer'
};

// Define permissions for each role
const PERMISSIONS = {
  // Admin permissions
  [ROLES.ADMIN]: [
    'user:read',
    'user:write',
    'user:delete',
    'role:read',
    'role:write',
    'job:read',
    'job:write',
    'job:delete',
    'payment:read',
    'payment:write',
    'payment:refund',
    'platform:settings',
    'reports:view',
    'admin:dashboard'
  ],
  
  // Worker permissions
  [ROLES.WORKER]: [
    'profile:read',
    'profile:write',
    'job:apply',
    'job:view',
    'message:read',
    'message:write',
    'payment:receive',
    'payment:withdraw',
    'review:read',
    'review:write',
    'contract:view',
    'contract:sign'
  ],
  
  // Hirer permissions
  [ROLES.HIRER]: [
    'profile:read',
    'profile:write',
    'job:create',
    'job:edit',
    'job:delete',
    'worker:search',
    'worker:view',
    'payment:send',
    'payment:escrow',
    'message:read',
    'message:write',
    'review:read',
    'review:write',
    'contract:create',
    'contract:sign'
  ]
};

/**
 * Get all permissions for a specific role
 * @param {String} role - Role to get permissions for
 * @returns {Array} Array of permissions
 */
const getPermissionsForRole = (role) => {
  if (!ROLES[role.toUpperCase()] || !PERMISSIONS[role]) {
    logger.warn(`Attempted to get permissions for unknown role: ${role}`);
    return [];
  }
  
  return PERMISSIONS[role];
};

/**
 * Check if a role has a specific permission
 * @param {String} role - Role to check
 * @param {String} permission - Permission to check
 * @returns {Boolean} Whether the role has the permission
 */
const hasPermission = (role, permission) => {
  if (!ROLES[role.toUpperCase()] || !PERMISSIONS[role]) {
    logger.warn(`Attempted to check permissions for unknown role: ${role}`);
    return false;
  }
  
  return PERMISSIONS[role].includes(permission);
};

/**
 * Get role hierarchy level (for comparing roles)
 * @param {String} role - Role to get level for
 * @returns {Number} Role level (higher = more authority)
 */
const getRoleLevel = (role) => {
  switch (role) {
    case ROLES.ADMIN:
      return 100;
    case ROLES.HIRER:
      return 50;
    case ROLES.WORKER:
      return 10;
    default:
      return 0;
  }
};

/**
 * Check if a user has sufficient role level
 * @param {String} userRole - User's role
 * @param {String} requiredRole - Required role
 * @returns {Boolean} Whether user has sufficient role
 */
const hasRoleLevel = (userRole, requiredRole) => {
  const userLevel = getRoleLevel(userRole);
  const requiredLevel = getRoleLevel(requiredRole);
  
  return userLevel >= requiredLevel;
};

module.exports = {
  ROLES,
  PERMISSIONS,
  getPermissionsForRole,
  hasPermission,
  getRoleLevel,
  hasRoleLevel
}; 