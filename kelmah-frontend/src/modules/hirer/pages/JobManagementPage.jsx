import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Grid,
  Tabs,
  Tab,
  Paper,
  Button,
  Card,
  CardContent,
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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
  useMediaQuery,
  Avatar,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  Star as StarIcon,
  Assignment as ApplicationIcon,
  CheckCircle as ActiveIcon,
  PauseCircle as PausedIcon,
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
        return { label: 'In Progress', color: 'warning', icon: <ExpiredIcon /> };
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
  const { user } = useSelector((state) => state.auth);

  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch jobs by status on mount (canonical statuses)
  useEffect(() => {
    ['open', 'in-progress', 'completed', 'cancelled', 'draft'].forEach(
      (status) => {
        dispatch(fetchHirerJobs(status));
      },
    );
  }, [dispatch]);

  // Tab statuses (canonical)
  const tabStatuses = ['all', 'open', 'in-progress', 'completed', 'cancelled', 'draft'];

  // Filter jobs based on tab and search
  const filteredJobs = jobs.filter((job) => {
    const matchesTab = tabValue === 0 || job.status === tabStatuses[tabValue];
    const matchesSearch =
      searchText === '' ||
      job.title.toLowerCase().includes(searchText.toLowerCase()) ||
      job.location.toLowerCase().includes(searchText.toLowerCase());

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
    navigate(`/jobs/edit/${jobId}`);
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
      dispatch(updateJobStatus({ jobId: selectedJob.id, status }));
    }
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (selectedJob) {
      dispatch(deleteHirerJob(selectedJob.id));
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
    ['active', 'draft', 'completed', 'cancelled', 'paused'].forEach(
      (status) => {
        dispatch(fetchHirerJobs(status));
      },
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Job Management
          </Typography>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateJob}
            size={isMobile ? 'small' : 'medium'}
          >
            Post a New Job
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage your job postings and track applications
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 4, borderRadius: 2 }}>
        <Box
          sx={{
            p: { xs: 2, md: 3 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <TextField
            placeholder="Search jobs..."
            value={searchText}
            onChange={handleSearchChange}
            size={isMobile ? 'small' : 'medium'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: 300 },
            }}
          />

          <Box>
            <Tooltip title="Refresh Jobs">
              <IconButton onClick={handleRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons={isMobile ? 'auto' : false}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.9rem',
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                All Jobs
                {jobs.length > 0 && (
                  <Chip
                    label={jobs.length}
                    size="small"
                    sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Open
                {jobs.filter((job) => job.status === 'open').length > 0 && (
                  <Chip
                    label={jobs.filter((job) => job.status === 'open').length}
                    size="small"
                    color="success"
                    sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                In Progress
                {jobs.filter((job) => job.status === 'in-progress').length > 0 && (
                  <Chip
                    label={jobs.filter((job) => job.status === 'in-progress').length}
                    size="small"
                    color="warning"
                    sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Completed
                {jobs.filter((job) => job.status === 'completed').length > 0 && (
                  <Chip
                    label={jobs.filter((job) => job.status === 'completed').length}
                    size="small"
                    color="success"
                    sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Cancelled
                {jobs.filter((job) => job.status === 'cancelled').length > 0 && (
                  <Chip
                    label={jobs.filter((job) => job.status === 'cancelled').length}
                    size="small"
                    color="error"
                    sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Drafts
                {jobs.filter((job) => job.status === 'draft').length > 0 && (
                  <Chip
                    label={jobs.filter((job) => job.status === 'draft').length}
                    size="small"
                    sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                  />
                )}
              </Box>
            }
          />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredJobs.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 6,
              }}
            >
              <WarningIcon
                sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                No jobs found
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {searchText
                  ? 'No jobs match your search criteria. Try changing your search terms.'
                  : 'You have no jobs in this category yet.'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateJob}
                sx={{ mt: 2 }}
              >
                Post a New Job
              </Button>
            </Box>
          ) : (
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
                    {loading
                      ? Array.from(new Array(rowsPerPage)).map((_, idx) => (
                          <TableRow key={`skeleton-${idx}`}>
                            <TableCell>
                              <Skeleton />
                            </TableCell>
                            <TableCell>
                              <Skeleton />
                            </TableCell>
                            <TableCell>
                              <Skeleton />
                            </TableCell>
                            <TableCell>
                              <Skeleton />
                            </TableCell>
                            <TableCell>
                              <Skeleton />
                            </TableCell>
                            <TableCell align="right">
                              <Skeleton />
                            </TableCell>
                          </TableRow>
                        ))
                      : paginatedJobs.map((job) => (
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
                                  {job.location}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  ${job.hourlyRate}/hr
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <StatusChip status={job.status} />
                            </TableCell>
                            <TableCell>
                              <Badge
                                badgeContent={job.applications?.length || 0}
                                color="primary"
                                max={999}
                                showZero
                              >
                                <ApplicationIcon color="action" />
                              </Badge>
                            </TableCell>
                            <TableCell>{job.postedDate}</TableCell>
                            <TableCell>{job.expiryDate}</TableCell>
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
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Job</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{selectedJob?.title}"? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default JobManagementPage;
