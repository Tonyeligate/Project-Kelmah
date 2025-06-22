import React from 'react';
import { Box } from '@mui/material';

/**
 * Work Animation component that displays animated particles representing work activity
 */
const WorkAnimation = () => {
  return (
    <Box 
      sx={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
    />
  );
};

export default WorkAnimation; 