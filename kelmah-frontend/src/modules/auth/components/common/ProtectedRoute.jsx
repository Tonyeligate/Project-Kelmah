import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { setOAuthLogin } from '../../services/authSlice';
import { useAuth } from '../../contexts/AuthContext';

/**
 * A route wrapper that redirects unauthenticated users
 * Displays a loading indicator while authentication is being checked
 */
const ProtectedRoute = ({
  isAllowed: isAllowedProp,
  roles,
  redirectPath = '/login',
  children,
  loading = false,
}) => {
  const dispatch = useDispatch();
  // Prefer AuthContext when available to avoid Redux/AuthContext conflicts
  let ctxUser = null;
  let ctxIsAuthenticated = false;
  try {
    const auth = useAuth();
    ctxUser = auth?.user || null;
    ctxIsAuthenticated = typeof auth?.isAuthenticated === 'function' ? auth.isAuthenticated() : !!auth?.user;
  } catch (_) {
    // Context not available; fallback to Redux below
  }

  const { user: reduxUser, isAuthenticated: reduxIsAuthenticated } = useSelector((state) => state.auth);
  const user = ctxUser || reduxUser;
  const isAuthenticated = ctxIsAuthenticated || reduxIsAuthenticated;

  // Determine if the route is allowed based on roles or directly from prop
  const isAllowed = Array.isArray(roles)
    ? isAuthenticated && user && roles.includes(user.role)
    : (typeof isAllowedProp === 'boolean' ? isAllowedProp : isAuthenticated);

  // Show loading indicator while authentication is being checked
  if (loading) {
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
  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />;
  }

  // Render the protected content
  return children;
};

ProtectedRoute.propTypes = {
  isAllowed: PropTypes.bool,
  roles: PropTypes.arrayOf(PropTypes.string),
  redirectPath: PropTypes.string,
  children: PropTypes.node.isRequired,
  loading: PropTypes.bool,
};

export default ProtectedRoute;
