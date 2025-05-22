import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, CircularProgress, Typography } from '@mui/material';
import { setOAuthLogin } from '../../store/slices/authSlice';

/**
 * OAuthCallback - Handles OAuth redirects and sets up user session
 */
const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Get tokens from URL parameters
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const refreshToken = params.get('refreshToken');
        const error = params.get('error');
        
        if (error) {
          console.error('OAuth error:', error);
          navigate('/login', { state: { error: 'Authentication failed. Please try again.' } });
          return;
        }
        
        if (!token || !refreshToken) {
          console.error('Missing tokens in OAuth callback');
          navigate('/login', { state: { error: 'Authentication failed. Please try again.' } });
          return;
        }
        
        // Store refresh token in localStorage
        localStorage.setItem('refreshToken', refreshToken);
        
        // Get user info from token (JWT)
        const userInfo = parseJwt(token);
        
        // Set user in Redux store using the proper action
        dispatch(setOAuthLogin({
          user: {
            id: userInfo.id,
            email: userInfo.email,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            role: userInfo.role
          },
          token: token
        }));
        
        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
        navigate('/login', { state: { error: 'Authentication failed. Please try again.' } });
      }
    };
    
    processOAuthCallback();
  }, [dispatch, location, navigate]);
  
  // Helper function to parse JWT token
  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return {};
    }
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 3
      }}
    >
      <CircularProgress size={60} thickness={4} />
      <Typography variant="h6" sx={{ mt: 4 }}>
        Completing login...
      </Typography>
    </Box>
  );
};

export default OAuthCallback; 