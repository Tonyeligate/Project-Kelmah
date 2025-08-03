import React from 'react';
import { Box, Button, Typography, useMediaQuery } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AuthWrapper from '../components/common/AuthWrapper';

const RoleSelectionPage = () => {
  const isActualMobile = useMediaQuery('(max-width: 768px)');
  const navigate = useNavigate();

  const handleRoleSelection = (role) => {
    navigate('/register', { state: { selectedRole: role } });
  };

  // Mobile-first role selection view
  if (isActualMobile) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#181611',
          color: 'white',
          fontFamily: 'Manrope, "Noto Sans", sans-serif',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography
              variant="h6"
              sx={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '18px',
                textAlign: 'center',
                flex: 1,
                pl: 6,
              }}
            >
              Kelmah
            </Typography>
            <Box sx={{ width: 48, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                sx={{
                  color: 'white',
                  minWidth: 'auto',
                  p: 0,
                  '&:hover': { backgroundColor: 'transparent' },
                }}
              >
                <svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M140,180a12,12,0,1,1-12-12A12,12,0,0,1,140,180ZM128,72c-22.06,0-40,16.15-40,36v4a8,8,0,0,0,16,0v-4c0-11,10.77-20,24-20s24,9,24,20-10.77,20-24,20a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-.72c18.24-3.35,32-17.9,32-35.28C168,88.15,150.06,72,128,72Zm104,56A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
                </svg>
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, px: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography
            variant="h4"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: '28px',
              textAlign: 'center',
              mb: 3,
            }}
          >
            Are you a worker or a hirer?
          </Typography>

          <Typography
            sx={{
              color: 'white',
              fontSize: '16px',
              textAlign: 'center',
              mb: 3,
            }}
          >
            Choose your role to get started.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: '480px', mx: 'auto', width: '100%' }}>
            {/* Worker Button */}
            <Button
              onClick={() => handleRoleSelection('worker')}
              sx={{
                backgroundColor: '#deae10',
                color: '#181611',
                height: '48px',
                borderRadius: '24px',
                fontSize: '16px',
                fontWeight: 'bold',
                textTransform: 'none',
                width: '100%',
                '&:hover': {
                  backgroundColor: '#c49a0e',
                },
              }}
            >
              Worker
            </Button>

            {/* Hirer Button */}
            <Button
              onClick={() => handleRoleSelection('hirer')}
              sx={{
                backgroundColor: '#393528',
                color: 'white',
                height: '48px',
                borderRadius: '24px',
                fontSize: '16px',
                fontWeight: 'bold',
                textTransform: 'none',
                width: '100%',
                '&:hover': {
                  backgroundColor: '#4a4436',
                },
              }}
            >
              Hirer
            </Button>
          </Box>
        </Box>

        {/* Bottom Navigation */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            borderTop: '1px solid #393528',
            backgroundColor: '#27241c',
            px: 2,
            pb: 3,
            pt: 2,
          }}
        >
          {[
            { icon: 'M224,115.55V208a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V168a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v40a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V115.55a16,16,0,0,1,5.17-11.78l80-75.48.11-.11a16,16,0,0,1,21.53,0,1.14,1.14,0,0,0,.11.11l80,75.48A16,16,0,0,1,224,115.55Z', active: true },
            { icon: 'M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z', active: false },
            { icon: 'M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208Zm-32-80a8,8,0,0,1-8,8H136v32a8,8,0,0,1-16,0V136H88a8,8,0,0,1,0-16h32V88a8,8,0,0,1,16,0v32h32A8,8,0,0,1,176,128Z', active: false },
            { icon: 'M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128ZM84,116a12,12,0,1,0,12,12A12,12,0,0,0,84,116Zm88,0a12,12,0,1,0,12,12A12,12,0,0,0,172,116Zm60,12A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Zm-16,0A88,88,0,1,0,51.81,172.06a8,8,0,0,1,.66,6.54L40,216,77.4,203.53a7.85,7.85,0,0,1,2.53-.42,8,8,0,0,1,4,1.08A88,88,0,0,0,216,128Z', active: false },
            { icon: 'M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z', active: false },
          ].map((item, index) => (
            <Box
              key={index}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                py: 1,
              }}
            >
              <Box
                sx={{
                  color: item.active ? 'white' : '#b9b29d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 32,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor">
                  <path d={item.icon} />
                </svg>
              </Box>
            </Box>
          ))}
        </Box>
        <Box sx={{ height: '20px', backgroundColor: '#27241c' }} />
      </Box>
    );
  }

  // Desktop fallback - redirect to register
  return (
    <AuthWrapper>
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Choose Your Role
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Are you looking for work or hiring skilled professionals?
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => handleRoleSelection('worker')}
            sx={{ minWidth: 120 }}
          >
            Worker
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => handleRoleSelection('hirer')}
            sx={{ minWidth: 120 }}
          >
            Hirer
          </Button>
        </Box>
      </Box>
    </AuthWrapper>
  );
};

export default RoleSelectionPage;