import { createTheme } from '@mui/material/styles';

// Kelmah Brand Colors - Core Identity
const BRAND_COLORS = {
  // Gold variations - Primary brand color (must remain untouched)
  gold: '#FFD700',
  goldLight: '#FFE55C',
  goldDark: '#B8860B',
  goldMuted: 'rgba(255, 215, 0, 0.8)',

  // Elevated neutral system so gold acts as an accent instead of background fill
  charcoal: '#050507',
  obsidian: '#0E0F14',
  graphite: '#161821',
  slate: '#1F2028',
  ink: '#1B1C22',
  warmConcrete: '#2A2B32',

  linen: '#F9F7ED',
  parchment: '#FFFDF4',
  sand: '#F3E8CB',
  bone: '#EEE5CF',
  warmGray: '#A7A199',
  nightBlue: '#0B1A2A',

  // Legacy blacks kept for compatibility with older components
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

const SURFACE_TOKENS = {
  dark: {
    body: '#050507',
    surface: '#0E0F14',
    raised: '#151722',
    overlay: '#1E2030',
    stroke: 'rgba(255, 255, 255, 0.08)',
    glow: 'rgba(255, 215, 0, 0.14)',
    textPrimary: '#F7F3E3',
    textSecondary: 'rgba(247, 243, 227, 0.7)',
    textMuted: 'rgba(247, 243, 227, 0.55)',
  },
  light: {
    body: '#F9F7ED',
    surface: '#FFFFFF',
    raised: '#F4EFE3',
    overlay: '#EFE9D9',
    stroke: 'rgba(15, 15, 23, 0.08)',
    glow: 'rgba(0, 0, 0, 0.06)',
    textPrimary: '#1F1F25',
    textSecondary: '#4A4B57',
    textMuted: 'rgba(31, 31, 37, 0.6)',
  },
};

// Base theme configuration
const baseTheme = {
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif',
    h1: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: 'clamp(1.75rem, 4vw, 3.5rem)',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: 'clamp(1.5rem, 3.5vw, 2.75rem)',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: 'clamp(1.25rem, 3vw, 2.25rem)',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: 'clamp(1.125rem, 2.5vw, 1.75rem)',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: 'clamp(1rem, 2vw, 1.5rem)',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: 'clamp(0.9375rem, 1.5vw, 1.25rem)',
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
      main: BRAND_COLORS.slate,
      light: BRAND_COLORS.warmConcrete,
      dark: BRAND_COLORS.ink,
      contrastText: BRAND_COLORS.gold,
    },
    background: {
      default: SURFACE_TOKENS.dark.body,
      paper: SURFACE_TOKENS.dark.surface,
      elevated: SURFACE_TOKENS.dark.raised,
    },
    text: {
      primary: SURFACE_TOKENS.dark.textPrimary,
      secondary: SURFACE_TOKENS.dark.textSecondary,
      disabled: SURFACE_TOKENS.dark.textMuted,
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    neutral: {
      main: 'rgba(255, 255, 255, 0.4)',
      contrastText: SURFACE_TOKENS.dark.textPrimary,
    },
    action: {
      hover: 'rgba(255, 215, 0, 0.1)',
      selected: 'rgba(255, 215, 0, 0.18)',
      disabled: 'rgba(255, 255, 255, 0.3)',
      focus: 'rgba(255, 215, 0, 0.2)',
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
          backgroundColor: SURFACE_TOKENS.dark.body,
          color: SURFACE_TOKENS.dark.textPrimary,
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin',
          scrollbarColor: `${BRAND_COLORS.gold} ${SURFACE_TOKENS.dark.surface}`,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: SURFACE_TOKENS.dark.surface,
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
          backgroundImage:
            'radial-gradient(circle at top, rgba(255,215,0,0.08), transparent 40%)',
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
        '::selection': {
          backgroundColor: 'rgba(255, 215, 0, 0.35)',
          color: SURFACE_TOKENS.dark.body,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(14, 15, 20, 0.95)',
          borderBottom: '1px solid rgba(255, 215, 0, 0.25)',
          boxShadow: '0 24px 45px rgba(5, 5, 7, 0.65)',
          backdropFilter: 'blur(18px)',
          color: SURFACE_TOKENS.dark.textPrimary,
          '& .MuiToolbar-root': {
            minHeight: 72,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: SURFACE_TOKENS.dark.surface,
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 14,
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          boxShadow: '0 25px 60px rgba(3, 3, 5, 0.55)',
          '&:hover': {
            borderColor: 'rgba(255, 215, 0, 0.35)',
            boxShadow: '0 30px 70px rgba(0, 0, 0, 0.65)',
          },
          '@media (min-width: 900px)': {
            boxShadow: '0 12px 30px rgba(3, 3, 5, 0.35)',
            '&:hover': {
              boxShadow: '0 18px 45px rgba(0, 0, 0, 0.45)',
            },
          },
        },
        elevation1: {
          boxShadow: '0 18px 35px rgba(6, 6, 9, 0.4)',
          '@media (min-width: 900px)': {
            boxShadow: '0 10px 20px rgba(6, 6, 9, 0.25)',
          },
        },
        elevation4: {
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.55)',
          '@media (min-width: 900px)': {
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.35)',
          },
        },
        elevation8: {
          boxShadow: '0 40px 85px rgba(0, 0, 0, 0.65)',
          '@media (min-width: 900px)': {
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
          },
        },
        elevation12: {
          boxShadow: '0 50px 100px rgba(0, 0, 0, 0.7)',
          '@media (min-width: 900px)': {
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: SURFACE_TOKENS.dark.raised,
          border: '1px solid rgba(255, 255, 255, 0.07)',
          borderRadius: 18,
          transition: 'transform 0.3s ease, border-color 0.3s ease',
          '@media (hover: hover)': {
            '&:hover': {
              borderColor: 'rgba(255, 215, 0, 0.3)',
              boxShadow: '0 25px 65px rgba(0, 0, 0, 0.65)',
              transform: 'translateY(-4px)',
            },
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
          padding: 'clamp(8px, 1vw, 10px) clamp(16px, 2vw, 26px)',
          fontSize: 'clamp(0.875rem, 1vw, 0.95rem)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '44px', // Better touch target
          letterSpacing: '0.02em',
        },
        contained: {
          background: `linear-gradient(135deg, ${BRAND_COLORS.gold} 0%, ${BRAND_COLORS.goldLight} 100%)`,
          color: BRAND_COLORS.black,
          boxShadow: '0 18px 35px rgba(255, 215, 0, 0.35)',
          '&:hover': {
            background: `linear-gradient(135deg, ${BRAND_COLORS.goldLight} 0%, ${BRAND_COLORS.gold} 100%)`,
            boxShadow: '0 24px 55px rgba(255, 215, 0, 0.45)',
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
          borderColor: 'rgba(255, 215, 0, 0.6)',
          borderWidth: '1.5px',
          color: BRAND_COLORS.gold,
          '&:hover': {
            borderColor: BRAND_COLORS.goldLight,
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
            borderWidth: '1.5px',
          },
        },
        text: {
          color: 'rgba(255, 255, 255, 0.8)',
          '&:hover': {
            backgroundColor: 'rgba(255, 215, 0, 0.12)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: 'rgba(255, 255, 255, 0.8)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(255, 215, 0, 0.15)',
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 8,
            fontSize: '16px', // Prevents iOS zoom on focus
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 215, 0, 0.4)',
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
          backgroundColor: SURFACE_TOKENS.dark.surface,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 8,
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.55)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 215, 0, 0.12)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 215, 0, 0.2)',
            '&:hover': {
              backgroundColor: 'rgba(255, 215, 0, 0.25)',
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
          backgroundColor: SURFACE_TOKENS.dark.surface,
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: SURFACE_TOKENS.dark.raised,
          border: `1px solid rgba(255, 215, 0, 0.4)`,
          borderRadius: 18,
          boxShadow: '0 40px 85px rgba(0, 0, 0, 0.7)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 215, 0, 0.25)',
          color: BRAND_COLORS.gold,
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
          backgroundColor: 'rgba(5, 5, 7, 0.75)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: SURFACE_TOKENS.dark.raised,
          color: SURFACE_TOKENS.dark.textPrimary,
          border: '1px solid rgba(255, 215, 0, 0.3)',
          fontSize: '0.875rem',
        },
        arrow: {
          color: SURFACE_TOKENS.dark.raised,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 215, 0, 0.18)',
          color: BRAND_COLORS.gold,
          '&:hover': {
            backgroundColor: 'rgba(255, 215, 0, 0.25)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '0 4px',
          color: SURFACE_TOKENS.dark.textSecondary,
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 215, 0, 0.18)',
            color: BRAND_COLORS.gold,
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 215, 0, 0.12)',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
        indicator: {
          backgroundColor: BRAND_COLORS.gold,
          height: 3,
          borderRadius: 2,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 48,
          color: SURFACE_TOKENS.dark.textSecondary,
          fontWeight: 600,
          '&.Mui-selected': {
            color: BRAND_COLORS.gold,
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: 'none',
          borderColor: 'rgba(255, 255, 255, 0.12)',
          color: SURFACE_TOKENS.dark.textSecondary,
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 215, 0, 0.2)',
            color: BRAND_COLORS.gold,
            borderColor: 'rgba(255, 215, 0, 0.5)',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backdropFilter: 'blur(6px)',
        },
        standardInfo: {
          backgroundColor: 'rgba(33, 150, 243, 0.12)',
          color: '#64b5f6',
        },
        standardSuccess: {
          backgroundColor: 'rgba(76, 175, 80, 0.12)',
          color: '#81c784',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 6,
          borderRadius: 999,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
        bar: {
          borderRadius: 999,
          background: `linear-gradient(90deg, ${BRAND_COLORS.gold} 0%, ${BRAND_COLORS.goldLight} 100%)`,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
      main: '#2B2C34',
      light: '#3C3E47',
      dark: '#1F1F25',
      contrastText: BRAND_COLORS.white,
    },
    background: {
      default: SURFACE_TOKENS.light.body,
      paper: SURFACE_TOKENS.light.surface,
      elevated: SURFACE_TOKENS.light.raised,
    },
    text: {
      primary: SURFACE_TOKENS.light.textPrimary,
      secondary: SURFACE_TOKENS.light.textSecondary,
      disabled: SURFACE_TOKENS.light.textMuted,
    },
    divider: 'rgba(0, 0, 0, 0.15)',
    action: {
      hover: 'rgba(0, 0, 0, 0.08)',
      selected: 'rgba(0, 0, 0, 0.12)',
      disabled: 'rgba(0, 0, 0, 0.3)',
      focus: 'rgba(0, 0, 0, 0.15)',
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
          backgroundColor: SURFACE_TOKENS.light.body,
          color: SURFACE_TOKENS.light.textPrimary,
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin',
          scrollbarColor: `${BRAND_COLORS.goldDark} ${SURFACE_TOKENS.light.body}`,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: SURFACE_TOKENS.light.body,
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(27, 27, 37, 0.45)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(27, 27, 37, 0.65)',
            },
          },
          margin: 0,
          padding: 0,
          fontFamily:
            '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          backgroundImage:
            'radial-gradient(circle at top, rgba(255,215,0,0.15), transparent 45%)',
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
        '::selection': {
          backgroundColor: 'rgba(0, 0, 0, 0.12)',
          color: BRAND_COLORS.goldDark,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 15px 35px rgba(15, 15, 23, 0.08)',
          backdropFilter: 'blur(18px)',
          color: SURFACE_TOKENS.light.textPrimary,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: SURFACE_TOKENS.light.surface,
          backgroundImage: 'none',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: 14,
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          boxShadow: '0 20px 55px rgba(15, 15, 23, 0.08)',
          '&:hover': {
            borderColor: 'rgba(0, 0, 0, 0.16)',
            boxShadow: '0 26px 70px rgba(15, 15, 23, 0.12)',
          },
        },
        elevation1: {
          boxShadow: '0 15px 30px rgba(15, 15, 23, 0.08)',
        },
        elevation4: {
          boxShadow: '0 28px 60px rgba(15, 15, 23, 0.12)',
        },
        elevation8: {
          boxShadow: '0 35px 80px rgba(15, 15, 23, 0.15)',
        },
        elevation12: {
          boxShadow: '0 45px 90px rgba(15, 15, 23, 0.18)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: SURFACE_TOKENS.light.raised,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: 18,
          transition: 'transform 0.3s ease, border-color 0.3s ease',
          '&:hover': {
            borderColor: 'rgba(0, 0, 0, 0.18)',
            boxShadow: '0 24px 55px rgba(15, 15, 23, 0.12)',
            transform: 'translateY(-4px)',
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
          padding: 'clamp(8px, 1vw, 10px) clamp(16px, 2vw, 26px)',
          fontSize: 'clamp(0.875rem, 1vw, 0.95rem)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '44px',
          letterSpacing: '0.02em',
        },
        contained: {
          background: `linear-gradient(135deg, ${BRAND_COLORS.gold} 0%, ${BRAND_COLORS.goldLight} 100%)`,
          color: BRAND_COLORS.black,
          boxShadow: '0 18px 35px rgba(255, 215, 0, 0.35)',
          '&:hover': {
            background: `linear-gradient(135deg, ${BRAND_COLORS.goldLight} 0%, ${BRAND_COLORS.gold} 100%)`,
            boxShadow: '0 24px 55px rgba(255, 215, 0, 0.45)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&:disabled': {
            background: 'rgba(255, 215, 0, 0.35)',
            color: 'rgba(0, 0, 0, 0.35)',
          },
        },
        outlined: {
          borderColor: 'rgba(0, 0, 0, 0.25)',
          borderWidth: '1.5px',
          color: SURFACE_TOKENS.light.textPrimary,
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          '&:hover': {
            borderColor: 'rgba(0, 0, 0, 0.4)',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          },
        },
        text: {
          color: SURFACE_TOKENS.light.textSecondary,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: SURFACE_TOKENS.light.textSecondary,
          transition: 'all 0.2s ease-in-out',
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
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: 8,
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.12)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.32)',
            },
            '&.Mui-focused fieldset': {
              borderColor: BRAND_COLORS.black,
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(0, 0, 0, 0.6)',
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
          backgroundColor: SURFACE_TOKENS.light.surface,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: 12,
          boxShadow: '0 24px 55px rgba(15, 15, 23, 0.12)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.12)',
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
          backgroundColor: BRAND_COLORS.black,
          color: BRAND_COLORS.gold,
          fontWeight: 600,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: SURFACE_TOKENS.light.surface,
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: SURFACE_TOKENS.light.surface,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: 18,
          boxShadow: '0 35px 80px rgba(15, 15, 23, 0.15)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: SURFACE_TOKENS.light.surface,
          color: SURFACE_TOKENS.light.textPrimary,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          fontSize: '0.875rem',
        },
        arrow: {
          color: SURFACE_TOKENS.light.surface,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.06)',
          color: SURFACE_TOKENS.light.textPrimary,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '0 4px',
          color: SURFACE_TOKENS.light.textSecondary,
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
            color: BRAND_COLORS.goldDark,
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
        indicator: {
          backgroundColor: BRAND_COLORS.gold,
          height: 3,
          borderRadius: 2,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 48,
          color: SURFACE_TOKENS.light.textSecondary,
          fontWeight: 600,
          '&.Mui-selected': {
            color: BRAND_COLORS.goldDark,
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: 'none',
          borderColor: 'rgba(0, 0, 0, 0.15)',
          color: SURFACE_TOKENS.light.textSecondary,
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
            color: BRAND_COLORS.goldDark,
            borderColor: 'rgba(0, 0, 0, 0.35)',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 6,
          borderRadius: 999,
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
        },
        bar: {
          borderRadius: 999,
          background: `linear-gradient(90deg, ${BRAND_COLORS.gold} 0%, ${BRAND_COLORS.goldLight} 100%)`,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
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
