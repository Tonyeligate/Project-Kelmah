import React from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  Divider,
  Stack,
  Grid,
  Avatar,
  Rating,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  WorkOutline as WorkIcon,
  AttachMoney as AttachMoneyIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const WorkerCard = ({ worker }) => {
  const navigate = useNavigate();

  // Handle click on card
  const handleClick = () => {
    navigate(`/workers/${worker.id}`);
  };

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
      <CardActionArea onClick={handleClick} sx={{ flexGrow: 1 }}>
        <CardContent>
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
      </CardActionArea>
    </Card>
  );
};

WorkerCard.propTypes = {
  worker: PropTypes.shape({
    id: PropTypes.string.isRequired,
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
