import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { verifyAuth, selectAuthLoading } from '../../store/slices/authSlice';
import { CircularProgress, Box } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * AuthWrapper component
 * Used to validate authentication on app mount
 * Shows loading indicator while checking auth status
 */
const AuthWrapper = ({ children }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectAuthLoading);
  
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        await dispatch(verifyAuth());
      }
    };
    
    checkAuth();
  }, [dispatch]);
  
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
  
  return <>{children}</>;
};

AuthWrapper.propTypes = {
  children: PropTypes.node.isRequired
};

export default AuthWrapper; 