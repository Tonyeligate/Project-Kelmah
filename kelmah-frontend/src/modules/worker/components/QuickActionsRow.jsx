import React from 'react';
import { Box, ButtonBase, Typography, useTheme, alpha } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

const actions = [
  {
    label: 'Find Work',
    caption: 'Browse open jobs',
    icon: SearchIcon,
    path: '/worker/find-work',
  },
  {
    label: 'Applications',
    caption: 'Track submissions',
    icon: AssignmentIcon,
    path: '/worker/applications',
  },
  {
    label: 'Contracts',
    caption: 'Review active work',
    icon: ReceiptIcon,
    path: '/worker/contracts',
  },
  {
    label: 'Earnings',
    caption: 'See payment progress',
    icon: AttachMoneyIcon,
    path: '/worker/earnings',
  },
  {
    label: 'Schedule',
    caption: 'Update availability',
    icon: EventAvailableIcon,
    path: '/worker/schedule',
  },
];

/**
 * QuickActionsRow — horizontal scrollable row of 5 common worker actions.
 */
const QuickActionsRow = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      aria-label="Worker quick actions"
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(3, minmax(0, 1fr))',
          sm: 'repeat(5, minmax(0, 1fr))',
        },
        gap: { xs: 0.85, sm: 1.5 },
      }}
    >
      {actions.map(({ label, caption, icon: Icon, path }) => (
        <ButtonBase
          key={label}
          onClick={() => navigate(path)}
          aria-label={`${label}. ${caption}`}
          title={`${label}: ${caption}`}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            minHeight: { xs: 78, sm: 116 },
            width: '100%',
            py: { xs: 0.9, sm: 1.9 },
            px: { xs: 0.85, sm: 1.6 },
            borderRadius: { xs: 2, sm: 2.5 },
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.24),
            background: `linear-gradient(155deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 62%, ${alpha(theme.palette.background.paper, 0.92)} 100%)`,
            transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
            '@media (hover: hover)': {
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: `0 10px 20px ${alpha(theme.palette.primary.main, 0.22)}`,
                borderColor: alpha(theme.palette.primary.main, 0.55),
              },
            },
          }}
        >
          <Icon
            sx={{
              fontSize: { xs: 20, sm: 28 },
              mb: { xs: 0.45, sm: 1 },
              color: theme.palette.primary.main,
              p: { xs: 0.5, sm: 0.75 },
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
            }}
          />
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              lineHeight: 1.2,
              overflowWrap: 'anywhere',
              fontSize: { xs: '0.74rem', sm: '0.875rem' },
              width: '100%',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
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
              overflowWrap: 'anywhere',
              display: { xs: 'none', sm: 'block' },
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
