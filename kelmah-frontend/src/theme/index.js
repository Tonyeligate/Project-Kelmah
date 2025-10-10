import { createTheme } from '@mui/material/styles';

// Kelmah Brand Colors - Core Identity
const BRAND_COLORS = {
  // Gold variations - Primary brand color
  gold: '#FFD700',
  goldLight: '#FFE55C',
  goldDark: '#B8860B',
  goldMuted: 'rgba(255, 215, 0, 0.8)',

  // Black variations - Secondary brand color
  black: '#000000',
  blackLight: '#1a1a1a',
  blackMedium: '#2c2c2c',
  blackSoft: '#333333',

  // White variations - Accent color
  white: '#FFFFFF',
  whiteLight: '#FAFAFA',
  whiteDark: '#F5F5F5',
  whiteAlpha: 'rgba(255, 255, 255, 0.9)',

  // Semantic colors
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
};

// Base theme configuration
const baseTheme = {
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif',
    h1: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '3.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '2.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '2.25rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      fontWeight: 400,
    },
    overline: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    },
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
};

// Dark Theme (Default - Professional Dark)
const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: BRAND_COLORS.gold,
      light: BRAND_COLORS.goldLight,
      dark: BRAND_COLORS.goldDark,
      contrastText: BRAND_COLORS.black,
    },
    secondary: {
      main: BRAND_COLORS.black,
      light: BRAND_COLORS.blackLight,
      dark: BRAND_COLORS.black,
      contrastText: BRAND_COLORS.gold,
    },
    background: {
      default: BRAND_COLORS.black,
      paper: BRAND_COLORS.blackLight,
    },
    text: {
      primary: BRAND_COLORS.white,
      secondary: BRAND_COLORS.gold,
    },
    divider: 'rgba(255, 215, 0, 0.12)',
    action: {
      hover: 'rgba(255, 215, 0, 0.08)',
      selected: 'rgba(255, 215, 0, 0.12)',
      disabled: 'rgba(255, 255, 255, 0.3)',
    },
    error: {
      main: BRAND_COLORS.error,
      light: '#e57373',
      dark: '#d32f2f',
    },
    warning: {
      main: BRAND_COLORS.warning,
      light: '#ffb74d',
      dark: '#f57c00',
    },
    info: {
      main: BRAND_COLORS.info,
      light: '#64b5f6',
      dark: '#1976d2',
    },
    success: {
      main: BRAND_COLORS.success,
      light: '#81c784',
      dark: '#388e3c',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: BRAND_COLORS.black,
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin',
          scrollbarColor: `${BRAND_COLORS.gold} ${BRAND_COLORS.blackLight}`,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: BRAND_COLORS.blackLight,
          },
          '&::-webkit-scrollbar-thumb': {
            background: BRAND_COLORS.gold,
            borderRadius: '4px',
            '&:hover': {
              background: BRAND_COLORS.goldLight,
            },
          },
          // Remove any default margins/padding
          margin: 0,
          padding: 0,
          // Ensure consistent font rendering
          fontFamily:
            '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '*': {
          boxSizing: 'border-box',
        },
        'html, body, #root': {
          height: '100%',
          margin: 0,
          padding: 0,
          overflowX: 'hidden',
          overflowY: 'auto',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: BRAND_COLORS.black,
          borderBottom: `2px solid rgba(255, 215, 0, 0.3)`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: BRAND_COLORS.blackMedium,
          backgroundImage: 'none',
          border: `1px solid rgba(255, 215, 0, 0.2)`,
          borderRadius: 12,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            borderColor: 'rgba(255, 215, 0, 0.4)',
            boxShadow: '0 8px 25px rgba(255, 215, 0, 0.15)',
          },
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        },
        elevation4: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        },
        elevation8: {
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
        },
        elevation12: {
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.45)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: BRAND_COLORS.blackMedium,
          border: `1px solid rgba(255, 215, 0, 0.2)`,
          borderRadius: 12,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            borderColor: 'rgba(255, 215, 0, 0.4)',
            boxShadow: '0 8px 25px rgba(255, 215, 0, 0.15)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          fontSize: '0.95rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '44px', // Better touch target
        },
        contained: {
          background: `linear-gradient(135deg, ${BRAND_COLORS.gold} 0%, ${BRAND_COLORS.goldLight} 100%)`,
          color: BRAND_COLORS.black,
          boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
          '&:hover': {
            background: `linear-gradient(135deg, ${BRAND_COLORS.goldLight} 0%, ${BRAND_COLORS.gold} 100%)`,
            boxShadow: '0 6px 20px rgba(255, 215, 0, 0.4)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&:disabled': {
            background: 'rgba(255, 215, 0, 0.3)',
            color: 'rgba(0, 0, 0, 0.5)',
          },
        },
        outlined: {
          borderColor: BRAND_COLORS.gold,
          borderWidth: '2px',
          color: BRAND_COLORS.gold,
          '&:hover': {
            borderColor: BRAND_COLORS.goldLight,
            backgroundColor: 'rgba(255, 215, 0, 0.08)',
            borderWidth: '2px',
          },
        },
        text: {
          color: BRAND_COLORS.gold,
          '&:hover': {
            backgroundColor: 'rgba(255, 215, 0, 0.08)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: BRAND_COLORS.gold,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 8,
            '& fieldset': {
              borderColor: 'rgba(255, 215, 0, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 215, 0, 0.6)',
            },
            '&.Mui-focused fieldset': {
              borderColor: BRAND_COLORS.gold,
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-focused': {
              color: BRAND_COLORS.gold,
            },
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: BRAND_COLORS.blackMedium,
          border: `1px solid rgba(255, 215, 0, 0.3)`,
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 215, 0, 0.15)',
            '&:hover': {
              backgroundColor: 'rgba(255, 215, 0, 0.2)',
            },
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: BRAND_COLORS.gold,
          color: BRAND_COLORS.black,
          fontWeight: 600,
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          backgroundColor: BRAND_COLORS.gold,
          color: BRAND_COLORS.black,
          fontWeight: 600,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: BRAND_COLORS.black,
          borderRight: `1px solid rgba(255, 215, 0, 0.2)`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: BRAND_COLORS.blackMedium,
          border: `2px solid ${BRAND_COLORS.gold}`,
          borderRadius: 16,
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 215, 0, 0.1)',
          color: '#ffd700',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '20px 24px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: BRAND_COLORS.blackMedium,
          color: BRAND_COLORS.white,
          border: `1px solid rgba(255, 215, 0, 0.3)`,
          fontSize: '0.875rem',
        },
        arrow: {
          color: BRAND_COLORS.blackMedium,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 215, 0, 0.15)',
          color: BRAND_COLORS.gold,
          '&:hover': {
            backgroundColor: 'rgba(255, 215, 0, 0.2)',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '16px',
          paddingRight: '16px',
          '@media (min-width: 600px)': {
            paddingLeft: '24px',
            paddingRight: '24px',
          },
        },
      },
    },
  },
});

// Light Theme (Gold-based Professional)
const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: BRAND_COLORS.gold,
      light: BRAND_COLORS.goldLight,
      dark: BRAND_COLORS.goldDark,
      contrastText: BRAND_COLORS.black,
    },
    secondary: {
      main: BRAND_COLORS.black,
      light: BRAND_COLORS.blackLight,
      dark: BRAND_COLORS.black,
      contrastText: BRAND_COLORS.white,
    },
    background: {
      default: BRAND_COLORS.gold,
      paper: BRAND_COLORS.gold,
    },
    text: {
      primary: BRAND_COLORS.black,
      secondary: BRAND_COLORS.blackLight,
    },
    divider: 'rgba(0, 0, 0, 0.15)',
    action: {
      hover: 'rgba(0, 0, 0, 0.08)',
      selected: 'rgba(0, 0, 0, 0.12)',
      disabled: 'rgba(0, 0, 0, 0.3)',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: BRAND_COLORS.gold,
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin',
          scrollbarColor: `${BRAND_COLORS.black} ${BRAND_COLORS.gold}`,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: BRAND_COLORS.gold,
          },
          '&::-webkit-scrollbar-thumb': {
            background: BRAND_COLORS.black,
            borderRadius: '4px',
            '&:hover': {
              background: BRAND_COLORS.blackLight,
            },
          },
          margin: 0,
          padding: 0,
          fontFamily:
            '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '*': {
          boxSizing: 'border-box',
        },
        'html, body, #root': {
          height: '100%',
          margin: 0,
          padding: 0,
          overflowX: 'hidden',
          overflowY: 'auto',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: BRAND_COLORS.gold,
          borderBottom: `2px solid rgba(0, 0, 0, 0.2)`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(20px)',
          color: BRAND_COLORS.black,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: BRAND_COLORS.gold,
          backgroundImage: 'none',
          border: `1px solid rgba(0, 0, 0, 0.15)`,
          borderRadius: 12,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            borderColor: 'rgba(0, 0, 0, 0.25)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          },
        },
        elevation1: {
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
        },
        elevation4: {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
        },
        elevation8: {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        },
        elevation12: {
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: BRAND_COLORS.gold,
          border: `1px solid rgba(0, 0, 0, 0.15)`,
          borderRadius: 12,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            borderColor: 'rgba(0, 0, 0, 0.25)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          fontSize: '0.95rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '44px',
        },
        contained: {
          background: `linear-gradient(135deg, ${BRAND_COLORS.black} 0%, ${BRAND_COLORS.blackLight} 100%)`,
          color: BRAND_COLORS.gold,
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            background: `linear-gradient(135deg, ${BRAND_COLORS.blackLight} 0%, ${BRAND_COLORS.black} 100%)`,
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&:disabled': {
            background: 'rgba(0, 0, 0, 0.3)',
            color: 'rgba(255, 215, 0, 0.5)',
          },
        },
        outlined: {
          borderColor: BRAND_COLORS.black,
          borderWidth: '2px',
          color: BRAND_COLORS.black,
          backgroundColor: 'transparent',
          '&:hover': {
            borderColor: BRAND_COLORS.blackLight,
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
            borderWidth: '2px',
          },
        },
        text: {
          color: BRAND_COLORS.black,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: BRAND_COLORS.black,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderRadius: 8,
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.25)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.4)',
            },
            '&.Mui-focused fieldset': {
              borderColor: BRAND_COLORS.black,
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(0, 0, 0, 0.7)',
            '&.Mui-focused': {
              color: BRAND_COLORS.black,
            },
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: BRAND_COLORS.gold,
          border: `1px solid rgba(0, 0, 0, 0.2)`,
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 0, 0, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.16)',
            },
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: BRAND_COLORS.black,
          color: BRAND_COLORS.gold,
          fontWeight: 600,
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          backgroundColor: BRAND_COLORS.black,
          color: BRAND_COLORS.gold,
          fontWeight: 600,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: BRAND_COLORS.gold,
          borderRight: `1px solid rgba(0, 0, 0, 0.15)`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: BRAND_COLORS.gold,
          border: `2px solid ${BRAND_COLORS.black}`,
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: BRAND_COLORS.black,
          color: BRAND_COLORS.gold,
          border: `1px solid rgba(255, 215, 0, 0.3)`,
          fontSize: '0.875rem',
        },
        arrow: {
          color: BRAND_COLORS.black,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          color: BRAND_COLORS.black,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '16px',
          paddingRight: '16px',
          '@media (min-width: 600px)': {
            paddingLeft: '24px',
            paddingRight: '24px',
          },
        },
      },
    },
  },
});

// Export themes and brand colors
export default darkTheme;
export { lightTheme, BRAND_COLORS };

// Utility functions for theme-aware styling
export const getThemeAwareColor = (theme, darkColor, lightColor) => {
  return theme.palette.mode === 'dark' ? darkColor : lightColor;
};

export const createGradient = (theme, colors) => {
  return `linear-gradient(135deg, ${colors.join(', ')})`;
};

export const createGlassEffect = (theme, opacity = 0.1) => {
  return {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? `rgba(255, 255, 255, ${opacity})`
        : `rgba(0, 0, 0, ${opacity})`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${
      theme.palette.mode === 'dark'
        ? 'rgba(255, 215, 0, 0.2)'
        : 'rgba(0, 0, 0, 0.15)'
    }`,
  };
};

export const GHANA_COLORS = {
  red: '#DC143C',
  gold: '#FFD700',
  green: '#2E7D32',
  blue: '#1976D2',
  earth: '#8B4513',
};

export const KELMAH_DEPTH = {
  elevation: {
    low: '0 4px 12px rgba(0,0,0,0.25)',
    medium: '0 12px 32px rgba(0,0,0,0.35)',
    high: '0 24px 60px rgba(0,0,0,0.45)',
  },
  blur: {
    glass: 'blur(10px)',
  },
  gradients: {
    goldSheen:
      'linear-gradient(135deg, rgba(255,215,0,0.25) 0%, rgba(255,215,0,0.05) 100%)',
    ghanaFlagSweep:
      'linear-gradient(120deg, rgba(220,20,60,0.18), rgba(255,215,0,0.15), rgba(46,125,50,0.18))',
  },
};

// augment theme with kelmah namespace via createTheme overrides below
