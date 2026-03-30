import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AuthWrapper from '../components/common/AuthWrapper';
import { Helmet } from 'react-helmet-async';
import { useBreakpointDown } from '@/hooks/useResponsive';
import PageCanvas from '@/modules/common/components/PageCanvas';

const RoleSelectionPage = () => {
  const isActualMobile = useBreakpointDown('md');
  const navigate = useNavigate();

  const handleRoleSelection = (role) => {
    navigate('/register', { state: { selectedRole: role } });
  };

  // Mobile-first role selection view
  if (isActualMobile) {
    return (
      <PageCanvas
        disableContainer
        sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 4, md: 6 } }}
      >
        <Box
          sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            color: 'text.primary',
            fontFamily: 'Manrope, "Noto Sans", sans-serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Header */}
          <Box sx={{ p: 2, pb: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: 'text.primary',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  textAlign: 'center',
                  flex: 1,
                  pl: 6,
                }}
              >
                Kelmah
              </Typography>
              <Box
                sx={{ width: 48, display: 'flex', justifyContent: 'flex-end' }}
              >
                <Button
                  sx={{
                    color: 'text.primary',
                    minWidth: 44,
                    minHeight: 44,
                    p: 0,
                    '&:hover': { backgroundColor: 'transparent' },
                  }}
                  aria-label="Help"
                  onClick={() => navigate('/help')}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 256 256"
                    fill="currentColor"
                  >
                    <path d="M140,180a12,12,0,1,1-12-12A12,12,0,0,1,140,180ZM128,72c-22.06,0-40,16.15-40,36v4a8,8,0,0,0,16,0v-4c0-11,10.77-20,24-20s24,9,24,20-10.77,20-24,20a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-.72c18.24-3.35,32-17.9,32-35.28C168,88.15,150.06,72,128,72Zm104,56A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
                  </svg>
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Main Content */}
          <Box
            sx={{
              flex: 1,
              px: 2,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: 'text.primary',
                fontWeight: 'bold',
                fontSize: '28px',
                textAlign: 'center',
                mb: 3,
              }}
            >
              How do you want to use Kelmah?
            </Typography>

            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '16px',
                textAlign: 'center',
                mb: 3,
              }}
            >
              Choose one option. You can update this later in your profile.
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                maxWidth: '480px',
                mx: 'auto',
                width: '100%',
              }}
            >
              {/* Worker Button */}
              <Button
                onClick={() => handleRoleSelection('worker')}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  height: '48px',
                  borderRadius: '24px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  width: '100%',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
              >
                I want to find work
              </Button>

              {/* Hirer Button */}
              <Button
                onClick={() => handleRoleSelection('hirer')}
                sx={{
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  height: '48px',
                  borderRadius: '24px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  width: '100%',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                I want to hire workers
              </Button>
            </Box>
          </Box>

          {/* Spacer to replace removed decorative bottom nav */}
          <Box sx={{ height: '20px', bgcolor: 'background.default' }} />
        </Box>
      </PageCanvas>
    );
  }

  // Desktop fallback - redirect to register
  return (
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 4, md: 6 } }}
    >
      <AuthWrapper>
        <Helmet>
          <title>Choose Your Role | Kelmah</title>
        </Helmet>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h4" gutterBottom>
            Choose Your Role
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Pick one to continue. You can change this in account settings later.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => handleRoleSelection('worker')}
              sx={{ minWidth: 120, minHeight: 44 }}
            >
              I want to find work
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => handleRoleSelection('hirer')}
              sx={{ minWidth: 120, minHeight: 44 }}
            >
              I want to hire workers
            </Button>
          </Box>
        </Box>
      </AuthWrapper>
    </PageCanvas>
  );
};

export default RoleSelectionPage;
