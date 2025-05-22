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
    borderRadius: 16
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: {
        xs: '2.5rem',
        sm: '3rem',
        md: '3.75rem',
      },
      fontWeight: 500,
      color: '#ffd700',
    },
    h2: {
      fontSize: {
        xs: '2rem',
        sm: '2.5rem',
        md: '3rem',
      },
      fontWeight: 500,
      color: '#ffd700',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      color: '#ffd700',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#ffd700',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#ffd700',
    },
    h6: {
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
  },
});

export default theme; 