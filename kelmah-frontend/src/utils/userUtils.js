/**
 * User Data Normalization Utility
 *
 * Provides standardized user data access patterns across the entire application
 * to eliminate inconsistencies and prevent undefined access errors.
 */

const normalizeRoleValue = (role) => {
  if (role === undefined || role === null) {
    return null;
  }

  const value = String(role).trim();
  if (!value) {
    return null;
  }

  return value.toLowerCase();
};

export const getUserRoles = (rawUser) => {
  if (!rawUser) {
    return [];
  }

  const collected = [];
  const addRole = (role) => {
    const normalized = normalizeRoleValue(role);
    if (normalized) {
      collected.push(normalized);
    }
  };

  addRole(rawUser.role);
  addRole(rawUser.userType);
  addRole(rawUser.userRole);

  if (Array.isArray(rawUser.roles)) {
    rawUser.roles.forEach(addRole);
  }

  if (rawUser._raw) {
    addRole(rawUser._raw.role);
    addRole(rawUser._raw.userType);
    addRole(rawUser._raw.userRole);
    if (Array.isArray(rawUser._raw.roles)) {
      rawUser._raw.roles.forEach(addRole);
    }
  }

  return [...new Set(collected)];
};

/**
 * Normalize user data from various sources into a consistent structure
 * @param {Object} rawUser - Raw user data from API/Redux/Context
 * @returns {Object} Normalized user object with consistent structure
 */
export const normalizeUser = (rawUser) => {
  if (!rawUser) return null;
  // Already normalized — return as-is to prevent _raw nesting chains
  if (rawUser.__isNormalized) return rawUser;

  const splitName = rawUser.name?.split(' ') ?? [];
  const normalizedRoles = getUserRoles(rawUser);
  const primaryRole = normalizedRoles[0] || 'user';
  const displayRole =
    rawUser.role ||
    rawUser.userType ||
    rawUser.userRole ||
    (Array.isArray(rawUser.roles) && rawUser.roles.length > 0
      ? rawUser.roles[0]
      : primaryRole);

  return {
    // Primary identification
    id: rawUser.id || rawUser._id || rawUser.userId || null,
    email: rawUser.email || null,

    // Name fields
    firstName: rawUser.firstName || rawUser.first_name || splitName[0] || '',
    lastName: rawUser.lastName || rawUser.last_name || splitName[1] || '',
    fullName: getFullName(rawUser),
    displayName: getDisplayName(rawUser),

    // Role and permissions
    role: primaryRole,
    roleDisplay: displayRole,
    roles: normalizedRoles,
    permissions: rawUser.permissions || [],

    // Profile information
    profileImage:
      rawUser.profileImage || rawUser.avatar || rawUser.profilePicture || null,
    bio: rawUser.bio || rawUser.description || '',
    location: rawUser.location || rawUser.address || '',
    phone: rawUser.phone || rawUser.phoneNumber || '',

    // Status and verification
    isVerified: Boolean(
      rawUser.isVerified || rawUser.verified || rawUser.emailVerified,
    ),
    isActive: Boolean(rawUser.isActive !== false),
    isOnline: Boolean(rawUser.isOnline),

    // Professional information
    company: rawUser.company || rawUser.companyName || '',
    jobTitle: rawUser.jobTitle || rawUser.title || '',
    skills: Array.isArray(rawUser.skills) ? rawUser.skills : [],
    experience: rawUser.experience || 'entry',

    // Settings and preferences
    preferences: rawUser.preferences || {},
    settings: rawUser.settings || {},

    // Timestamps
    createdAt:
      rawUser.createdAt || rawUser.joinedAt || rawUser.created_at || null,
    updatedAt: rawUser.updatedAt || rawUser.updated_at || null,
    lastLoginAt: rawUser.lastLoginAt || rawUser.last_login_at || null,

    // Security
    isTwoFactorEnabled: Boolean(
      rawUser.isTwoFactorEnabled || rawUser.mfaEnabled,
    ),

    // Flags + raw data for downstream consumers
    __isNormalized: true,
    _raw: rawUser,
  };
};

/**
 * Get user's full name with fallbacks
 * @param {Object} user - User data object
 * @returns {string} Full name or fallback
 */
export const getFullName = (user) => {
  if (!user) return 'User';

  const firstName = user.firstName || user.first_name || '';
  const lastName = user.lastName || user.last_name || '';

  if (firstName && lastName) {
    return `${firstName} ${lastName}`.trim();
  }

  if (user.name) return user.name;
  if (firstName) return firstName;
  if (user.email) return user.email.split('@')[0];

  return 'User';
};

/**
 * Get user's display name (shorter version for UI)
 * @param {Object} user - User data object
 * @returns {string} Display name
 */
export const getDisplayName = (user) => {
  if (!user) return 'User';

  const firstName = user.firstName || user.first_name || '';
  if (firstName) return firstName;

  if (user.name) {
    const nameParts = user.name.split(' ');
    return nameParts[0];
  }

  if (user.email) return user.email.split('@')[0];

  return 'User';
};

/**
 * Check if user has a specific role
 * @param {Object} user - User data object
 * @param {string|string[]} roles - Role(s) to check
 * @returns {boolean} Whether user has the role(s)
 */
export const hasRole = (user, roles) => {
  if (!user || !roles) return false;

  const userRoles = getUserRoles(user);
  if (!userRoles.length && user._raw) {
    userRoles.push(...getUserRoles(user._raw));
  }

  if (!userRoles.length) {
    return false;
  }

  const rolesToMatch = (Array.isArray(roles) ? roles : [roles])
    .map((role) => normalizeRoleValue(role))
    .filter(Boolean);

  if (!rolesToMatch.length) {
    return false;
  }

  return rolesToMatch.some((role) => userRoles.includes(role));
};

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User data object
 * @param {string|string[]} permissions - Permission(s) to check
 * @returns {boolean} Whether user has the permission(s)
 */
export const hasPermission = (user, permissions) => {
  if (!user || !user.permissions) return false;

  const userPerms = user.permissions.map((p) => p.toLowerCase());

  if (Array.isArray(permissions)) {
    return permissions.some((permission) =>
      userPerms.includes(permission.toLowerCase()),
    );
  }

  return userPerms.includes(permissions.toLowerCase());
};

/**
 * Get user's initials for avatars
 * @param {Object} user - User data object
 * @returns {string} User initials
 */
export const getUserInitials = (user) => {
  if (!user) return 'U';

  const firstName = user.firstName || user.first_name || '';
  const lastName = user.lastName || user.last_name || '';

  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  if (firstName) return firstName[0].toUpperCase();

  if (user.name) {
    const nameParts = user.name.split(' ').filter((part) => part.length > 0);
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  }

  if (user.email) return user.email[0].toUpperCase();

  return 'U';
};

/**
 * Check if user profile is complete (for profile completion indicators)
 * @param {Object} user - User data object
 * @returns {Object} Profile completion status
 */
const mergeProfileSources = (user, profile) => {
  if (!user && !profile) {
    return null;
  }

  const normalizedUser = user ? normalizeUser(user) : null;
  const normalizedProfile = profile
    ? profile.__isNormalized
      ? profile
      : normalizeUser(profile)
    : null;

  const combined = {
    ...(normalizedUser?._raw || {}),
    ...normalizedUser,
  };

  if (normalizedProfile) {
    Object.assign(combined, normalizedProfile._raw || {}, normalizedProfile);
  }

  return combined;
};

const hasMeaningfulValue = (value) => {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }

  return Boolean(value);
};

export const getProfileCompletion = (user, profile = null) => {
  const mergedSource = mergeProfileSources(user, profile);
  if (!mergedSource) return { percentage: 0, missing: [] };

  const requiredFields = ['firstName', 'lastName', 'email'];
  const optionalFields = ['bio', 'location', 'phone', 'profileImage'];
  const skillsFields = ['skills', 'experience'];

  let completed = 0;
  const missing = [];
  const total =
    requiredFields.length + optionalFields.length + skillsFields.length;

  requiredFields.forEach((field) => {
    if (hasMeaningfulValue(mergedSource[field])) {
      completed += 1;
    } else {
      missing.push(field);
    }
  });

  optionalFields.forEach((field) => {
    const value = mergedSource[field];
    if (hasMeaningfulValue(value)) {
      completed += 1;
    } else {
      missing.push(field);
    }
  });

  if (
    mergedSource.skills &&
    Array.isArray(mergedSource.skills) &&
    mergedSource.skills.length > 0
  ) {
    completed += 1;
  } else {
    missing.push('skills');
  }

  if (
    mergedSource.experience &&
    typeof mergedSource.experience === 'string' &&
    mergedSource.experience !== 'entry'
  ) {
    completed += 1;
  } else if (
    mergedSource.experience &&
    typeof mergedSource.experience === 'object' &&
    Object.keys(mergedSource.experience).length > 0
  ) {
    completed += 1;
  } else {
    missing.push('experience');
  }

  return {
    percentage: Math.round((completed / total) * 100),
    missing,
    completed,
    total,
  };
};

/**
 * Safe user data getter with default values
 * @param {Object} user - User data object
 * @param {string} path - Dot notation path (e.g., 'preferences.notifications.email')
 * @param {*} defaultValue - Default value if path doesn't exist
 * @returns {*} Value at path or default value
 */
export const getUserData = (user, path, defaultValue = null) => {
  if (!user || !path) return defaultValue;

  const pathParts = path.split('.');
  let current = user;

  for (const part of pathParts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return defaultValue;
    }
  }

  return current;
};

/**
 * Format user role for display
 * @param {Object} user - User data object
 * @returns {string} Formatted role name
 */
export const formatUserRole = (user) => {
  if (!user) return 'User';

  const role = user.role || user.userType || user.userRole || 'user';

  switch (role.toLowerCase()) {
    case 'admin':
      return 'Administrator';
    case 'hirer':
      return 'Hirer';
    case 'worker':
      return 'Worker';
    case 'moderator':
      return 'Moderator';
    default:
      return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }
};

export default {
  normalizeUser,
  getFullName,
  getDisplayName,
  getUserRoles,
  hasRole,
  hasPermission,
  getUserInitials,
  getProfileCompletion,
  getUserData,
  formatUserRole,
};
