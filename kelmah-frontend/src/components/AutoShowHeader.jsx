/**
 * Auto-Show Header Component
 * 
 * Provides automatic header visibility on dashboard pages when user moves mouse
 * to the top of the screen or uses touch gestures on mobile.
 */

import React from 'react';
import { Box, Fade, useTheme } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useAutoShowHeader } from '../hooks/useAutoShowHeader';
import Header from '../modules/layout/components/Header';

const AutoShowHeader = ({ toggleTheme, mode, disabled = false }) => {
  const theme = useTheme();
  const location = useLocation();
  const { 
    isVisible, 
    isLocked, 
    lockHeader, 
    unlockHeader,
    isMobile 
  } = useAutoShowHeader({ disabled });

  // Check if we're on a dashboard page
  const isDashboardPage = location.pathname.includes('/dashboard') ||
                          location.pathname.startsWith('/worker') ||
                          location.pathname.startsWith('/hirer');

  // Don't render if not on dashboard or disabled
  if (!isDashboardPage || disabled) {
    return null;
  }

  // Handle header interaction events
  const handleHeaderMouseEnter = () => {
    lockHeader(); // Keep header visible while interacting
  };

  const handleHeaderMouseLeave = () => {
    unlockHeader(); // Allow auto-hide after interaction
  };

  return (
    <>
      {/* Invisible trigger zone at top of screen */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '20px',
          zIndex: 9998,
          backgroundColor: 'transparent',
          pointerEvents: 'none',
        }}
      />
      
      {/* Auto-show header */}
      <Fade in={isVisible} timeout={{ enter: 300, exit: 200 }}>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isVisible 
              ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
              : 'none',
            // Enhanced mobile visibility
            '@media (max-width: 768px)': {
              boxShadow: isVisible 
                ? '0 2px 12px rgba(0, 0, 0, 0.4)' 
                : 'none',
            }
          }}
          onMouseEnter={handleHeaderMouseEnter}
          onMouseLeave={handleHeaderMouseLeave}
        >
          <Header 
            toggleTheme={toggleTheme} 
            mode={mode}
            // Pass dashboard context to header
            isDashboardMode={true}
            autoShowMode={true}
          />
        </Box>
      </Fade>

      {/* Mobile gesture hint (shows briefly on first visit) */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            opacity: isVisible ? 0 : 0.6,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.5,
            borderRadius: 20,
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box
            sx={{
              width: 30,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 215, 0, 0.8)'
                : 'rgba(0, 0, 0, 0.8)',
            }}
          />
        </Box>
      )}

      {/* Accessibility: Visual indicator when header is locked */}
      {isLocked && (
        <Box
          sx={{
            position: 'fixed',
            top: 4,
            right: 16,
            zIndex: 10001,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: theme.palette.success.main,
            boxShadow: '0 0 8px rgba(76, 175, 80, 0.6)',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': {
                boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)',
              },
              '70%': {
                boxShadow: '0 0 0 10px rgba(76, 175, 80, 0)',
              },
              '100%': {
                boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)',
              },
            },
          }}
        />
      )}
    </>
  );
};

export default AutoShowHeader;