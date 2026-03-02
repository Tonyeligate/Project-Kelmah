import React from 'react';
import { Box, ButtonBase, Typography, useTheme, alpha } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

const actions = [
  { label: 'Find Jobs', icon: SearchIcon, path: '/worker/find-work' },
  { label: 'My Applications', icon: AssignmentIcon, path: '/worker/applications' },
  { label: 'Active Contracts', icon: ReceiptIcon, path: '/worker/contracts' },
  { label: 'My Earnings', icon: AttachMoneyIcon, path: '/worker/earnings' },
  { label: 'Update Availability', icon: EventAvailableIcon, path: '/worker/schedule' },
];

/**
 * QuickActionsRow — horizontal scrollable row of 5 common worker actions.
 */
const QuickActionsRow = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        overflowX: 'auto',
        pb: 1,
        // Hide scrollbar but allow scrolling on mobile
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {actions.map(({ label, icon: Icon, path }) => (
        <ButtonBase
          key={label}
          onClick={() => navigate(path)}
          aria-label={label}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 88,
            width: { xs: 88, sm: 100 },
            py: 1.5,
            px: 1,
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
            transition: 'transform 0.15s, box-shadow 0.15s',
            '@media (hover: hover)': {
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                borderColor: alpha(theme.palette.primary.main, 0.4),
              },
            },
          }}
        >
          <Icon
            sx={{
              fontSize: 28,
              mb: 0.75,
              color: theme.palette.primary.main,
            }}
          />
          <Typography
            variant="caption"
            align="center"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              lineHeight: 1.2,
              fontSize: '0.7rem',
            }}
          >
            {label}
          </Typography>
        </ButtonBase>
      ))}
    </Box>
  );
};

export default QuickActionsRow;
