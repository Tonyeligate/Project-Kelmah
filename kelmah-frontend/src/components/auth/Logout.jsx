import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { logoutUser } from '../../store/slices/authSlice';
import LogoutIcon from '@mui/icons-material/Logout';

/**
 * Logout component
 * Displays a logout button that when clicked, logs the user out and redirects to home
 */
const Logout = ({ variant = "text", color = "secondary", fullWidth = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if the API call fails, we still want to clear local state and redirect
      navigate('/', { replace: true });
    }
  };

  return (
    <Button
      variant={variant}
      color={color}
      onClick={handleLogout}
      fullWidth={fullWidth}
      startIcon={<LogoutIcon />}
    >
      Logout
    </Button>
  );
};

export default Logout; 