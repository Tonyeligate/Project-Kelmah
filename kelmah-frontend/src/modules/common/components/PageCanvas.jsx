import React from 'react';
import { Box, Container, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const PageCanvas = ({
  children,
  maxWidth = 'xl',
  disableContainer = false,
  containerProps = {},
  sx = {},
}) => {
  const theme = useTheme();

  const canvas = (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        overflowX: 'hidden',
        isolation: 'isolate',
        backgroundColor: theme.palette.background.default,
        backgroundAttachment: 'fixed',
        backgroundImage:
          theme.palette.mode === 'dark'
            ? `radial-gradient(circle at 10% 0%, ${alpha(theme.palette.secondary.main, 0.14)} 0%, transparent 28%), radial-gradient(circle at 88% 8%, ${alpha(theme.palette.info.main, 0.09)} 0%, transparent 24%), radial-gradient(circle at 50% 100%, ${alpha(theme.palette.success.main, 0.06)} 0%, transparent 34%), linear-gradient(180deg, ${alpha(theme.palette.common.black, 0.15)} 0%, transparent 22%)`
            : `radial-gradient(circle at 10% 0%, ${alpha(theme.palette.secondary.main, 0.08)} 0%, transparent 30%), linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.98)} 0%, ${theme.palette.background.default} 100%)`,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)'
              : 'linear-gradient(rgba(15,15,23,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,15,23,0.035) 1px, transparent 1px)',
          backgroundSize: '88px 88px',
          opacity: 0.14,
          maskImage:
            'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 56%, transparent 100%)',
        },
        '& > *': {
          position: 'relative',
          zIndex: 1,
        },
        ...sx,
      }}
    >
      {disableContainer ? (
        children
      ) : (
        <Container maxWidth={maxWidth} {...containerProps}>
          {children}
        </Container>
      )}
    </Box>
  );

  return canvas;
};

export default PageCanvas;
