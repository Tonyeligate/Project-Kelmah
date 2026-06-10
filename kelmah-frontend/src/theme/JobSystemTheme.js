import { createTheme } from '@mui/material/styles';
import kelmahTokens from '../../kelmah-design-tokens.cjs';

const { color, radius, spacing: baseSpacing, typography: tokenTypography } = kelmahTokens;

// Professional Kelmah palette sourced from shared design tokens.
const colors = {
  primary: {
    main: color.gold,
    light: color.goldBright,
    dark: color.goldMuted,
    contrastText: '#000000',
  },
  secondary: {
    main: color.navyContainer,
    light: color.darkSurfaceElevated,
    dark: color.navy,
    contrastText: color.darkOnSurface,
  },
  background: {
    default: color.darkBackground,
    paper: 'rgba(26, 29, 38, 0.82)',
    elevated: 'rgba(34, 37, 48, 0.90)',
  },
  text: {
    primary: color.darkOnSurface,
    secondary: 'rgba(247, 243, 227, 0.84)',
    disabled: color.darkOnSurfaceMuted,
  },
  success: {
    main: color.accentPositive,
    light: '#67DCA6',
    dark: '#1C8F5C',
  },
  warning: {
    main: color.accentWarning,
    light: '#FFC56D',
    dark: '#C77912',
  },
  error: {
    main: color.error,
    light: '#FF9B9B',
    dark: '#C94444',
  },
  info: {
    main: color.accentInfo,
    light: '#8CC3FF',
    dark: '#2F75C9',
  },
};

// Typography scale optimized for Ghana's mobile market
const typography = {
  fontFamily: tokenTypography.fontFamily,
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
const spacing = baseSpacing;

// Breakpoints optimized for Ghana's device landscape
const breakpoints = {
  values: {
    xs: 0,
    mobileCompact: 390,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  },
};

// Component-specific theme overrides
const components = {
  MuiCssBaseline: {
    styleOverrides: {
      '@media (forced-colors: active)': {
        '*': {
          forcedColorAdjust: 'auto',
        },
      },
      '@media (prefers-contrast: more)': {
        'a, button, [role="button"], input, textarea, select': {
          outlineWidth: '2px',
          outlineStyle: 'solid',
          outlineColor: color.gold,
          outlineOffset: '2px',
        },
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '8px 16px',
        minHeight: 44,
        fontWeight: 600,
        textTransform: 'none',
        transition: 'all 0.2s ease-in-out',
        '&:focus-visible': {
          outline: `3px solid ${color.gold}`,
          outlineOffset: 2,
        },
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(255, 211, 77, 0.25)',
        },
      },
      contained: {
        background: `linear-gradient(45deg, ${color.goldMuted} 0%, ${color.gold} 55%, ${color.goldBright} 100%)`,
        color: '#000000',
        '&:hover': {
          background: `linear-gradient(45deg, ${color.goldMuted} 0%, ${color.gold} 100%)`,
        },
      },
      outlined: {
        borderColor: color.gold,
        color: color.gold,
        '&:hover': {
          backgroundColor: 'rgba(255, 211, 77, 0.10)',
          borderColor: color.goldBright,
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundColor: 'rgba(26, 29, 38, 0.72)',
        border: `1px solid ${color.darkOutline}`,
        borderRadius: radius.sm,
        backdropFilter: 'blur(10px)',
        '&:hover': {
          border: `1px solid ${color.gold}`,
          boxShadow: '0 8px 32px rgba(255, 211, 77, 0.20)',
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'rgba(34, 37, 48, 0.72)',
          borderRadius: radius.xs,
          '& fieldset': {
            borderColor: color.darkOutline,
          },
          '&:hover fieldset': {
            borderColor: color.gold,
          },
          '&.Mui-focused fieldset': {
            borderColor: color.gold,
          },
        },
        '& .MuiInputLabel-root': {
          color: color.darkOnSurfaceMuted,
          '&.Mui-focused': {
            color: color.gold,
          },
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        backgroundColor: 'rgba(255, 211, 77, 0.16)',
        color: color.gold,
        border: `1px solid ${color.darkOutline}`,
        '&:hover': {
          backgroundColor: 'rgba(255, 211, 77, 0.24)',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundColor: 'rgba(26, 29, 38, 0.72)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 211, 77, 0.12)',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: 'rgba(16, 17, 22, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${color.darkOutline}`,
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundColor: 'rgba(16, 17, 22, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRight: `1px solid ${color.darkOutline}`,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        backgroundColor: 'rgba(26, 29, 38, 0.95)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${color.darkOutline}`,
        borderRadius: radius.md,
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: 'rgba(16, 17, 22, 0.92)',
        color: color.darkOnSurface,
        border: `1px solid ${color.darkOutline}`,
        fontSize: '0.75rem',
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        minWidth: 44,
        minHeight: 44,
        '&:focus-visible': {
          outline: `3px solid ${color.gold}`,
          outlineOffset: 2,
        },
      },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: {
        '&:focus-visible': {
          outline: `2px solid ${color.gold}`,
          outlineOffset: 2,
          borderRadius: 2,
        },
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
    borderRadius: radius.xs,
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
