import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Chip, 
  IconButton, 
  LinearProgress,
  Tooltip,
  Paper,
  Divider,
  Stack
} from '@mui/material';
import { 
  OpenInNew as OpenIcon,
  AccessTime as TimeIcon, 
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * Displays a list of active jobs for workers
 */
const ActiveJobsList = ({ jobs }) => {
  const navigate = useNavigate();
  
  // Calculate progress percentage based on milestones
  const calculateProgress = (job) => {
    if (!job.milestones || job.milestones.length === 0) return 0;
    const completedCount = job.milestones.filter(m => m.completed).length;
    return Math.round((completedCount / job.milestones.length) * 100);
  };
  
  // Format date to a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  // Navigate to job details
  const handleJobClick = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };
  
  if (!jobs || jobs.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No active jobs at the moment.
      </Typography>
    );
  }
  
  return (
    <List disablePadding>
      {jobs.map((job, index) => {
        const progress = calculateProgress(job);
        
        return (
          <React.Fragment key={job.id}>
            {index > 0 && <Divider component="li" />}
            <ListItem 
              alignItems="flex-start"
              sx={{ 
                py: 2, 
                '&:hover': { 
                  bgcolor: 'action.hover',
                  cursor: 'pointer'
                }
              }}
              onClick={() => handleJobClick(job.id)}
              secondaryAction={
                <Tooltip title="View Details">
                  <IconButton 
                    edge="end" 
                    aria-label="open"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJobClick(job.id);
                    }}
                  >
                    <OpenIcon />
                  </IconButton>
                </Tooltip>
              }
            >
              <ListItemText
                primary={
                  <Typography variant="subtitle1" component="div" fontWeight="medium">
                    {job.title}
                  </Typography>
                }
                secondary={
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" component="span">
                        Client: {job.clientName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 2 }}>
                        Location: {job.location}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tooltip title="Hourly Rate">
                        <Chip 
                          size="small" 
                          icon={<MoneyIcon fontSize="small" />} 
                          label={`$${job.hourlyRate}/hr`} 
                          variant="outlined"
                          color="success"
                        />
                      </Tooltip>
                      
                      <Tooltip title="Expected End Date">
                        <Chip 
                          size="small" 
                          icon={<TimeIcon fontSize="small" />} 
                          label={`Due: ${formatDate(job.expectedEndDate)}`} 
                          variant="outlined"
                          color="primary"
                        />
                      </Tooltip>
                      
                      <Chip 
                        size="small" 
                        label={job.status} 
                        color={job.status === 'in-progress' ? 'warning' : 'default'}
                      />
                    </Box>
                    
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Progress</Typography>
                        <Typography variant="caption" color="text.secondary">{`${progress}%`}</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
                    </Box>
                  </Stack>
                }
              />
            </ListItem>
          </React.Fragment>
        );
      })}
    </List>
  );
};

ActiveJobsList.propTypes = {
  /**
   * Array of job objects to display
   */
  jobs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      clientName: PropTypes.string.isRequired,
      location: PropTypes.string,
      startDate: PropTypes.string,
      expectedEndDate: PropTypes.string,
      status: PropTypes.string,
      hourlyRate: PropTypes.number,
      hoursLogged: PropTypes.number,
      totalBudget: PropTypes.number,
      milestones: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          title: PropTypes.string,
          completed: PropTypes.bool,
          completedDate: PropTypes.string
        })
      )
    })
  ).isRequired
};

export default ActiveJobsList; 