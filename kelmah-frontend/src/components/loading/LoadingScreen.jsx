import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';

const LoadingContainer = styled(Box)({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
  zIndex: 9999,
});

const LoadingDot = styled(motion.div)({
  width: 20,
  height: 20,
  margin: '0 5px',
  borderRadius: '50%',
  background: 'linear-gradient(45deg, #FFD700, #FFA500)',
});

const LoadingLogo = styled(motion.div)({
  fontSize: '3rem',
  fontWeight: 'bold',
  marginBottom: '2rem',
  background: 'linear-gradient(45deg, #FFD700, #FFA500)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
});

const LoadingScreen = ({ isLoading: propIsLoading, minDisplayTime = 1500 }) => {
  const [isLoading, setIsLoading] = useState(propIsLoading !== false);
  
  useEffect(() => {
    if (propIsLoading === false) {
      // If props say we're done loading, wait for minimum display time before hiding
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, minDisplayTime);
      
      return () => clearTimeout(timer);
    } else {
      setIsLoading(true);
    }
  }, [propIsLoading, minDisplayTime]);
  
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <LoadingContainer>
            <LoadingLogo
              animate={{ scale: [0.9, 1.1, 0.9] }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            >
              KELMAH
            </LoadingLogo>
            <Box sx={{ display: 'flex', mb: 2 }}>
              {[...Array(3)].map((_, i) => (
                <LoadingDot
                  key={i}
                  animate={{
                    y: [-20, 0, -20],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </Box>
            <Typography
              variant="h6"
              sx={{
                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Loading KELMAH...
            </Typography>
          </LoadingContainer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen; 