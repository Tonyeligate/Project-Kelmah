import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1C1C1C',
      light: '#363636',
      dark: '#000000',
      contrastText: '#FFD700',
    },
    secondary: {
      main: '#FFD700',
      light: '#FFE44D',
      dark: '#C7A900',
      contrastText: '#1C1C1C',
    },
    background: {
      default: '#1C1C1C',
      paper: '#1C1C1C',
    },
    text: {
      primary: '#FFD700',
      secondary: '#FFE44D',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#1C1C1C',
          scrollBehavior: 'smooth',
        },
        // ✅ MOBILE-AUDIT FIX: Removed wildcard '* { transition: all 0.2s }'
        // It caused scroll jank, dropped frames & battery drain on mobile.
        // Transitions are now applied only on specific components that need them.
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1C1C1C',
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(255, 215, 0, 0.15)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '8px 24px',
          transition: 'all 0.3s ease-in-out',
        },
      },
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      color: '#FFD700',
    },
    h2: {
      color: '#FFD700',
    },
    h3: {
      color: '#FFD700',
    },
    h4: {
      color: '#FFD700',
    },
    h5: {
      color: '#FFD700',
    },
    h6: {
      color: '#FFD700',
    },
  },
});

export default theme;
