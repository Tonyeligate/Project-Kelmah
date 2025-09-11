import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon,
  Message as MessageIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';

const JobManagement = () => {
  const user = useSelector(state => state.auth.user);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [formData, setFormData] = useState({
    message: '',
    milestone: '',
  });

  useEffect(() => {
    fetchJobs();
  }, [activeTab]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/workers/${user.id}/jobs?status=${getStatusForTab(activeTab)}`,
      );
      const data = await response.json();
      setJobs(data);
      setError(null);
    } catch (err) {
      setError('Failed to load jobs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusForTab = (tab) => {
    switch (tab) {
      case 0:
        return 'active';
      case 1:
        return 'completed';
      case 2:
        return 'available';
      default:
        return 'all';
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleMenuOpen = (event, job) => {
    setAnchorEl(event.currentTarget);
    setSelectedJob(job);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedJob(null);
  };

  const handleDialogOpen = (type) => {
    setDialogType(type);
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogType(null);
    setFormData({ message: '', milestone: '' });
  };

  const handleSubmit = async () => {
    try {
      // Handle different dialog types
      switch (dialogType) {
        case 'message':
          await sendMessage();
          break;
        case 'milestone':
          await submitMilestone();
          break;
        case 'review':
          await submitReview();
          break;
        default:
          break;
      }
      handleDialogClose();
      fetchJobs();
    } catch (err) {
      setError('Failed to submit');
      console.error(err);
    }
  };

  const sendMessage = async () => {
    // Implement message sending
  };

  const submitMilestone = async () => {
    // Implement milestone submission
  };

  const submitReview = async () => {
    // Implement review submission
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'primary';
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const renderJobCard = (job) => (
    <Card key={job.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6">{job.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {job.hirerName}
            </Typography>
          </Box>
          <Chip
            label={job.status}
            color={getStatusColor(job.status)}
            size="small"
          />
        </Box>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Budget
            </Typography>
            <Typography variant="body1">${job.budget}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Deadline
            </Typography>
            <Typography variant="body1">
              {format(new Date(job.deadline), 'MMM dd, yyyy')}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body1">{job.description}</Typography>
          </Grid>
        </Grid>
      </CardContent>
      <Divider />
      <CardActions>
        <Button
          size="small"
          startIcon={<MessageIcon />}
          onClick={() => handleDialogOpen('message')}
        >
          Message
        </Button>
        {job.status === 'active' && (
          <Button
            size="small"
            startIcon={<AssessmentIcon />}
            onClick={() => handleDialogOpen('milestone')}
          >
            Submit Milestone
          </Button>
        )}
        <IconButton size="small" onClick={(e) => handleMenuOpen(e, job)}>
          <MoreVertIcon />
        </IconButton>
      </CardActions>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Job Management
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<WorkIcon />} label="Active Jobs" iconPosition="start" />
          <Tab
            icon={<CheckCircleIcon />}
            label="Completed"
            iconPosition="start"
          />
          <Tab icon={<PendingIcon />} label="Available" iconPosition="start" />
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : jobs.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No jobs found</Typography>
        </Paper>
      ) : (
        <Box>{jobs.map(renderJobCard)}</Box>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleDialogOpen('message')}>
          <MessageIcon sx={{ mr: 1 }} /> Send Message
        </MenuItem>
        {selectedJob?.status === 'active' && (
          <MenuItem onClick={() => handleDialogOpen('milestone')}>
            <AssessmentIcon sx={{ mr: 1 }} /> Submit Milestone
          </MenuItem>
        )}
        {selectedJob?.status === 'completed' && (
          <MenuItem onClick={() => handleDialogOpen('review')}>
            <ReceiptIcon sx={{ mr: 1 }} /> Submit Review
          </MenuItem>
        )}
      </Menu>

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'message' && 'Send Message'}
          {dialogType === 'milestone' && 'Submit Milestone'}
          {dialogType === 'review' && 'Submit Review'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {dialogType === 'message' && (
              <TextField
                fullWidth
                label="Message"
                multiline
                rows={4}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                margin="normal"
              />
            )}
            {dialogType === 'milestone' && (
              <TextField
                fullWidth
                label="Milestone Description"
                multiline
                rows={4}
                value={formData.milestone}
                onChange={(e) =>
                  setFormData({ ...formData, milestone: e.target.value })
                }
                margin="normal"
              />
            )}
            {dialogType === 'review' && (
              <TextField
                fullWidth
                label="Review"
                multiline
                rows={4}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                margin="normal"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.message && !formData.milestone}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobManagement;
