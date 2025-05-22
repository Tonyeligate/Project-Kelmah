import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Box, Container, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const ParallaxImage = styled(motion.div)(({ theme }) => ({
  width: '100%',
  height: '400px',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  borderRadius: '20px',
  margin: '20px 0',
  [theme.breakpoints.down('sm')]: {
    height: '300px',
  },
}));

const ParallaxGallery = () => {
  const { scrollYProgress } = useScroll();
  
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);

  return (
    <Container>
      <Box sx={{ minHeight: '200vh', position: 'relative' }}>
        <motion.div style={{ y: y1, opacity }}>
          <ParallaxImage
            style={{
              backgroundImage: 'url(/images/parallax1.jpg)',
            }}
          />
        </motion.div>
        
        <motion.div style={{ y: y2, opacity }}>
          <ParallaxImage
            style={{
              backgroundImage: 'url(/images/parallax2.jpg)',
            }}
          />
        </motion.div>
      </Box>
    </Container>
  );
};

export default ParallaxGallery; 