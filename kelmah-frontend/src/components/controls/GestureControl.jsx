import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

const GestureControl = ({ children }) => {
  const controls = useAnimation();
  let touchStartX = 0;
  let touchStartY = 0;

  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
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

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [controls]);

  return (
    <motion.div animate={controls}>
      {children}
    </motion.div>
  );
};

export default GestureControl; 