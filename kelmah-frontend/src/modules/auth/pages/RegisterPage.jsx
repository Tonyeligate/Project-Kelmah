import React from 'react';
import Register from '../components/register/Register';
import MobileRegister from '../components/mobile/MobileRegister';
import { useMediaQuery, useTheme } from '@mui/material';
import { Helmet } from 'react-helmet-async';

const RegisterPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const pageTitle = <Helmet><title>Sign Up | Kelmah</title></Helmet>;

  if (isMobile) {
    return (
      <>
        {pageTitle}
        <MobileRegister />
      </>
    );
  }

  return (
    <>
      {pageTitle}
      <Register />
    </>
  );
};

export default RegisterPage;
