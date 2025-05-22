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
  Avatar
} from '@mui/material';
import { 
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const JobCard = ({ job }) => {
  const navigate = useNavigate();

  // Handle click on card
  const handleClick = () => {
    navigate(`/jobs/${job.id}`);
  };

  // Format date
  const formattedDate = job.createdAt 
    ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })
    : 'Recently';

  // Format budget
  const formattedBudget = () => {
    if (job.paymentType === 'hourly') {
      return `$${job.budget}/hr`;
    } else if (job.paymentType === 'fixed') {
      return `$${job.budget}`;
    } else {
      return 'Budget not specified';
    }
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
          boxShadow: 6
        }
      }}
    >
      <CardActionArea onClick={handleClick} sx={{ flexGrow: 1 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                src={job.client?.profileImage} 
                alt={job.client?.name}
                sx={{ width: 30, height: 30, mr: 1 }}
              >
                <BusinessIcon />
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                {job.client?.name || 'Anonymous Client'}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formattedDate}
            </Typography>
          </Box>

          <Typography variant="h6" component="h2" gutterBottom noWrap>
            {job.title}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ 
            minHeight: '3em',
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            mb: 2
          }}>
            {job.description}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
            {job.skills?.slice(0, 3).map((skill) => (
              <Chip
                key={skill}
                label={skill}
                size="small"
                variant="outlined"
              />
            ))}
            {job.skills?.length > 3 && (
              <Chip
                label={`+${job.skills.length - 3}`}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>

          <Divider sx={{ my: 1 }} />

          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoneyIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.primary">
                  {formattedBudget()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {job.jobType || 'Not specified'}
                </Typography>
              </Box>
            </Grid>
            {job.location && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {job.location}
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

JobCard.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    budget: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    paymentType: PropTypes.string,
    jobType: PropTypes.string,
    location: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
    createdAt: PropTypes.string,
    client: PropTypes.shape({
      name: PropTypes.string,
      profileImage: PropTypes.string
    })
  }).isRequired
};

export default JobCard; 