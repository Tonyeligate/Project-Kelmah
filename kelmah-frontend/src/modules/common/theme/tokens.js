/**
 * Kelmah Design System Tokens
 * Centralized design tokens for consistent theming across the platform
 */

// Ghana-inspired color palette
export const colors = {
  primary: {
    50: '#e8f5e8',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50', // Ghana green
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
  },
  secondary: {
    50: '#fff3e0',
    100: '#ffe0b3',
    200: '#ffcc80',
    300: '#ffb74d',
    400: '#ffa726',
    500: '#ff9800', // Ghana gold
    600: '#fb8c00',
    700: '#f57c00',
    800: '#ef6c00',
    900: '#e65100',
  },
  error: {
    50: '#ffebee',
    500: '#f44336',
    900: '#b71c1c',
  },
  warning: {
    50: '#fff8e1',
    500: '#ff9800',
    900: '#e65100',
  },
  success: {
    50: '#e8f5e8',
    500: '#4caf50',
    900: '#1b5e20',
  },
  info: {
    50: '#e3f2fd',
    500: '#2196f3',
    900: '#0d47a1',
  },
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  // Ghana flag colors
  ghana: {
    red: '#ce1126',
    gold: '#fcd116',
    green: '#006b3f',
  },
};

// Typography scale following Material Design guidelines
export const typography = {
  fontFamily: {
    primary: '"Roboto", "Helvetica", "Arial", sans-serif',
    secondary: '"Roboto Condensed", "Helvetica", "Arial", sans-serif',
    mono: '"Roboto Mono", "Courier New", monospace',
  },
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
  },
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing system (8pt grid)
export const spacing = {
  0: '0px',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
};

// Border radius tokens
export const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
};

// Shadow system
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

// Breakpoints (matching Material-UI defaults)
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

// Z-index scale
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Animation tokens
export const animation = {
  duration: {
    fastest: '100ms',
    fast: '200ms',
    normal: '300ms',
    slow: '500ms',
    slowest: '800ms',
  },
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Component-specific tokens
export const components = {
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    shadow: shadows.base,
    hoverShadow: shadows.md,
  },
  button: {
    borderRadius: borderRadius.base,
    padding: `${spacing[2]} ${spacing[4]}`,
    fontWeight: typography.fontWeight.medium,
  },
  input: {
    borderRadius: borderRadius.base,
    padding: `${spacing[3]} ${spacing[4]}`,
    borderWidth: '1px',
  },
  modal: {
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    shadow: shadows['2xl'],
  },
};

// Semantic color tokens for specific use cases
export const semantic = {
  background: {
    primary: colors.grey[50],
    secondary: colors.grey[100],
    paper: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  text: {
    primary: colors.grey[900],
    secondary: colors.grey[700],
    disabled: colors.grey[400],
    inverse: '#ffffff',
  },
  border: {
    default: colors.grey[300],
    light: colors.grey[200],
    dark: colors.grey[400],
  },
  status: {
    online: colors.success[500],
    offline: colors.grey[400],
    busy: colors.warning[500],
    away: colors.warning[300],
  },
};

// Export all tokens
export const tokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  animation,
  components,
  semantic,
};

export default tokens;
