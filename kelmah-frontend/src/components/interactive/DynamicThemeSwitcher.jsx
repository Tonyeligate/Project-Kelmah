import React, { useState, useEffect } from 'react';
import { Box, IconButton, Menu, MenuItem, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeToggle = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  right: 20,
  top: 20,
  zIndex: 1000,
  background: 'rgba(255, 215, 0, 0.1)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 215, 0, 0.2)',
  '&:hover': {
    background: 'rgba(255, 215, 0, 0.2)',
  },
}));

const ColorPalette = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '10px',
  padding: '10px',
}));

const ColorDot = styled(motion.div)(({ color }) => ({
  width: 25,
  height: 25,
  borderRadius: '50%',
  backgroundColor: color,
  cursor: 'pointer',
  border: '2px solid transparent',
  '&:hover': {
    transform: 'scale(1.2)',
  },
}));

export const DynamicThemeSwitcher = ({ onThemeChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#FFD700');
  const theme = useTheme();

  const colors = [
    '#FFD700', // Gold
    '#00FF00', // Neon Green
    '#FF1493', // Deep Pink
    '#00FFFF', // Cyan
    '#9400D3', // Violet
  ];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    onThemeChange(color);
    handleClose();
  };

  return (
    <>
      <ThemeToggle onClick={handleClick}>
        {theme.palette.mode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
      </ThemeToggle>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            background: 'rgba(28, 28, 28, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
          },
        }}
      >
        <ColorPalette>
          <AnimatePresence>
            {colors.map((color) => (
              <ColorDot
                key={color}
                color={color}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleColorChange(color)}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                style={{
                  borderColor: selectedColor === color ? color : 'transparent',
                }}
              />
            ))}
          </AnimatePresence>
        </ColorPalette>
      </Menu>
    </>
  );
}; 