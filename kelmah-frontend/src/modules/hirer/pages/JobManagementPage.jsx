import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Divider,
  Badge,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
  useMediaQuery,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  Assignment as ApplicationIcon,
  CheckCircle as ActiveIcon,
  AccessTime as ExpiredIcon,
  Close as ClosedIcon,
  HourglassEmpty as DraftIcon,
  Refresh as RefreshIcon,
  ErrorOutline as WarningIcon,
} from '@mui/icons-material';
import {
  fetchHirerJobs,
  updateJobStatus,
  deleteHirerJob,
  selectHirerLoading,
  selectHirerError,
} from '../services/hirerSlice';
import { formatJobLocation } from '../../../utils/formatters';

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`job-tabpanel-${index}`}
      aria-labelledby={`job-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Status chip component (canonical statuses)
const StatusChip = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'open':
        return { label: 'Open', color: 'success', icon: <ActiveIcon /> };
      case 'in-progress':
        return {
          label: 'In Progress',
          color: 'warning',
          icon: <ExpiredIcon />,
        };
      case 'completed':
        return { label: 'Completed', color: 'success', icon: <ActiveIcon /> };
      case 'cancelled':
        return { label: 'Cancelled', color: 'error', icon: <ClosedIcon /> };
      case 'draft':
        return { label: 'Draft', color: 'default', icon: <DraftIcon /> };
      default:
        return { label: 'Unknown', color: 'default', icon: null };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size="small"
      sx={{ fontWeight: 500 }}
    />
  );
};

const JobManagementPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Redux state
  const jobsByStatus = useSelector((state) => state.hirer.jobs);
  const loading = useSelector(selectHirerLoading('jobs'));
  const error = useSelector(selectHirerError('jobs'));
  const jobs = useMemo(
    () => Object.values(jobsByStatus).flat(),
    [jobsByStatus],
  );

  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [uiMessage, setUiMessage] = useState(null);

  // Fetch jobs by status on mount (canonical statuses)
  useEffect(() => {
    ['open', 'in-progress', 'completed', 'cancelled', 'draft'].forEach(
      (status) => {
        dispatch(fetchHirerJobs(status));
      },
    );
  }, [dispatch]);

  // Tab statuses (canonical)
  const tabStatuses = [
    'all',
    'open',
    'in-progress',
    'completed',
    'cancelled',
    'draft',
  ];

  // Filter jobs based on tab and search
  const filteredJobs = jobs.filter((job) => {
    const matchesTab = tabValue === 0 || job.status === tabStatuses[tabValue];
    const locationStr = formatJobLocation(job.location);
    const matchesSearch =
      searchText === '' ||
      job.title.toLowerCase().includes(searchText.toLowerCase()) ||
      locationStr.toLowerCase().includes(searchText.toLowerCase());

    return matchesTab && matchesSearch;
  });

  // Paginated jobs
  const paginatedJobs = filteredJobs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // Handlers
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0); // Reset pagination when changing tabs
  };

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
    setPage(0); // Reset pagination when searching
  };

  const handleCreateJob = () => {
    navigate('/hirer/jobs/post');
  };

  const handleEditJob = (jobId) => {
    const job = jobs.find((j) => j?.id === jobId);
    const editableStatuses = ['draft', 'open'];
    if (job?.status && !editableStatuses.includes(job.status.toLowerCase())) {
      setUiMessage('Only draft and open jobs can be edited.');
      handleMenuClose();
      return;
    }
    navigate(`/hirer/jobs/edit/${jobId}`);
    handleMenuClose();
  };

  const handleViewJob = (jobId) => {
    navigate(`/jobs/${jobId}`);
    handleMenuClose();
  };

  const handleViewApplications = (jobId) => {
    navigate(`/hirer/applications?jobId=${jobId}`);
    handleMenuClose();
  };

  const handleMenuOpen = (event, job) => {
    setAnchorEl(event.currentTarget);
    setSelectedJob(job);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (status) => {
    if (selectedJob) {
      dispatch(updateJobStatus({ jobId: selectedJob.id || selectedJob._id, status }))
        .unwrap()
        .then(() => setUiMessage({ text: `Job status updated to ${status}`, severity: 'success' }))
        .catch((err) => setUiMessage({ text: err?.message || 'Failed to update status', severity: 'error' }));
    }
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (selectedJob) {
      dispatch(deleteHirerJob(selectedJob.id || selectedJob._id))
        .unwrap()
        .then(() => setUiMessage({ text: 'Job deleted successfully', severity: 'success' }))
        .catch((err) => setUiMessage({ text: err?.message || 'Failed to delete job', severity: 'error' }));
      setDeleteDialogOpen(false);
    }
    handleMenuClose();
  };

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    ['open', 'in-progress', 'completed', 'cancelled', 'draft'].forEach(
      (status) => {
        dispatch(fetchHirerJobs(status));
      },
    );
  };

  // Mobile Job Card Component
  const MobileJobCard = ({ job }) => (
    <Card
      sx={{
        mb: 2,
        borderRadius: 2,
        '&:active': { transform: 'scale(0.98)' },
        transition: 'transform 0.1s ease',
      }}
      onClick={() => handleViewJob(job.id)}
    >
      {job.coverImage && (
        <CardMedia
          component="img"
          height={120}
          image={job.coverImage}
          alt={job.title || 'Job image'}
          sx={{ objectFit: 'cover' }}
        />
      )}
      <CardContent sx={{ pb: '12px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1, pr: 1 }}>
            {job.title}
          </Typography>
          <StatusChip status={job.status} />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {formatJobLocation(job.location)} {job.budget != null ? `• GH₵${typeof job.budget === 'object' ? (job.budget.max || job.budget.min || job.budget.amount || 0) : job.budget}${job.paymentType === 'hourly' ? '/hr' : ''}` : ''}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Badge
              badgeContent={job.applicantCount || job.proposalCount || job.applications?.length || 0}
              color="primary"
              max={99}
              showZero
              sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
            >
              <ApplicationIcon fontSize="small" color="action" />
            </Badge>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              applicants
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); handleViewApplications(job.id); }}
              aria-label="View applicants"
              sx={{ bgcolor: 'action.hover', minWidth: 44, minHeight: 44 }}
            >
              <PersonIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); handleEditJob(job.id); }}
              aria-label="Edit job"
              sx={{ bgcolor: 'action.hover', minWidth: 44, minHeight: 44 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, job); }}
              aria-label="More options"
              sx={{ bgcolor: 'action.hover', minWidth: 44, minHeight: 44 }}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ pb: { xs: 2, md: 4 }, pt: { xs: 1, md: 2 } }}>
      <Helmet>
        <title>Manage Jobs | Kelmah</title>
      </Helmet>

      {uiMessage && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setUiMessage(null)}>
          {uiMessage}
        </Alert>
      )}
      
      {/* Mobile-optimized header */}
      <Box sx={{ mb: { xs: 2, md: 4 }, px: { xs: 0.5, md: 0 } }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography 
            variant={isMobile ? 'h5' : 'h4'} 
            fontWeight="bold"
            sx={{ mb: 0 }}
          >
            {isMobile ? 'My Jobs' : 'Job Management'}
          </Typography>

          <Button
            variant="contained"
            color="primary"
            startIcon={!isMobile && <AddIcon />}
            onClick={handleCreateJob}
            size={isMobile ? 'small' : 'medium'}
            sx={{ 
              minWidth: isMobile ? 'auto' : undefined,
              px: isMobile ? 2 : 3,
            }}
          >
            {isMobile ? '+ New Job' : 'Post a New Job'}
          </Button>
        </Box>
        {!isMobile && (
          <Typography variant="body1" color="text.secondary">
            Manage your job postings and track applications
          </Typography>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, mx: { xs: 0.5, md: 0 } }}>
          {error}
        </Alert>
      )}

      {/* Data consistency warning - shows when API returned data but display shows 0 */}
      {!loading && jobs.length === 0 && !error && (
        <Alert
          severity="info"
          sx={{ mb: 2, mx: { xs: 0.5, md: 0 } }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Refresh
            </Button>
          }
        >
          {isMobile 
            ? 'No jobs yet. Tap + New Job to create one!' 
            : 'Loading your jobs... If you\'ve posted jobs and don\'t see them, try refreshing or contact support.'}
        </Alert>
      )}

      <Paper sx={{ mb: 2, borderRadius: 2, mx: { xs: 0, md: 0 } }} elevation={isMobile ? 0 : 1}>
        {/* Search and filter bar */}
        <Box
          sx={{
            p: { xs: 1.5, md: 3 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <TextField
            placeholder="Search jobs..."
            value={searchText}
            onChange={handleSearchChange}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              width: '100%',
              flex: 1,
              '& .MuiOutlinedInput-root': {
                fontSize: '0.875rem',
              },
            }}
          />

          <IconButton 
            onClick={handleRefresh} 
            disabled={loading}
            size="small"
            aria-label="Refresh jobs"
            sx={{ 
              bgcolor: 'action.hover',
              minWidth: 44,
              minHeight: 44,
              '&:hover': { bgcolor: 'action.selected' },
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Simplified tabs for mobile */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            minHeight: { xs: 40, md: 48 },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: { xs: '0.8rem', md: '0.9rem' },
              minHeight: { xs: 40, md: 48 },
              minWidth: { xs: 'auto', md: 100 },
              px: { xs: 1.5, md: 2 },
            },
            '& .MuiTabs-scrollButtons': {
              width: 28,
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>All</span>
                {jobs.length > 0 && (
                  <Chip
                    label={jobs.length}
                    size="small"
                    sx={{ height: 18, fontSize: '0.7rem', '& .MuiChip-label': { px: 0.75 } }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>Open</span>
                {jobs.filter((job) => job.status === 'open').length > 0 && (
                  <Chip
                    label={jobs.filter((job) => job.status === 'open').length}
                    size="small"
                    color="success"
                    sx={{ height: 18, fontSize: '0.7rem', '& .MuiChip-label': { px: 0.75 } }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>{isMobile ? 'Active' : 'In Progress'}</span>
                {jobs.filter((job) => job.status === 'in-progress').length >
                  0 && (
                    <Chip
                      label={
                        jobs.filter((job) => job.status === 'in-progress').length
                      }
                      size="small"
                      color="warning"
                      sx={{ height: 18, fontSize: '0.7rem', '& .MuiChip-label': { px: 0.75 } }}
                    />
                  )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>Done</span>
                {jobs.filter((job) => job.status === 'completed').length >
                  0 && (
                    <Chip
                      label={
                        jobs.filter((job) => job.status === 'completed').length
                      }
                      size="small"
                      color="success"
                      sx={{ height: 18, fontSize: '0.7rem', '& .MuiChip-label': { px: 0.75 } }}
                    />
                  )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>{isMobile ? 'Closed' : 'Cancelled'}</span>
                {jobs.filter((job) => job.status === 'cancelled').length >
                  0 && (
                    <Chip
                      label={
                        jobs.filter((job) => job.status === 'cancelled').length
                      }
                      size="small"
                      color="error"
                      sx={{ height: 18, fontSize: '0.7rem', '& .MuiChip-label': { px: 0.75 } }}
                    />
                  )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>Drafts</span>
                {jobs.filter((job) => job.status === 'draft').length > 0 && (
                  <Chip
                    label={jobs.filter((job) => job.status === 'draft').length}
                    size="small"
                    sx={{ height: 18, fontSize: '0.7rem', '& .MuiChip-label': { px: 0.75 } }}
                  />
                )}
              </Box>
            }
          />
        </Tabs>

        {/* Content area - Mobile cards vs Desktop table */}
        <Box sx={{ p: { xs: 1.5, md: 3 } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : filteredJobs.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: { xs: 4, md: 6 },
              }}
            >
              <WarningIcon
                sx={{ fontSize: { xs: 40, md: 48 }, color: jobs.length > 0 ? 'warning.main' : 'text.secondary', mb: 2 }}
              />
              <Typography variant={isMobile ? 'body1' : 'h6'} fontWeight={500} gutterBottom textAlign="center">
                {jobs.length > 0 && filteredJobs.length === 0
                  ? 'No jobs match current filter'
                  : 'No jobs yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ textAlign: 'center', maxWidth: 300, px: 2 }}>
                {searchText
                  ? 'Try different search terms.'
                  : jobs.length > 0 && tabValue !== 0
                    ? `${jobs.length} job${jobs.length !== 1 ? 's' : ''} in other tabs.`
                    : 'Create your first job posting!'}
              </Typography>
              {jobs.length > 0 && tabValue !== 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setTabValue(0)}
                  sx={{ mt: 2 }}
                >
                  View All ({jobs.length})
                </Button>
              )}
              <Button
                variant="contained"
                size={isMobile ? 'small' : 'medium'}
                startIcon={<AddIcon />}
                onClick={handleCreateJob}
                sx={{ mt: 2 }}
              >
                {isMobile ? 'Post Job' : 'Post a New Job'}
              </Button>
            </Box>
          ) : isMobile ? (
            /* Mobile: Card-based layout */
            <>
              {paginatedJobs.map((job) => (
                <MobileJobCard key={job.id} job={job} />
              ))}
              {filteredJobs.length > rowsPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setRowsPerPage(prev => prev + 10)}
                    disabled={paginatedJobs.length >= filteredJobs.length}
                  >
                    Load More ({filteredJobs.length - paginatedJobs.length} remaining)
                  </Button>
                </Box>
              )}
            </>
          ) : (
            /* Desktop: Table layout */
            <>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Job Title</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Applications</TableCell>
                      <TableCell>Posted</TableCell>
                      <TableCell>Expiry</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedJobs.map((job) => (
                        <TableRow
                          key={job.id}
                          sx={{
                            '&:hover': { bgcolor: 'action.hover' },
                            cursor: 'pointer',
                          }}
                        >
                          <TableCell
                            onClick={() => handleViewJob(job.id)}
                            sx={{ fontWeight: 500 }}
                          >
                            {job.title}
                            <Box sx={{ display: 'flex', mt: 0.5 }}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mr: 2 }}
                              >
                                {formatJobLocation(job.location)}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {job.budget != null ? `GH₵${typeof job.budget === 'object' ? (job.budget.max || job.budget.min || job.budget.amount || 0) : job.budget}${job.paymentType === 'hourly' ? '/hr' : ''}` : ''}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <StatusChip status={job.status} />
                          </TableCell>
                          <TableCell>
                            <Badge
                              badgeContent={job.applicantCount || job.proposalCount || job.applications?.length || 0}
                              color="primary"
                              max={999}
                              showZero
                            >
                              <ApplicationIcon color="action" />
                            </Badge>
                          </TableCell>
                          <TableCell>{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '—'}</TableCell>
                          <TableCell>{job.endDate ? new Date(job.endDate).toLocaleDateString() : '—'}</TableCell>
                          <TableCell align="right">
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                              }}
                            >
                              <Tooltip title="View Applications">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleViewApplications(job.id)
                                  }
                                  sx={{ mr: 1 }}
                                >
                                  <PersonIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="View Job">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewJob(job.id)}
                                  sx={{ mr: 1 }}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Job">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditJob(job.id)}
                                  sx={{ mr: 1 }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="More Options">
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleMenuOpen(e, job)}
                                >
                                  <MoreIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredJobs.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Box>
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditJob(selectedJob?.id)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Job
        </MenuItem>

        <MenuItem onClick={() => handleViewJob(selectedJob?.id)}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Job
        </MenuItem>

        <MenuItem onClick={() => handleViewApplications(selectedJob?.id)}>
          <PersonIcon fontSize="small" sx={{ mr: 1 }} />
          View Applications
        </MenuItem>

        <Divider />

        {selectedJob?.status !== 'open' && (
          <MenuItem onClick={() => handleStatusChange('open')}>
            <ActiveIcon
              fontSize="small"
              sx={{ mr: 1, color: 'success.main' }}
            />
            Set as Open
          </MenuItem>
        )}
        {selectedJob?.status !== 'in-progress' && (
          <MenuItem onClick={() => handleStatusChange('in-progress')}>
            <ExpiredIcon
              fontSize="small"
              sx={{ mr: 1, color: 'warning.main' }}
            />
            Mark In Progress
          </MenuItem>
        )}
        {selectedJob?.status !== 'completed' && (
          <MenuItem onClick={() => handleStatusChange('completed')}>
            <ActiveIcon
              fontSize="small"
              sx={{ mr: 1, color: 'success.main' }}
            />
            Mark Completed
          </MenuItem>
        )}
        {selectedJob?.status !== 'cancelled' && (
          <MenuItem onClick={() => handleStatusChange('cancelled')}>
            <ClosedIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
            Cancel Job
          </MenuItem>
        )}

        <Divider />

        <MenuItem onClick={openDeleteDialog} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Job
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} fullScreen={isMobile}>
        <DialogTitle>Delete Job</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{selectedJob?.title}"? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} sx={{ minHeight: 44 }}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            sx={{ minHeight: 44 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Snackbar */}
      {uiMessage && typeof uiMessage === 'object' && uiMessage.severity && (
        <Snackbar
          open={Boolean(uiMessage?.severity)}
          autoHideDuration={4000}
          onClose={() => setUiMessage(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setUiMessage(null)}
            severity={uiMessage.severity}
            sx={{ width: '100%' }}
          >
            {uiMessage.text}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default JobManagementPage;
