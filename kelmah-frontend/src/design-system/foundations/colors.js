/**
 * Kelmah Design System - Color Foundations
 * Professional color palette for Ghana's Skilled Trades Platform
 */

// Primary Brand Colors
export const PRIMARY_COLORS = {
  // Gold - Primary brand color representing excellence and craftsmanship
  gold: {
    50: '#FFFEF7',
    100: '#FFFAEB',
    200: '#FFF2CC',
    300: '#FFE99D',
    400: '#FFDD6B',
    500: '#FFD700', // Main brand gold
    600: '#E6C200',
    700: '#B8860B',
    800: '#996F00',
    900: '#7A5900',
    950: '#4D3800',
  },
  
  // Black - Secondary brand color representing professionalism
  black: {
    50: '#F7F7F7',
    100: '#E3E3E3',
    200: '#C8C8C8',
    300: '#A4A4A4',
    400: '#818181',
    500: '#666666',
    600: '#515151',
    700: '#434343',
    800: '#383838',
    900: '#000000', // True black
    950: '#000000',
  },
  
  // White - Accent color for contrast and clarity
  white: {
    50: '#FFFFFF', // Pure white
    100: '#FEFEFE',
    200: '#FDFDFD',
    300: '#FCFCFC',
    400: '#FAFAFA',
    500: '#F8F8F8',
    600: '#F5F5F5',
    700: '#F0F0F0',
    800: '#EBEBEB',
    900: '#E5E5E5',
    950: '#E0E0E0',
  },
};

// Semantic Colors
export const SEMANTIC_COLORS = {
  // Success - For completed tasks, verified profiles, successful payments
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },
  
  // Warning - For pending actions, incomplete profiles
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    950: '#451A03',
  },
  
  // Error - For failures, rejections, critical issues
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },
  
  // Info - For informational messages, tips, guides
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554',
  },
};

// Neutral Colors for backgrounds, borders, and text
export const NEUTRAL_COLORS = {
  // Gray scale for various UI elements
  gray: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },
};

// Theme-specific color mappings
export const THEME_COLORS = {
  dark: {
    // Backgrounds
    background: {
      primary: PRIMARY_COLORS.black[900],
      secondary: '#1A1A1A',
      tertiary: '#2C2C2C',
      elevated: '#333333',
      overlay: 'rgba(0, 0, 0, 0.8)',
    },
    
    // Text colors
    text: {
      primary: PRIMARY_COLORS.white[50],
      secondary: 'rgba(255, 255, 255, 0.8)',
      tertiary: 'rgba(255, 255, 255, 0.6)',
      disabled: 'rgba(255, 255, 255, 0.4)',
      accent: PRIMARY_COLORS.gold[500],
    },
    
    // Border colors
    border: {
      primary: 'rgba(255, 215, 0, 0.2)',
      secondary: 'rgba(255, 255, 255, 0.1)',
      focus: PRIMARY_COLORS.gold[500],
    },
    
    // Interactive states
    interactive: {
      hover: 'rgba(255, 215, 0, 0.1)',
      active: 'rgba(255, 215, 0, 0.2)',
      focus: 'rgba(255, 215, 0, 0.3)',
      disabled: 'rgba(255, 255, 255, 0.05)',
    },
  },
  
  light: {
    // Backgrounds
    background: {
      primary: PRIMARY_COLORS.gold[500],
      secondary: PRIMARY_COLORS.gold[400],
      tertiary: PRIMARY_COLORS.gold[300],
      elevated: PRIMARY_COLORS.gold[200],
      overlay: 'rgba(255, 215, 0, 0.9)',
    },
    
    // Text colors
    text: {
      primary: PRIMARY_COLORS.black[900],
      secondary: 'rgba(0, 0, 0, 0.8)',
      tertiary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.4)',
      accent: PRIMARY_COLORS.black[800],
    },
    
    // Border colors
    border: {
      primary: 'rgba(0, 0, 0, 0.2)',
      secondary: 'rgba(0, 0, 0, 0.1)',
      focus: PRIMARY_COLORS.black[800],
    },
    
    // Interactive states
    interactive: {
      hover: 'rgba(0, 0, 0, 0.1)',
      active: 'rgba(0, 0, 0, 0.15)',
      focus: 'rgba(0, 0, 0, 0.2)',
      disabled: 'rgba(0, 0, 0, 0.05)',
    },
  },
};

// Color utilities
export const getColorWithOpacity = (color, opacity) => {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

export const createGradient = (colors, direction = '135deg') => {
  return `linear-gradient(${direction}, ${colors.join(', ')})`;
};

// Brand gradients
export const BRAND_GRADIENTS = {
  gold: createGradient([PRIMARY_COLORS.gold[400], PRIMARY_COLORS.gold[600]]),
  goldLight: createGradient([PRIMARY_COLORS.gold[300], PRIMARY_COLORS.gold[500]]),
  black: createGradient([PRIMARY_COLORS.black[800], PRIMARY_COLORS.black[900]]),
  blackLight: createGradient([PRIMARY_COLORS.black[700], PRIMARY_COLORS.black[800]]),
};

export default {
  PRIMARY_COLORS,
  SEMANTIC_COLORS,
  NEUTRAL_COLORS,
  THEME_COLORS,
  BRAND_GRADIENTS,
  getColorWithOpacity,
  createGradient,
}; 