import React from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  Avatar,
  Rating,
  Stack,
  Button,
  IconButton,
} from '@mui/material';
import { LocationOn, Email, Phone, Star, Verified } from '@mui/icons-material';

/**
 * Generic UserCard Component
 * Reusable card for displaying user information across different contexts
 *
 * @param {Object} props - Component props
 * @param {Object} props.user - User data object
 * @param {Function} props.onClick - Click handler for the card
 * @param {Object} props.features - Feature flags to control display
 * @param {string} props.variant - Display variant ('compact' | 'default' | 'detailed')
 */
const UserCard = ({
  user,
  onClick,
  features = {
    showEmail: false,
    showPhone: false,
    showLocation: true,
    showRating: true,
    showStatus: true,
    showActions: false,
    clickable: true,
  },
  variant = 'default',
}) => {
  if (!user) return null;

  const {
    id,
    name,
    profileImage,
    avatar,
    email,
    phone,
    location,
    rating,
    reviewCount,
    isVerified,
    status,
    role,
    skills = [],
    completedJobs,
    specializations = [],
  } = user;

  const handleClick = () => {
    if (features.clickable && onClick) {
      onClick(user, id);
    }
  };

  // Get appropriate skills/specializations to display
  const displayTags = skills.length > 0 ? skills : specializations;
  const maxTags = variant === 'compact' ? 2 : variant === 'detailed' ? 5 : 3;

  const cardContent = (
    <CardContent sx={{ p: variant === 'compact' ? 1.5 : 2 }}>
      {/* Header with avatar and basic info */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
        <Avatar
          src={profileImage || avatar}
          alt={name}
          sx={{
            width: variant === 'compact' ? 40 : 56,
            height: variant === 'compact' ? 40 : 56,
            mr: 1.5,
          }}
        >
          {name?.charAt(0)}
        </Avatar>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}
          >
            <Typography
              variant={variant === 'compact' ? 'subtitle2' : 'h6'}
              component="div"
              noWrap
            >
              {name}
            </Typography>
            {isVerified && <Verified fontSize="small" color="primary" />}
          </Box>

          {role && variant !== 'compact' && (
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Typography>
          )}

          {/* Status chip */}
          {features.showStatus && status && (
            <Chip
              label={status}
              size="small"
              color={status === 'online' ? 'success' : 'default'}
              variant="outlined"
              sx={{ mt: 0.5 }}
            />
          )}
        </Box>
      </Box>

      {/* Rating */}
      {features.showRating && rating && variant !== 'compact' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Rating value={rating} precision={0.1} size="small" readOnly />
          <Typography variant="body2" color="text.secondary">
            {rating.toFixed(1)}
            {reviewCount && ` (${reviewCount})`}
          </Typography>
        </Box>
      )}

      {/* Contact Information */}
      <Stack spacing={0.5} sx={{ mb: 1.5 }}>
        {features.showLocation && location && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" noWrap>
              {location}
            </Typography>
          </Box>
        )}

        {features.showEmail && email && variant === 'detailed' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Email fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" noWrap>
              {email}
            </Typography>
          </Box>
        )}

        {features.showPhone && phone && variant === 'detailed' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Phone fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {phone}
            </Typography>
          </Box>
        )}
      </Stack>

      {/* Skills/Specializations */}
      {displayTags.length > 0 && variant !== 'compact' && (
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', mb: 1 }}>
          {displayTags.slice(0, maxTags).map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              size="small"
              variant="outlined"
              color="secondary"
            />
          ))}
          {displayTags.length > maxTags && (
            <Chip
              label={`+${displayTags.length - maxTags} more`}
              size="small"
              variant="outlined"
              color="default"
            />
          )}
        </Stack>
      )}

      {/* Statistics */}
      {completedJobs && variant === 'detailed' && (
        <Typography variant="body2" color="text.secondary">
          {completedJobs} completed jobs
        </Typography>
      )}

      {/* Action buttons */}
      {features.showActions && variant === 'detailed' && (
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button size="small" variant="outlined" fullWidth>
            Message
          </Button>
          <Button size="small" variant="contained" fullWidth>
            Hire
          </Button>
        </Stack>
      )}
    </CardContent>
  );

  // Wrap in clickable area if needed
  if (features.clickable) {
    return (
      <Card
        sx={{
          height: '100%',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4,
          },
        }}
      >
        <CardActionArea onClick={handleClick} sx={{ height: '100%' }}>
          {cardContent}
        </CardActionArea>
      </Card>
    );
  }

  return <Card sx={{ height: '100%' }}>{cardContent}</Card>;
};

export default UserCard;
