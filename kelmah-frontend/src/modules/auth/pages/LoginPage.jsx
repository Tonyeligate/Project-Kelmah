import React from 'react';
import Login from '../components/login/Login';
import AuthWrapper from '../components/common/AuthWrapper';
import { useLocation } from 'react-router-dom';
import { Alert } from '@mui/material';

const LoginPage = () => {
  const location = useLocation();
  const registered = location.state?.registered;
  return (
    <AuthWrapper>
      {registered && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Registration successful! Please check your email to verify your
          account.
        </Alert>
      )}
      <Login />
    </AuthWrapper>
  );
};

export default LoginPage;
