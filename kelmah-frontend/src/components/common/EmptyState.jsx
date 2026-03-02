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

/* Accessible default messages per variant for screen readers */
const ariaDescriptions = {
  jobs: 'No jobs available',
  messages: 'No messages yet',
  notifications: 'No notifications',
  search: 'No results found',
  contracts: 'No contracts',
  reviews: 'No reviews yet',
  profile: 'Profile is empty',
};

/**
 * EmptyState — visual placeholder for empty lists. Shows a large icon, heading,
 * subtitle, and optional CTA button.
 *
 * Accessibility:
 * - role="status" + aria-live so dynamic content changes are announced
 * - Descriptive aria-label on the icon circle for screen readers
 * - 54px-tall CTA button with visible focus ring for large-touch accessibility
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
      role="status"
      aria-live="polite"
      aria-label={ariaDescriptions[variant] || title}
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
        aria-hidden="true"
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
        component="h2"
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
          aria-label={actionLabel}
          sx={{
            bgcolor: '#D4AF37',
            color: '#000',
            fontWeight: 700,
            minHeight: 54,
            minWidth: 160,
            fontSize: '1rem',
            '&:hover': { bgcolor: '#B8941F' },
            '&:focus-visible': {
              outline: '3px solid #D4AF37',
              outlineOffset: '3px',
            },
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
