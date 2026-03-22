const AUTH_BLOCKED_PREFIXES = ['/login', '/register', '/forgot-password', '/reset-password'];

export const getDefaultRouteByRole = (role) => {
  if (role === 'worker') return '/worker/dashboard';
  if (role === 'hirer') return '/hirer/dashboard';
  if (role === 'admin') return '/admin/skills-management';
  return '/dashboard';
};

export const normalizeRequestedPath = (candidate) => {
  if (typeof candidate !== 'string') {
    return null;
  }

  const requestedPath = candidate.trim();
  if (!requestedPath.startsWith('/')) {
    return null;
  }

  // Prevent protocol-relative and malformed external redirects.
  if (requestedPath.startsWith('//')) {
    return null;
  }

  const lower = requestedPath.toLowerCase();
  const isBlocked = AUTH_BLOCKED_PREFIXES.some((prefix) =>
    lower.startsWith(prefix),
  );

  return isBlocked ? null : requestedPath;
};

export const getRequestedPathFromLocation = (location) => {
  const queryFrom = new URLSearchParams(location?.search || '').get('from');
  const stateFrom = location?.state?.from;
  const stateRedirectTo = location?.state?.redirectTo;

  return (
    normalizeRequestedPath(stateFrom) ||
    normalizeRequestedPath(stateRedirectTo) ||
    normalizeRequestedPath(queryFrom) ||
    null
  );
};

export const resolveLoginRedirectPath = ({ location, user }) => {
  const requestedPath = getRequestedPathFromLocation(location);
  return requestedPath || getDefaultRouteByRole(user?.role);
};
