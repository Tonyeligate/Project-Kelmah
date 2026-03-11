import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
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
  Gavel as BidIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  GroupAdd as InviteIcon,
} from '@mui/icons-material';
import {
  updateJobStatus,
  deleteHirerJob,
} from '../services/hirerSlice';
import { formatJobLocation } from '../../../utils/formatters';
import { api } from '../../../services/apiClient';

// Visibility chip — tells the hirer whether the job appears on the public Jobs page
const VisibilityChip = ({ visibility }) => {
  const v = visibility || 'public'; // treat missing as public (legacy data)
  if (v === 'private') {
    return (
      <Tooltip title="This job is hidden from the public Jobs page">
        <Chip icon={<PrivateIcon />} label="Private" size="small" color="default"
          sx={{ fontSize: '0.7rem', height: 20, '& .MuiChip-label': { px: 0.5 } }} />
      </Tooltip>
    );
  }
  if (v === 'invite-only') {
    return (
      <Tooltip title="Invite-only — only visible to invited workers">
        <Chip icon={<InviteIcon />} label="Invite" size="small" color="info"
          sx={{ fontSize: '0.7rem', height: 20, '& .MuiChip-label': { px: 0.5 } }} />
      </Tooltip>
    );
  }
  return (
    <Tooltip title="Visible on the public Jobs page">
      <Chip icon={<PublicIcon />} label="Public" size="small" color="success"
        sx={{ fontSize: '0.7rem', height: 20, '& .MuiChip-label': { px: 0.5 } }} />
    </Tooltip>
  );
};

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

  const emptyStatusCounts = useMemo(() => ({
    open: 0,
    'in-progress': 0,
    completed: 0,
    cancelled: 0,
    draft: 0,
  }), []);

  // Local state
  const [jobs, setJobs] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [uiMessage, setUiMessage] = useState(null);
  const [statusCounts, setStatusCounts] = useState(emptyStatusCounts);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tab statuses (canonical)
  const tabStatuses = [
    'all',
    'open',
    'in-progress',
    'completed',
    'cancelled',
    'draft',
  ];

  const activeStatus = tabStatuses[tabValue];

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        role: 'hirer',
        page: page + 1,
        limit: rowsPerPage,
      };

      if (activeStatus !== 'all') {
        params.status = activeStatus;
      }

      const trimmedSearch = searchText.trim();
      if (trimmedSearch) {
        params.search = trimmedSearch;
      }

      const response = await api.get('/jobs/my-jobs', { params });
      const payload = response.data?.data || {};
      const pagination = payload.pagination || response.data?.meta?.pagination || {};
      const counts = response.data?.meta?.countsByStatus || {};

      setJobs(Array.isArray(payload.items) ? payload.items : []);
      setTotalJobs(Number(pagination.total) || 0);
      setStatusCounts({
        open: Number(counts.open) || 0,
        'in-progress': Number(counts['in-progress']) || 0,
        completed: Number(counts.completed) || 0,
        cancelled: Number(counts.cancelled) || 0,
        draft: Number(counts.draft) || 0,
      });
    } catch (loadError) {
      setJobs([]);
      setTotalJobs(0);
      setStatusCounts(emptyStatusCounts);
      setError(loadError?.response?.data?.message || loadError.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [activeStatus, emptyStatusCounts, page, rowsPerPage, searchText]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleRefresh = () => {
    loadJobs();
  };

  const allJobsCount = useMemo(
    () => Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
    [statusCounts],
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
    const job = jobs.find((j) => j?.id === jobId || j?._id === jobId);
    const editableStatuses = ['draft', 'open'];
    if (job?.status && !editableStatuses.includes(job.status.toLowerCase())) {
      setUiMessage({ text: 'Only draft and open jobs can be edited.', severity: 'warning' });
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

  const isBiddingJob = (job) => Boolean(job?.bidding?.bidStatus);

  const getJobResponseCount = (job) =>
    job?.proposalCount ?? job?.applicantCount ?? job?.applicationsCount ?? job?.applications?.length ?? 0;

  const handleReviewResponses = (job) => {
    const jobId = job?.id || job?._id;
    if (!jobId) {
      handleMenuClose();
      return;
    }

    if (isBiddingJob(job)) {
      navigate(`/hirer/jobs/${jobId}/bids`);
    } else {
      navigate(`/hirer/applications?jobId=${jobId}`);
    }

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
        .then(() => {
          setUiMessage({ text: `Job status updated to ${status}`, severity: 'success' });
          loadJobs();
        })
        .catch((err) => setUiMessage({ text: err?.message || 'Failed to update status', severity: 'error' }));
    }
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (selectedJob && !isDeleting) {
      setIsDeleting(true);
      dispatch(deleteHirerJob(selectedJob.id || selectedJob._id))
        .unwrap()
        .then(() => {
          setUiMessage({ text: 'Job deleted successfully', severity: 'success' });
          loadJobs();
        })
        .catch((err) => setUiMessage({ text: err?.message || 'Failed to delete job', severity: 'error' }))
        .finally(() => {
          setIsDeleting(false);
          setDeleteDialogOpen(false);
        });
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

  // Mobile Job Card Component
  const MobileJobCard = ({ job }) => (
    <Card
      sx={{
        mb: 2,
        borderRadius: 2,
        '&:active': { transform: 'scale(0.98)' },
        transition: 'transform 0.1s ease',
      }}
      onClick={() => handleViewJob(job.id || job._id)}
    >
      {job.coverImage && (
        <CardMedia
          component="img"
          height={120}
          image={job.coverImage}
          alt={job.title || 'Job image'}
          sx={{ objectFit: 'cover' }}
          onError={(e) => { e.target.onerror = null; e.target.src = ''; e.target.style.display = 'none'; }}
        />
      )}
      <CardContent sx={{ pb: '12px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ flex: 1, pr: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {job.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            <StatusChip status={job.status} />
            <VisibilityChip visibility={job.visibility} />
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {formatJobLocation(job.location)} {job.budget != null ? `• GH₵${typeof job.budget === 'object' ? (job.budget.max || job.budget.min || job.budget.amount || 0) : job.budget}${job.paymentType === 'hourly' ? '/hr' : ''}` : ''}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Badge
              badgeContent={getJobResponseCount(job)}
              color="primary"
              max={99}
              showZero
              sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
            >
              {isBiddingJob(job) ? (
                <BidIcon fontSize="small" color="action" />
              ) : (
                <ApplicationIcon fontSize="small" color="action" />
              )}
            </Badge>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {isBiddingJob(job) ? 'bids' : 'applicants'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); handleReviewResponses(job); }}
              aria-label={isBiddingJob(job) ? 'Review bids' : 'View applications'}
              sx={{ bgcolor: 'action.hover', minWidth: 44, minHeight: 44 }}
            >
              {isBiddingJob(job) ? <BidIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); handleEditJob(job.id || job._id); }}
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
        // Inline alert removed — Snackbar below is the canonical feedback channel
        // (keeping this comment to signal the intentional removal)
        null
      )}

      {/* Visibility explainer: helps hirers understand why some jobs don't appear on the public page */}
      {!loading && jobs.length > 0 && (() => {
        const publicCount = jobs.filter(j => !j.visibility || j.visibility === 'public').length;
        const privateCount = jobs.length - publicCount;
        if (privateCount === 0) return null;
        return (
          <Alert
            severity="warning"
            sx={{ mb: 2, mx: { xs: 0.5, md: 0 } }}
            action={
              <Button color="inherit" size="small" onClick={() => navigate('/jobs')} sx={{ whiteSpace: 'nowrap' }}>
                View Public Page
              </Button>
            }
          >
            {isMobile
              ? `${privateCount} job${privateCount > 1 ? 's' : ''} not visible publicly. Check the 🔒 badge.`
              : `${privateCount} of the ${totalJobs} job${totalJobs !== 1 ? 's' : ''} in this view ${privateCount > 1 ? 'are' : 'is'} not visible on the public Jobs page. Jobs marked 🔒 Private won't be found by workers. Look for the visibility badge on each job.`}
          </Alert>
        );
      })()}

      
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
            Manage your job postings and track bids or applications
          </Typography>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, mx: { xs: 0.5, md: 0 } }}>
          {error}
        </Alert>
      )}

      {/* Empty-state helper for the current filtered page */}
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
            : 'No jobs found for this view. Adjust the filters, refresh, or post a new job.'}
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
                {allJobsCount > 0 && (
                  <Chip
                    label={allJobsCount}
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
                {statusCounts.open > 0 && (
                  <Chip
                    label={statusCounts.open}
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
                {statusCounts['in-progress'] > 0 && (
                    <Chip
                      label={statusCounts['in-progress']}
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
                {statusCounts.completed > 0 && (
                    <Chip
                      label={statusCounts.completed}
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
                {statusCounts.cancelled > 0 && (
                    <Chip
                      label={statusCounts.cancelled}
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
                {statusCounts.draft > 0 && (
                  <Chip
                    label={statusCounts.draft}
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
          ) : jobs.length === 0 ? (
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
                sx={{ fontSize: { xs: 40, md: 48 }, color: allJobsCount > 0 ? 'warning.main' : 'text.secondary', mb: 2 }}
              />
              <Typography variant={isMobile ? 'body1' : 'h6'} fontWeight={500} gutterBottom textAlign="center">
                {allJobsCount > 0
                  ? 'No jobs match current filter'
                  : 'No jobs yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ textAlign: 'center', maxWidth: 300, px: 2 }}>
                {searchText
                  ? 'Try different search terms.'
                  : allJobsCount > 0 && tabValue !== 0
                    ? `${allJobsCount} job${allJobsCount !== 1 ? 's' : ''} in other tabs.`
                    : 'Create your first job posting!'}
              </Typography>
              {allJobsCount > 0 && tabValue !== 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setTabValue(0)}
                  sx={{ mt: 2 }}
                >
                  View All ({allJobsCount})
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
              {jobs.map((job) => (
                <MobileJobCard key={job.id || job._id} job={job} />
              ))}
              {totalJobs > rowsPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                    disabled={page === 0}
                    sx={{ mr: 1 }}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={(page + 1) * rowsPerPage >= totalJobs}
                  >
                    Next
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
                      <TableCell>Responses</TableCell>
                      <TableCell>Posted</TableCell>
                      <TableCell>Expiry</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jobs.map((job) => (
                        <TableRow
                          key={job.id || job._id}
                          sx={{
                            '&:hover': { bgcolor: 'action.hover' },
                            cursor: 'pointer',
                          }}
                        >
                          <TableCell
                            onClick={() => handleViewJob(job.id || job._id)}
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <StatusChip status={job.status} />
                              <VisibilityChip visibility={job.visibility} />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Badge
                              badgeContent={getJobResponseCount(job)}
                              color="primary"
                              max={999}
                              showZero
                            >
                              {isBiddingJob(job) ? <BidIcon color="action" /> : <ApplicationIcon color="action" />}
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
                              <Tooltip title={isBiddingJob(job) ? 'Review Bids' : 'View Applications'}>
                                <IconButton
                                  size="small"
                                  aria-label={isBiddingJob(job) ? 'Review bids' : 'View applications'}
                                  onClick={() => handleReviewResponses(job)}
                                  sx={{ mr: 1 }}
                                >
                                  {isBiddingJob(job) ? <BidIcon /> : <PersonIcon />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="View Job">
                                <IconButton
                                  size="small"
                                  aria-label="View job"
                                  onClick={() => handleViewJob(job.id || job._id)}
                                  sx={{ mr: 1 }}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Job">
                                <IconButton
                                  size="small"
                                  aria-label="Edit job"
                                  onClick={() => handleEditJob(job.id || job._id)}
                                  sx={{ mr: 1 }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="More Options">
                                <IconButton
                                  size="small"
                                  aria-label="More options"
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
                count={totalJobs}
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
        <MenuItem onClick={() => handleEditJob(selectedJob?.id || selectedJob?._id)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Job
        </MenuItem>

        <MenuItem onClick={() => handleViewJob(selectedJob?.id || selectedJob?._id)}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Job
        </MenuItem>

        <MenuItem onClick={() => handleReviewResponses(selectedJob)}>
          {isBiddingJob(selectedJob) ? (
            <BidIcon fontSize="small" sx={{ mr: 1 }} />
          ) : (
            <PersonIcon fontSize="small" sx={{ mr: 1 }} />
          )}
          {isBiddingJob(selectedJob) ? 'Review Bids' : 'View Applications'}
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
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} fullScreen={isMobile} aria-labelledby="delete-job-dialog-title">
        <DialogTitle id="delete-job-dialog-title">Delete Job</DialogTitle>
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
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
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
