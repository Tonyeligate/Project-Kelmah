import React from 'react';
import { Box, styled } from '@mui/material';
import { Link as RouterLink, NavLink, useLocation } from 'react-router-dom';
import useNavLinks from '../../../hooks/useNavLinks';
import { useAuth } from '../../auth/contexts/AuthContext';

// Styled components
const StyledNavLink = styled(NavLink)(({ theme }) => ({
  margin: '0 12px',
  padding: '8px 16px',
  borderRadius: '20px',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.95rem',
  transition: 'all 0.3s ease-in-out',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-1px)',
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
  },
  '&.active': {
    color: theme.palette.secondary.main,
    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
    fontWeight: 700,
  },
  '&:not(.active)': {
    color: theme.palette.text.primary,
  },
}));

const DesktopNav = () => {
  const location = useLocation();
  const { isInitialized } = useAuth();
  const { navLinks } = useNavLinks();

  // Show loading state during initialization
  if (!isInitialized) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: 200, height: 40 }} /> {/* Placeholder */}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* 🎯 NAVIGATION LINKS ONLY - All action items handled by Header component */}
      {navLinks.map(({ label, to }) => (
        <StyledNavLink key={to} to={to}>
          {label}
        </StyledNavLink>
      ))}
      
      {/* 🚨 REMOVED: All duplicate elements (messages, notifications, user avatar, auth buttons)
          These are now handled exclusively by Header component to prevent duplication */}
    </Box>
  );
};

export default DesktopNav;
