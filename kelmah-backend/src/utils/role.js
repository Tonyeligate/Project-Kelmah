/**
 * Role Utility
 * Provides functions for role-based access control
 */

// Role hierarchy and levels
const roleHierarchy = {
  admin: 100,
  manager: 80,
  hirer: 30,
  worker: 20,
  user: 10
};

// Default permissions for each role
const rolePermissions = {
  admin: [
    // Admin has all permissions
    'admin:all',
    
    // User management
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    
    // Job management
    'jobs:read',
    'jobs:create',
    'jobs:update',
    'jobs:delete',
    
    // Contract management
    'contracts:read',
    'contracts:create',
    'contracts:update',
    'contracts:delete',
    
    // Payment management
    'payments:read',
    'payments:create',
    'payments:update',
    'payments:delete',
    
    // Settings
    'settings:read',
    'settings:update'
  ],
  
  manager: [
    // User management (limited)
    'users:read',
    'users:update',
    
    // Job management
    'jobs:read',
    'jobs:create',
    'jobs:update',
    'jobs:delete',
    
    // Contract management
    'contracts:read',
    'contracts:create',
    'contracts:update',
    
    // Payment management
    'payments:read',
    'payments:create',
    
    // Settings
    'settings:read',
    'settings:update'
  ],
  
  hirer: [
    // Limited permissions
    'users:read',
    'profile:read',
    'profile:update',
    
    // Job management (own)
    'jobs:read',
    'jobs:create',
    'jobs:update:own',
    
    // Contract management (own)
    'contracts:read:own',
    'contracts:create:own',
    'contracts:update:own',
    
    // Payment management (own)
    'payments:read:own',
    'payments:create:own',
    
    // Settings (own)
    'settings:read:own',
    'settings:update:own'
  ],
  
  worker: [
    // Limited permissions
    'users:read',
    'profile:read',
    'profile:update',
    
    // Job management
    'jobs:read',
    
    // Contract management (own)
    'contracts:read:own',
    'contracts:update:own',
    
    // Payment management (own)
    'payments:read:own',
    
    // Settings (own)
    'settings:read:own',
    'settings:update:own'
  ],
  
  user: [
    // Basic permissions
    'profile:read',
    'profile:update',
    'settings:read:own',
    'settings:update:own'
  ]
};

/**
 * Check if a role has a minimum required level
 * @param {string} role - User role
 * @param {string} requiredRole - Minimum required role
 * @returns {boolean} True if user role meets or exceeds required role
 */
exports.hasRoleLevel = (role, requiredRole) => {
  const userLevel = roleHierarchy[role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 999;
  
  return userLevel >= requiredLevel;
};

/**
 * Get permissions for a specific role
 * @param {string} role - User role
 * @returns {Array} Array of permissions for the role
 */
exports.getPermissionsForRole = (role) => {
  return rolePermissions[role] || [];
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} True if role has permission
 */
exports.hasPermission = (role, permission) => {
  const permissions = exports.getPermissionsForRole(role);
  
  // Admin has all permissions
  if (role === 'admin' || permissions.includes('admin:all')) {
    return true;
  }
  
  return permissions.includes(permission);
};

/**
 * Get all available roles
 * @returns {Array} Array of role names
 */
exports.getRoles = () => {
  return Object.keys(roleHierarchy);
};

/**
 * Get role level
 * @param {string} role - User role
 * @returns {number} Role level
 */
exports.getRoleLevel = (role) => {
  return roleHierarchy[role] || 0;
};
