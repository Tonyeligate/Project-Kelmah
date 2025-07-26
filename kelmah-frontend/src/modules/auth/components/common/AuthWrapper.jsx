import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  useTheme,
  useMediaQuery,
  Chip,
  Stack,
} from '@mui/material';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import backgroundImg from '../../../../assets/images/background.jpg';
import goodJobClip from '../../../../assets/images/Good job clip.jpeg';
import plannerClip from '../../../../assets/images/planner clip.jpeg';
import {
  Build as BuildIcon,
  Handyman as HandymanIcon,
  Engineering as EngineeringIcon,
  Construction as ConstructionIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';

const cartoonImages = [goodJobClip, plannerClip];

const AuthWrapper = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % cartoonImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <VerifiedIcon sx={{ fontSize: { xs: 20, sm: 24 }, color: '#FFD700' }} />,
      title: 'Verified Professionals',
      description: 'All workers are vetted and verified'
    },
    {
      icon: <BuildIcon sx={{ fontSize: { xs: 20, sm: 24 }, color: '#FFD700' }} />,
      title: 'Skilled Trades',
      description: 'Plumbing, electrical, carpentry & more'
    },
    {
      icon: <HandymanIcon sx={{ fontSize: { xs: 20, sm: 24 }, color: '#FFD700' }} />,
      title: 'Quality Work',
      description: 'Guaranteed professional results'
    },
  ];

  const trades = ['Plumber', 'Electrician', 'Carpenter', 'Mason', 'Welder', 'Painter'];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1, sm: 2 },
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* Enhanced background with animated overlay */}
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
          filter: 'blur(3px) brightness(0.7)',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, 
              rgba(0,0,0,0.8) 0%, 
              rgba(0,0,0,0.4) 40%, 
              rgba(255,215,0,0.05) 50%, 
              rgba(0,0,0,0.4) 60%, 
              rgba(0,0,0,0.8) 100%)`,
            zIndex: 1,
          },
        }}
      />

      {/* Animated background particles - Mobile Optimized */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
          display: { xs: 'none', sm: 'block' }, // Hide on mobile for performance
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 70%)',
            animation: 'float 6s ease-in-out infinite',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '20%',
            right: '10%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%)',
            animation: 'float 4s ease-in-out infinite reverse',
          },
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px) scale(1)' },
            '50%': { transform: 'translateY(-20px) scale(1.05)' },
          },
        }}
      />

      <Container 
        maxWidth="lg" 
        sx={{ 
          position: 'relative', 
          zIndex: 2,
          width: '100%',
          px: { xs: 1, sm: 2, md: 3 },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
        <Paper
            elevation={12}
          sx={{
            display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              width: '100%',
              maxWidth: { xs: '100%', sm: '90%', md: 'none' },
            mx: 'auto',
              overflow: 'hidden',
              borderRadius: { xs: 4, sm: 5, md: 6 },
              background: 'linear-gradient(145deg, rgba(20, 20, 20, 0.95) 0%, rgba(30, 30, 30, 0.98) 100%)',
              boxShadow: {
                xs: '0 12px 40px rgba(0,0,0,0.3)',
                sm: '0 16px 50px rgba(0,0,0,0.35)',
                md: '0 20px 60px rgba(0,0,0,0.4)',
              },
              backdropFilter: 'blur(20px)',
              border: { xs: '1px solid rgba(255,215,0,0.15)', sm: '1px solid rgba(255,215,0,0.2)' },
              minHeight: { xs: 'auto', md: 650 },
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: { xs: '3px', sm: '4px' },
                background: 'linear-gradient(90deg, #FFD700 0%, #FFC000 50%, #FFD700 100%)',
                zIndex: 3,
              },
          }}
        >
            {/* Left Panel - Branding & Features - Mobile Optimized */}
            {!isMobile && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
                  p: { xs: 2, sm: 3, md: 4 },
                  background: `linear-gradient(135deg, 
                    rgba(40,40,40,0.9) 0%, 
                    rgba(30,30,30,0.95) 50%, 
                    rgba(25,25,25,0.98) 100%)`,
                  borderRight: isTablet ? 'none' : '1px solid rgba(255,215,0,0.15)',
              color: theme.palette.primary.contrastText,
              position: 'relative',
                  minWidth: { xs: 'auto', md: 380, lg: 420 },
                  minHeight: { xs: 'auto', md: 650 },
                  overflow: 'hidden',
                }}
              >
                {/* Header Section */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <Stack spacing={{ xs: 2, sm: 3 }} alignItems="center" sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: { xs: 60, sm: 70, md: 80 },
                        height: { xs: 60, sm: 70, md: 80 },
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 25px rgba(255,215,0,0.3)',
                      }}
                    >
                      <EngineeringIcon sx={{ fontSize: { xs: 28, sm: 32, md: 40 }, color: '#000' }} />
                    </Box>
                    
                    <Stack spacing={1} alignItems="center">
                      <Typography
                        variant="h3"
                        component="h1"
                        sx={{
                          fontWeight: 800,
                          letterSpacing: 1,
                          color: theme.palette.secondary.main,
                          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem', lg: '2.2rem' },
                          textShadow: '0 2px 15px rgba(255,215,0,0.3)',
                          lineHeight: 1.2,
                        }}
                      >
                        Welcome to Kelmah
                      </Typography>
                      
                      <Typography
                        variant="h6"
                        sx={{
                          color: 'rgba(255,255,255,0.9)',
                          fontWeight: 500,
                          fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                        }}
                      >
                        Ghana's Premier Skilled Trades Platform
                      </Typography>
                      
                      <Typography
                        variant="body1"
                        sx={{
                          color: 'rgba(255,255,255,0.8)',
                          maxWidth: { xs: 250, sm: 280, md: 320 },
                          lineHeight: 1.5,
                          fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
                        }}
                      >
                        Connect with verified skilled workers and find quality trade services across Ghana
                      </Typography>
                    </Stack>
                  </Stack>
                </motion.div>

                {/* Animated Image Section */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                      position: 'relative',
                      my: { xs: 2, sm: 3 },
              }}
            >
              <Box
                sx={{
                        width: { xs: '160px', sm: '200px', md: '240px', lg: '280px' },
                        height: { xs: '160px', sm: '200px', md: '240px', lg: '280px' },
                  position: 'relative',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
                        border: { xs: '2px solid rgba(255,215,0,0.3)', md: '3px solid rgba(255,215,0,0.3)' },
                }}
              >
                      {/* Golden glow effect */}
                <Box
                  sx={{
                    position: 'absolute',
                          inset: { xs: '-15px', md: '-20px' },
                    borderRadius: '50%',
                          background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)',
                          animation: 'pulse 3s ease-in-out infinite',
                          '@keyframes pulse': {
                            '0%, 100%': { opacity: 0.7, transform: 'scale(1)' },
                            '50%': { opacity: 1, transform: 'scale(1.05)' },
                    },
                  }}
                />
                      
                {cartoonImages.map((img, idx) => (
                        <motion.img
                    key={img}
                    src={img}
                          alt="Professional worker"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: currentImage === idx ? 1 : 0 }}
                          transition={{ duration: 1 }}
                          style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                            objectFit: 'cover',
                            borderRadius: '50%',
                    }}
                  />
                ))}
              </Box>
            </Box>
                </motion.div>

                {/* Features Section */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  <Stack spacing={{ xs: 1.5, sm: 2 }}>
                    {features.map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: { xs: 1.5, sm: 2 },
                            borderRadius: { xs: 1.5, sm: 2 },
                            background: 'rgba(255,215,0,0.05)',
                            border: '1px solid rgba(255,215,0,0.1)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              background: 'rgba(255,215,0,0.1)',
                              border: '1px solid rgba(255,215,0,0.2)',
                              transform: 'translateX(5px)',
                            },
                          }}
                        >
                          <Box sx={{ mr: { xs: 1.5, sm: 2 }, flexShrink: 0 }}>{feature.icon}</Box>
                          <Box sx={{ minWidth: 0 }}>
              <Typography
                              variant="subtitle2"
                sx={{
                                color: '#FFD700', 
                  fontWeight: 700,
                                mb: 0.5,
                                fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
                }}
              >
                              {feature.title}
              </Typography>
              <Typography
                              variant="caption"
                sx={{
                                color: 'rgba(255,255,255,0.8)',
                                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                                lineHeight: 1.3,
                }}
              >
                              {feature.description}
              </Typography>
            </Box>
          </Box>
                      </motion.div>
                    ))}
                  </Stack>
                </motion.div>

                {/* Trade Tags */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1 }}
                >
                  <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="body2"
                      sx={{ 
                        color: 'rgba(255,255,255,0.7)', 
                        fontWeight: 600,
                        fontSize: { xs: '0.8rem', sm: '0.85rem' },
                      }}
                    >
                      Popular Trades
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: { xs: 0.5, sm: 1 }, 
                      justifyContent: 'center',
                      maxWidth: '100%',
                    }}>
                      {trades.map((trade, index) => (
                        <motion.div
                          key={trade}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: 1.2 + index * 0.1 }}
                        >
                          <Chip
                            label={trade}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(255,215,0,0.15)',
                              color: '#FFD700',
                              fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                              fontWeight: 600,
                              border: '1px solid rgba(255,215,0,0.3)',
                              height: { xs: '24px', sm: '28px' },
                              '&:hover': {
                                backgroundColor: 'rgba(255,215,0,0.25)',
                                transform: 'scale(1.05)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                          />
                        </motion.div>
                      ))}
                    </Box>
                  </Stack>
                </motion.div>
              </Box>
            )}

            {/* Mobile Header - Only shown on mobile */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Stack 
                  spacing={1} 
                  alignItems="center" 
                  sx={{ 
                    textAlign: 'center',
                    p: 1.5,
                    background: 'linear-gradient(135deg, rgba(40,40,40,0.8) 0%, rgba(30,30,30,0.9) 100%)',
                    borderBottom: '1px solid rgba(255,215,0,0.1)',
                  }}
                >
                  <Box
                    sx={{
                      width: 35,
                      height: 35,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 15px rgba(255,215,0,0.3)',
                    }}
                  >
                    <EngineeringIcon sx={{ fontSize: 18, color: '#000' }} />
                  </Box>
                  
                  <Stack spacing={0.5} alignItems="center">
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        color: '#FFD700',
                        fontSize: '1.4rem',
                        textShadow: '0 2px 10px rgba(255,215,0,0.3)',
                      }}
                    >
                      Kelmah
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '0.85rem',
                      }}
                    >
                      Ghana's Skilled Trades Platform
                    </Typography>
                  </Stack>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                    {['Verified', 'Skilled', 'Quality'].map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255,215,0,0.15)',
                          color: '#FFD700',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          height: '22px',
                        }}
                      />
                    ))}
                  </Box>
                </Stack>
              </motion.div>
            )}

            {/* Right Panel - Auth Forms - Better Mobile Layout */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
                p: { xs: 2, sm: 3, md: 4 },
                minWidth: { xs: 'auto', md: 450, lg: 500 },
              backgroundColor: 'transparent',
                minHeight: { xs: 'auto', md: 650 },
              }}
            >
              <motion.div
                initial={{ opacity: 0, x: isMobile ? 0 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{ width: '100%', maxWidth: isMobile ? '100%' : '480px' }}
          >
            {children}
              </motion.div>
          </Box>
        </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

AuthWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthWrapper;
