import React from 'react';
import Register from '../components/register/Register';
import MobileRegister from '../components/mobile/MobileRegister';
import { Box, Typography, Stack, Chip } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useBreakpointDown } from '@/hooks/useResponsive';
import PageCanvas from '@/modules/common/components/PageCanvas';
import { withSafeAreaBottom } from '@/utils/safeArea';

const RegisterPage = () => {
  const isMobile = useBreakpointDown('md');

  const pageTitle = (
    <Helmet>
      <title>Sign Up | Kelmah</title>
    </Helmet>
  );
  const helperCopy = (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 1.25, lineHeight: 1.5 }}
      >
        Create your account to post jobs, apply quickly, and chat safely on
        Kelmah.
      </Typography>
      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
        <Chip size="small" label="Hirer: Post jobs and review proposals" />
        <Chip size="small" label="Worker: Build profile and apply to jobs" />
      </Stack>
    </Box>
  );

  if (isMobile) {
    return (
      <PageCanvas
        disableContainer
        sx={{
          pt: { xs: 2, md: 4 },
          pb: { xs: withSafeAreaBottom(20), md: 6 },
        }}
      >
        {pageTitle}
        <Box sx={{ px: 2, pt: 1.5 }}>
          <Typography component="h1" variant="h5" sx={{ mb: 1, fontWeight: 800 }}>
            Create Your Kelmah Account
          </Typography>
          {helperCopy}
        </Box>
        <MobileRegister />
      </PageCanvas>
    );
  }

  return (
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 2.5, md: 4 }, pb: { xs: 4, md: 6 } }}
    >
      {pageTitle}
      <Box
        sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, md: 0 }, pt: 1.5 }}
      >
        <Typography component="h1" variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
          Create Your Kelmah Account
        </Typography>
        {helperCopy}
      </Box>
      <Register />
    </PageCanvas>
  );
};

export default RegisterPage;
