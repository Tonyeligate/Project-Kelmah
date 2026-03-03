import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { normalizeUser } from '../../../utils/userUtils';
import { api } from '../../../services/apiClient';
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
import { format } from 'date-fns';

const JobManagement = () => {
  // FIXED: Use standardized user normalization for consistent user data access
  const { user: rawUser } = useSelector((state) => state.auth);
  const user = normalizeUser(rawUser);
  const navigate = useNavigate();
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
      const status = getStatusForTab(activeTab);
      const response =
        activeTab === 2
          ? await api.get('/jobs', {
            params: {
              status: 'open',
              page: 1,
              limit: 20,
            },
          })
          : await api.get('/jobs/assigned', {
            params: status === 'all' ? {} : { status },
          });
      const payload = response?.data?.data ?? response?.data ?? {};
      const list = Array.isArray(payload?.results)
        ? payload.results
        : Array.isArray(payload?.items)
          ? payload.items
        : Array.isArray(payload)
          ? payload
          : [];
      setJobs(list);
      setError(null);
    } catch (err) {
      setError('Failed to load jobs');
      if (import.meta.env.DEV) console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusForTab = (tab) => {
    switch (tab) {
      case 0:
        return 'in-progress';
      case 1:
        return 'completed';
      case 2:
        return 'open';
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
      if (import.meta.env.DEV) console.error(err);
    }
  };

  const sendMessage = async () => {
    const trimmed = (formData.message || '').trim();
    if (!trimmed) {
      throw new Error('Message is required');
    }

    const draftPayload = {
      text: trimmed,
      source: 'job-management',
      jobId: selectedJob?._id || selectedJob?.id || null,
      jobTitle: selectedJob?.title || 'Job',
      createdAt: new Date().toISOString(),
    };

    sessionStorage.setItem('kelmah_message_draft', JSON.stringify(draftPayload));
    navigate('/messages');
  };

  const submitMilestone = async () => {
    throw new Error('Milestone submission is not available from this screen yet');
  };

  const submitReview = async () => {
    throw new Error('Review submission is not available from this screen yet');
  };

  const getStatusColor = (status = '') => {
    const normalized = String(status).toLowerCase();
    switch (normalized) {
      case 'active':
      case 'in-progress':
        return 'primary';
      case 'completed':
        return 'success';
      case 'open':
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const renderJobCard = (job) => (
    <Card key={job.id || job._id} sx={{ mb: 2 }}>
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
              {job?.hirerName || `${job?.hirer?.firstName || ''} ${job?.hirer?.lastName || ''}`.trim() || 'Hirer'}
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
            <Typography variant="body1">
              GH₵{job?.budget?.amount ?? job?.budget ?? 0}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Deadline
            </Typography>
            <Typography variant="body1">
              {job?.deadline
                ? format(new Date(job.deadline), 'MMM dd, yyyy')
                : 'N/A'}
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
        {(job.status === 'active' || job.status === 'in-progress') && (
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
        {(selectedJob?.status === 'active' || selectedJob?.status === 'in-progress') && (
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
        aria-labelledby="job-management-dialog-title"
      >
        <DialogTitle id="job-management-dialog-title">
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
