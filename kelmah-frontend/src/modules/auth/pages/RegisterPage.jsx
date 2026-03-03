import React from 'react';
import Register from '../components/register/Register';
import AuthWrapper from '../components/common/AuthWrapper';
import MobileRegister from '../components/mobile/MobileRegister';
import { useMediaQuery, useTheme } from '@mui/material';
import { Helmet } from 'react-helmet-async';

const RegisterPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Render clean mobile view without AuthWrapper
  if (isMobile) {
    return <MobileRegister />;
  }

  // Desktop view with AuthWrapper
  return (
    <AuthWrapper>
      <Helmet><title>Sign Up | Kelmah</title></Helmet>
      <Register />
    </AuthWrapper>
  );
};

export default RegisterPage;
