import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { motion, useAnimation } from 'framer-motion';

export const GestureControls = () => {
  const controls = useAnimation();
  const containerRef = useRef(null);
  let touchStartX = 0;
  let touchStartY = 0;

  useEffect(() => {
    const handleGesture = (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Detect swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 50) {
          controls.start({ x: 100, opacity: 0 });
        } else if (deltaX < -50) {
          controls.start({ x: -100, opacity: 0 });
        }
      } else {
        if (deltaY > 50) {
          controls.start({ y: 100, opacity: 0 });
        } else if (deltaY < -50) {
          controls.start({ y: -100, opacity: 0 });
        }
      }
    };

    const element = containerRef.current;
    if (element) {
      element.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      });
      element.addEventListener('touchend', handleGesture);

      return () => {
        element.removeEventListener('touchstart', handleGesture);
        element.removeEventListener('touchend', handleGesture);
      };
    }
  }, [controls]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100vh',
        touchAction: 'none',
      }}
    >
      <motion.div
        animate={controls}
        initial={{ opacity: 1, x: 0, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Your content here */}
      </motion.div>
    </Box>
  );
}; 