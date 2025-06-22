import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, List, ListItem, ListItemIcon, ListItemText, Button, 
  Chip, Grid, CircularProgress, Snackbar, Alert, Dialog, DialogTitle, 
  DialogContent, DialogActions, Divider
} from '@mui/material';
import PlumbingIcon from '@mui/icons-material/Plumbing';
import CarpenterIcon from '@mui/icons-material/Carpenter';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import DashboardCard from '../common/DashboardCard';
import jobsApi from '../../../../api/services/jobsApi';

// Map for trade icons
const tradeIconMap = {
  'Plumbing': <PlumbingIcon />,
  'Carpentry': <CarpenterIcon />,
  'Electrical': <ElectricalServicesIcon />,
  // Add more mappings as needed
};

// Helper function to get icon for job
const getJobIcon = (job) => {
  const primaryTrade = job.tags && job.tags.length > 0 ? job.tags[0] : null;
  return tradeIconMap[primaryTrade] || <CarpenterIcon />;
};

const AvailableJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch available jobs on component mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        // Use params to get relevant jobs (nearby, matching skills, etc.)
        const response = await jobsApi.getJobs({ 
          status: 'open',
          nearby: true,
          limit: 10
        });
        
        // Map API response to component state
        const mappedJobs = response.jobs.map(job => ({
          ...job,
          icon: getJobIcon(job),
          status: 'idle' // Initial application status
        }));
        
        setJobs(mappedJobs);
        setError(null);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Failed to load available jobs. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Handle job application
  const handleApply = async (jobId) => {
    // Update UI immediately
    setJobs(prevJobs => prevJobs.map(job =>
      job.id === jobId ? { ...job, status: 'loading' } : job
    ));

    try {
      // Send application to API
      await jobsApi.applyToJob(jobId, { 
        coverMessage: 'I am interested in this job and believe my skills are a good match.' 
      });
      
      // Update UI after successful application
      setJobs(prevJobs => prevJobs.map(job =>
        job.id === jobId ? { ...job, status: 'applied' } : job
      ));
      
      setFeedback({
        open: true,
        message: 'Application submitted successfully!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error applying to job:', err);
      
      // Revert to idle state on error
      setJobs(prevJobs => prevJobs.map(job =>
        job.id === jobId ? { ...job, status: 'idle' } : job
      ));
      
      setFeedback({
        open: true,
        message: 'Failed to submit application. Please try again.',
        severity: 'error'
      });
    }
  };
  
  const handleViewDetails = (job) => {
    setSelectedJob(job);
  };
  
  const handleCloseDetails = () => {
    setSelectedJob(null);
  };
  
  const handleCloseFeedback = () => {
    setFeedback({ ...feedback, open: false });
  };

  if (isLoading) {
    return (
      <DashboardCard title="Available Jobs Near You">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard title="Available Jobs Near You">
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Box>
      </DashboardCard>
    );
  }

  if (jobs.length === 0) {
    return (
      <DashboardCard title="Available Jobs Near You">
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No jobs available in your area at the moment.</Typography>
        </Box>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Available Jobs Near You">
      <List sx={{ px: 1 }}>
        {jobs.map((job) => (
          <ListItem
            key={job.id}
            divider
            sx={{
              mb: 2,
              p: 2,
              bgcolor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              '&:last-child': {
                mb: 0,
                borderBottom: 'none',
              },
            }}
          >
            <Grid container spacing={2} alignItems="center" sx={{ width: '100%' }}>
              <Grid item>
                <ListItemIcon sx={{ minWidth: 'auto', color: 'primary.light' }}>
                  {job.icon}
                </ListItemIcon>
              </Grid>
              <Grid item xs>
                <ListItemText
                  primary={
                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {job.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography component="div" variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                        {job.company}
                      </Typography>
                      <Box component="div" sx={{ display: 'flex', alignItems: 'center', mt: 1, fontSize: '0.9rem', color: 'text.secondary' }}>
                        <LocationOnIcon sx={{ fontSize: 18, mr: 0.5 }} />
                        {job.location}
                      </Box>
                    </>
                  }
                />
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color={job.status === 'applied' ? 'success' : 'primary'}
                  sx={{ borderRadius: '20px', px: 3, fontWeight: 'bold', minWidth: '130px' }}
                  onClick={job.status === 'applied' ? 
                    () => handleViewDetails(job) : 
                    () => handleViewDetails(job)
                  }
                  disabled={job.status === 'loading'}
                >
                  {job.status === 'idle' && 'View & Apply'}
                  {job.status === 'loading' && <CircularProgress size={24} color="inherit" />}
                  {job.status === 'applied' && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon sx={{ mr: 1 }} />
                      Applied
                    </Box>
                  )}
                </Button>
              </Grid>
            </Grid>
            
            <Box sx={{ width: '100%', mt: 1 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {job.tags && job.tags.map((tag, index) => (
                  <Chip 
                    key={index} 
                    label={tag} 
                    size="small" 
                    sx={{ borderRadius: '4px' }} 
                    color={tag === 'Urgent' ? 'error' : 'default'} 
                  />
                ))}
                <Box sx={{ ml: 'auto', color: 'text.secondary', fontSize: '0.8rem' }}>
                  Posted {job.postedDate || job.posted}
                </Box>
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>
      
      {/* Job Details Dialog */}
      <Dialog 
        open={selectedJob !== null} 
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        {selectedJob && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ mr: 2 }}>
                  {selectedJob.icon}
                </Box>
                <Typography variant="h5" component="div">
                  {selectedJob.title}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="h6">{selectedJob.company}</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography>{selectedJob.location}</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography>Duration: {selectedJob.duration || 'Not specified'}</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AttachMoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography>Rate: {selectedJob.rate || selectedJob.budget || 'Not specified'}</Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>Job Description</Typography>
              <Typography paragraph>{selectedJob.description}</Typography>
              
              <Typography variant="h6" gutterBottom>Requirements</Typography>
              <Box component="ul">
                {selectedJob.requirements ? (
                  selectedJob.requirements.map((req, index) => (
                    <Typography component="li" key={index}>{req}</Typography>
                  ))
                ) : (
                  <Typography component="li">No specific requirements listed</Typography>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetails}>Close</Button>
              {selectedJob.status !== 'applied' && (
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => {
                    handleApply(selectedJob.id);
                    handleCloseDetails();
                  }}
                  disabled={selectedJob.status === 'loading'}
                >
                  Apply Now
                </Button>
              )}
              {selectedJob.status === 'applied' && (
                <Button 
                  variant="contained" 
                  color="success"
                  disabled
                  startIcon={<CheckCircleIcon />}
                >
                  Application Submitted
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Feedback Snackbar */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseFeedback} 
          severity={feedback.severity}
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </DashboardCard>
  );
};

export default AvailableJobs; 