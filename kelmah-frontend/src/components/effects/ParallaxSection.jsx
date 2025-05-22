import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const ParallaxContainer = styled(Box)({
  height: '100vh',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
});

const ParallaxLayer = styled(motion.div)({
  position: 'absolute',
  width: '100%',
  height: '100%',
});

const ParallaxSection = () => {
  const { scrollYProgress } = useScroll();
  
  const layer1Y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const layer2Y = useTransform(scrollYProgress, [0, 1], ['0%', '-30%']);
  const layer3Y = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-100%']);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.5]);
  
  return (
    <ParallaxContainer>
      <ParallaxLayer
        style={{ y: layer1Y }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '200px',
            height: '200px',
            background: 'linear-gradient(45deg, #FFD700, transparent)',
            borderRadius: '50%',
            filter: 'blur(40px)',
          }}
        />
      </ParallaxLayer>

      <ParallaxLayer
        style={{ y: layer2Y }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '40%',
            right: '15%',
            width: '300px',
            height: '300px',
            background: 'linear-gradient(45deg, #FFA500, transparent)',
            borderRadius: '50%',
            filter: 'blur(60px)',
          }}
        />
      </ParallaxLayer>

      <ParallaxLayer
        style={{ y: layer3Y }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1, delay: 0.4 }}
      >
        <Box
          sx={{
            position: 'absolute',
            bottom: '30%',
            left: '30%',
            width: '250px',
            height: '250px',
            background: 'linear-gradient(45deg, #FF8C00, transparent)',
            borderRadius: '50%',
            filter: 'blur(50px)',
          }}
        />
      </ParallaxLayer>

      <motion.div
        style={{ 
          y: textY,
          scale,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Typography
          variant="h2"
          sx={{
            color: '#fff',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            fontWeight: 'bold',
          }}
        >
          Discover Innovation
        </Typography>
      </motion.div>
    </ParallaxContainer>
  );
};

export default ParallaxSection; 