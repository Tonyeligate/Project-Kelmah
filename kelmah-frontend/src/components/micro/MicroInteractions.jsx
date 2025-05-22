import React, { useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';

const InteractiveButton = styled(motion.button)(({ theme }) => ({
  padding: '10px 20px',
  border: 'none',
  borderRadius: '30px',
  background: 'linear-gradient(45deg, #FFD700, #FFA500)',
  color: '#000',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
}));

const RippleEffect = styled(motion.span)({
  position: 'absolute',
  borderRadius: '50%',
  transform: 'scale(0)',
  background: 'rgba(255, 255, 255, 0.7)',
  pointerEvents: 'none',
});

export const MicroInteractions = () => {
  const [ripples, setRipples] = useState([]);

  const createRipple = (event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const ripple = {
      x,
      y,
      id: Date.now(),
    };

    setRipples((prev) => [...prev, ripple]);
    
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
    }, 1000);
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <InteractiveButton
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={createRipple}
      >
        <AnimatePresence>
          {ripples.map((ripple) => (
            <RippleEffect
              key={ripple.id}
              initial={{ scale: 0, x: ripple.x, y: ripple.y }}
              animate={{ scale: 4 }}
              exit={{ opacity: 0 }}
              style={{
                left: 0,
                top: 0,
                width: 20,
                height: 20,
                transform: `translate(-50%, -50%)`,
              }}
            />
          ))}
        </AnimatePresence>
        Click Me
      </InteractiveButton>

      <Tooltip
        title="Hover for more info"
        arrow
        TransitionComponent={motion.div}
      >
        <IconButton>
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.3 }}
          >
            ℹ️
          </motion.div>
        </IconButton>
      </Tooltip>
    </Box>
  );
}; 