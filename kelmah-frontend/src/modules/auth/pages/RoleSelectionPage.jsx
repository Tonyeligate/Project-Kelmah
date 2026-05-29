import React from 'react';
import { Box, Button, Typography, Card, CardActionArea, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { WorkOutline, Search } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AuthWrapper from '../components/common/AuthWrapper';
import { Helmet } from 'react-helmet-async';
import { useBreakpointDown } from '@/hooks/useResponsive';
import PageCanvas from '@/modules/common/components/PageCanvas';
import { withSafeAreaBottom, withSafeAreaTop } from '@/utils/safeArea';

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
        sx={{ pt: 0, pb: 0 }}
      >
        <Box
          sx={{
            minHeight: '100dvh',
            bgcolor: 'background.default',
            color: 'text.primary',
            fontFamily: 'Manrope, "Noto Sans", sans-serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Header */}
          <Box sx={{ px: 2, pt: withSafeAreaTop(8), pb: 1 }}>
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
                mb: 2.25,
              }}
            >
              How do you want to use Kelmah?
            </Typography>

            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '16px',
                textAlign: 'center',
                mb: 2,
              }}
            >
              Choose one option. You can update this later in your profile.
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
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

          <Box sx={{ pb: withSafeAreaBottom(12) }} />
        </Box>
      </PageCanvas>
    );
  }

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const accentColor = theme.palette.primary.main || '#FFD34D';
  const panelText = isDarkMode ? '#FFFFFF' : '#171A1F';
  const panelMuted = isDarkMode ? alpha('#FFFFFF', 0.8) : alpha('#171A1F', 0.7);

  // Desktop view with premium cards
  return (
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 2.5, md: 4 }, pb: { xs: 4, md: 6 } }}
    >
      <AuthWrapper>
        <Helmet>
          <title>Choose Your Role | Kelmah</title>
        </Helmet>
        <Box sx={{ width: '100%', maxWidth: 640, mx: 'auto', py: 2 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              color: accentColor,
              fontSize: '1.8rem',
              textAlign: 'center',
              mb: 1.5,
              textShadow: `0 2px 10px ${alpha(accentColor, 0.24)}`
            }}
          >
            How do you want to use Kelmah?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: panelMuted,
              textAlign: 'center',
              mb: 4,
              fontSize: '1rem',
              lineHeight: 1.5
            }}
          >
            Select the primary path that fits your goals. You can change this in your profile settings later.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              justifyContent: 'center',
              flexDirection: { xs: 'column', sm: 'row' }
            }}
          >
            {/* Worker Card */}
            <Card
              elevation={4}
              sx={{
                flex: 1,
                borderRadius: 3,
                bgcolor: isDarkMode ? 'rgba(26,29,38,0.7)' : '#FFFFFF',
                border: `2px solid ${alpha(accentColor, 0.25)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: accentColor,
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 32px ${alpha(accentColor, 0.18)}`,
                }
              }}
            >
              <CardActionArea
                onClick={() => handleRoleSelection('worker')}
                sx={{ p: 3.5, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${accentColor} 0%, #FFC000 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 6px 20px ${alpha(accentColor, 0.3)}`,
                    mb: 2.5
                  }}
                >
                  <WorkOutline sx={{ fontSize: 32, color: '#000' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: panelText, mb: 1.5 }}>
                  Find Work
                </Typography>
                <Typography variant="body2" sx={{ color: panelMuted, lineHeight: 1.5 }}>
                  Apply for skilled trades, manage contracts, view recommended jobs, and build your digital reputation.
                </Typography>
              </CardActionArea>
            </Card>

            {/* Hirer Card */}
            <Card
              elevation={4}
              sx={{
                flex: 1,
                borderRadius: 3,
                bgcolor: isDarkMode ? 'rgba(26,29,38,0.7)' : '#FFFFFF',
                border: `2px solid ${alpha(accentColor, 0.25)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: accentColor,
                  transform: 'translateY(-4px)',
                  boxShadow: `0 12px 32px ${alpha(accentColor, 0.18)}`,
                }
              }}
            >
              <CardActionArea
                onClick={() => handleRoleSelection('hirer')}
                sx={{ p: 3.5, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${accentColor} 0%, #FFC000 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 6px 20px ${alpha(accentColor, 0.3)}`,
                    mb: 2.5
                  }}
                >
                  <Search sx={{ fontSize: 32, color: '#000' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: panelText, mb: 1.5 }}>
                  Hire Workers
                </Typography>
                <Typography variant="body2" sx={{ color: panelMuted, lineHeight: 1.5 }}>
                  Search vetted artisans, post job listings, compare local quotes, and track project details dynamically.
                </Typography>
              </CardActionArea>
            </Card>
          </Box>
        </Box>
      </AuthWrapper>
    </PageCanvas>
  );
};

export default RoleSelectionPage;
