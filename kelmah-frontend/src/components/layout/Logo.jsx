import React from 'react';
import { Box, Typography, styled } from '@mui/material';
import HandymanIcon from '@mui/icons-material/Handyman';

const LogoWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const LogoIcon = styled(HandymanIcon)(({ theme }) => ({
  fontSize: '2rem',
  color: theme.palette.primary.main,
  transform: 'rotate(-45deg)',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'rotate(0deg)',
  },
}));

const BrandText = styled(Typography)(({ theme }) => ({
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 700,
  fontSize: '1.8rem',
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, #1a1a1a 90%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -2,
    left: 0,
    width: '100%',
    height: '2px',
    background: theme.palette.primary.main,
    transform: 'scaleX(0)',
    transition: 'transform 0.3s ease-in-out',
    transformOrigin: 'right',
  },
  '&:hover::after': {
    transform: 'scaleX(1)',
    transformOrigin: 'left',
  },
}));

const Logo = () => {
  return (
    <LogoWrapper>
      <LogoIcon />
      <BrandText>Kelmah</BrandText>
    </LogoWrapper>
  );
};

export default Logo; 