import { createTheme } from '@mui/material/styles';

// Professional color palette for Kelmah job system
const colors = {
  primary: {
    main: '#D4AF37', // Gold
    light: '#FFD700',
    dark: '#B8941F',
    contrastText: '#000000',
  },
  secondary: {
    main: '#1a1a1a', // Black
    light: '#2d2d2d',
    dark: '#0a0a0a',
    contrastText: '#ffffff',
  },
  background: {
    default: '#0a0a0a',
    paper: 'rgba(255,255,255,0.05)',
    elevated: 'rgba(255,255,255,0.08)',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255,255,255,0.7)',
    disabled: 'rgba(255,255,255,0.5)',
  },
  success: {
    main: '#4CAF50',
    light: '#81C784',
    dark: '#388E3C',
  },
  warning: {
    main: '#FF9800',
    light: '#FFB74D',
    dark: '#F57C00',
  },
  error: {
    main: '#F44336',
    light: '#EF5350',
    dark: '#D32F2F',
  },
  info: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1976D2',
  },
};

// Typography scale optimized for Ghana's mobile market
const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  h6: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.6,
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.5,
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'none',
  },
};

// Spacing system (8px base unit)
const spacing = {
  xs: 0.5, // 4px
  sm: 1, // 8px
  md: 2, // 16px
  lg: 3, // 24px
  xl: 4, // 32px
  xxl: 6, // 48px
};

// Breakpoints optimized for Ghana's device landscape
const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  },
};

// Component-specific theme overrides
const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '8px 16px',
        fontWeight: 600,
        textTransform: 'none',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(212,175,55,0.3)',
        },
      },
      contained: {
        background: 'linear-gradient(45deg, #D4AF37 30%, #FFD700 90%)',
        color: '#000000',
        '&:hover': {
          background: 'linear-gradient(45deg, #B8941F 30%, #D4AF37 90%)',
        },
      },
      outlined: {
        borderColor: '#D4AF37',
        color: '#D4AF37',
        '&:hover': {
          backgroundColor: 'rgba(212,175,55,0.1)',
          borderColor: '#FFD700',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: 12,
        backdropFilter: 'blur(10px)',
        '&:hover': {
          border: '1px solid #D4AF37',
          boxShadow: '0 8px 32px rgba(212,175,55,0.3)',
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 8,
          '& fieldset': {
            borderColor: 'rgba(212,175,55,0.3)',
          },
          '&:hover fieldset': {
            borderColor: '#D4AF37',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#D4AF37',
          },
        },
        '& .MuiInputLabel-root': {
          color: 'rgba(255,255,255,0.7)',
          '&.Mui-focused': {
            color: '#D4AF37',
          },
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        backgroundColor: 'rgba(212,175,55,0.2)',
        color: '#D4AF37',
        border: '1px solid rgba(212,175,55,0.3)',
        '&:hover': {
          backgroundColor: 'rgba(212,175,55,0.3)',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(212,175,55,0.1)',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(212,175,55,0.2)',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(212,175,55,0.2)',
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: 16,
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: 'rgba(26, 26, 26, 0.9)',
        color: '#ffffff',
        border: '1px solid rgba(212,175,55,0.3)',
        fontSize: '0.75rem',
      },
    },
  },
};

// Create the theme
const jobSystemTheme = createTheme({
  palette: colors,
  typography,
  spacing,
  breakpoints,
  components,
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 2px 4px rgba(0,0,0,0.1)',
    '0 4px 8px rgba(0,0,0,0.15)',
    '0 8px 16px rgba(0,0,0,0.2)',
    '0 12px 24px rgba(0,0,0,0.25)',
    '0 16px 32px rgba(0,0,0,0.3)',
    '0 20px 40px rgba(0,0,0,0.35)',
    '0 24px 48px rgba(0,0,0,0.4)',
    '0 28px 56px rgba(0,0,0,0.45)',
    '0 32px 64px rgba(0,0,0,0.5)',
    '0 36px 72px rgba(0,0,0,0.55)',
    '0 40px 80px rgba(0,0,0,0.6)',
    '0 44px 88px rgba(0,0,0,0.65)',
    '0 48px 96px rgba(0,0,0,0.7)',
    '0 52px 104px rgba(0,0,0,0.75)',
    '0 56px 112px rgba(0,0,0,0.8)',
    '0 60px 120px rgba(0,0,0,0.85)',
    '0 64px 128px rgba(0,0,0,0.9)',
    '0 68px 136px rgba(0,0,0,0.95)',
    '0 72px 144px rgba(0,0,0,1)',
    '0 76px 152px rgba(0,0,0,1)',
    '0 80px 160px rgba(0,0,0,1)',
    '0 84px 168px rgba(0,0,0,1)',
    '0 88px 176px rgba(0,0,0,1)',
    '0 92px 184px rgba(0,0,0,1)',
  ],
});

export default jobSystemTheme;
