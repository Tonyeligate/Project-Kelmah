import React from 'react';
import Login from '../components/login/Login';
import AuthWrapper from '../components/common/AuthWrapper';
import MobileLogin from '../components/mobile/MobileLogin';
import { useLocation } from 'react-router-dom';
import { Alert, useMediaQuery } from '@mui/material';

const LoginPage = () => {
  const location = useLocation();
  const registered = location.state?.registered;
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Render clean mobile view without AuthWrapper
  if (isMobile) {
    return <MobileLogin registrationSuccess={registered} />;
  }

  // Desktop view with AuthWrapper
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
