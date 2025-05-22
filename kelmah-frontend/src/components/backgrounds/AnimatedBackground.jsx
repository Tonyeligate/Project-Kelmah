import React from 'react';
import { motion } from 'framer-motion';
import { Box, styled } from '@mui/material';

const BackgroundContainer = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '100%',
  overflow: 'hidden',
  zIndex: 0,
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      linear-gradient(
        to bottom,
        rgba(26, 26, 26, 0.85) 0%,
        rgba(26, 26, 26, 0.95) 50%,
        rgba(26, 26, 26, 1) 100%
      ),
      linear-gradient(
        45deg,
        rgba(255, 215, 0, 0.15) 0%,
        transparent 100%
      )
    `,
    zIndex: 1,
  },
});

const ImageContainer = styled(motion.div)({
  position: 'absolute',
  width: '33.333%',
  height: '100%',
  overflow: 'hidden',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
});

const AnimatedBackground = () => {
  const images = [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=2000&q=80', // Professional construction
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=2000&q=80', // Electrical work
    'https://images.unsplash.com/photo-1574359411659-15573a68aacd?auto=format&fit=crop&w=2000&q=80', // Skilled trade
  ];

  return (
    <BackgroundContainer>
      {images.map((img, index) => (
        <ImageContainer
          key={index}
          initial={{ 
            x: `${index * 33.333}%`,
            opacity: 0.3,
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: index * 2,
            ease: "easeInOut",
          }}
          style={{
            left: `${index * 33.333}%`,
          }}
        >
          <motion.img
            src={img}
            alt={`Professional trade background ${index + 1}`}
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              filter: 'saturate(0.8) brightness(0.9)',
            }}
          />
        </ImageContainer>
      ))}

      <Box
        component={motion.div}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url(https://grainy-gradients.vercel.app/noise.svg)',
          opacity: 0.03,
          zIndex: 2,
          pointerEvents: 'none',
        }}
        animate={{
          opacity: [0.02, 0.04, 0.02],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </BackgroundContainer>
  );
};

export default AnimatedBackground; 