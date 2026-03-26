import React from 'react';
import { Box, Container } from '@mui/material';

const PageCanvas = ({
  children,
  disableContainer = false,
  maxWidth = 'xl',
  sx = {},
  containerSx = {},
  ...props
}) => {
  const content = disableContainer ? (
    children
  ) : (
    <Container maxWidth={maxWidth} disableGutters sx={{ width: '100%', minWidth: 0, ...containerSx }}>
      {children}
    </Container>
  );

  return (
    <Box component="main" sx={{ width: '100%', minWidth: 0, ...sx }} {...props}>
      {content}
    </Box>
  );
};

export default PageCanvas;
