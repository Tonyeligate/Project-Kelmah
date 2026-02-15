import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  Snackbar,
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



const HirerJobManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Redux selectors
  const activeJobs = useSelector(selectHirerJobs('active'));
  const completedJobs = useSelector(selectHirerJobs('completed'));
  const draftJobs = useSelector(selectHirerJobs('draft'));
  const loading = useSelector(selectHirerLoading('jobs'));
  const error = useSelector(selectHirerError('jobs'));

  useEffect(() => {
    dispatch(fetchHirerJobs('active'));
    dispatch(fetchHirerJobs('completed'));
    dispatch(fetchHirerJobs('draft'));
  }, [dispatch]);

  // Compute real analytics from Redux data
  const analytics = useMemo(() => {
    const allJobs = [
      ...(Array.isArray(activeJobs) ? activeJobs : []),
      ...(Array.isArray(completedJobs) ? completedJobs : []),
      ...(Array.isArray(draftJobs) ? draftJobs : []),
    ];
    const totalJobs = allJobs.length;
    const totalSpent = allJobs.reduce((sum, job) => sum + (job.budget || 0), 0);
    const totalApplications = allJobs.reduce((sum, job) => sum + (job.applicationsCount || 0), 0);
    const completed = Array.isArray(completedJobs) ? completedJobs.length : 0;
    const hireSuccessRate = totalJobs > 0 ? Math.round((completed / totalJobs) * 100) : 0;
    return { totalJobs, totalSpent, totalApplications, hireSuccessRate };
  }, [activeJobs, completedJobs, draftJobs]);

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
    const jobId = selectedJob?.id || selectedJob?._id;
    if (action === 'view') {
      handleMenuClose();
      navigate(`/hirer/jobs/${jobId}`);
      return;
    }
    if (action === 'edit') {
      handleMenuClose();
      navigate(`/hirer/jobs/${jobId}/edit`);
      return;
    }
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
        await dispatch(deleteHirerJob(selectedJob.id || selectedJob._id)).unwrap();
        setSnackbar({ open: true, message: 'Job deleted successfully', severity: 'success' });
        handleDialogClose();
      } catch (err) {
        setSnackbar({ open: true, message: err?.message || 'Failed to delete job', severity: 'error' });
        handleDialogClose();
      }
    }
  };

  const handlePublishJob = async () => {
    if (selectedJob) {
      try {
        await dispatch(
          updateJobStatus({
            jobId: selectedJob.id || selectedJob._id,
            status: 'active',
          }),
        ).unwrap();
        setSnackbar({ open: true, message: 'Job published successfully', severity: 'success' });
        handleDialogClose();
      } catch (err) {
        setSnackbar({ open: true, message: err?.message || 'Failed to publish job', severity: 'error' });
        handleDialogClose();
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
                  {analytics.totalJobs}
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
                  {formatCurrency(analytics.totalSpent)}
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
                  {analytics.totalApplications}
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
                  {analytics.hireSuccessRate}%
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
                {analytics.totalJobs > 0
                  ? `You have ${analytics.totalJobs} total job${analytics.totalJobs !== 1 ? 's' : ''} — check other tabs`
                  : activeTab === 2
                    ? 'Start by creating a new job posting'
                    : "You haven't posted any jobs yet"}
              </Typography>
              {analytics.totalJobs > 0 && (
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 1 }}>
                  {activeTab !== 0 && activeJobs?.length > 0 && (
                    <Button variant="outlined" size="small" onClick={() => setActiveTab(0)}>
                      Active ({activeJobs.length})
                    </Button>
                  )}
                  {activeTab !== 1 && completedJobs?.length > 0 && (
                    <Button variant="outlined" size="small" onClick={() => setActiveTab(1)}>
                      Completed ({completedJobs.length})
                    </Button>
                  )}
                  {activeTab !== 2 && draftJobs?.length > 0 && (
                    <Button variant="outlined" size="small" onClick={() => setActiveTab(2)}>
                      Drafts ({draftJobs.length})
                    </Button>
                  )}
                </Box>
              )}
              <Button variant="contained" color="primary" onClick={() => navigate('/hirer/jobs/post')} sx={{ mt: 1 }}>
                Post New Job
              </Button>
            </Box>
          ) : (
            <>
              {isMobile ? (
                /* Mobile card view */
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {paginatedJobs.map((job) => (
                    <Card key={job.id || job._id} variant="outlined">
                      <CardContent sx={{ pb: '12px !important' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Box sx={{ flex: 1, mr: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {job.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {job.description?.substring(0, 60)}...
                            </Typography>
                          </Box>
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, job)} aria-label="Job actions">
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                        <Box display="flex" flexWrap="wrap" gap={1} alignItems="center">
                          <Chip label={job.category} size="small" variant="outlined" color="primary" />
                          <Chip label={job.status?.toUpperCase()} size="small" color={getStatusColor(job.status)} variant="filled" />
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ ml: 'auto' }}>
                            {formatCurrency(job.budget)}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mt={1}>
                          <Typography variant="caption" color="text.secondary">
                            {job.applicationsCount || 0} applications
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(job.createdAt)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
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
                      <TableRow key={job.id || job._id} hover>
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
              )

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
      <Dialog open={dialogOpen} onClose={handleDialogClose} fullScreen={isMobile}>
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

      {/* Snackbar for action feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HirerJobManagement;
