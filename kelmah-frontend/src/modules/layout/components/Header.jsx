import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { Link as RouterLink } from 'react-router-dom';
import DesktopNav from './DesktopNav';
import MobileNav from './MobileNav';

const Header = ({ toggleTheme, mode }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: theme.palette.secondary.main,
        ...(import.meta.env.DEV && {
          '&::after': {
            content: '"DEV MODE"',
            position: 'absolute',
            top: '5px',
            right: '5px',
            fontSize: '10px',
            padding: '2px 5px',
            background: theme.palette.error.main,
            color: 'white',
            borderRadius: '2px',
          },
        }),
      }}
    >
      <Toolbar>
        {/* Logo */}
        <Box
          component={RouterLink}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'black',
            mr: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '1.5rem',
              color: 'black',
              letterSpacing: '0.05em',
            }}
          >
            Kelmah
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {!isMobile ? <DesktopNav /> : <MobileNav />}
        {/* Theme toggle */}
        <IconButton color="inherit" onClick={toggleTheme} sx={{ ml: 1 }}>
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
