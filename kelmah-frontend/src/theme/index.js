import { createTheme } from '@mui/material/styles';

// Kelmah Brand Colors
const BRAND_COLORS = {
  gold: '#FFD700',
  goldLight: '#FFE55C',
  goldDark: '#B8860B',
  black: '#000000',
  blackLight: '#1a1a1a',
  blackMedium: '#2c2c2c',
  white: '#FFFFFF',
  whiteLight: '#FAFAFA',
  whiteDark: '#F5F5F5',
};

// Dark Theme (Primary)
const darkTheme = createTheme({
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
    divider: `rgba(255, 215, 0, 0.12)`,
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
  },
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
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '3.5rem',
      fontWeight: 700,
      color: BRAND_COLORS.gold,
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '2.75rem',
      fontWeight: 600,
      color: BRAND_COLORS.gold,
      lineHeight: 1.3,
    },
    h3: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '2.25rem',
      fontWeight: 600,
      color: BRAND_COLORS.gold,
      lineHeight: 1.3,
    },
    h4: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '1.75rem',
      fontWeight: 600,
      color: BRAND_COLORS.gold,
      lineHeight: 1.4,
    },
    h5: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '1.5rem',
      fontWeight: 600,
      color: BRAND_COLORS.gold,
      lineHeight: 1.4,
    },
    h6: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '1.25rem',
      fontWeight: 600,
      color: BRAND_COLORS.gold,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      color: BRAND_COLORS.white,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      color: BRAND_COLORS.white,
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
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
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: BRAND_COLORS.black,
          borderBottom: `1px solid rgba(255, 215, 0, 0.2)`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 24px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
        },
        outlined: {
          borderColor: BRAND_COLORS.gold,
          borderWidth: '2px',
          color: BRAND_COLORS.gold,
          '&:hover': {
            borderColor: BRAND_COLORS.goldLight,
            backgroundColor: `rgba(255, 215, 0, 0.08)`,
            borderWidth: '2px',
          },
        },
        text: {
          color: BRAND_COLORS.gold,
          '&:hover': {
            backgroundColor: `rgba(255, 215, 0, 0.08)`,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: `rgba(255, 255, 255, 0.05)`,
            borderRadius: 8,
            '& fieldset': {
              borderColor: `rgba(255, 215, 0, 0.3)`,
            },
            '&:hover fieldset': {
              borderColor: `rgba(255, 215, 0, 0.6)`,
            },
            '&.Mui-focused fieldset': {
              borderColor: BRAND_COLORS.gold,
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            color: `rgba(255, 255, 255, 0.7)`,
            '&.Mui-focused': {
              color: BRAND_COLORS.gold,
            },
          },
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
            borderColor: `rgba(255, 215, 0, 0.4)`,
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
            borderColor: `rgba(255, 215, 0, 0.4)`,
            boxShadow: '0 8px 25px rgba(255, 215, 0, 0.15)',
            transform: 'translateY(-2px)',
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
            backgroundColor: `rgba(255, 215, 0, 0.1)`,
          },
          '&.Mui-selected': {
            backgroundColor: `rgba(255, 215, 0, 0.15)`,
            '&:hover': {
              backgroundColor: `rgba(255, 215, 0, 0.2)`,
            },
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
            backgroundColor: `rgba(255, 215, 0, 0.1)`,
            transform: 'scale(1.05)',
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
});

// Light Theme
const lightTheme = createTheme({
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
      default: BRAND_COLORS.goldLight, // Changed from whiteLight to goldLight
      paper: BRAND_COLORS.gold, // Changed from white to gold
    },
    text: {
      primary: BRAND_COLORS.black,
      secondary: BRAND_COLORS.blackLight,
    },
    divider: `rgba(0, 0, 0, 0.15)`,
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
  breakpoints: darkTheme.breakpoints,
  shape: darkTheme.shape,
  typography: {
    ...darkTheme.typography,
    h1: { ...darkTheme.typography.h1, color: BRAND_COLORS.black },
    h2: { ...darkTheme.typography.h2, color: BRAND_COLORS.black },
    h3: { ...darkTheme.typography.h3, color: BRAND_COLORS.black },
    h4: { ...darkTheme.typography.h4, color: BRAND_COLORS.black },
    h5: { ...darkTheme.typography.h5, color: BRAND_COLORS.black },
    h6: { ...darkTheme.typography.h6, color: BRAND_COLORS.black },
    body1: { ...darkTheme.typography.body1, color: BRAND_COLORS.black },
    body2: { ...darkTheme.typography.body2, color: BRAND_COLORS.black },
  },
  components: {
    ...darkTheme.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: `${BRAND_COLORS.black} ${BRAND_COLORS.goldLight}`,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: BRAND_COLORS.goldLight,
          },
          '&::-webkit-scrollbar-thumb': {
            background: BRAND_COLORS.black,
            borderRadius: '4px',
            '&:hover': {
              background: BRAND_COLORS.blackLight,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: BRAND_COLORS.gold, // Changed from white to gold
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
          backgroundColor: BRAND_COLORS.goldLight, // Changed from white to goldLight
          border: `1px solid rgba(0, 0, 0, 0.15)`,
          borderRadius: 12,
          '&:hover': {
            borderColor: `rgba(0, 0, 0, 0.25)`,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: BRAND_COLORS.goldLight, // Changed from white to goldLight
          border: `1px solid rgba(0, 0, 0, 0.15)`,
          '&:hover': {
            borderColor: `rgba(0, 0, 0, 0.25)`,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: `rgba(255, 255, 255, 0.6)`, // Semi-transparent white over gold
            '& fieldset': {
              borderColor: `rgba(0, 0, 0, 0.25)`,
            },
            '&:hover fieldset': {
              borderColor: `rgba(0, 0, 0, 0.4)`,
            },
            '&.Mui-focused fieldset': {
              borderColor: BRAND_COLORS.black,
            },
          },
          '& .MuiInputLabel-root': {
            color: `rgba(0, 0, 0, 0.7)`,
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
          backgroundColor: BRAND_COLORS.goldLight, // Changed from white to goldLight
          border: `1px solid rgba(0, 0, 0, 0.2)`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: `rgba(0, 0, 0, 0.08)`,
          },
          '&.Mui-selected': {
            backgroundColor: `rgba(0, 0, 0, 0.12)`,
            '&:hover': {
              backgroundColor: `rgba(0, 0, 0, 0.16)`,
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: BRAND_COLORS.black,
          '&:hover': {
            backgroundColor: `rgba(0, 0, 0, 0.08)`,
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
          padding: '8px 24px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
        },
        outlined: {
          borderColor: BRAND_COLORS.black,
          borderWidth: '2px',
          color: BRAND_COLORS.black,
          '&:hover': {
            borderColor: BRAND_COLORS.blackLight,
            backgroundColor: `rgba(0, 0, 0, 0.08)`,
            borderWidth: '2px',
          },
        },
        text: {
          color: BRAND_COLORS.black,
          '&:hover': {
            backgroundColor: `rgba(0, 0, 0, 0.08)`,
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: BRAND_COLORS.gold, // Changed from white to gold
          borderRight: `1px solid rgba(0, 0, 0, 0.15)`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: BRAND_COLORS.goldLight, // Changed from white to goldLight
          border: `2px solid ${BRAND_COLORS.black}`,
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
        },
        arrow: {
          color: BRAND_COLORS.black,
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
  },
});

// Export both themes
export default darkTheme;
export { lightTheme, BRAND_COLORS };
