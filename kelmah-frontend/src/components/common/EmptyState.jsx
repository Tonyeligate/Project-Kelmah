import { Box, Typography, Button } from '@mui/material';
import {
  WorkOutline,
  MessageOutlined,
  NotificationsNoneOutlined,
  SearchOff,
  DescriptionOutlined,
  StarBorderOutlined,
  AccountCircleOutlined,
} from '@mui/icons-material';

const iconMap = {
  jobs: WorkOutline,
  messages: MessageOutlined,
  notifications: NotificationsNoneOutlined,
  search: SearchOff,
  contracts: DescriptionOutlined,
  reviews: StarBorderOutlined,
  profile: AccountCircleOutlined,
};

/**
 * EmptyState — visual placeholder for empty lists. Shows a large icon, heading,
 * subtitle, and optional CTA button.
 *
 * @param {'jobs'|'messages'|'notifications'|'search'|'contracts'|'reviews'|'profile'} variant
 * @param {string}   title
 * @param {string}   [subtitle]
 * @param {string}   [actionLabel]   – CTA button text
 * @param {Function} [onAction]      – CTA callback
 */
export default function EmptyState({
  variant = 'search',
  title = 'Nothing here yet',
  subtitle,
  actionLabel,
  onAction,
}) {
  const Icon = iconMap[variant] || SearchOff;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 6, md: 10 },
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <Icon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.6 }} />
      </Box>
      <Typography
        variant="h6"
        fontWeight={600}
        sx={{ color: 'text.primary', mb: 1 }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', maxWidth: 320, mb: actionLabel ? 3 : 0 }}
        >
          {subtitle}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{
            bgcolor: '#D4AF37',
            color: '#000',
            '&:hover': { bgcolor: '#B8941F' },
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
