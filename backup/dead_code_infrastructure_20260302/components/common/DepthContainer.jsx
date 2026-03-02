import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';

/**
 * DepthContainer
 * Adds perspective, layered shadows, and motion-friendly props for immersive UIs.
 */
const DepthContainer = ({
  children,
  perspective = 1000,
  depth = 'medium',
  sx = {},
  ...props
}) => {
  const shadowMap = {
    low: '0 4px 12px rgba(0,0,0,0.25)',
    medium: '0 12px 32px rgba(0,0,0,0.35)',
    high: '0 24px 60px rgba(0,0,0,0.45)',
  };

  return (
    <Box
      sx={{
        position: 'relative',
        transformStyle: 'preserve-3d',
        perspective,
        // willChange removed — wastes GPU memory when not actively animating
        boxShadow: shadowMap[depth] || shadowMap.medium,
        borderRadius: 2,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

DepthContainer.propTypes = {
  children: PropTypes.node,
  perspective: PropTypes.number,
  depth: PropTypes.oneOf(['low', 'medium', 'high']),
  sx: PropTypes.object,
};

export default DepthContainer;
