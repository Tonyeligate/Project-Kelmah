import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1a1a1a',
      light: '#2c2c2c',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FFD700',
      light: '#FFE55C',
      dark: '#c7a600',
      contrastText: '#000000',
    },
    background: {
      default: '#1a1a1a',
      paper: '#2c2c2c',
    },
    text: {
      primary: '#ffffff',
      secondary: '#ffd700',
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
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: {
        xs: '2.5rem',
        sm: '3rem',
        md: '3.75rem',
      },
      fontWeight: 500,
      color: '#ffd700',
    },
    h2: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: {
        xs: '2rem',
        sm: '2.5rem',
        md: '3rem',
      },
      fontWeight: 500,
      color: '#ffd700',
    },
    h3: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '1.75rem',
      fontWeight: 500,
      color: '#ffd700',
    },
    h4: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#ffd700',
    },
    h5: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#ffd700',
    },
    h6: {
      fontFamily: '"Montserrat", sans-serif',
      fontSize: '1.1rem',
      fontWeight: 600,
      color: '#ffd700',
    },
    body1: {
      fontSize: '1rem',
      color: '#ffffff',
    },
    body2: {
      fontSize: '0.875rem',
      color: '#ffffff',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: {
            xs: 4,
            sm: 8,
          },
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(255, 215, 0, 0.2)',
          },
        },
        containedSecondary: {
          backgroundColor: '#ffd700',
          color: '#000000',
          boxShadow: '0 2px 8px rgba(255, 215, 0, 0.4)',
          '&:hover': {
            backgroundColor: '#ffeb52',
          },
        },
        outlinedSecondary: {
          borderColor: '#ffd700',
          borderWidth: '2px',
          color: '#ffd700',
          '&:hover': {
            borderColor: '#ffeb52',
            backgroundColor: 'rgba(255, 235, 82, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#ffd700',
            },
            '&:hover fieldset': {
              borderColor: '#ffff52',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#ffd700',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#2c2c2c',
          backgroundImage: 'none',
          border: '1px solid #ffd700',
          transition:
            'box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 0 16px rgba(255, 215, 0, 0.5)',
            borderColor: '#ffeb52',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: {
            xs: 2,
            sm: 3,
          },
          paddingRight: {
            xs: 2,
            sm: 3,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: {
            xs: 8,
            sm: 12,
          },
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 0 12px rgba(255, 215, 0, 0.3)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1a1a1a',
          borderRight: '1px solid rgba(255, 215, 0, 0.1)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          padding: '24px',
          backgroundColor: '#2c2c2c',
          border: '2px solid #ffd700',
          boxShadow: '0 0 16px rgba(255, 215, 0, 0.5)',
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
          backgroundColor: '#333',
          color: '#fff',
          fontSize: '0.875rem',
        },
        arrow: {
          color: '#333',
        },
      },
    },
  },
  transitions: {
    duration: {
      shortest: 200,
      shorter: 250,
      short: 300,
      standard: 500,
      complex: 700,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
});

export default theme;

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      contrastText: '#ffffff',
    },
    secondary: theme.palette.secondary,
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#555555',
    },
  },
  breakpoints: theme.breakpoints,
  shape: theme.shape,
  typography: theme.typography,
  components: theme.components,
});
