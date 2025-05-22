import React, { useState, useEffect } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { styled } from '@mui/material/styles';

// Custom Cursor
const CustomCursor = styled(motion.div)({
  width: 20,
  height: 20,
  background: 'rgba(255, 215, 0, 0.5)',
  borderRadius: '50%',
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 9999,
  mixBlendMode: 'difference',
});

// Magnetic Button
const MagneticButton = styled(motion.button)(({ theme }) => ({
  padding: '15px 30px',
  border: 'none',
  borderRadius: '30px',
  background: 'linear-gradient(45deg, #FFD700, #FFA500)',
  color: '#000',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(255, 255, 255, 0.1)',
    transform: 'translateX(-100%)',
    transition: 'transform 0.3s ease',
  },
  '&:hover::before': {
    transform: 'translateX(0)',
  },
}));

// 3D Card
const Card3D = styled(motion.div)(({ theme }) => ({
  width: '300px',
  height: '400px',
  background: 'rgba(255, 215, 0, 0.1)',
  borderRadius: '20px',
  padding: theme.spacing(3),
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 215, 0, 0.2)',
  transformStyle: 'preserve-3d',
  perspective: '1000px',
  [theme.breakpoints.down('sm')]: {
    width: '250px',
    height: '350px',
  },
}));

export const AdvancedFeatures = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cursorVariant, setCursorVariant] = useState('default');
  const { scrollYProgress } = useScroll();

  // Smooth scroll progress
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Cursor animations
  const variants = {
    default: {
      x: mousePosition.x - 10,
      y: mousePosition.y - 10,
      scale: 1,
    },
    hover: {
      scale: 1.5,
      backgroundColor: 'rgba(255, 215, 0, 0.8)',
    },
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Audio feedback
  const playHoverSound = () => {
    const audio = new Audio('/sounds/hover.mp3');
    audio.volume = 0.2;
    audio.play();
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {!isMobile && (
        <CustomCursor
          variants={variants}
          animate={cursorVariant}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        />
      )}

      {/* Progress Bar */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          background: 'linear-gradient(to right, #FFD700, #FFA500)',
          transformOrigin: '0%',
          scaleX,
        }}
      />

      {/* Interactive Elements */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 4,
          padding: 4,
        }}
      >
        {/* 3D Cards */}
        {[1, 2, 3].map((item) => (
          <Card3D
            key={item}
            whileHover={{ 
              rotateX: 10,
              rotateY: 15,
              scale: 1.05,
            }}
            onMouseMove={(e) => {
              const { currentTarget: target } = e;
              const rect = target.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              const rotateX = (y - centerY) / 10;
              const rotateY = (centerX - x) / 10;
              target.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
            }}
          >
            {/* Card Content */}
          </Card3D>
        ))}

        {/* Magnetic Button */}
        <MagneticButton
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={() => {
            setCursorVariant('hover');
            playHoverSound();
          }}
          onMouseLeave={() => setCursorVariant('default')}
        >
          Hover Me
        </MagneticButton>
      </Box>
    </Box>
  );
};

export default AdvancedFeatures; 