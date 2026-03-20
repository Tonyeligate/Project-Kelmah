import React from 'react';
import Register from '../components/register/Register';
import MobileRegister from '../components/mobile/MobileRegister';
import { Helmet } from 'react-helmet-async';
import { useBreakpointDown } from '@/hooks/useResponsive';

const RegisterPage = () => {
  const isMobile = useBreakpointDown('md');

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
