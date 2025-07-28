// Initial JobApplicationPage file

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Breadcrumbs,
  Link,
  Typography,
  Grid,
  Paper,
  Box,
  TextField,
  Button,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  IconButton,
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Skeleton,
  useTheme,
  useMediaQuery,
  Avatar,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Fade,
  Grow,
  Slide,
  Alert,
  Snackbar,
  Tooltip,
  Badge,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  alpha,
  Autocomplete,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Bookmark as BookmarkIcon,
  FilterList as FilterListIcon,
  WorkOutline as WorkOutlineIcon,
  AccessTime as AccessTimeIcon,
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Tune as TuneIcon,
  Star as StarIcon,
  Verified as VerifiedIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Build as BuildIcon,
  Home as HomeIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  MyLocation as MyLocationIcon,
  Savings as SavingsIcon,
  Send as ApplyIcon,
} from '@mui/icons-material';
import {
  Link as RouterLink,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { styled, keyframes } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../auth/contexts/AuthContext';
import jobsApi from '../../jobs/services/jobsApi';
import workerService from '../services/workerService';

// Animations
const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

// Styled Components
const GlassCard = styled(Card)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.9),
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: 16,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[20],
    background: alpha(theme.palette.background.paper, 0.95),
  },
}));

const JobCard = styled(GlassCard)(({ theme, urgent }) => ({
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
  ...(urgent && {
    border: `2px solid ${theme.palette.warning.main}`,
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.error.main})`,
    },
  }),
}));

const FilterSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: 16,
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
}));

const AnimatedButton = styled(Button)(({ theme }) => ({
  borderRadius: 25,
  padding: '10px 24px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
}));

const StatsCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: 16,
  textAlign: 'center',
  padding: theme.spacing(2),
}));

const JobApplicationPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // State management
  const [jobs, setJobs] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [appliedJobs, setAppliedJobs] = useState(new Set());

  // Filters state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    location: searchParams.get('location') || '',
    category: searchParams.get('category') || '',
    skillLevel: searchParams.get('skillLevel') || '',
    payRange: [
      Number(searchParams.get('minPay')) || 0,
      Number(searchParams.get('maxPay')) || 10000,
    ],
    jobType: searchParams.get('jobType') || '',
    sortBy: searchParams.get('sortBy') || 'relevance',
    datePosted: searchParams.get('datePosted') || '',
  });

  // Dialog states
  const [applicationDialog, setApplicationDialog] = useState({
    open: false,
    job: null,
  });
  const [filterDialog, setFilterDialog] = useState(false);

  // Feedback states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Mock data for categories and skills
  const categories = [
    'Electrical',
    'Plumbing',
    'Carpentry',
    'HVAC',
    'Masonry',
    'Painting',
    'Landscaping',
    'Roofing',
    'Welding',
    'General Construction',
  ];

  const skillLevels = [
    'Entry Level',
    'Intermediate',
    'Expert',
    'Master Craftsman',
  ];
  const jobTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Temporary',
    'Project-based',
  ];
  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'date', label: 'Date Posted' },
    { value: 'pay', label: 'Pay Rate' },
    { value: 'distance', label: 'Distance' },
    { value: 'rating', label: 'Client Rating' },
  ];

  // Fetch jobs with filters
  const fetchJobs = useCallback(
    async (pageNum = 1, currentFilters = filters) => {
      setLoading(true);
      try {
        const params = {
          page: pageNum,
          limit: 12,
          ...currentFilters,
          minPay: currentFilters.payRange[0],
          maxPay: currentFilters.payRange[1],
        };

        const response = await jobsApi.searchJobs(params);
        setJobs(response.data.jobs || []);
        setTotalItems(response.data.total || 0);

        // Update URL params
        const newSearchParams = new URLSearchParams();
        Object.keys(params).forEach((key) => {
          if (
            params[key] &&
            params[key] !== '' &&
            key !== 'page' &&
            key !== 'limit'
          ) {
            newSearchParams.set(key, params[key]);
          }
        });
        setSearchParams(newSearchParams);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load jobs. Please try again.',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    },
    [filters, setSearchParams],
  );

  // Load initial data
  useEffect(() => {
    fetchJobs(page);
    loadUserData();
  }, [page]);

  const loadUserData = async () => {
    try {
      // Load saved and applied jobs for this user
      const [savedResponse, appliedResponse] = await Promise.all([
        workerService.getSavedJobs(),
        workerService.getApplications(),
      ]);

      setSavedJobs(new Set(savedResponse.data?.map((job) => job.id) || []));
      setAppliedJobs(
        new Set(appliedResponse.data?.map((app) => app.job_id) || []),
      );
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPage(1);
    fetchJobs(1, newFilters);
  };

  // Handle job bookmark
  const handleBookmarkJob = async (jobId, event) => {
    event.stopPropagation();
    try {
      if (savedJobs.has(jobId)) {
        await workerService.unsaveJob(jobId);
        setSavedJobs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
        setSnackbar({
          open: true,
          message: 'Job removed from saved',
          severity: 'info',
        });
    } else {
        await workerService.saveJob(jobId);
        setSavedJobs((prev) => new Set([...prev, jobId]));
        setSnackbar({
          open: true,
          message: 'Job saved successfully',
          severity: 'success',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update bookmark',
        severity: 'error',
      });
    }
  };

  // Handle job application
  const handleApplyToJob = (job) => {
    if (appliedJobs.has(job.id)) {
      setSnackbar({
        open: true,
        message: 'You have already applied to this job',
        severity: 'warning',
      });
      return;
    }
    setApplicationDialog({ open: true, job });
  };

  // Submit application
  const submitApplication = async (applicationData) => {
    try {
      await workerService.applyToJob(applicationDialog.job.id, applicationData);
      setAppliedJobs((prev) => new Set([...prev, applicationDialog.job.id]));
      setApplicationDialog({ open: false, job: null });
      setSnackbar({
        open: true,
        message: 'Application submitted successfully!',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to submit application',
        severity: 'error',
      });
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters = {
      search: '',
      location: '',
      category: '',
      skillLevel: '',
      payRange: [0, 10000],
      jobType: '',
      sortBy: 'relevance',
      datePosted: '',
    };
    setFilters(clearedFilters);
    setPage(1);
    fetchJobs(1, clearedFilters);
  };

  // Get user location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Convert coordinates to address (would need geocoding service)
          setSnackbar({
            open: true,
            message: 'Location updated',
            severity: 'success',
          });
        },
        (error) => {
          setSnackbar({
            open: true,
            message: 'Could not get location',
            severity: 'warning',
          });
        },
      );
    }
  };

  const renderJobCard = (job) => (
    <Grid item xs={12} sm={6} lg={viewMode === 'grid' ? 4 : 12} key={job.id}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <JobCard
          urgent={job.is_urgent}
          onClick={() => navigate(`/jobs/${job.id}`)}
        >
          {job.is_urgent && (
            <Chip
              label="URGENT"
              color="warning"
              size="small"
              sx={{
                position: 'absolute',
                top: 12,
                left: 12,
                zIndex: 1,
                fontWeight: 700,
              }}
            />
          )}

          <CardContent sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  mr: 2,
                  bgcolor: 'primary.main',
                }}
              >
                {job.company_name?.charAt(0) || 'C'}
              </Avatar>

              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="h6" fontWeight={700} noWrap>
                  {job.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {job.company_name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <LocationIcon
                    sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {job.location}
                  </Typography>
                </Box>
              </Box>

              <IconButton
                size="small"
                onClick={(e) => handleBookmarkJob(job.id, e)}
                sx={{
                  color: savedJobs.has(job.id)
                    ? 'primary.main'
                    : 'text.secondary',
                }}
              >
                {savedJobs.has(job.id) ? (
                  <BookmarkIcon />
                ) : (
                  <BookmarkBorderIcon />
                )}
              </IconButton>
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {job.description}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<MoneyIcon />}
                label={`$${job.pay_rate}/hr`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip label={job.job_type} size="small" variant="outlined" />
              {job.skill_level && (
                <Chip label={job.skill_level} size="small" variant="outlined" />
              )}
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(job.created_at), {
                  addSuffix: true,
                })}
              </Typography>
              {job.client_rating && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Rating value={job.client_rating} size="small" readOnly />
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    ({job.client_rating})
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>

          <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
            <AnimatedButton
              variant={appliedJobs.has(job.id) ? 'outlined' : 'contained'}
              color={appliedJobs.has(job.id) ? 'success' : 'primary'}
              size="small"
              fullWidth
              startIcon={
                appliedJobs.has(job.id) ? <CheckCircleIcon /> : <SendIcon />
              }
              onClick={(e) => {
                e.stopPropagation();
                handleApplyToJob(job);
              }}
              disabled={appliedJobs.has(job.id)}
            >
              {appliedJobs.has(job.id) ? 'Applied' : 'Apply Now'}
            </AnimatedButton>
          </CardActions>
        </JobCard>
      </motion.div>
    </Grid>
  );

  const renderFilters = () => (
    <FilterSection>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Find Your Perfect Job
        </Typography>

      <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
            placeholder="Search jobs, skills, companies..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
            placeholder="Location"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon />
                    </InputAdornment>
                  ),
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Use my location">
                    <IconButton size="small" onClick={getUserLocation}>
                      <MyLocationIcon />
                    </IconButton>
                  </Tooltip>
                    </InputAdornment>
                  ),
                }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
              value={filters.category}
                  label="Category"
              onChange={(e) => handleFilterChange('category', e.target.value)}
              sx={{ borderRadius: 3 }}
                >
                  <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
            <InputLabel>Sort By</InputLabel>
                <Select
              value={filters.sortBy}
              label="Sort By"
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              sx={{ borderRadius: 3 }}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
                </Select>
              </FormControl>
            </Grid>

        <Grid item xs={12} md={1}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Advanced Filters">
              <IconButton
                onClick={() => setFilterDialog(true)}
                color="primary"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  },
                }}
              >
                <TuneIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>
          </Grid>

      {/* Active filters display */}
      {Object.values(filters).some(
        (value) =>
          value &&
          value !== '' &&
          JSON.stringify(value) !== JSON.stringify([0, 10000]),
      ) && (
        <Box
          sx={{
            mt: 2,
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Active filters:
          </Typography>
          {filters.category && (
            <Chip
              label={`Category: ${filters.category}`}
              size="small"
              onDelete={() => handleFilterChange('category', '')}
            />
          )}
          {filters.skillLevel && (
            <Chip
              label={`Level: ${filters.skillLevel}`}
              size="small"
              onDelete={() => handleFilterChange('skillLevel', '')}
            />
          )}
          {filters.jobType && (
            <Chip
              label={`Type: ${filters.jobType}`}
              size="small"
              onDelete={() => handleFilterChange('jobType', '')}
            />
          )}
          <Button
            size="small"
            onClick={clearAllFilters}
            startIcon={<ClearIcon />}
            sx={{ minWidth: 'auto' }}
          >
            Clear All
          </Button>
        </Box>
      )}
    </FilterSection>
  );

  const renderJobStats = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={6} sm={3}>
        <StatsCard>
          <WorkOutlineIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
          <Typography variant="h6" fontWeight={700}>
            {totalItems.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Available Jobs
          </Typography>
        </StatsCard>
      </Grid>
      <Grid item xs={6} sm={3}>
        <StatsCard>
          <SavingsIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
          <Typography variant="h6" fontWeight={700}>
            {savedJobs.size}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Saved Jobs
          </Typography>
        </StatsCard>
      </Grid>
      <Grid item xs={6} sm={3}>
        <StatsCard>
          <CheckCircleIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
          <Typography variant="h6" fontWeight={700}>
            {appliedJobs.size}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Applications
          </Typography>
        </StatsCard>
      </Grid>
      <Grid item xs={6} sm={3}>
        <StatsCard>
          <TrendingUpIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
          <Typography variant="h6" fontWeight={700}>
            23%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Match Rate
          </Typography>
        </StatsCard>
      </Grid>
    </Grid>
  );

  return (
    <>
      <Helmet>
        <title>Find Jobs - Professional Opportunities | Kelmah</title>
        <meta
          name="description"
          content="Discover professional job opportunities in construction, electrical, plumbing, carpentry and more. Apply to jobs that match your skills and experience."
        />
      </Helmet>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link color="inherit" component={RouterLink} to="/">
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Link color="inherit" component={RouterLink} to="/worker/dashboard">
            Dashboard
          </Link>
          <Typography color="text.primary">Find Jobs</Typography>
        </Breadcrumbs>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Find Your Next Opportunity
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Discover jobs that match your skills and advance your career
          </Typography>
        </Box>

        {renderJobStats()}
        {renderFilters()}

        {/* View controls and results */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            {loading ? 'Loading...' : `${totalItems} jobs found`}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={() => fetchJobs(page)} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newView) => newView && setViewMode(newView)}
              size="small"
            >
              <ToggleButton value="grid">
                <ViewModuleIcon />
              </ToggleButton>
              <ToggleButton value="list">
                <ViewListIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Jobs grid */}
        {loading ? (
          <Grid container spacing={3}>
            {Array.from({ length: 12 }).map((_, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                lg={viewMode === 'grid' ? 4 : 12}
                key={index}
              >
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Skeleton
                        variant="circular"
                        width={48}
                        height={48}
                        sx={{ mr: 2 }}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Skeleton variant="text" width="60%" height={24} />
                        <Skeleton variant="text" width="40%" height={20} />
                      </Box>
                    </Box>
                    <Skeleton variant="text" width="100%" height={20} />
                    <Skeleton variant="text" width="80%" height={20} />
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Skeleton
                        variant="rectangular"
                        width={80}
                        height={24}
                        sx={{ borderRadius: 1 }}
                      />
                    <Skeleton
                      variant="rectangular"
                        width={60}
                        height={24}
                        sx={{ borderRadius: 1 }}
                    />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : jobs.length > 0 ? (
          <>
            <Grid container spacing={3}>
              <AnimatePresence>
                {jobs.map((job) => renderJobCard(job))}
              </AnimatePresence>
            </Grid>

            {/* Pagination */}
            {totalItems > 12 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={Math.ceil(totalItems / 12)}
                  page={page}
                  onChange={(event, value) => setPage(value)}
                  color="primary"
                  size="large"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <WorkOutlineIcon
              sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant="h5" fontWeight={600} gutterBottom>
              No jobs found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Try adjusting your search criteria or filters
            </Typography>
            <AnimatedButton
              variant="contained"
              onClick={clearAllFilters}
              startIcon={<ClearIcon />}
            >
              Clear Filters
            </AnimatedButton>
          </Box>
        )}

        {/* Advanced Filters Dialog */}
        <Dialog
          open={filterDialog}
          onClose={() => setFilterDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="h5" fontWeight={600}>
                Advanced Filters
              </Typography>
              <IconButton onClick={() => setFilterDialog(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Skill Level</InputLabel>
                  <Select
                    value={filters.skillLevel}
                    label="Skill Level"
                    onChange={(e) =>
                      handleFilterChange('skillLevel', e.target.value)
                    }
                  >
                    <MenuItem value="">Any Level</MenuItem>
                    {skillLevels.map((level) => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Job Type</InputLabel>
                <Select
                    value={filters.jobType}
                    label="Job Type"
                    onChange={(e) =>
                      handleFilterChange('jobType', e.target.value)
                    }
                  >
                    <MenuItem value="">Any Type</MenuItem>
                    {jobTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography gutterBottom>
                  Pay Range: ${filters.payRange[0]} - ${filters.payRange[1]} per
                  hour
                </Typography>
                <Slider
                  value={filters.payRange}
                  onChange={(e, newValue) =>
                    handleFilterChange('payRange', newValue)
                  }
                  valueLabelDisplay="auto"
                  min={0}
                  max={200}
                  step={5}
                  marks={[
                    { value: 0, label: '$0' },
                    { value: 50, label: '$50' },
                    { value: 100, label: '$100' },
                    { value: 200, label: '$200+' },
                  ]}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Date Posted</InputLabel>
                  <Select
                    value={filters.datePosted}
                    label="Date Posted"
                    onChange={(e) =>
                      handleFilterChange('datePosted', e.target.value)
                    }
                                >
                    <MenuItem value="">Any Time</MenuItem>
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="week">This Week</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={clearAllFilters} startIcon={<ClearIcon />}>
              Clear All
            </Button>
            <AnimatedButton
              variant="contained"
              onClick={() => setFilterDialog(false)}
                            >
              Apply Filters
            </AnimatedButton>
          </DialogActions>
        </Dialog>

        {/* Snackbar for feedback */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            sx={{ borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Floating Action Button */}
        <SpeedDial
          ariaLabel="Quick Actions"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
                          >
          <SpeedDialAction
            icon={<SavingsIcon />}
            tooltipTitle="Saved Jobs"
            onClick={() => navigate('/worker/saved-jobs')}
          />
          <SpeedDialAction
            icon={<ApplyIcon />}
            tooltipTitle="My Applications"
            onClick={() => navigate('/worker/applications')}
          />
          <SpeedDialAction
            icon={<TuneIcon />}
            tooltipTitle="Advanced Filters"
            onClick={() => setFilterDialog(true)}
                  />
        </SpeedDial>
      </Container>
    </>
  );
};

export default JobApplicationPage;
