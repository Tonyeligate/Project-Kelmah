import React from 'react';
import { Box, Typography, MenuItem, ListItemIcon, ListItemText } from '@mui/material';

/**
 * NavMenuSection — renders a titled group of menu items inside the user dropdown.
 * Extracted from Header.jsx for maintainability.
 */
const NavMenuSection = ({ title, items, onNavigate }) => (
  <Box sx={{ py: 1, px: 2 }}>
    <Typography
      variant="overline"
      sx={{ fontSize: '0.65rem', color: 'text.secondary' }}
    >
      {title}
    </Typography>
    {items.filter(Boolean).map((item) => (
      <MenuItem
        key={item.label}
        onClick={() => {
          onNavigate(item.path);
          item.onClick?.();
        }}
        sx={{ py: 1.25 }}
      >
        <ListItemIcon>{item.icon}</ListItemIcon>
        <ListItemText
          primary={item.label}
          secondary={item.description}
          secondaryTypographyProps={{ variant: 'caption' }}
        />
      </MenuItem>
    ))}
  </Box>
);

export default NavMenuSection;
