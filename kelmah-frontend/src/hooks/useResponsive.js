/**
 * Responsive Design Hooks
 * Standardized breakpoint management for mobile and desktop
 */

import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useMemo } from 'react';

// Standard breakpoint values (Material-UI default)
const BREAKPOINTS = {
  xs: 0,     // Extra small devices (phones)
  sm: 600,   // Small devices (tablets)
  md: 900,   // Medium devices (small laptops)
  lg: 1200,  // Large devices (desktops)
  xl: 1536   // Extra large devices (large desktops)
};

/**
 * Main responsive hook with standardized breakpoints
 */
export const useResponsive = () => {
  const theme = useTheme();
  
  // Material-UI breakpoint queries
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.only('xl'));
  
  // Common responsive queries
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // xs, sm
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // sm only
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // md, lg, xl
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up('lg')); // lg, xl
  
  // Custom pixel-based queries (for legacy compatibility)
  const isActualMobile = useMediaQuery('(max-width: 768px)');
  const isActualTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isActualDesktop = useMediaQuery('(min-width: 1025px)');
  
  return useMemo(() => ({
    // Current breakpoint
    currentBreakpoint: isXs ? 'xs' : isSm ? 'sm' : isMd ? 'md' : isLg ? 'lg' : 'xl',
    
    // Individual breakpoints
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    
    // Grouped breakpoints
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    
    // Legacy pixel-based (for backward compatibility)
    isActualMobile,
    isActualTablet,
    isActualDesktop,
    
    // Screen size info
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    
    // Orientation
    isLandscape: window.innerWidth > window.innerHeight,
    isPortrait: window.innerWidth <= window.innerHeight,
    
    // Helper functions
    up: (breakpoint) => useMediaQuery(theme.breakpoints.up(breakpoint)),
    down: (breakpoint) => useMediaQuery(theme.breakpoints.down(breakpoint)),
    between: (start, end) => useMediaQuery(theme.breakpoints.between(start, end)),
    only: (breakpoint) => useMediaQuery(theme.breakpoints.only(breakpoint))
  }), [
    theme, isXs, isSm, isMd, isLg, isXl,
    isMobile, isTablet, isDesktop, isLargeDesktop,
    isActualMobile, isActualTablet, isActualDesktop
  ]);
};

/**
 * Hook for responsive spacing values
 */
export const useResponsiveSpacing = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  return useMemo(() => ({
    // Padding values
    containerPadding: isMobile ? 16 : isTablet ? 24 : 32,
    sectionPadding: isMobile ? 24 : isTablet ? 32 : 48,
    cardPadding: isMobile ? 16 : 24,
    
    // Margin values
    sectionMargin: isMobile ? 16 : isTablet ? 24 : 32,
    componentMargin: isMobile ? 8 : 16,
    
    // Grid spacing
    gridSpacing: isMobile ? 2 : isTablet ? 3 : 4,
    
    // Layout widths
    maxContentWidth: isDesktop ? 1200 : '100%',
    sidebarWidth: isMobile ? 280 : 320,
    drawerWidth: isMobile ? 250 : 280
  }), [isMobile, isTablet, isDesktop]);
};

/**
 * Hook for responsive typography
 */
export const useResponsiveTypography = () => {
  const { isMobile, isTablet } = useResponsive();
  
  return useMemo(() => ({
    // Font sizes
    h1: isMobile ? '2rem' : isTablet ? '2.5rem' : '3rem',
    h2: isMobile ? '1.75rem' : isTablet ? '2rem' : '2.5rem',
    h3: isMobile ? '1.5rem' : isTablet ? '1.75rem' : '2rem',
    h4: isMobile ? '1.25rem' : isTablet ? '1.5rem' : '1.75rem',
    h5: isMobile ? '1.125rem' : isTablet ? '1.25rem' : '1.5rem',
    h6: isMobile ? '1rem' : isTablet ? '1.125rem' : '1.25rem',
    body1: isMobile ? '0.875rem' : '1rem',
    body2: isMobile ? '0.75rem' : '0.875rem',
    caption: isMobile ? '0.6875rem' : '0.75rem',
    
    // Line heights
    headingLineHeight: isMobile ? 1.2 : 1.3,
    bodyLineHeight: isMobile ? 1.4 : 1.5,
    
    // Letter spacing
    headingLetterSpacing: isMobile ? '-0.01em' : '-0.02em',
    bodyLetterSpacing: '0.01em'
  }), [isMobile, isTablet]);
};

/**
 * Hook for responsive layout configurations
 */
export const useResponsiveLayout = () => {
  const { isMobile, isTablet, isDesktop, currentBreakpoint } = useResponsive();
  
  return useMemo(() => ({
    // Grid configurations
    gridCols: {
      xs: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 4
    },
    
    // Card configurations
    cardCols: isMobile ? 1 : isTablet ? 2 : 3,
    jobCardCols: isMobile ? 1 : isTablet ? 2 : 3,
    workerCardCols: isMobile ? 1 : isTablet ? 2 : isDesktop ? 3 : 4,
    
    // List configurations
    listItemsPerPage: isMobile ? 10 : isTablet ? 15 : 20,
    
    // Navigation
    showSideNavigation: isDesktop,
    showBottomNavigation: isMobile,
    collapsedSidebar: isTablet,
    
    // Modal configurations
    modalFullScreen: isMobile,
    modalMaxWidth: isMobile ? 'xs' : isTablet ? 'sm' : 'md',
    
    // Table configurations
    hideColumnsOnMobile: isMobile,
    stackedTable: isMobile,
    
    // Chat/messaging
    showChatSidebar: isDesktop,
    fullscreenChat: isMobile,
    
    // Dashboard
    dashboardCols: isMobile ? 1 : isTablet ? 2 : 3,
    metricCardSize: isMobile ? 'small' : 'medium',
    
    // Forms
    formLayout: isMobile ? 'stacked' : 'inline',
    inputSize: isMobile ? 'small' : 'medium'
  }), [isMobile, isTablet, isDesktop, currentBreakpoint]);
};

/**
 * Hook for responsive image configurations
 */
export const useResponsiveImages = () => {
  const { isMobile, isTablet, screenWidth } = useResponsive();
  
  return useMemo(() => ({
    // Avatar sizes
    avatarSize: {
      small: isMobile ? 32 : 40,
      medium: isMobile ? 48 : 56,
      large: isMobile ? 80 : 96,
      xlarge: isMobile ? 120 : 160
    },
    
    // Hero image dimensions
    heroHeight: isMobile ? 300 : isTablet ? 400 : 500,
    
    // Card image dimensions
    cardImageHeight: isMobile ? 150 : 200,
    
    // Gallery configurations
    galleryColumns: isMobile ? 2 : isTablet ? 3 : 4,
    
    // Image quality based on screen size
    imageQuality: screenWidth < 768 ? 'medium' : 'high',
    
    // Lazy loading threshold
    lazyLoadOffset: isMobile ? 100 : 200
  }), [isMobile, isTablet, screenWidth]);
};

/**
 * Utility function to get responsive values
 * Usage: getResponsiveValue({ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 })
 */
export const useResponsiveValue = (values) => {
  const { currentBreakpoint } = useResponsive();
  
  return useMemo(() => {
    // Return the value for current breakpoint or fallback to smaller ones
    const breakpointOrder = ['xl', 'lg', 'md', 'sm', 'xs'];
    const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
    
    for (let i = currentIndex; i < breakpointOrder.length; i++) {
      const bp = breakpointOrder[i];
      if (values[bp] !== undefined) {
        return values[bp];
      }
    }
    
    // Fallback to first available value
    return Object.values(values)[0];
  }, [values, currentBreakpoint]);
};

/**
 * Hook for responsive animations
 */
export const useResponsiveAnimations = () => {
  const { isMobile } = useResponsive();
  
  return useMemo(() => ({
    // Reduce animations on mobile for performance
    enableAnimations: !isMobile || window.matchMedia('(prefers-reduced-motion: no-preference)').matches,
    
    // Animation durations
    duration: {
      short: isMobile ? 150 : 200,
      medium: isMobile ? 250 : 300,
      long: isMobile ? 350 : 500
    },
    
    // Transition easings
    easing: {
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }), [isMobile]);
};

// Export individual breakpoint constants
export { BREAKPOINTS };

// Default export
export default useResponsive;