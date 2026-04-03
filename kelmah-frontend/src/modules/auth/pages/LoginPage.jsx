import React, { useEffect } from 'react';
import Login from '../components/login/Login';
import AuthWrapper from '../components/common/AuthWrapper';
import MobileLogin from '../components/mobile/MobileLogin';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useBreakpointDown } from '@/hooks/useResponsive';
import { Typography } from '@mui/material';
import PageCanvas from '@/modules/common/components/PageCanvas';
import { withSafeAreaBottom } from '@/utils/safeArea';

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
    return (
      <PageCanvas
        disableContainer
        sx={{
          pt: { xs: 2, md: 4 },
          pb: { xs: withSafeAreaBottom(20), md: 6 },
        }}
      >
        <Typography
          component="h1"
          variant="h5"
          sx={{ px: 2, mb: 1, fontWeight: 800 }}
        >
          Sign In to Kelmah
        </Typography>
        <MobileLogin registrationSuccess={registered} />
      </PageCanvas>
    );
  }

  // Desktop view with AuthWrapper
  return (
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 2.5, md: 4 }, pb: { xs: 4, md: 6 } }}
    >
      <AuthWrapper>
        <Helmet>
          <title>Log In | Kelmah</title>
        </Helmet>
        <Typography component="h1" variant="h4" sx={{ mb: 2, fontWeight: 800 }}>
          Sign In to Kelmah
        </Typography>
        {registered && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Registration complete. Check your email for a verification link,
            then sign in.
          </Alert>
        )}
        {!registered && infoMessage && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {infoMessage}
          </Alert>
        )}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Sign in with the email and password used during registration.
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
            If login fails after two attempts, use Forgot password to reset
            access securely.
          </Typography>
        </Alert>
        <Login />
      </AuthWrapper>
    </PageCanvas>
  );
};

export default LoginPage;
