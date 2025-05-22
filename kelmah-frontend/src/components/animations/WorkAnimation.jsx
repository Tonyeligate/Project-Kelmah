import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, styled } from '@mui/material';
// Import construction image
import plumbingImg from '../../assets/images/plumbing.jpg.jpeg';

const AnimationContainer = styled(Box)({
  position: 'absolute',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  background: '#1a1a1a',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

const ImageContainer = styled(motion.div)({
  position: 'relative',
  width: '80%',
  height: '80%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
});

const AnimatedImage = styled(motion.img)({
  width: '100vw',
  height: '100vh',
  objectFit: 'cover',
  objectPosition: 'center',
  filter: 'brightness(1.2) contrast(1.1)',
  maskImage: 'radial-gradient(circle at center, black 50%, transparent 80%)',
  WebkitMaskImage: 'radial-gradient(circle at center, black 50%, transparent 80%)',
});

const GlowOverlay = styled(motion.div)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'radial-gradient(circle at center, transparent 30%, #1a1a1a 100%)',
  pointerEvents: 'none',
  borderRadius: '8px',
});

const WorkAnimation = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <AnimationContainer>
      <ImageContainer
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{
          y: isHovered ? -20 : 0,
          scale: isHovered ? 1.05 : 1,
          transition: {
            type: "spring",
            stiffness: 200,
            damping: 20
          }
        }}
      >
        <AnimatedImage
          src={plumbingImg}
          alt="Professional Plumbing"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
          }}
        />

        <GlowOverlay
          animate={{
            opacity: isHovered ? 0.3 : 0.7,
            background: isHovered 
              ? 'radial-gradient(circle at center, transparent 50%, #1a1a1a 100%)'
              : 'radial-gradient(circle at center, transparent 30%, #1a1a1a 100%)',
          }}
          transition={{
            duration: 0.3,
          }}
        />

        {/* Golden border on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                right: '-2px',
                bottom: '-2px',
                border: '2px solid rgba(255, 215, 0, 0.5)',
                borderRadius: '10px',
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.2)',
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>

        {/* Ambient glow effect */}
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '8px',
            background: 'radial-gradient(circle at center, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
          animate={{
            opacity: isHovered ? [0.4, 0.6, 0.4] : [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Hover lift shadow */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: '20px',
                left: '0',
                right: '0',
                height: '40px',
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%)',
                transform: 'translateY(50%) scale(0.9)',
                zIndex: -1,
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>
      </ImageContainer>
    </AnimationContainer>
  );
};

export default WorkAnimation; 