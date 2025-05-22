import React from 'react';
import { Box, Button, Container, styled } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const StyledButton = styled(Button)(({ theme, active }) => ({
  color: active ? theme.palette.secondary.main : theme.palette.text.primary,
  borderBottom: active ? `2px solid ${theme.palette.secondary.main}` : 'none',
  borderRadius: 0,
  padding: theme.spacing(2),
  '&:hover': {
    backgroundColor: 'transparent',
    color: theme.palette.secondary.main,
  },
}));

function ServiceNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { path: '/jobs', label: 'Browse Jobs' },
    { path: '/find-work', label: 'Find Work' },
    { path: '/find-talents', label: 'Find Talents' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/whats-new', label: "What's New" },
  ];

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Container>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
          {navigationItems.map((item) => (
            <StyledButton
              key={item.path}
              active={location.pathname === item.path ? 1 : 0}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </StyledButton>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

export default ServiceNavigation; 