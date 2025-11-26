import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
  Divider,
  Stack,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  LocationOn,
  AttachMoney,
  AccessTime,
  Star,
  BookmarkBorder,
  Bookmark,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * Unified JobCard Component
 * Consolidates common and listing JobCard functionality into single reusable component
 *
 * @param {Object} props - Component props
 * @param {Object} props.job - Job data object
 * @param {Function} props.onViewDetails - Callback for view details action
 * @param {Object} props.features - Feature flags to control component capabilities
 * @param {boolean} props.features.showSaveButton - Show save/unsave functionality
 * @param {boolean} props.features.showNavigation - Enable navigation on click
 * @param {boolean} props.features.showHirerInfo - Show hirer information
 * @param {boolean} props.features.showFullDescription - Show full vs truncated description
 * @param {string} props.variant - Visual variant ('default' | 'compact' | 'detailed')
 */
const defaultFeatures = {
  showSaveButton: true,
  showNavigation: true,
  showHirerInfo: true,
  showFullDescription: false,
};

const JobCard = ({
  job,
  onViewDetails,
  features = defaultFeatures,
  variant = 'default',
  isSaved: isSavedProp,
  isSaveLoading = false,
  onToggleSave,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const derivedIsSaved = useMemo(() => {
    if (typeof isSavedProp === 'boolean') {
      return isSavedProp;
    }
    if (job?.isSaved !== undefined) {
      return Boolean(job.isSaved);
    }
    if (typeof job?.status === 'string') {
      return job.status.toLowerCase() === 'saved';
    }
    return false;
  }, [isSavedProp, job]);

  if (!job) {
    return null;
  }

  const canSave = Boolean(features.showSaveButton && onToggleSave);

  const {
    id,
    title,
    description,
    budget,
    location,
    postedDate,
    category,
    skills = [],
    hirerName,
    hirerRating,
    hirerAvatar,
    urgency,
    applications = 0,
  } = job;

  // Handle save/unsave job
  const handleSaveToggle = async (e) => {
    e.stopPropagation();
    if (!canSave) return;
    await onToggleSave?.(job, { isSaved: derivedIsSaved });
  };

  // Handle card click
  const handleCardClick = () => {
    if (features.showNavigation && onViewDetails) {
      onViewDetails(id);
    } else if (features.showNavigation) {
      navigate(`/jobs/${id}`);
    }
  };

  // Format budget display
  const formatBudget = (budget) => {
    if (typeof budget === 'object' && budget.min && budget.max) {
      return `GH₵${budget.min} - GH₵${budget.max}`;
    }
    return budget ? `GH₵${budget}` : 'Budget TBD';
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const posted = new Date(date);
    const diff = now - posted;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  // Truncate description based on variant
  const getDescription = () => {
    if (!description) return '';
    if (features.showFullDescription || variant === 'detailed') {
      return description;
    }

    const limit = variant === 'compact' ? 100 : 150;
    return description.length > limit
      ? `${description.substring(0, limit)}...`
      : description;
  };

  // Card styling based on variant
  const getCardSx = () => {
    const baseSx = {
      mb: 2,
      borderRadius: 2,
      boxShadow: 2,
      transition: 'all 0.3s ease',
      cursor: features.showNavigation ? 'pointer' : 'default',
      '&:hover': features.showNavigation
        ? {
            boxShadow: 4,
            transform: 'translateY(-2px)',
          }
        : {},
    };

    if (variant === 'compact') {
      return { ...baseSx, mb: 1 };
    }

    return baseSx;
  };

  return (
    <Card sx={getCardSx()} onClick={handleCardClick}>
      <CardContent sx={{ pb: variant === 'compact' ? 1 : 2 }}>
        {/* Header with title and category */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1,
          }}
        >
          <Typography
            variant={variant === 'compact' ? 'subtitle1' : 'h6'}
            component="div"
            sx={{ flexGrow: 1, mr: 1 }}
          >
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {category && (
              <Chip
                size="small"
                label={category}
                color="primary"
                variant="outlined"
              />
            )}
            {canSave && (
              <IconButton
                size="small"
                onClick={handleSaveToggle}
                disabled={isSaveLoading}
                color={derivedIsSaved ? 'primary' : 'default'}
                sx={{ p: 0.5 }}
              >
                {derivedIsSaved ? <Bookmark /> : <BookmarkBorder />}
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Description */}
        {variant !== 'compact' && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {getDescription()}
          </Typography>
        )}

        {/* Budget and Location */}
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AttachMoney fontSize="small" color="primary" />
            <Typography variant="body2" fontWeight="medium">
              {formatBudget(budget)}
            </Typography>
          </Box>
          {location && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationOn fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {location}
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Skills chips - only in detailed variant or when not compact */}
        {variant !== 'compact' && skills.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
            {skills.slice(0, 3).map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                size="small"
                variant="outlined"
                color="secondary"
              />
            ))}
            {skills.length > 3 && (
              <Chip
                label={`+${skills.length - 3} more`}
                size="small"
                variant="outlined"
                color="default"
              />
            )}
          </Stack>
        )}

        {/* Hirer info - if enabled */}
        {features.showHirerInfo && hirerName && variant !== 'compact' && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                src={hirerAvatar}
                alt={hirerName}
                sx={{ width: 32, height: 32 }}
              >
                {hirerName.charAt(0)}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  {hirerName}
                </Typography>
                {hirerRating && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Star fontSize="small" color="warning" />
                    <Typography variant="caption" color="text.secondary">
                      {hirerRating}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </>
        )}

        {/* Footer with time and applications */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: variant === 'compact' ? 1 : 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTime fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {formatTimeAgo(postedDate)}
            </Typography>
          </Box>

          {applications > 0 && (
            <Typography variant="caption" color="text.secondary">
              {applications} application{applications !== 1 ? 's' : ''}
            </Typography>
          )}

          {urgency === 'high' && (
            <Chip label="Urgent" size="small" color="error" variant="filled" />
          )}
        </Box>
      </CardContent>

      {/* Actions - only for detailed variant */}
      {variant === 'detailed' && (
        <CardActions sx={{ px: 2, pb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            fullWidth={isMobile}
          >
            View Details
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

export default JobCard;

const budgetShape = PropTypes.oneOfType([
  PropTypes.number,
  PropTypes.string,
  PropTypes.shape({
    min: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    max: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
]);

JobCard.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    description: PropTypes.string,
    budget: budgetShape,
    location: PropTypes.string,
    postedDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),
    category: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
    hirerName: PropTypes.string,
    hirerRating: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    hirerAvatar: PropTypes.string,
    urgency: PropTypes.string,
    applications: PropTypes.number,
    isSaved: PropTypes.bool,
    status: PropTypes.string,
  }),
  onViewDetails: PropTypes.func,
  features: PropTypes.shape({
    showSaveButton: PropTypes.bool,
    showNavigation: PropTypes.bool,
    showHirerInfo: PropTypes.bool,
    showFullDescription: PropTypes.bool,
  }),
  variant: PropTypes.oneOf(['default', 'compact', 'detailed']),
  isSaved: PropTypes.bool,
  isSaveLoading: PropTypes.bool,
  onToggleSave: PropTypes.func,
};

JobCard.defaultProps = {
  job: null,
  onViewDetails: undefined,
  features: defaultFeatures,
  variant: 'default',
  isSaved: undefined,
  isSaveLoading: false,
  onToggleSave: undefined,
};
