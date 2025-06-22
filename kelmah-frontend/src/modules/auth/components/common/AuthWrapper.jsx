import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Container, useTheme, useMediaQuery } from '@mui/material';
import PropTypes from 'prop-types';
// Corrected path for the background image
import backgroundImg from '../../../../assets/images/background.jpg';
import goodJobClip from '../../../../assets/images/Good job clip.jpeg';
import plannerClip from '../../../../assets/images/planner clip.jpeg';

const cartoonImages = [goodJobClip, plannerClip];

const AuthWrapper = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % cartoonImages.length);
    }, 4000); // Change image every 4 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default,
        py: 4,
        overflow: 'hidden',
      }}
    >
      {/* Background image, blur, and gradient overlay */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          backgroundImage: `url(${backgroundImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(4px) brightness(0.85)',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(120deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.7) 100%)',
            zIndex: 1,
          },
        }}
      />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Paper
          elevation={6}
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            overflow: 'hidden',
            borderRadius: 5,
            background: 'rgba(30, 30, 30, 0.75)',
            boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
            backdropFilter: 'blur(18px)',
            border: '1.5px solid rgba(255,255,255,0.10)',
            minHeight: { xs: 0, md: 600 },
          }}
        >
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: { xs: 2, md: 3 },
              background: 'rgba(40,40,40,0.55)',
              borderRight: isMobile ? 'none' : '1.5px solid rgba(255,255,255,0.10)',
              color: theme.palette.primary.contrastText,
              position: 'relative',
              minWidth: 320,
              minHeight: { xs: 0, md: 600 },
            }}
          >
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              {/* Large, centered cartoon image filling the panel */}
              <Box
                sx={{
                  width: { xs: '90%', sm: '90%', md: '95%' },
                  maxWidth: 420,
                  height: { xs: 220, sm: 320, md: 420 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transition: 'height 0.3s',
                }}
              >
                {/* Animated gold glow behind the image */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '90%',
                    height: '90%',
                    borderRadius: '50%',
                    zIndex: 0,
                    background: 'radial-gradient(circle, rgba(255,215,0,0.18) 0%, rgba(255,215,0,0.08) 60%, rgba(255,215,0,0) 100%)',
                    filter: 'blur(8px)',
                    animation: 'glowPulse 3s ease-in-out infinite',
                    '@keyframes glowPulse': {
                      '0%': { opacity: 0.7 },
                      '50%': { opacity: 1 },
                      '100%': { opacity: 0.7 },
                    },
                  }}
                />
                {cartoonImages.map((img, idx) => (
                  <Box
                    key={img}
                    component="img"
                    src={img}
                    alt="Cartoon worker"
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      opacity: currentImage === idx ? 1 : 0,
                      transition: 'opacity 0.7s',
                      // Softer, larger fade for blending
                      WebkitMaskImage:
                        'radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 55%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0) 100%)',
                      maskImage:
                        'radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 55%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0) 100%)',
                      boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)',
                    }}
                  />
                ))}
              </Box>
            </Box>
            <Box sx={{ width: '100%', mt: 2, mb: 1, textAlign: 'center' }}>
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom
                sx={{
                  textShadow: '0 2px 12px rgba(0,0,0,0.25)',
                  fontWeight: 700,
                  letterSpacing: 1,
                  textAlign: 'center',
                  color: theme.palette.secondary.main,
                  mb: 1,
                }}
              >
              Welcome to Kelmah
            </Typography>
              <Typography 
                variant="body1" 
                align="center" 
                sx={{ maxWidth: 400, color: 'rgba(255,255,255,0.85)', textAlign: 'center', fontWeight: 500, mx: 'auto' }}
              >
              Connect with skilled professionals and find your next opportunity in our global marketplace.
            </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 5,
              backgroundColor: 'transparent',
              minWidth: 350,
            }}
          >
            {children}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

AuthWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthWrapper; 