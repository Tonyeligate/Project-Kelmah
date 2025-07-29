import { createTheme } from '@mui/material/styles';
import { PRIMARY_COLORS, SEMANTIC_COLORS, THEME_COLORS, BRAND_GRADIENTS } from '../foundations/colors';
import { TYPOGRAPHY_SCALE, FONT_FAMILIES, FONT_WEIGHTS } from '../foundations/typography';
import { SPACING, SEMANTIC_SPACING, BORDER_RADIUS, SHADOW_SPACING, Z_INDEX } from '../foundations/spacing';

/**
 * Kelmah Design System - Comprehensive Theme
 * 
 * Integrates all design foundations into a cohesive theme system
 * Provides both dark and light themes with consistent branding
 */

// Base theme configuration shared between dark and light themes
const baseTheme = {
  breakpoints: {
    values: {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    },
  },
  
  shape: {
    borderRadius: parseInt(BORDER_RADIUS.md),
  },
  
  spacing: (factor) => `${factor * 4}px`,
  
  typography: {
    fontFamily: FONT_FAMILIES.primary,
    
    // Map design system typography to Material-UI variants
    h1: {
      ...TYPOGRAPHY_SCALE['display-lg'],
      '@media (max-width: 768px)': {
        ...TYPOGRAPHY_SCALE['display-md'],
      },
    },
    h2: {
      ...TYPOGRAPHY_SCALE['display-md'],
      '@media (max-width: 768px)': {
        ...TYPOGRAPHY_SCALE['display-sm'],
      },
    },
    h3: {
      ...TYPOGRAPHY_SCALE['display-sm'],
      '@media (max-width: 768px)': {
        ...TYPOGRAPHY_SCALE['heading-xl'],
      },
    },
    h4: {
      ...TYPOGRAPHY_SCALE['heading-xl'],
      '@media (max-width: 768px)': {
        ...TYPOGRAPHY_SCALE['heading-lg'],
      },
    },
    h5: {
      ...TYPOGRAPHY_SCALE['heading-lg'],
    },
    h6: {
      ...TYPOGRAPHY_SCALE['heading-md'],
    },
    
    body1: TYPOGRAPHY_SCALE['body-md'],
    body2: TYPOGRAPHY_SCALE['body-sm'],
    
    subtitle1: {
      ...TYPOGRAPHY_SCALE['body-lg'],
      fontWeight: FONT_WEIGHTS.medium,
    },
    subtitle2: {
      ...TYPOGRAPHY_SCALE['body-md'],
      fontWeight: FONT_WEIGHTS.medium,
    },
    
    button: {
      ...TYPOGRAPHY_SCALE['label-md'],
      textTransform: 'none',
    },
    
    caption: TYPOGRAPHY_SCALE['caption-md'],
    overline: TYPOGRAPHY_SCALE['overline-md'],
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
  
  zIndex: Z_INDEX,
};

// Dark theme
const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: PRIMARY_COLORS.gold[500],
      light: PRIMARY_COLORS.gold[400],
      dark: PRIMARY_COLORS.gold[600],
      contrastText: PRIMARY_COLORS.black[900],
    },
    secondary: {
      main: PRIMARY_COLORS.black[900],
      light: PRIMARY_COLORS.black[800],
      dark: PRIMARY_COLORS.black[900],
      contrastText: PRIMARY_COLORS.gold[500],
    },
    background: {
      default: THEME_COLORS.dark.background.primary,
      paper: THEME_COLORS.dark.background.secondary,
    },
    text: {
      primary: THEME_COLORS.dark.text.primary,
      secondary: THEME_COLORS.dark.text.secondary,
      disabled: THEME_COLORS.dark.text.disabled,
    },
    divider: THEME_COLORS.dark.border.secondary,
    action: {
      hover: THEME_COLORS.dark.interactive.hover,
      selected: THEME_COLORS.dark.interactive.active,
      disabled: THEME_COLORS.dark.interactive.disabled,
      focus: THEME_COLORS.dark.interactive.focus,
    },
    error: {
      main: SEMANTIC_COLORS.error[500],
      light: SEMANTIC_COLORS.error[400],
      dark: SEMANTIC_COLORS.error[600],
    },
    warning: {
      main: SEMANTIC_COLORS.warning[500],
      light: SEMANTIC_COLORS.warning[400],
      dark: SEMANTIC_COLORS.warning[600],
    },
    info: {
      main: SEMANTIC_COLORS.info[500],
      light: SEMANTIC_COLORS.info[400],
      dark: SEMANTIC_COLORS.info[600],
    },
    success: {
      main: SEMANTIC_COLORS.success[500],
      light: SEMANTIC_COLORS.success[400],
      dark: SEMANTIC_COLORS.success[600],
    },
  },
  
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: THEME_COLORS.dark.background.primary,
          color: THEME_COLORS.dark.text.primary,
          fontFamily: FONT_FAMILIES.primary,
          fontSize: TYPOGRAPHY_SCALE['body-md'].fontSize,
          lineHeight: TYPOGRAPHY_SCALE['body-md'].lineHeight,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          
          // Custom scrollbar
          scrollbarWidth: 'thin',
          scrollbarColor: `${PRIMARY_COLORS.gold[500]} ${THEME_COLORS.dark.background.secondary}`,
          
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: THEME_COLORS.dark.background.secondary,
          },
          '&::-webkit-scrollbar-thumb': {
            background: PRIMARY_COLORS.gold[500],
            borderRadius: BORDER_RADIUS.sm,
            '&:hover': {
              background: PRIMARY_COLORS.gold[400],
            },
          },
        },
        
        // Selection colors
        '::selection': {
          backgroundColor: PRIMARY_COLORS.gold[500],
          color: PRIMARY_COLORS.black[900],
        },
        
        // Focus outline
        '*:focus-visible': {
          outline: `2px solid ${PRIMARY_COLORS.gold[500]}`,
          outlineOffset: '2px',
        },
      },
    },
    
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: SEMANTIC_SPACING.container.xs,
          paddingRight: SEMANTIC_SPACING.container.xs,
          '@media (min-width: 640px)': {
            paddingLeft: SEMANTIC_SPACING.container.sm,
            paddingRight: SEMANTIC_SPACING.container.sm,
          },
          '@media (min-width: 768px)': {
            paddingLeft: SEMANTIC_SPACING.container.md,
            paddingRight: SEMANTIC_SPACING.container.md,
          },
          '@media (min-width: 1024px)': {
            paddingLeft: SEMANTIC_SPACING.container.lg,
            paddingRight: SEMANTIC_SPACING.container.lg,
          },
        },
      },
    },
    
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: THEME_COLORS.dark.background.secondary,
          backgroundImage: 'none',
          border: `1px solid ${THEME_COLORS.dark.border.primary}`,
          borderRadius: BORDER_RADIUS.lg,
          transition: 'all 0.3s ease-in-out',
          
          '&:hover': {
            borderColor: THEME_COLORS.dark.border.focus,
            boxShadow: `0 0 0 1px ${THEME_COLORS.dark.border.focus}`,
          },
        },
        elevation1: { boxShadow: SHADOW_SPACING.sm },
        elevation2: { boxShadow: SHADOW_SPACING.md },
        elevation4: { boxShadow: SHADOW_SPACING.lg },
        elevation8: { boxShadow: SHADOW_SPACING.xl },
        elevation12: { boxShadow: SHADOW_SPACING['2xl'] },
      },
    },
    
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: THEME_COLORS.dark.background.secondary,
          border: `1px solid ${THEME_COLORS.dark.border.primary}`,
          borderRadius: BORDER_RADIUS.lg,
          transition: 'all 0.3s ease-in-out',
          
          '&:hover': {
            borderColor: THEME_COLORS.dark.border.focus,
            transform: 'translateY(-2px)',
            boxShadow: SHADOW_SPACING.lg,
          },
        },
      },
    },
    
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS.md,
          textTransform: 'none',
          fontWeight: FONT_WEIGHTS.semibold,
          fontSize: TYPOGRAPHY_SCALE['label-md'].fontSize,
          lineHeight: TYPOGRAPHY_SCALE['label-md'].lineHeight,
          padding: SEMANTIC_SPACING.button.padding.sm,
          minHeight: '44px', // Accessibility - minimum touch target
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        
        contained: {
          background: BRAND_GRADIENTS.gold,
          color: PRIMARY_COLORS.black[900],
          boxShadow: SHADOW_SPACING.md,
          
          '&:hover': {
            background: BRAND_GRADIENTS.goldLight,
            boxShadow: SHADOW_SPACING.lg,
          },
          
          '&:disabled': {
            background: THEME_COLORS.dark.interactive.disabled,
            color: THEME_COLORS.dark.text.disabled,
          },
        },
        
        outlined: {
          borderColor: PRIMARY_COLORS.gold[500],
          borderWidth: '2px',
          color: PRIMARY_COLORS.gold[500],
          backgroundColor: 'transparent',
          
          '&:hover': {
            borderColor: PRIMARY_COLORS.gold[400],
            backgroundColor: THEME_COLORS.dark.interactive.hover,
            borderWidth: '2px',
          },
        },
        
        text: {
          color: PRIMARY_COLORS.gold[500],
          
          '&:hover': {
            backgroundColor: THEME_COLORS.dark.interactive.hover,
          },
        },
        
        sizeSmall: {
          padding: SEMANTIC_SPACING.button.padding.xs,
          fontSize: TYPOGRAPHY_SCALE['label-sm'].fontSize,
          minHeight: '36px',
        },
        
        sizeLarge: {
          padding: SEMANTIC_SPACING.button.padding.lg,
          fontSize: TYPOGRAPHY_SCALE['label-lg'].fontSize,
          minHeight: '52px',
        },
      },
    },
    
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: PRIMARY_COLORS.gold[500],
          borderRadius: BORDER_RADIUS.md,
          transition: 'all 0.3s ease-in-out',
          
          '&:hover': {
            backgroundColor: THEME_COLORS.dark.interactive.hover,
            transform: 'scale(1.05)',
          },
        },
      },
    },
    
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: THEME_COLORS.dark.background.tertiary,
            borderRadius: BORDER_RADIUS.md,
            
            '& fieldset': {
              borderColor: THEME_COLORS.dark.border.primary,
              borderWidth: '1px',
            },
            
            '&:hover fieldset': {
              borderColor: THEME_COLORS.dark.border.focus,
            },
            
            '&.Mui-focused fieldset': {
              borderColor: PRIMARY_COLORS.gold[500],
              borderWidth: '2px',
            },
          },
          
          '& .MuiInputLabel-root': {
            color: THEME_COLORS.dark.text.secondary,
            
            '&.Mui-focused': {
              color: PRIMARY_COLORS.gold[500],
            },
          },
        },
      },
    },
    
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: THEME_COLORS.dark.interactive.hover,
          color: THEME_COLORS.dark.text.primary,
          borderRadius: BORDER_RADIUS.full,
          
          '&:hover': {
            backgroundColor: THEME_COLORS.dark.interactive.active,
          },
        },
        
        colorPrimary: {
          backgroundColor: `${PRIMARY_COLORS.gold[500]}20`,
          color: PRIMARY_COLORS.gold[500],
          border: `1px solid ${PRIMARY_COLORS.gold[500]}40`,
        },
      },
    },
    
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: PRIMARY_COLORS.gold[500],
          color: PRIMARY_COLORS.black[900],
          fontWeight: FONT_WEIGHTS.semibold,
        },
      },
    },
    
    MuiBadge: {
      styleOverrides: {
        badge: {
          backgroundColor: PRIMARY_COLORS.gold[500],
          color: PRIMARY_COLORS.black[900],
          fontWeight: FONT_WEIGHTS.semibold,
          fontSize: TYPOGRAPHY_SCALE['caption-md'].fontSize,
        },
      },
    },
    
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: THEME_COLORS.dark.background.primary,
          borderBottom: `1px solid ${THEME_COLORS.dark.border.primary}`,
          boxShadow: SHADOW_SPACING.lg,
          backdropFilter: 'blur(20px)',
        },
      },
    },
    
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: THEME_COLORS.dark.background.primary,
          borderRight: `1px solid ${THEME_COLORS.dark.border.primary}`,
        },
      },
    },
    
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: THEME_COLORS.dark.background.secondary,
          border: `1px solid ${THEME_COLORS.dark.border.primary}`,
          borderRadius: BORDER_RADIUS.lg,
          boxShadow: SHADOW_SPACING.xl,
          backdropFilter: 'blur(20px)',
        },
      },
    },
    
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS.sm,
          margin: '2px 8px',
          
          '&:hover': {
            backgroundColor: THEME_COLORS.dark.interactive.hover,
          },
          
          '&.Mui-selected': {
            backgroundColor: THEME_COLORS.dark.interactive.active,
            
            '&:hover': {
              backgroundColor: THEME_COLORS.dark.interactive.focus,
            },
          },
        },
      },
    },
    
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: THEME_COLORS.dark.background.secondary,
          border: `2px solid ${PRIMARY_COLORS.gold[500]}`,
          borderRadius: BORDER_RADIUS.xl,
          boxShadow: SHADOW_SPACING['2xl'],
          backdropFilter: 'blur(20px)',
        },
      },
    },
    
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: THEME_COLORS.dark.background.elevated,
          color: THEME_COLORS.dark.text.primary,
          border: `1px solid ${THEME_COLORS.dark.border.primary}`,
          borderRadius: BORDER_RADIUS.md,
          fontSize: TYPOGRAPHY_SCALE['caption-md'].fontSize,
          boxShadow: SHADOW_SPACING.lg,
        },
        arrow: {
          color: THEME_COLORS.dark.background.elevated,
        },
      },
    },
  },
});

// Light theme
const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: PRIMARY_COLORS.gold[500],
      light: PRIMARY_COLORS.gold[400],
      dark: PRIMARY_COLORS.gold[600],
      contrastText: PRIMARY_COLORS.black[900],
    },
    secondary: {
      main: PRIMARY_COLORS.black[900],
      light: PRIMARY_COLORS.black[700],
      dark: PRIMARY_COLORS.black[900],
      contrastText: PRIMARY_COLORS.white[50],
    },
    background: {
      default: THEME_COLORS.light.background.primary,
      paper: THEME_COLORS.light.background.secondary,
    },
    text: {
      primary: THEME_COLORS.light.text.primary,
      secondary: THEME_COLORS.light.text.secondary,
      disabled: THEME_COLORS.light.text.disabled,
    },
    divider: THEME_COLORS.light.border.secondary,
    action: {
      hover: THEME_COLORS.light.interactive.hover,
      selected: THEME_COLORS.light.interactive.active,
      disabled: THEME_COLORS.light.interactive.disabled,
      focus: THEME_COLORS.light.interactive.focus,
    },
    error: {
      main: SEMANTIC_COLORS.error[600],
      light: SEMANTIC_COLORS.error[500],
      dark: SEMANTIC_COLORS.error[700],
    },
    warning: {
      main: SEMANTIC_COLORS.warning[600],
      light: SEMANTIC_COLORS.warning[500],
      dark: SEMANTIC_COLORS.warning[700],
    },
    info: {
      main: SEMANTIC_COLORS.info[600],
      light: SEMANTIC_COLORS.info[500],
      dark: SEMANTIC_COLORS.info[700],
    },
    success: {
      main: SEMANTIC_COLORS.success[600],
      light: SEMANTIC_COLORS.success[500],
      dark: SEMANTIC_COLORS.success[700],
    },
  },
  
  components: {
    // Inherit dark theme components and override specific colors
    ...darkTheme.components,
    
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: THEME_COLORS.light.background.primary,
          color: THEME_COLORS.light.text.primary,
          
          // Custom scrollbar for light theme
          scrollbarColor: `${PRIMARY_COLORS.black[900]} ${THEME_COLORS.light.background.secondary}`,
          
          '&::-webkit-scrollbar-track': {
            background: THEME_COLORS.light.background.secondary,
          },
          '&::-webkit-scrollbar-thumb': {
            background: PRIMARY_COLORS.black[900],
            '&:hover': {
              background: PRIMARY_COLORS.black[800],
            },
          },
        },
        
        '::selection': {
          backgroundColor: PRIMARY_COLORS.black[900],
          color: PRIMARY_COLORS.gold[500],
        },
      },
    },
    
    MuiButton: {
      styleOverrides: {
        ...darkTheme.components.MuiButton.styleOverrides,
        contained: {
          background: BRAND_GRADIENTS.black,
          color: PRIMARY_COLORS.gold[500],
          
          '&:hover': {
            background: BRAND_GRADIENTS.blackLight,
          },
        },
        
        outlined: {
          borderColor: PRIMARY_COLORS.black[900],
          color: PRIMARY_COLORS.black[900],
          
          '&:hover': {
            borderColor: PRIMARY_COLORS.black[700],
            backgroundColor: THEME_COLORS.light.interactive.hover,
          },
        },
        
        text: {
          color: PRIMARY_COLORS.black[900],
          
          '&:hover': {
            backgroundColor: THEME_COLORS.light.interactive.hover,
          },
        },
      },
    },
    
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: PRIMARY_COLORS.black[900],
          
          '&:hover': {
            backgroundColor: THEME_COLORS.light.interactive.hover,
          },
        },
      },
    },
    
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: PRIMARY_COLORS.black[900],
          color: PRIMARY_COLORS.gold[500],
        },
      },
    },
    
    MuiBadge: {
      styleOverrides: {
        badge: {
          backgroundColor: PRIMARY_COLORS.black[900],
          color: PRIMARY_COLORS.gold[500],
        },
      },
    },
  },
});

// Export themes and utilities
export { darkTheme, lightTheme };
export default darkTheme;

// Theme utilities
export const getThemeColor = (theme, colorPath) => {
  const paths = colorPath.split('.');
  return paths.reduce((obj, path) => obj?.[path], theme.palette);
};

export const createCustomTheme = (customizations = {}) => {
  return createTheme({
    ...baseTheme,
    ...customizations,
  });
};

export {
  PRIMARY_COLORS,
  SEMANTIC_COLORS,
  THEME_COLORS,
  BRAND_GRADIENTS,
  TYPOGRAPHY_SCALE,
  SPACING,
  SEMANTIC_SPACING,
  BORDER_RADIUS,
  SHADOW_SPACING,
  Z_INDEX,
}; 