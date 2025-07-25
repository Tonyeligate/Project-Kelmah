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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  LinearProgress,
} from '@mui/material';
import {
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon,
  Message as MessageIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useAuth } from '../../auth/contexts/AuthContext';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const HirerJobManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [summary, setSummary] = useState({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalSpent: 0,
    averageJobValue: 0,
  });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchJobs();
    fetchSummary();
  }, [activeTab]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/hirers/${user.id}/jobs?status=${getStatusForTab(activeTab)}`,
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

  const fetchSummary = async () => {
    try {
      const response = await fetch(`/api/hirers/${user.id}/jobs/summary`);
      const data = await response.json();
      setSummary(data);
      setChartData(data.chartData);
    } catch (err) {
      console.error('Failed to load job summary:', err);
    }
  };

  const getStatusForTab = (tab) => {
    switch (tab) {
      case 0:
        return 'active';
      case 1:
        return 'completed';
      case 2:
        return 'draft';
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
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = async (jobId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      fetchJobs();
    } catch (err) {
      setError('Failed to delete job');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (jobId, newStatus) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update job status');
      }

      fetchJobs();
    } catch (err) {
      setError('Failed to update job status');
      console.error(err);
    } finally {
      setLoading(false);
    }
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
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const renderSummaryCards = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WorkIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Jobs</Typography>
            </Box>
            <Typography variant="h4">{summary.totalJobs}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Active Jobs</Typography>
            </Box>
            <Typography variant="h4">{summary.activeJobs}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Completed</Typography>
            </Box>
            <Typography variant="h4">{summary.completedJobs}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AttachMoneyIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Spent</Typography>
            </Box>
            <Typography variant="h4">
              ${summary.totalSpent.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderJobsChart = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Job Activity
      </Typography>
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <ChartTooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="active"
              stroke="#1976d2"
              name="Active Jobs"
            />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="#2e7d32"
              name="Completed Jobs"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );

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
              {job.workerName || 'No worker assigned'}
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
          {job.progress && (
            <Grid item xs={12}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Progress
                </Typography>
                <Typography variant="body2">{job.progress}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={job.progress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Grid>
          )}
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
            Review Milestone
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

      {renderSummaryCards()}
      {renderJobsChart()}

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
          <Tab icon={<PendingIcon />} label="Drafts" iconPosition="start" />
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
        <MenuItem onClick={() => handleDialogOpen('edit')}>
          <EditIcon sx={{ mr: 1 }} /> Edit Job
        </MenuItem>
        <MenuItem onClick={() => handleDialogOpen('message')}>
          <MessageIcon sx={{ mr: 1 }} /> Send Message
        </MenuItem>
        {selectedJob?.status === 'active' && (
          <MenuItem onClick={() => handleDialogOpen('milestone')}>
            <AssessmentIcon sx={{ mr: 1 }} /> Review Milestone
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedJob) {
              handleDelete(selectedJob.id);
            }
          }}
        >
          <DeleteIcon sx={{ mr: 1 }} /> Delete Job
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
          {dialogType === 'milestone' && 'Review Milestone'}
          {dialogType === 'edit' && 'Edit Job'}
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
              <TextField
                fullWidth
                label="Milestone Review"
                multiline
                rows={4}
                margin="normal"
              />
            )}
            {dialogType === 'edit' && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Job Title"
                    defaultValue={selectedJob?.title}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={4}
                    defaultValue={selectedJob?.description}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Budget"
                    type="number"
                    defaultValue={selectedJob?.budget}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Deadline"
                    type="date"
                    defaultValue={selectedJob?.deadline}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleDialogClose} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HirerJobManagement;
