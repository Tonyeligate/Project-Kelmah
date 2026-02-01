import React from 'react';
import Register from '../components/register/Register';
import AuthWrapper from '../components/common/AuthWrapper';
import MobileRegister from '../components/mobile/MobileRegister';
import { useMediaQuery } from '@mui/material';

const RegisterPage = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');

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
