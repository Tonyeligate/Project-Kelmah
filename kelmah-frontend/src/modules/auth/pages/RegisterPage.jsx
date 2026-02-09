import React from 'react';
import Register from '../components/register/Register';
import AuthWrapper from '../components/common/AuthWrapper';
import MobileRegister from '../components/mobile/MobileRegister';
import { useMediaQuery, useTheme } from '@mui/material';

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
      <Register />
    </AuthWrapper>
  );
};

export default RegisterPage;
