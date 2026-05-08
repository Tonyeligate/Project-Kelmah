import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1f2937',
      light: '#374151',
      dark: '#111827',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#d97706',
      light: '#f59e0b',
      dark: '#92400e',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f6f7fb',
      paper: '#ffffff',
    },
    success: {
      main: '#15803d',
    },
    warning: {
      main: '#b45309',
    },
    error: {
      main: '#b91c1c',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Segoe UI", "Inter", "Roboto", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(17, 24, 39, 0.08)',
          boxShadow: '0 10px 30px rgba(17, 24, 39, 0.05)',
        },
      },
    },
  },
});

export default theme;
