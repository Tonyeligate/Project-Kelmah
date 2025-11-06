import React from 'react';
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
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const WorkerCard = ({ worker, isPublicView = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const isHirer = user?.role === 'hirer' || user?.userType === 'hirer';

  // Handle view profile
  const handleViewProfile = (e) => {
    e.stopPropagation();
    navigate(`/workers/${worker.id || worker._id || worker.userId}`);
  };

  // Handle message worker
  const handleMessage = (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: `/workers/${worker.id}`,
          message: 'Please sign in to message workers',
        },
      });
      return;
    }

    // Navigate to messaging page with worker ID
    navigate(`/messages?userId=${worker.userId || worker.id}`);
  };

  // Determine if user can message (authenticated and is hirer)
  const canMessage = isAuthenticated && isHirer;

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
      <CardContent sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={handleViewProfile}>
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
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2, pt: 0 }}>
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
        <Tooltip
          title={!canMessage ? 'Sign in as a hirer to message workers' : ''}
          arrow
        >
          <span style={{ flex: 1 }}>
            <Button
              variant="contained"
              startIcon={<MessageIcon />}
              onClick={handleMessage}
              disabled={!canMessage}
              size="small"
              fullWidth
              sx={{
                minHeight: '44px',
                bgcolor: canMessage ? '#FFD700' : 'action.disabledBackground',
                color: canMessage ? '#000' : 'text.disabled',
                '&:hover': {
                  bgcolor: canMessage ? '#FFC700' : undefined,
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'text.disabled',
                },
              }}
            >
              {canMessage ? 'Message' : 'Sign In'}
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
  isPublicView: PropTypes.bool,
};

export default WorkerCard;
