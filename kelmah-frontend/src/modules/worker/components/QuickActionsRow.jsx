import React from 'react';
import { Box, ButtonBase, Typography, useTheme, alpha } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

const actions = [
  { label: 'Find Work', caption: 'Browse open jobs', icon: SearchIcon, path: '/worker/find-work' },
  { label: 'Applications', caption: 'Track submissions', icon: AssignmentIcon, path: '/worker/applications' },
  { label: 'Contracts', caption: 'Review active work', icon: ReceiptIcon, path: '/worker/contracts' },
  { label: 'Earnings', caption: 'See payment progress', icon: AttachMoneyIcon, path: '/worker/earnings' },
  { label: 'Schedule', caption: 'Update availability', icon: EventAvailableIcon, path: '/worker/schedule' },
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
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(5, minmax(0, 1fr))' },
        gap: 1.5,
      }}
    >
      {actions.map(({ label, caption, icon: Icon, path }) => (
        <ButtonBase
          key={label}
          onClick={() => navigate(path)}
          aria-label={label}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            minHeight: { xs: 96, sm: 108 },
            width: '100%',
            py: 1.75,
            px: 1.5,
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
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
              mb: 1,
              color: theme.palette.primary.main,
            }}
          />
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              lineHeight: 1.2,
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              mt: 0.5,
              color: 'text.secondary',
              lineHeight: 1.35,
              textAlign: 'left',
            }}
          >
            {caption}
          </Typography>
        </ButtonBase>
      ))}
    </Box>
  );
};

export default QuickActionsRow;
