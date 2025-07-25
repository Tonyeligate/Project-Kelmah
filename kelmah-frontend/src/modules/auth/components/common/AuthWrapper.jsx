import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  useTheme,
  useMediaQuery,
  Chip,
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
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % cartoonImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <VerifiedIcon sx={{ fontSize: 24, color: '#FFD700' }} />,
      title: 'Verified Professionals',
      description: 'All workers are vetted and verified'
    },
    {
      icon: <BuildIcon sx={{ fontSize: 24, color: '#FFD700' }} />,
      title: 'Skilled Trades',
      description: 'Plumbing, electrical, carpentry & more'
    },
    {
      icon: <HandymanIcon sx={{ fontSize: 24, color: '#FFD700' }} />,
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
        py: 4,
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

      {/* Animated background particles */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
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

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Paper
            elevation={12}
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              width: { xs: '95%', sm: '85%', md: 'auto' },
              mx: 'auto',
              overflow: 'hidden',
              borderRadius: 6,
              background: 'linear-gradient(145deg, rgba(20, 20, 20, 0.95) 0%, rgba(30, 30, 30, 0.98) 100%)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,215,0,0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,215,0,0.2)',
              minHeight: { xs: 'auto', md: 650 },
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #FFD700 0%, #FFC000 50%, #FFD700 100%)',
                zIndex: 3,
              },
            }}
          >
            {/* Left Panel - Branding & Features */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: { xs: 3, md: 4 },
                background: `linear-gradient(135deg, 
                  rgba(40,40,40,0.9) 0%, 
                  rgba(30,30,30,0.95) 50%, 
                  rgba(25,25,25,0.98) 100%)`,
                borderRight: isMobile ? 'none' : '1px solid rgba(255,215,0,0.15)',
                color: theme.palette.primary.contrastText,
                position: 'relative',
                minWidth: { xs: 'auto', md: 380 },
                minHeight: { xs: 300, md: 650 },
                overflow: 'hidden',
              }}
            >
              {/* Header Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      boxShadow: '0 8px 25px rgba(255,215,0,0.3)',
                    }}
                  >
                    <EngineeringIcon sx={{ fontSize: 40, color: '#000' }} />
                  </Box>
                  
                  <Typography
                    variant="h3"
                    component="h1"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: 1,
                      textAlign: 'center',
                      color: theme.palette.secondary.main,
                      mb: 2,
                      fontSize: { xs: '1.8rem', md: '2.2rem' },
                      textShadow: '0 2px 15px rgba(255,215,0,0.3)',
                    }}
                  >
                    Welcome to Kelmah
                  </Typography>
                  
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      textAlign: 'center',
                      fontWeight: 500,
                      mb: 2,
                      fontSize: { xs: '1rem', md: '1.1rem' },
                    }}
                  >
                    Ghana's Premier Skilled Trades Platform
                  </Typography>
                  
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'rgba(255,255,255,0.8)',
                      textAlign: 'center',
                      maxWidth: 300,
                      mx: 'auto',
                      lineHeight: 1.5,
                    }}
                  >
                    Connect with verified skilled workers and find quality trade services across Ghana
                  </Typography>
                </Box>
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
                    my: 3,
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: '200px', md: '280px' },
                      height: { xs: '200px', md: '280px' },
                      position: 'relative',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
                      border: '3px solid rgba(255,215,0,0.3)',
                    }}
                  >
                    {/* Golden glow effect */}
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: '-20px',
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
                <Box sx={{ mb: 3 }}>
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
                          mb: 2,
                          p: 2,
                          borderRadius: 2,
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
                        <Box sx={{ mr: 2 }}>{feature.icon}</Box>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ color: '#FFD700', fontWeight: 700, mb: 0.5 }}
                          >
                            {feature.title}
              </Typography>
              <Typography
                            variant="caption"
                            sx={{ color: 'rgba(255,255,255,0.8)' }}
                          >
                            {feature.description}
                          </Typography>
                        </Box>
                      </Box>
                    </motion.div>
                  ))}
                </Box>
              </motion.div>

              {/* Trade Tags */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255,255,255,0.7)', mb: 2, fontWeight: 600 }}
                  >
                    Popular Trades
              </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
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
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: '1px solid rgba(255,215,0,0.3)',
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
                </Box>
              </motion.div>
            </Box>

            {/* Right Panel - Auth Forms */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
                p: { xs: 3, md: 4 },
                minWidth: { xs: 'auto', md: 450 },
              backgroundColor: 'transparent',
            }}
            >
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{ width: '100%' }}
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
