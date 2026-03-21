import React from 'react';
import Register from '../components/register/Register';
import MobileRegister from '../components/mobile/MobileRegister';
import { Box, Typography } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useBreakpointDown } from '@/hooks/useResponsive';

const RegisterPage = () => {
  const isMobile = useBreakpointDown('md');

  const pageTitle = <Helmet><title>Sign Up | Kelmah</title></Helmet>;
  const helperCopy = (
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mb: 2, lineHeight: 1.5 }}
    >
      Create your account to post jobs, apply quickly, and chat safely on Kelmah.
    </Typography>
  );

  if (isMobile) {
    return (
      <>
        {pageTitle}
        <Box sx={{ px: 2, pt: 2 }}>
          {helperCopy}
        </Box>
        <MobileRegister />
      </>
    );
  }

  return (
    <>
      {pageTitle}
      <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, md: 0 }, pt: 2 }}>
        {helperCopy}
      </Box>
      <Register />
    </>
  );
};

export default RegisterPage;
