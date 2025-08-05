/**
 * Auto-Show Header Hook
 * 
 * Provides functionality to automatically show/hide header based on mouse position
 * and touch interactions for optimal dashboard UX.
 */

import { useState, useEffect, useCallback } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

export const useAutoShowHeader = (options = {}) => {
  const {
    triggerDistance = 50, // Distance from top to trigger header
    hideDelay = 3000, // Delay before auto-hiding on mobile
    disabled = false, // Disable auto-show functionality
  } = options;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [isVisible, setIsVisible] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // Prevents auto-hide when user is interacting
  const [mouseY, setMouseY] = useState(0);
  const [hideTimeout, setHideTimeout] = useState(null);

  // Clear hide timeout
  const clearHideTimeout = useCallback(() => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
  }, [hideTimeout]);

  // Show header and manage auto-hide
  const showHeader = useCallback((lock = false) => {
    console.log('✨ Showing header:', { lock, isMobile, isLocked });
    setIsVisible(true);
    if (lock) {
      setIsLocked(true);
      clearHideTimeout();
    } else if (isMobile && !isLocked) {
      // Auto-hide on mobile after delay
      clearHideTimeout();
      const timeout = setTimeout(() => {
        if (!isLocked) {
          console.log('⏰ Auto-hiding header after delay');
          setIsVisible(false);
        }
      }, hideDelay);
      setHideTimeout(timeout);
    }
  }, [isMobile, isLocked, hideDelay, clearHideTimeout]);

  // Hide header
  const hideHeader = useCallback(() => {
    if (!isLocked) {
      setIsVisible(false);
      clearHideTimeout();
    }
  }, [isLocked, clearHideTimeout]);

  // Lock header visibility (prevent auto-hide)
  const lockHeader = useCallback(() => {
    setIsLocked(true);
    clearHideTimeout();
  }, [clearHideTimeout]);

  // Unlock header visibility (allow auto-hide)
  const unlockHeader = useCallback(() => {
    setIsLocked(false);
    if (isMobile && isVisible) {
      showHeader(); // Restart auto-hide timer
    }
  }, [isMobile, isVisible, showHeader]);

  // Mouse move handler
  const handleMouseMove = useCallback((e) => {
    if (disabled) return;
    
    const y = e.clientY;
    setMouseY(y);
    
    if (y <= triggerDistance && !isVisible) {
      console.log('🖱️ Mouse at top, showing header:', { y, triggerDistance });
      showHeader();
    } else if (y > triggerDistance * 2 && isVisible && !isLocked) {
      console.log('🖱️ Mouse moved away, hiding header:', { y, isLocked });
      hideHeader();
    }
  }, [disabled, triggerDistance, isVisible, isLocked, showHeader, hideHeader]);

  // Touch start handler for mobile
  const handleTouchStart = useCallback((e) => {
    if (disabled || !isMobile) return;
    
    const touch = e.touches[0];
    if (touch.clientY <= triggerDistance * 0.6) { // Smaller trigger area for touch
      showHeader();
    }
  }, [disabled, isMobile, triggerDistance, showHeader]);

  // Handle mouse leave document
  const handleMouseLeave = useCallback(() => {
    if (disabled) return;
    hideHeader();
  }, [disabled, hideHeader]);

  // Keyboard shortcut (Esc to hide, Ctrl+H to toggle)
  const handleKeyDown = useCallback((e) => {
    if (disabled) return;
    
    if (e.key === 'Escape' && isVisible) {
      hideHeader();
    } else if (e.ctrlKey && e.key === 'h') {
      e.preventDefault();
      if (isVisible) {
        hideHeader();
      } else {
        showHeader(true); // Lock when manually shown
      }
    }
  }, [disabled, isVisible, hideHeader, showHeader]);

  // Setup event listeners
  useEffect(() => {
    if (disabled) {
      console.log('🚫 useAutoShowHeader disabled, not setting up event listeners');
      return;
    }

    console.log('🎯 Setting up auto-show header event listeners');
    const options = { passive: true };
    
    document.addEventListener('mousemove', handleMouseMove, options);
    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('mouseleave', handleMouseLeave, options);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      console.log('🧹 Cleaning up auto-show header event listeners');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('keydown', handleKeyDown);
      clearHideTimeout();
    };
  }, [
    disabled,
    handleMouseMove,
    handleTouchStart,
    handleMouseLeave,
    handleKeyDown,
    clearHideTimeout,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearHideTimeout();
    };
  }, [clearHideTimeout]);

  return {
    // State
    isVisible,
    isLocked,
    mouseY,
    isMobile,
    
    // Actions
    showHeader,
    hideHeader,
    lockHeader,
    unlockHeader,
    
    // Config
    triggerDistance,
  };
};