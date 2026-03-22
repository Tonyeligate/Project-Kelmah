import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useSelector } from 'react-redux';
import {
  hasRole as userHasRole,
  getRoleHomePath,
} from '../../../../utils/userUtils';
import RouteErrorBoundary from '../../../common/components/RouteErrorBoundary';

/**
 * A route wrapper that redirects unauthenticated users
 * Displays a loading indicator while authentication is being checked
 * Includes built-in error boundary for crash resilience.
 * FIXED: Uses ONLY Redux authentication state to prevent dual state management conflicts
 */
const ProtectedRoute = ({
  isAllowed: isAllowedProp,
  roles,
  redirectPath = '/login',
  children,
  loading = false,
}) => {
  const location = useLocation();
  // Use ONLY Redux auth state - removed dual AuthContext/Redux conflicts
  const { user, isAuthenticated, loading: authLoading } = useSelector((state) => state.auth);

  // Determine if the route is allowed based on roles or directly from prop
  const requiresRoleCheck = Array.isArray(roles) && roles.length > 0;
  const hasRequiredRole = requiresRoleCheck ? userHasRole(user, roles) : true;
  const computedAllowance =
    typeof isAllowedProp === 'boolean'
      ? isAllowedProp
      : isAuthenticated && hasRequiredRole;

  // Show loading indicator while authentication is being checked
  if (loading || authLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect if not authenticated or not authorized
  if (!isAuthenticated) {
    const intendedPath = `${location.pathname || '/'}${location.search || ''}${location.hash || ''}`;
    return (
      <Navigate
        to={redirectPath}
        replace
        state={{
          from: intendedPath,
          redirectTo: intendedPath,
          message: 'Please sign in to continue.',
        }}
      />
    );
  }

  if (!computedAllowance) {
    const intendedPath = `${location.pathname || '/'}${location.search || ''}${location.hash || ''}`;
    return (
      <Navigate
        to={getRoleHomePath(user)}
        replace
        state={{
          from: intendedPath,
          redirectTo: intendedPath,
          message: 'You do not have access to that page.',
        }}
      />
    );
  }

  // Render the protected content with automatic error boundary
  return (
    <RouteErrorBoundary label={location.pathname}>
      {children}
    </RouteErrorBoundary>
  );
};

ProtectedRoute.propTypes = {
  isAllowed: PropTypes.bool,
  roles: PropTypes.arrayOf(PropTypes.string),
  redirectPath: PropTypes.string,
  children: PropTypes.node.isRequired,
  loading: PropTypes.bool,
};

export default ProtectedRoute;
