import { keyframes } from '@emotion/react';
import { styled } from '@mui/material/styles';
import { Box, Card, Container } from '@mui/material';

// Keyframes
export const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
`;

export const glow = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.2); }
  50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.6); }
`;

export const ripple = keyframes`
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
`;

// Interactive Styled Components
export const InteractiveCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  background: 'rgba(28, 28, 28, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 215, 0, 0.1)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-10px) scale(1.02)',
    boxShadow: '0 20px 40px rgba(255, 215, 0, 0.2)',
    '&::before': {
      opacity: 1,
      transform: 'scale(2)',
    },
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at center, rgba(255,215,0,0.1) 0%, transparent 70%)',
    opacity: 0,
    transition: 'all 0.5s ease-out',
    transform: 'scale(0.5)',
  },
  [theme.breakpoints.down('sm')]: {
    margin: theme.spacing(2),
  },
}));

export const FloatingElement = styled(Box)(({ theme }) => ({
  animation: `${float} 3s ease-in-out infinite`,
  '&:hover': {
    animationPlayState: 'paused',
  },
}));

export const GlowingContainer = styled(Container)(({ theme }) => ({
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '100%',
    height: '100%',
    transform: 'translate(-50%, -50%)',
    background: 'radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 70%)',
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out',
  },
  '&:hover::after': {
    opacity: 1,
  },
})); 