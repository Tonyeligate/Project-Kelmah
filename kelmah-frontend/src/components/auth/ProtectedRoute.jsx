import React from 'react';
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { CircularProgress, Box } from '@mui/material';

/**
 * ProtectedRoute component
 * A wrapper for routes that require authentication
 * Redirects to login if not authenticated
 */
const ProtectedRoute = ({ isAllowed, redirectPath, loading, children }) => {
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  isAllowed: PropTypes.bool.isRequired,
  redirectPath: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  children: PropTypes.node.isRequired
};

ProtectedRoute.defaultProps = {
  loading: false
};

export default ProtectedRoute; 