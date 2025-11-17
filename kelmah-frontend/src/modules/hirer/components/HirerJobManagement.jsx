import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  Grid,
  Paper,
  LinearProgress,
  Skeleton,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Publish as PublishIcon,
  TrendingUp as TrendingUpIcon,
  Work as WorkIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import {
  fetchHirerJobs,
  deleteHirerJob,
  updateJobStatus,
  selectHirerJobs,
  selectHirerLoading,
  selectHirerError,
} from '../services/hirerSlice';

// Mock analytics data for comprehensive dashboard
const mockAnalytics = {
  summary: {
    totalJobs: 45,
    activeJobs: 8,
    completedJobs: 32,
    draftJobs: 5,
    totalSpent: 125000,
    averageJobValue: 3289,
    totalApplications: 284,
    hireSuccessRate: 84,
  },
  monthlyData: [
    { month: 'Jan', jobs: 6, spending: 18500, applications: 45 },
    { month: 'Feb', jobs: 4, spending: 12000, applications: 32 },
    { month: 'Mar', jobs: 7, spending: 21500, applications: 58 },
    { month: 'Apr', jobs: 5, spending: 15000, applications: 38 },
    { month: 'May', jobs: 8, spending: 23500, applications: 67 },
    { month: 'Jun', jobs: 6, spending: 18200, applications: 44 },
  ],
  topCategories: [
    { category: 'Carpentry', jobs: 12, spending: 35000, avgRate: 2917 },
    { category: 'Plumbing', jobs: 8, spending: 28000, avgRate: 3500 },
    { category: 'Electrical', jobs: 6, spending: 22000, avgRate: 3667 },
    { category: 'Painting', jobs: 5, spending: 15000, avgRate: 3000 },
    { category: 'Landscaping', jobs: 4, spending: 12000, avgRate: 3000 },
  ],
};

const HirerJobManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Redux selectors
  const activeJobs = useSelector(selectHirerJobs('active'));
  const completedJobs = useSelector(selectHirerJobs('completed'));
  const draftJobs = useSelector(selectHirerJobs('draft'));
  const loading = useSelector(selectHirerLoading('jobs'));
  const error = useSelector(selectHirerError('jobs'));

  useEffect(() => {
    // Fetch jobs for all statuses
    dispatch(fetchHirerJobs('active'));
    dispatch(fetchHirerJobs('completed'));
    dispatch(fetchHirerJobs('draft'));
  }, [dispatch]);

  const getCurrentJobs = () => {
    switch (activeTab) {
      case 0:
        return Array.isArray(activeJobs) ? activeJobs : [];
      case 1:
        return Array.isArray(completedJobs) ? completedJobs : [];
      case 2:
        return Array.isArray(draftJobs) ? draftJobs : [];
      default:
        return [];
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
        return 'active';
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0); // Reset pagination when changing tabs
  };

  const handleMenuOpen = (event, job) => {
    setAnchorEl(event.currentTarget);
    setSelectedJob(job);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedJob(null);
  };

  const handleAction = (action) => {
    setDialogType(action);
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogType(null);
    setSelectedJob(null);
  };

  const handleDeleteJob = async () => {
    if (selectedJob) {
      try {
        await dispatch(deleteHirerJob(selectedJob.id)).unwrap();
        handleDialogClose();
      } catch (error) {
        console.error('Error deleting job:', error);
      }
    }
  };

  const handlePublishJob = async () => {
    if (selectedJob) {
      try {
        await dispatch(
          updateJobStatus({
            jobId: selectedJob.id,
            status: 'active',
          }),
        ).unwrap();
        handleDialogClose();
      } catch (error) {
        console.error('Error publishing job:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'draft':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Analytics Summary Cards
  const AnalyticsSummary = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            height: '100%',
          }}
        >
          <CardContent>
            <Box
              display="flex"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              sx={{
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    lineHeight: 1.2,
                    wordBreak: 'break-word',
                  }}
                >
                  {mockAnalytics.summary.totalJobs}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.9, whiteSpace: 'normal' }}
                >
                  Total Jobs Posted
                </Typography>
              </Box>
              <WorkIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            height: '100%',
          }}
        >
          <CardContent>
            <Box
              display="flex"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              sx={{
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    lineHeight: 1.2,
                    wordBreak: 'break-word',
                  }}
                >
                  {formatCurrency(mockAnalytics.summary.totalSpent)}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.9, whiteSpace: 'normal' }}
                >
                  Total Amount Spent
                </Typography>
              </Box>
              <MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            height: '100%',
          }}
        >
          <CardContent>
            <Box
              display="flex"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              sx={{
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    lineHeight: 1.2,
                    wordBreak: 'break-word',
                  }}
                >
                  {mockAnalytics.summary.totalApplications}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.9, whiteSpace: 'normal' }}
                >
                  Total Applications
                </Typography>
              </Box>
              <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
            height: '100%',
          }}
        >
          <CardContent>
            <Box
              display="flex"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              sx={{
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    lineHeight: 1.2,
                    wordBreak: 'break-word',
                  }}
                >
                  {mockAnalytics.summary.hireSuccessRate}%
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.9, whiteSpace: 'normal' }}
                >
                  Success Rate
                </Typography>
              </Box>
              <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Loading skeleton
  const LoadingSkeleton = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[...Array(4)].map((_, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rounded" height={120} animation="wave" />
          </Grid>
        ))}
      </Grid>
      <Card>
        <CardContent>
          <Skeleton variant="text" height={40} width="40%" sx={{ mb: 2 }} />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="text" height={60} sx={{ mb: 1 }} />
          ))}
        </CardContent>
      </Card>
    </Box>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  const currentJobs = getCurrentJobs();
  const paginatedJobs = currentJobs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Box>
      {/* Analytics Summary */}
      <AnalyticsSummary />

      {/* Job Management Table */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Job Management
          </Typography>

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ mb: 3 }}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
          >
            <Tab
              label={`Active (${activeJobs?.length || 0})`}
              sx={{ fontWeight: 'bold' }}
            />
            <Tab
              label={`Completed (${completedJobs?.length || 0})`}
              sx={{ fontWeight: 'bold' }}
            />
            <Tab
              label={`Draft (${draftJobs?.length || 0})`}
              sx={{ fontWeight: 'bold' }}
            />
          </Tabs>

          {currentJobs.length === 0 ? (
            <Box textAlign="center" py={4}>
              <WorkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No {getStatusForTab(activeTab)} jobs found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {activeTab === 2
                  ? 'Start by creating a new job posting'
                  : `You don't have any ${getStatusForTab(activeTab)} jobs yet`}
              </Typography>
              {activeTab === 2 && (
                <Button variant="contained" color="primary">
                  Post New Job
                </Button>
              )}
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Job Title</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Category</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Budget</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Applications</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Status</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Created</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Actions</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedJobs.map((job) => (
                      <TableRow key={job.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {job.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                          >
                            {job.description?.substring(0, 60)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={job.category}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {formatCurrency(job.budget)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {job.type === 'hourly' ? 'Hourly' : 'Fixed Price'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar
                              sx={{ width: 24, height: 24, fontSize: 12 }}
                            >
                              {job.applicationsCount || 0}
                            </Avatar>
                            <Typography variant="body2">
                              Applications
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={job.status?.toUpperCase()}
                            size="small"
                            color={getStatusColor(job.status)}
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(job.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, job)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={currentJobs.length}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25]}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAction('view')}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleAction('edit')}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Job
        </MenuItem>
        {selectedJob?.status === 'draft' && (
          <MenuItem onClick={() => handleAction('publish')}>
            <PublishIcon sx={{ mr: 1 }} />
            Publish Job
          </MenuItem>
        )}
        <MenuItem
          onClick={() => handleAction('delete')}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Job
        </MenuItem>
      </Menu>

      {/* Confirmation Dialogs */}
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>
          {dialogType === 'delete' && 'Delete Job'}
          {dialogType === 'publish' && 'Publish Job'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogType === 'delete' &&
              `Are you sure you want to delete "${selectedJob?.title}"? This action cannot be undone.`}
            {dialogType === 'publish' &&
              `Are you sure you want to publish "${selectedJob?.title}"? It will become visible to workers.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={
              dialogType === 'delete' ? handleDeleteJob : handlePublishJob
            }
            color={dialogType === 'delete' ? 'error' : 'primary'}
            variant="contained"
          >
            {dialogType === 'delete' ? 'Delete' : 'Publish'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HirerJobManagement;
