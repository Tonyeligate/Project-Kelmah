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
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Tooltip,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  MoreVert as MoreVertIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon,
  AccessTime as AccessTimeIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  Flag as FlagIcon,
  Comment as CommentIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { useAuth } from '../../auth/contexts/AuthContext';
import { format } from 'date-fns';

const JobProgressTracker = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    amount: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hirers/${user.id}/active-jobs`);
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
    setMilestoneForm({
      title: '',
      description: '',
      dueDate: '',
      amount: ''
    });
  };

  const handleMilestoneSubmit = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${selectedJob.id}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(milestoneForm)
      });

      if (!response.ok) {
        throw new Error('Failed to create milestone');
      }

      fetchJobs();
      handleDialogClose();
    } catch (err) {
      setError('Failed to create milestone');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMilestoneReview = async (jobId, milestoneId, status) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}/milestones/${milestoneId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to review milestone');
      }

      fetchJobs();
    } catch (err) {
      setError('Failed to review milestone');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const renderJobCard = (job) => (
    <Card key={job.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6">{job.title}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Avatar src={job.workerAvatar} sx={{ width: 24, height: 24 }}>
                <PersonIcon />
              </Avatar>
              <Typography variant="body2">
                {job.workerName}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${job.progress}%`}
              color="primary"
              size="small"
            />
            <IconButton
              size="small"
              onClick={(e) => handleMenuOpen(e, job)}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachMoneyIcon color="primary" />
              <Typography variant="body1">
                ${job.budget}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon color="primary" />
              <Typography variant="body1">
                Due: {format(new Date(job.deadline), 'MMM dd, yyyy')}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Overall Progress
            </Typography>
            <LinearProgress
              variant="determinate"
              value={job.progress}
              sx={{ height: 8, borderRadius: 4 }}
            />
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
        <Button
          size="small"
          startIcon={<AssignmentIcon />}
          onClick={() => handleDialogOpen('milestone')}
        >
          Add Milestone
        </Button>
      </CardActions>
    </Card>
  );

  const renderMilestoneTimeline = (job) => (
    <Timeline>
      {job.milestones.map((milestone, index) => (
        <TimelineItem key={milestone.id}>
          <TimelineSeparator>
            <TimelineDot color={getStatusColor(milestone.status)}>
              {milestone.status === 'completed' ? <CheckCircleIcon /> : <FlagIcon />}
            </TimelineDot>
            {index < job.milestones.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="subtitle2">{milestone.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {milestone.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Due: {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}
                </Typography>
              </Box>
              {milestone.status === 'pending' && (
                <Box>
                  <Button
                    size="small"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleMilestoneReview(job.id, milestone.id, 'completed')}
                  >
                    Complete
                  </Button>
                </Box>
              )}
            </Box>
            {milestone.attachments && milestone.attachments.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Attachments:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                  {milestone.attachments.map((attachment, idx) => (
                    <Chip
                      key={idx}
                      icon={<AttachFileIcon />}
                      label={attachment.name}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Job Progress Tracking
      </Typography>

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
          <Typography color="text.secondary">
            No active jobs to track
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Active Jobs
              </Typography>
              {jobs.map(renderJobCard)}
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Milestone Timeline
              </Typography>
              {selectedJob ? (
                renderMilestoneTimeline(selectedJob)
              ) : (
                <Typography color="text.secondary" align="center">
                  Select a job to view milestones
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleDialogOpen('message')}>
          <MessageIcon sx={{ mr: 1 }} /> Send Message
        </MenuItem>
        <MenuItem onClick={() => handleDialogOpen('milestone')}>
          <AssignmentIcon sx={{ mr: 1 }} /> Add Milestone
        </MenuItem>
        <MenuItem onClick={() => handleDialogOpen('details')}>
          <DescriptionIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
      </Menu>

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'message' && 'Send Message'}
          {dialogType === 'milestone' && 'Add Milestone'}
          {dialogType === 'details' && 'Job Details'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {dialogType === 'message' && (
              <TextField
                fullWidth
                label="Message"
                multiline
                rows={4}
                margin="normal"
              />
            )}
            {dialogType === 'milestone' && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Milestone Title"
                    value={milestoneForm.title}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={4}
                    value={milestoneForm.description}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Due Date"
                    type="date"
                    value={milestoneForm.dueDate}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    value={milestoneForm.amount}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: e.target.value })}
                  />
                </Grid>
              </Grid>
            )}
            {dialogType === 'details' && selectedJob && (
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Worker"
                    secondary={selectedJob.workerName}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <AttachMoneyIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Budget"
                    secondary={`$${selectedJob.budget}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <AccessTimeIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Deadline"
                    secondary={format(new Date(selectedJob.deadline), 'MMM dd, yyyy')}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Description"
                    secondary={selectedJob.description}
                  />
                </ListItem>
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={dialogType === 'milestone' ? handleMilestoneSubmit : handleDialogClose}
            variant="contained"
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobProgressTracker; 


