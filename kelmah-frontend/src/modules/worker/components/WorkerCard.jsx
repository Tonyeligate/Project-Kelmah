import { useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Divider,
  Stack,
  Grid,
  Avatar,
  Rating,
  Button,
  Tooltip,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  WorkOutline as WorkIcon,
  AttachMoney as AttachMoneyIcon,
  Star as StarIcon,
  Message as MessageIcon,
  Visibility as VisibilityIcon,
  Verified as VerifiedIcon,
  Bolt as BoltIcon,
  Schedule as ScheduleIcon,
  WorkspacePremium as WorkspacePremiumIcon,
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuthCheck } from '../../../hooks/useAuthCheck';

const WorkerCard = ({ worker }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthCheck();

  const resolvedWorkerId = worker.id || worker._id || worker.userId;
  const resolvedViewerId = user?.id || user?._id || user?.userId;

  const normalizedRoles = useMemo(() => {
    const normalizeRoleValue = (value) =>
      value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/-+/g, '_');

    const roleSources = [
      user?.role,
      user?.userType,
      user?.accountType,
      user?.account_type,
    ];

    const aggregate = [
      ...roleSources,
      ...(Array.isArray(user?.roles) ? user.roles : []),
      ...(Array.isArray(user?.permissions) ? user.permissions : []),
    ]
      .filter(Boolean)
      .map((role) => normalizeRoleValue(role));

    return aggregate.length ? aggregate : ['guest'];
  }, [
    user?.accountType,
    user?.account_type,
    user?.permissions,
    user?.role,
    user?.roles,
    user?.userType,
  ]);

  const isHirer = useMemo(() => {
    const allowedRoles = new Set([
      'hirer',
      'client',
      'employer',
      'business',
      'business_owner',
      'company',
      'organization',
      'businessowner',
    ]);
    return normalizedRoles.some((role) => allowedRoles.has(role));
  }, [normalizedRoles]);

  const workerId = resolvedWorkerId;
  const viewerId = resolvedViewerId;
  const isViewingSelf = Boolean(viewerId && workerId && viewerId === workerId);

  const isVerifiedWorker = useMemo(() => {
    const badgeList = Array.isArray(worker.badges) ? worker.badges : [];
    return Boolean(
      worker.isVerified ||
      worker.verified ||
      worker.verificationStatus === 'verified' ||
      worker.status === 'verified' ||
      worker.trustLevel === 'verified' ||
      badgeList.some((badge) =>
        badge?.toString()?.toLowerCase().includes('verified'),
      ),
    );
  }, [
    worker.badges,
    worker.isVerified,
    worker.status,
    worker.trustLevel,
    worker.verificationStatus,
    worker.verified,
  ]);

  const availabilityDisplay = useMemo(() => {
    const status = worker.availabilityStatus || worker.status;
    if (typeof status === 'string') {
      const normalized = status.trim().toLowerCase();
      if (['available', 'active', 'open'].includes(normalized)) {
        return 'Available now';
      }
      if (['booked', 'busy', 'unavailable'].includes(normalized)) {
        return 'Currently booked';
      }
    }

    if (typeof worker.availability === 'string' && worker.availability.trim()) {
      return worker.availability.trim();
    }

    if (worker.availableNow) {
      return 'Available now';
    }

    if (worker.availabilityMessage) {
      return worker.availabilityMessage;
    }

    return null;
  }, [
    worker.availability,
    worker.availabilityMessage,
    worker.availabilityStatus,
    worker.availableNow,
    worker.status,
  ]);

  const responseTimeLabel = useMemo(() => {
    const responseSources = [
      worker.responseTime,
      worker.avgResponseTime,
      worker.averageResponseTime,
      worker.metrics?.responseTime,
      worker.metrics?.avgResponseTime,
      worker.performance?.responseTime,
    ];

    const stringValue = responseSources.find(
      (value) => typeof value === 'string' && value.trim().length > 0,
    );
    if (stringValue) {
      return stringValue.trim();
    }

    const numericValue = responseSources.find((value) =>
      Number.isFinite(Number(value)),
    );
    if (Number.isFinite(Number(numericValue))) {
      return `${Number(numericValue)} hr${Number(numericValue) === 1 ? '' : 's'}`;
    }

    return null;
  }, [
    worker.avgResponseTime,
    worker.averageResponseTime,
    worker.metrics,
    worker.performance,
    worker.responseTime,
  ]);

  const completedJobs = Number(
    worker.totalJobsCompleted ??
    worker.completedJobs ??
    worker.projectsCompleted ??
    0,
  );

  const jobSuccessValue = useMemo(() => {
    const candidates = [
      worker.jobSuccess,
      worker.successRate,
      worker.metrics?.jobSuccess,
      worker.performance?.successRate,
      worker.stats?.successRate,
    ];

    const match = candidates.find((value) => Number.isFinite(Number(value)));

    const numeric = Number(match);
    return Number.isFinite(numeric) ? Math.round(numeric) : null;
  }, [
    worker.jobSuccess,
    worker.metrics,
    worker.performance,
    worker.stats,
    worker.successRate,
  ]);

  const trustBadges = useMemo(() => {
    const badges = [];

    if (isVerifiedWorker) {
      badges.push({
        key: 'verified',
        label: 'Kelmah Verified',
        color: 'success',
        icon: VerifiedIcon,
        variant: 'filled',
        sx: {
          backgroundColor: 'success.light',
          color: 'success.dark',
        },
      });
    }

    if (availabilityDisplay) {
      badges.push({
        key: 'availability',
        label: availabilityDisplay,
        color: 'info',
        icon: ScheduleIcon,
        variant: 'outlined',
      });
    }

    if (responseTimeLabel) {
      badges.push({
        key: 'response-time',
        label: `Responds in ${responseTimeLabel}`,
        color: 'default',
        icon: BoltIcon,
        variant: 'outlined',
        sx: {
          borderColor: 'warning.light',
          color: 'warning.dark',
        },
      });
    }

    if (jobSuccessValue && jobSuccessValue >= 95) {
      badges.push({
        key: 'top-performer',
        label: `${jobSuccessValue}% success`,
        color: 'secondary',
        icon: WorkspacePremiumIcon,
        variant: 'outlined',
        sx: {
          borderColor: 'secondary.light',
          color: 'secondary.main',
        },
      });
    } else if (!jobSuccessValue && completedJobs >= 40) {
      badges.push({
        key: 'experienced',
        label: 'Experienced',
        color: 'secondary',
        icon: WorkspacePremiumIcon,
        variant: 'outlined',
        sx: {
          borderColor: 'secondary.light',
          color: 'secondary.main',
        },
      });
    }

    return badges;
  }, [
    availabilityDisplay,
    completedJobs,
    isVerifiedWorker,
    jobSuccessValue,
    responseTimeLabel,
  ]);

  // Handle view profile
  const handleViewProfile = (e) => {
    e.stopPropagation();
    const targetId = worker.id || worker._id || worker.userId;
    if (targetId) {
      navigate(`/worker-profile/${targetId}`);
    }
  };

  // Handle message worker
  const handleMessage = useCallback(
    (e) => {
      e.stopPropagation();

      if (!isAuthenticated) {
        const redirectTo = `${location.pathname || '/find-talents'}${location.search || ''}`;
        navigate('/login', {
          state: {
            from: redirectTo,
            message: 'Please sign in to message workers',
          },
        });
        return;
      }

      const targetUserId = worker.userId || worker.id || worker._id;
      if (targetUserId) {
        navigate(`/messages?recipient=${encodeURIComponent(targetUserId)}`);
      }
    },
    [
      isAuthenticated,
      location.pathname,
      location.search,
      navigate,
      worker._id,
      worker.id,
      worker.userId,
    ],
  );

  const messageCta = useMemo(() => {
    if (isViewingSelf) {
      return {
        label: 'This is you',
        tooltip: 'You cannot message your own profile',
        disabled: true,
        handler: (e) => e.stopPropagation(),
      };
    }

    if (!isAuthenticated) {
      return {
        label: 'Sign in to message',
        tooltip: 'Sign in as a hirer to contact workers',
        disabled: false,
        handler: handleMessage,
      };
    }

    if (!isHirer) {
      return {
        label: 'Hirer access required',
        tooltip: 'Switch to a hirer account to message workers',
        disabled: true,
        handler: (e) => e.stopPropagation(),
      };
    }

    return {
      label: 'Message',
      tooltip: 'Start a conversation with this worker',
      disabled: false,
      handler: handleMessage,
    };
  }, [handleMessage, isAuthenticated, isHirer, isViewingSelf]);

  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <CardContent
        component={RouterLink}
        to={`/worker-profile/${worker.id || worker._id || worker.userId}`}
        sx={{
          flexGrow: 1,
          cursor: 'pointer',
          textDecoration: 'none',
          color: 'inherit',
          display: 'block',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={worker.profileImage}
            alt={worker.name}
            sx={{ width: 56, height: 56, mr: 2 }}
          />
          <Box>
            <Typography variant="h6" component="h2" noWrap>
              {worker.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {worker.title || 'Freelancer'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <Rating
                value={worker.rating || 0}
                precision={0.5}
                size="small"
                readOnly
                emptyIcon={
                  <StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />
                }
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 0.5 }}
              >
                ({worker.reviewCount || 0})
              </Typography>
            </Box>
            {trustBadges.length > 0 && (
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}
              >
                {trustBadges.map((badge) => {
                  const IconComponent = badge.icon;
                  return (
                    <Chip
                      key={badge.key}
                      label={badge.label}
                      size="small"
                      variant={badge.variant}
                      color={badge.color}
                      icon={
                        IconComponent ? (
                          <IconComponent sx={{ fontSize: 16 }} />
                        ) : undefined
                      }
                      sx={{ fontWeight: 500, ...(badge.sx || {}) }}
                    />
                  );
                })}
              </Stack>
            )}
          </Box>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            minHeight: '3em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            mb: 2,
          }}
        >
          {worker.bio || 'No bio provided'}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}
        >
          {worker.skills
            ?.filter((skill) => skill && (skill.name || skill))
            .slice(0, 3)
            .map((skill) => (
              <Chip
                key={skill.name || skill}
                label={skill.name || skill}
                size="small"
                variant="outlined"
              />
            ))}
          {worker.skills?.filter((skill) => skill && (skill.name || skill))
            .length > 3 && (
              <Chip
                label={`+${worker.skills.filter((skill) => skill && (skill.name || skill)).length - 3}`}
                size="small"
                variant="outlined"
              />
            )}
        </Stack>

        <Divider sx={{ my: 1 }} />

        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AttachMoneyIcon
                fontSize="small"
                sx={{ mr: 0.5, color: 'text.secondary' }}
              />
              <Typography variant="body2" color="text.primary">
                ${worker.hourlyRate || '--'}/hr
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <WorkIcon
                fontSize="small"
                sx={{ mr: 0.5, color: 'text.secondary' }}
              />
              <Typography variant="body2" color="text.secondary">
                {worker.jobSuccess
                  ? `${worker.jobSuccess}% Success`
                  : 'New Worker'}
              </Typography>
            </Box>
          </Grid>
          {worker.location && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon
                  fontSize="small"
                  sx={{ mr: 0.5, color: 'text.secondary' }}
                />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {worker.location}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>

      {/* Contact Action Buttons */}
      <CardActions
        sx={{ justifyContent: 'space-between', px: 2, pb: 2, pt: 0 }}
      >
        <Button
          component={RouterLink}
          to={`/worker-profile/${worker.id || worker._id || worker.userId}`}
          variant="outlined"
          startIcon={<VisibilityIcon />}
          size="small"
          sx={{
            minHeight: '44px',
            flex: 1,
            mr: 1,
            borderColor: 'rgba(255, 215, 0, 0.5)',
            color: 'text.primary',
            textDecoration: 'none',
            '&:hover': {
              borderColor: '#FFD700',
              bgcolor: 'rgba(255, 215, 0, 0.08)',
            },
          }}
        >
          View Profile
        </Button>
        <Tooltip title={messageCta.tooltip} arrow>
          <span style={{ flex: 1 }}>
            <Button
              variant="contained"
              startIcon={<MessageIcon />}
              onClick={messageCta.handler}
              disabled={messageCta.disabled}
              size="small"
              fullWidth
              sx={{
                minHeight: '44px',
                bgcolor: messageCta.disabled
                  ? 'action.disabledBackground'
                  : '#FFD700',
                color: messageCta.disabled ? 'text.disabled' : '#000',
                '&:hover': {
                  bgcolor: messageCta.disabled ? undefined : '#FFC700',
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'text.disabled',
                },
              }}
            >
              {messageCta.label}
            </Button>
          </span>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

WorkerCard.propTypes = {
  worker: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    userId: PropTypes.string,
    name: PropTypes.string.isRequired,
    profileImage: PropTypes.string,
    title: PropTypes.string,
    bio: PropTypes.string,
    rating: PropTypes.number,
    reviewCount: PropTypes.number,
    hourlyRate: PropTypes.number,
    jobSuccess: PropTypes.number,
    location: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
    badges: PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    ),
    isVerified: PropTypes.bool,
    verified: PropTypes.bool,
    verificationStatus: PropTypes.string,
    trustLevel: PropTypes.string,
    status: PropTypes.string,
    availabilityStatus: PropTypes.string,
    availability: PropTypes.string,
    availabilityMessage: PropTypes.string,
    availableNow: PropTypes.bool,
    responseTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    avgResponseTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    averageResponseTime: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    metrics: PropTypes.shape({
      responseTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      avgResponseTime: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      jobSuccess: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    performance: PropTypes.shape({
      responseTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      successRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    stats: PropTypes.shape({
      successRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    successRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalJobsCompleted: PropTypes.number,
    completedJobs: PropTypes.number,
    projectsCompleted: PropTypes.number,
  }).isRequired,
};

export default WorkerCard;
