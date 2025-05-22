import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  IconButton, 
  CircularProgress, 
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider 
} from '@mui/material';
import { 
  LocationOn, 
  ViewList, 
  Work,
  AttachMoney,
  Grade
} from '@mui/icons-material';
import GoogleMap from '../maps/GoogleMap';
import { useNavigate } from 'react-router-dom';

/**
 * Job Map View Component
 * Displays jobs on a map with interactive markers
 * 
 * @param {Object} props
 * @param {Array} props.jobs - List of jobs to display on map
 * @param {Object} props.centerLocation - Center point for the map
 * @param {number} props.radius - Search radius in km
 * @param {boolean} props.loading - Whether data is still loading
 * @param {Function} props.onToggleView - Function to toggle between map and list view
 */
const JobMapView = ({ 
  jobs = [], 
  centerLocation = null,
  radius = 50,
  loading = false,
  onToggleView
}) => {
  const navigate = useNavigate();
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });
  const [selectedJob, setSelectedJob] = useState(null);
  const [markers, setMarkers] = useState([]);
  
  // Set default center if none provided
  useEffect(() => {
    if (centerLocation && centerLocation.latitude && centerLocation.longitude) {
      setMapCenter({ 
        lat: centerLocation.latitude, 
        lng: centerLocation.longitude 
      });
    } else if (jobs.length > 0 && jobs[0].location) {
      // Use the first job's location as center if no center provided
      setMapCenter({ 
        lat: jobs[0].location.latitude, 
        lng: jobs[0].location.longitude 
      });
    } else {
      // Default center (could be based on user's location)
      setMapCenter({ lat: 40.7128, lng: -74.0060 }); // New York
    }
  }, [centerLocation, jobs]);
  
  // Convert jobs to map markers
  useEffect(() => {
    if (jobs && jobs.length > 0) {
      const jobMarkers = jobs.map(job => ({
        position: { 
          lat: job.location?.latitude || 0, 
          lng: job.location?.longitude || 0 
        },
        title: job.title,
        jobId: job.id,
        job: job
      }));
      setMarkers(jobMarkers);
    } else {
      setMarkers([]);
    }
  }, [jobs]);
  
  // Handle marker click - show job details
  const handleMarkerClick = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    setSelectedJob(job);
  };
  
  // Navigate to job details
  const handleViewJobDetails = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };
  
  return (
    <Paper elevation={2}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">
          {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'} on Map
        </Typography>
        <Tooltip title="Switch to List View">
          <IconButton onClick={onToggleView}>
            <ViewList />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Box sx={{ display: 'flex', height: '600px' }}>
        {/* Job list sidebar */}
        <Box sx={{ width: '300px', borderRight: 1, borderColor: 'divider', overflowY: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : jobs.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography>No jobs found in this area</Typography>
            </Box>
          ) : (
            <List sx={{ width: '100%', p: 0 }}>
              {jobs.map((job, index) => (
                <React.Fragment key={job.id}>
                  {index > 0 && <Divider variant="inset" component="li" />}
                  <ListItem 
                    alignItems="flex-start" 
                    button
                    selected={selectedJob?.id === job.id}
                    onClick={() => setSelectedJob(job)}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: 'action.selected',
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <Work />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={job.title}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                            sx={{ display: 'block' }}
                          >
                            {job.company}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                              {job.location?.city}, {job.location?.region}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <AttachMoney fontSize="small" color="action" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                              {job.salary?.min && job.salary?.max
                                ? `$${job.salary.min} - $${job.salary.max}`
                                : job.salary?.min
                                ? `From $${job.salary.min}`
                                : 'Salary not specified'}
                            </Typography>
                          </Box>
                        </>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
        
        {/* Map container */}
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <GoogleMap
                center={mapCenter}
                markers={markers}
                zoom={10}
              />
              
              {/* Selected job details overlay */}
              {selectedJob && (
                <Paper
                  elevation={3}
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    width: '300px',
                    maxHeight: '200px',
                    overflow: 'auto',
                    p: 2,
                    zIndex: 1000,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(5px)'
                  }}
                >
                  <Typography variant="h6" gutterBottom>{selectedJob.title}</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {selectedJob.company}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {selectedJob.location?.city}, {selectedJob.location?.region}
                    </Typography>
                  </Box>
                  <Button 
                    variant="contained" 
                    size="small" 
                    onClick={() => handleViewJobDetails(selectedJob.id)}
                    sx={{ mt: 1 }}
                  >
                    View Details
                  </Button>
                </Paper>
              )}
            </>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default JobMapView; 