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
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthCheck } from '../../../hooks/useAuthCheck';

const WorkerCard = ({ worker }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthCheck();

  const normalizedRole = (user?.role || user?.userType || '')
    .toString()
    .toLowerCase();
  const isHirer = ['hirer', 'client', 'employer', 'business'].includes(
    normalizedRole,
  );
  const workerId = worker.id || worker._id || worker.userId;
  const viewerId = user?.id || user?._id || user?.userId;
  const isViewingSelf = Boolean(viewerId && workerId && viewerId === workerId);

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
        navigate('/login', {
          state: {
            from: location.pathname || '/find-talents',
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
        sx={{ flexGrow: 1, cursor: 'pointer' }}
        onClick={handleViewProfile}
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
          variant="outlined"
          startIcon={<VisibilityIcon />}
          onClick={handleViewProfile}
          size="small"
          sx={{
            minHeight: '44px',
            flex: 1,
            mr: 1,
            borderColor: 'rgba(255, 215, 0, 0.5)',
            color: 'text.primary',
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
  }).isRequired,
};

export default WorkerCard;
