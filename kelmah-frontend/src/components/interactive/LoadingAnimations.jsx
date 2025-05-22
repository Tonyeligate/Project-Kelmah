import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';

const LoadingContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(28, 28, 28, 0.9)',
  backdropFilter: 'blur(10px)',
  zIndex: 9999,
}));

const LoadingDot = styled(motion.div)(({ theme }) => ({
  width: 20,
  height: 20,
  borderRadius: '50%',
  background: theme.palette.secondary.main,
  margin: '0 10px',
}));

export const LoadingAnimations = () => {
  const containerVariants = {
    start: {
      transition: {
        staggerChildren: 0.2,
      },
    },
    end: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const dotVariants = {
    start: {
      y: '0%',
    },
    end: {
      y: '100%',
    },
  };

  const dotTransition = {
    duration: 0.5,
    repeat: Infinity,
    repeatType: 'reverse',
    ease: 'easeInOut',
  };

  return (
    <LoadingContainer>
      <motion.div
        variants={containerVariants}
        initial="start"
        animate="end"
        style={{ display: 'flex' }}
      >
        {[...Array(3)].map((_, i) => (
          <LoadingDot
            key={i}
            variants={dotVariants}
            transition={dotTransition}
          />
        ))}
      </motion.div>
    </LoadingContainer>
  );
}; 