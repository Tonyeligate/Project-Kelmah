import React, { useEffect } from 'react';
import Login from '../components/login/Login';
import AuthWrapper from '../components/common/AuthWrapper';
import MobileLogin from '../components/mobile/MobileLogin';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useBreakpointDown } from '@/hooks/useResponsive';

const LoginPage = () => {
  const location = useLocation();
  const registered = location.state?.registered;
  const infoMessage = location.state?.message;
  const isMobile = useBreakpointDown('md');

  // Clear location state after reading to prevent stale banners on refresh
  // Use router navigation so we stay within React Router state management.
  const navigate = useNavigate();
  useEffect(() => {
    if ((registered || infoMessage) && !location.state?.from) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [registered, infoMessage, location.pathname, location.state, navigate]);

  // Render clean mobile view without AuthWrapper
  if (isMobile) {
    return <MobileLogin registrationSuccess={registered} />;
  }

  // Desktop view with AuthWrapper
  return (
    <AuthWrapper>
      <Helmet><title>Log In | Kelmah</title></Helmet>
      {registered && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Registration complete. Check your email for a verification link, then
          sign in.
        </Alert>
      )}
      {!registered && infoMessage && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {infoMessage}
        </Alert>
      )}
      <Login />
    </AuthWrapper>
  );
};

export default LoginPage;
