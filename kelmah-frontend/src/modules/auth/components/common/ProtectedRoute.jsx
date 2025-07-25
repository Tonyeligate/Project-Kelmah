import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { setOAuthLogin } from '../../services/authSlice';

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
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  // Determine if the route is allowed based on roles or directly from prop
  const isAllowed = Array.isArray(roles)
    ? isAuthenticated && user && roles.includes(user.role)
    : isAllowedProp;

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
    // In development, simulate a one-time mock login without reloading the page
    if (
      import.meta.env.DEV &&
      import.meta.env.VITE_BYPASS_AUTH === 'true' &&
      !localStorage.getItem('mock_user_set')
    ) {
      console.log('Development mode: Simulating mock login without reload');
      const mockUser = {
        id: 'dev-user-123',
        email: 'dev@example.com',
        firstName: 'Dev',
        lastName: 'User',
        role: 'worker',
        name: 'Dev User',
      };
      const mockToken = 'dev-mock-token-123';
      dispatch(setOAuthLogin({ user: mockUser, token: mockToken }));
      localStorage.setItem('mock_user_set', 'true');
      // Render protected content immediately after setting mock auth
      return children;
    }
    // Redirect unauthorized users
    return <Navigate to={redirectPath} replace />;
  }

  // Render the protected content
  return children;
};

ProtectedRoute.propTypes = {
  isAllowed: PropTypes.bool.isRequired,
  roles: PropTypes.arrayOf(PropTypes.string),
  redirectPath: PropTypes.string,
  children: PropTypes.node.isRequired,
  loading: PropTypes.bool,
};

export default ProtectedRoute;
