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
    showHeader,
    hideHeader,
    isMobile,
  } = useAutoShowHeader({ disabled });

  // 🎯 ENHANCED: Comprehensive dashboard page detection (matches Layout.jsx)
  const isDashboardPage =
    location.pathname.includes('/dashboard') ||
    location.pathname.startsWith('/worker') ||
    location.pathname.startsWith('/hirer') ||
    location.pathname === '/dashboard' ||
    // Additional dashboard-related paths
    location.pathname.includes('/profile/edit') ||
    location.pathname.includes('/applications') ||
    location.pathname.includes('/contracts') ||
    location.pathname.includes('/payments') ||
    location.pathname.includes('/wallet') ||
    location.pathname.includes('/schedule') ||
    location.pathname.includes('/reviews');

  // Debug logging for development (remove in production)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 AutoShowHeader:', {
        pathname: location.pathname,
        isDashboardPage,
        disabled,
        shouldRender: isDashboardPage && !disabled,
      });
    }
  }, [location.pathname, isDashboardPage, disabled]);

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
      {/* TESTING: Manual trigger button - remove after verification */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 10000,
        }}
      >
        <button
          onClick={() => {
            console.log('🔲 Manual test - current isVisible:', isVisible);
            if (isVisible) {
              hideHeader();
            } else {
              showHeader(true); // Show and lock
            }
          }}
          style={{
            backgroundColor: isVisible ? '#ff4444' : '#44ff44',
            color: 'white',
            padding: '8px 12px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          {isVisible ? '🙈 HIDE' : '👀 SHOW'} HEADER
        </button>
      </Box>

      {/* Invisible trigger zone at top of screen */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '30px',
          zIndex: 9998,
          backgroundColor: 'transparent',
          pointerEvents: 'none',
        }}
      />

      {/* 🚀 PRODUCTION AUTO-SHOW HEADER */}
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
            boxShadow: isVisible ? '0 8px 32px rgba(0, 0, 0, 0.4)' : 'none',
            // Enhanced mobile visibility
            '@media (max-width: 768px)': {
              boxShadow: isVisible ? '0 4px 20px rgba(0, 0, 0, 0.5)' : 'none',
            },
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

      {/* 🎯 USER HINT: How to access logout/header */}
      {!isVisible && (
        <Box
          sx={{
            position: 'fixed',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            opacity: 0.7,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.5,
            borderRadius: 20,
            backgroundColor:
              theme.palette.mode === 'dark'
                ? 'rgba(255, 215, 0, 0.15)'
                : 'rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(10px)',
            border:
              theme.palette.mode === 'dark'
                ? '1px solid rgba(255, 215, 0, 0.3)'
                : '1px solid rgba(0, 0, 0, 0.3)',
          }}
        >
          <Box
            sx={{
              width: 20,
              height: 3,
              borderRadius: 2,
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 215, 0, 0.8)'
                  : 'rgba(0, 0, 0, 0.8)',
            }}
          />
          <Box
            component="span"
            sx={{
              fontSize: '11px',
              fontWeight: 600,
              color:
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 215, 0, 0.9)'
                  : 'rgba(0, 0, 0, 0.9)',
            }}
          >
            {isMobile ? 'Touch top for menu' : 'Move mouse to top'}
          </Box>
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
