import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Card,
  CardContent,
  CardActions,
  IconButton,
  TextField,
  InputAdornment,
  Stack,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery,
  alpha,
  Skeleton,
  Fade,
  Grow,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Plumbing as PlumbingIcon,
  Carpenter as CarpenterIcon,
  ElectricalServices as ElectricalServicesIcon,
  LocationOn as LocationOnIcon,
  CalendarToday as CalendarTodayIcon,
  AttachMoney as AttachMoneyIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Work as WorkIcon,
  AccessTime as TimeIcon,
  Group as GroupIcon,
  Refresh as RefreshIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardCard from '../common/DashboardCard';
import jobsApi from '../../../jobs/services/jobsApi';
// Removed AuthContext import to prevent dual state management conflicts
// import { useAuth } from '../../../auth/contexts/AuthContext';

// Enhanced trade icon mapping
// Utility function to format budget/salary data
const formatSalary = (salary) => {
  if (!salary) return 'Not specified';
  
  // If salary is already a string, return it
  if (typeof salary === 'string') return salary;
  
  // If salary is an object with budget information
  if (typeof salary === 'object' && salary !== null) {
    const { min, max, currency = 'GHS' } = salary;
    if (min && max) {
      return `${currency} ${min} - ${max}`;
    } else if (min) {
      return `${currency} ${min}+`;
    } else if (max) {
      return `Up to ${currency} ${max}`;
    }
  }
  
  return 'Not specified';
};

const tradeIconMap = {
  Plumbing: { icon: <PlumbingIcon />, color: '#2196F3' },
  Carpentry: { icon: <CarpenterIcon />, color: '#8D6E63' },
  Electrical: { icon: <ElectricalServicesIcon />, color: '#FFD700' },
  Masonry: { icon: <WorkIcon />, color: '#607D8B' },
  Painting: { icon: <WorkIcon />, color: '#E91E63' },
  Welding: { icon: <WorkIcon />, color: '#FF5722' },
  Roofing: { icon: <WorkIcon />, color: '#795548' },
  Default: { icon: <WorkIcon />, color: '#9E9E9E' },
};

// Helper function to get icon and color for job
const getJobIconData = (job) => {
  const primaryTrade = job.category || job.tags?.[0] || 'Default';
  return tradeIconMap[primaryTrade] || tradeIconMap.Default;
};

// Job priority mapping
const getPriorityChip = (job) => {
  if (job.urgent || job.priority === 'urgent') {
    return {
      label: 'Urgent',
      color: '#FF5722',
      bgColor: alpha('#FF5722', 0.1),
    };
  }
  if (job.featured || job.priority === 'high') {
    return {
      label: 'Featured',
      color: '#FFD700',
      bgColor: alpha('#FFD700', 0.1),
    };
  }
  if (
    job.new ||
    Date.now() - new Date(job.created_at).getTime() < 24 * 60 * 60 * 1000
  ) {
    return { label: 'New', color: '#4CAF50', bgColor: alpha('#4CAF50', 0.1) };
  }
  return null;
};

const EnhancedAvailableJobs = () => {
  const theme = useTheme();
  // Use ONLY Redux auth state to prevent dual state management conflicts
  const { user } = useSelector((state) => state.auth);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [jobs, setJobs] = useState([]);
  // REMOVED: filteredJobs state - use applyFiltersAndSearch directly
  // const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);
  const [selectedJobForMenu, setSelectedJobForMenu] = useState(null);

  const [feedback, setFeedback] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Jobs', icon: <WorkIcon /> },
    { value: 'nearby', label: 'Nearby', icon: <LocationOnIcon /> },
    { value: 'urgent', label: 'Urgent', icon: <TrendingUpIcon /> },
    { value: 'featured', label: 'Featured', icon: <StarIcon /> },
    { value: 'new', label: 'New Today', icon: <ScheduleIcon /> },
  ];

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'salary', label: 'Highest Pay' },
    { value: 'distance', label: 'Closest' },
    { value: 'relevance', label: 'Most Relevant' },
  ];

  // Fetch jobs
  const fetchJobs = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const response = await jobsApi.getJobs({
        status: 'open',
        nearby: true,
        limit: 20,
        userSkills: user?.skills || [],
      });

      // Ensure response exists and has jobs array
      if (!response || !Array.isArray(response.jobs)) {
        console.warn('Invalid response from jobsApi.getJobs:', response);
        setJobs([]);
        setError(null);
        return;
      }

      const mappedJobs =
        response.jobs.map((job) => ({
          ...job,
          ...getJobIconData(job),
          status: savedJobs.has(job.id) ? 'saved' : 'idle',
          distance: job.distance || Math.floor(Math.random() * 20) + 1, // Mock distance
          salary: job.salary || job.budget || `GH₵${Math.floor(Math.random() * 500) + 100}/day`,
          applicants: job.applicants || Math.floor(Math.random() * 15) + 1,
          matchScore: job.matchScore || Math.floor(Math.random() * 40) + 60, // Mock match score
        }));

      setJobs(mappedJobs);
      setError(null);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchJobs();
  }, []);

  // Filter and search jobs
  const applyFiltersAndSearch = useMemo(() => {
    // Ensure jobs is an array before spreading
    if (!Array.isArray(jobs)) {
      return [];
    }
    let filtered = [...jobs];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(query) ||
          job.company?.toLowerCase().includes(query) ||
          job.location?.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query) ||
          job.category?.toLowerCase().includes(query),
      );
    }

    // Apply filters
    switch (selectedFilter) {
      case 'nearby':
        filtered = filtered.filter((job) => job.distance <= 10);
        break;
      case 'urgent':
        filtered = filtered.filter(
          (job) => job.urgent || job.priority === 'urgent',
        );
        break;
      case 'featured':
        filtered = filtered.filter(
          (job) => job.featured || job.priority === 'high',
        );
        break;
      case 'new':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = filtered.filter((job) => new Date(job.created_at) >= today);
        break;
      default:
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'salary':
        filtered.sort((a, b) => {
          const getSalaryAmount = (salary) => {
            if (typeof salary === 'string') {
              return parseInt(salary.match(/\d+/)?.[0] || '0');
            } else if (typeof salary === 'object' && salary !== null) {
              return salary.max || salary.min || 0;
            }
            return 0;
          };
          const salaryA = getSalaryAmount(a.salary);
          const salaryB = getSalaryAmount(b.salary);
          return salaryB - salaryA;
        });
        break;
      case 'distance':
        filtered.sort((a, b) => a.distance - b.distance);
        break;
      case 'relevance':
        filtered.sort((a, b) => b.matchScore - a.matchScore);
        break;
      default: // newest
        filtered.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        );
        break;
    }

    return filtered;
  }, [jobs, searchQuery, selectedFilter, sortBy]);

  // REMOVED: This useEffect was causing infinite re-renders
  // Instead, use applyFiltersAndSearch directly in the component
  // useEffect(() => {
  //   setFilteredJobs(applyFiltersAndSearch);
  // }, [applyFiltersAndSearch]);

  // Handle job application
  const handleApply = async (jobId) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, status: 'loading' } : job,
      ),
    );

    try {
      await jobsApi.applyToJob(jobId, {
        coverMessage:
          'I am interested in this position and believe my skills are a perfect match.',
      });

      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, status: 'applied' } : job,
        ),
      );

      showFeedback('Application submitted successfully!', 'success');
    } catch (err) {
      console.error('Error applying to job:', err);
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, status: 'idle' } : job,
        ),
      );
      showFeedback('Failed to submit application. Please try again.', 'error');
    }
  };

  // Handle saving jobs
  const handleSaveJob = (jobId) => {
    const newSavedJobs = new Set(savedJobs);
    if (newSavedJobs.has(jobId)) {
      newSavedJobs.delete(jobId);
      showFeedback('Job removed from saved list', 'info');
    } else {
      newSavedJobs.add(jobId);
      showFeedback('Job saved successfully!', 'success');
    }
    setSavedJobs(newSavedJobs);

    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? { ...job, status: newSavedJobs.has(jobId) ? 'saved' : 'idle' }
          : job,
      ),
    );
  };

  // Helper functions
  const showFeedback = (message, severity) => {
    setFeedback({ open: true, message, severity });
  };

  const handleCloseDetails = () => setSelectedJob(null);
  const handleCloseFeedback = () =>
    setFeedback((prev) => ({ ...prev, open: false }));

  // Enhanced Job Card Component
  const JobCard = ({ job, index }) => {
    const priorityChip = getPriorityChip(job);
    const isApplied = job.status === 'applied';
    const isSaved = savedJobs.has(job.id);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Card
          sx={{
            background:
              'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 100%)',
            border: `1px solid ${alpha(job.color || '#FFD700', 0.2)}`,
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 25px ${alpha(job.color || '#FFD700', 0.3)}`,
              border: `1px solid ${alpha(job.color || '#FFD700', 0.4)}`,
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: `linear-gradient(90deg, ${job.color || '#FFD700'} 0%, ${alpha(job.color || '#FFD700', 0.8)} 100%)`,
            },
          }}
          onClick={() => setSelectedJob(job)}
        >
          <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            {/* Header Row */}
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ flex: 1, minWidth: 0 }}
              >
                <Box
                  sx={{
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    borderRadius: '50%',
                    background: alpha(job.color || '#FFD700', 0.2),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: job.color || '#FFD700',
                    flexShrink: 0,
                  }}
                >
                  {job.icon}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                      lineHeight: 1.2,
                      mb: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {job.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: { xs: '0.8rem', sm: '0.85rem' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {job.company}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Tooltip title={isSaved ? 'Remove from saved' : 'Save job'}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveJob(job.id);
                    }}
                    sx={{
                      color: isSaved ? '#FFD700' : 'rgba(255,255,255,0.5)',
                      '&:hover': {
                        color: '#FFD700',
                        background: alpha('#FFD700', 0.1),
                      },
                    }}
                  >
                    {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="More options">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedJobForMenu(job);
                      setMoreMenuAnchor(e.currentTarget);
                    }}
                    sx={{
                      color: 'rgba(255,255,255,0.5)',
                      '&:hover': {
                        color: '#fff',
                        background: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            {/* Job Details */}
            <Stack spacing={1.5}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                flexWrap="wrap"
              >
                <Chip
                  icon={<LocationOnIcon />}
                  label={`${job.location} • ${job.distance}km`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '0.75rem',
                  }}
                />
                <Chip
                  icon={<AttachMoneyIcon />}
                  label={formatSalary(job.salary)}
                  size="small"
                  sx={{
                    backgroundColor: alpha('#4CAF50', 0.2),
                    color: '#4CAF50',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                />
              </Stack>

              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.85rem',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {job.description}
              </Typography>

              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  {priorityChip && (
                    <Chip
                      label={priorityChip.label}
                      size="small"
                      sx={{
                        backgroundColor: priorityChip.bgColor,
                        color: priorityChip.color,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        height: '24px',
                      }}
                    />
                  )}
                  <Chip
                    label={`${job.matchScore}% match`}
                    size="small"
                    sx={{
                      backgroundColor: alpha('#2196F3', 0.2),
                      color: '#2196F3',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      height: '24px',
                    }}
                  />
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Tooltip title="Applicants">
                    <Chip
                      icon={<GroupIcon />}
                      label={job.applicants}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.7rem',
                        height: '24px',
                      }}
                    />
                  </Tooltip>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: '0.7rem',
                    }}
                  >
                    {job.timeAgo || '2h ago'}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </CardContent>

          <CardActions sx={{ p: { xs: 2, sm: 2.5 }, pt: 0 }}>
            <Button
              fullWidth
              variant={isApplied ? 'outlined' : 'contained'}
              color={isApplied ? 'success' : 'primary'}
              disabled={job.status === 'loading'}
              onClick={(e) => {
                e.stopPropagation();
                if (!isApplied) {
                  handleApply(job.id);
                }
              }}
              startIcon={
                job.status === 'loading' ? (
                  <CircularProgress size={16} color="inherit" />
                ) : isApplied ? (
                  <CheckCircleIcon />
                ) : null
              }
              sx={{
                py: 1.2,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                textTransform: 'none',
                ...(isApplied
                  ? {
                      borderColor: '#4CAF50',
                      color: '#4CAF50',
                      '&:hover': {
                        borderColor: '#388E3C',
                        backgroundColor: alpha('#4CAF50', 0.1),
                      },
                    }
                  : {
                      background:
                        'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                      color: '#000',
                      '&:hover': {
                        background:
                          'linear-gradient(135deg, #FFC000 0%, #FFB300 100%)',
                        transform: 'translateY(-1px)',
                      },
                    }),
              }}
            >
              {isApplied ? 'Applied' : 'Apply Now'}
            </Button>
          </CardActions>
        </Card>
      </motion.div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardCard
        title="Available Jobs"
        action={
          <IconButton disabled>
            <RefreshIcon />
          </IconButton>
        }
      >
        <Stack spacing={2}>
          {[...Array(3)].map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              height={180}
              sx={{ borderRadius: 3 }}
            />
          ))}
        </Stack>
      </DashboardCard>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardCard title="Available Jobs">
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => fetchJobs()}
            sx={{
              borderColor: '#FFD700',
              color: '#FFD700',
              '&:hover': {
                borderColor: '#FFC000',
                backgroundColor: alpha('#FFD700', 0.1),
              },
            }}
          >
            Try Again
          </Button>
        </Box>
      </DashboardCard>
    );
  }

  return (
    <>
      <DashboardCard
        title={
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 700 }}>
              Available Jobs
            </Typography>
            <Badge badgeContent={applyFiltersAndSearch.length} color="primary">
              <WorkIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
            </Badge>
          </Stack>
        }
        action={
          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh jobs">
              <IconButton
                onClick={() => fetchJobs(true)}
                disabled={isRefreshing}
                sx={{
                  color: '#FFD700',
                  '&:hover': {
                    backgroundColor: alpha('#FFD700', 0.1),
                  },
                }}
              >
                <RefreshIcon
                  sx={{
                    animation: isRefreshing
                      ? 'spin 1s linear infinite'
                      : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              </IconButton>
            </Tooltip>
          </Stack>
        }
      >
        {/* Search and Filter Bar */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <TextField
              placeholder="Search jobs, companies, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: 'rgba(255,215,0,0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255,215,0,0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FFD700',
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#fff',
                  '&::placeholder': {
                    color: 'rgba(255,255,255,0.5)',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
              sx={{
                borderColor: 'rgba(255,215,0,0.3)',
                color: '#FFD700',
                '&:hover': {
                  borderColor: '#FFD700',
                  backgroundColor: alpha('#FFD700', 0.1),
                },
              }}
            >
              {isMobile ? 'Filter' : `Filter (${selectedFilter})`}
            </Button>
          </Stack>

          {/* Quick Filters */}
          <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
            {filterOptions.map((option) => (
              <Chip
                key={option.value}
                icon={option.icon}
                label={option.label}
                clickable
                onClick={() => setSelectedFilter(option.value)}
                sx={{
                  backgroundColor:
                    selectedFilter === option.value
                      ? alpha('#FFD700', 0.2)
                      : 'rgba(255,255,255,0.05)',
                  color:
                    selectedFilter === option.value
                      ? '#FFD700'
                      : 'rgba(255,255,255,0.7)',
                  border: `1px solid ${
                    selectedFilter === option.value
                      ? 'rgba(255,215,0,0.5)'
                      : 'rgba(255,255,255,0.1)'
                  }`,
                  '&:hover': {
                    backgroundColor: alpha('#FFD700', 0.1),
                    color: '#FFD700',
                  },
                  flexShrink: 0,
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Results Count and Sort */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {applyFiltersAndSearch.length} job{applyFiltersAndSearch.length !== 1 ? 's' : ''}{' '}
            found
          </Typography>

          <TextField
            select
            size="small"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            sx={{
              minWidth: 120,
              '& .MuiSelect-select': {
                color: '#fff',
                fontSize: '0.85rem',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,215,0,0.3)',
              },
            }}
          >
            {sortOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {/* Jobs Grid */}
        {applyFiltersAndSearch.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <WorkIcon
              sx={{ fontSize: 64, color: 'rgba(255,255,255,0.3)', mb: 2 }}
            />
            <Typography
              variant="h6"
              sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}
            >
              No jobs found
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Try adjusting your search or filters
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            <AnimatePresence mode="popLayout">
              {applyFiltersAndSearch.map((job, index) => (
                <Grid item xs={12} sm={6} lg={4} key={job.id}>
                  <JobCard job={job} index={index} />
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        )}

        {/* Load More Button */}
        {applyFiltersAndSearch.length > 0 && applyFiltersAndSearch.length < jobs.length && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => fetchJobs()}
              sx={{
                borderColor: 'rgba(255,215,0,0.3)',
                color: '#FFD700',
                '&:hover': {
                  borderColor: '#FFD700',
                  backgroundColor: alpha('#FFD700', 0.1),
                },
              }}
            >
              Load More Jobs
            </Button>
          </Box>
        )}
      </DashboardCard>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
      >
        {filterOptions.map((option) => (
          <MenuItem
            key={option.value}
            selected={selectedFilter === option.value}
            onClick={() => {
              setSelectedFilter(option.value);
              setFilterMenuAnchor(null);
            }}
          >
            <ListItemIcon>{option.icon}</ListItemIcon>
            <ListItemText>{option.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* More Options Menu */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={() => {
          setMoreMenuAnchor(null);
          setSelectedJobForMenu(null);
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedJobForMenu) {
              handleSaveJob(selectedJobForMenu.id);
            }
            setMoreMenuAnchor(null);
            setSelectedJobForMenu(null);
          }}
        >
          <ListItemIcon>
            {selectedJobForMenu && savedJobs.has(selectedJobForMenu.id) ? (
              <BookmarkIcon />
            ) : (
              <BookmarkBorderIcon />
            )}
          </ListItemIcon>
          <ListItemText>
            {selectedJobForMenu && savedJobs.has(selectedJobForMenu.id)
              ? 'Remove from Saved'
              : 'Save Job'}
          </ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Implement share functionality
            setMoreMenuAnchor(null);
            setSelectedJobForMenu(null);
          }}
        >
          <ListItemIcon>
            <ShareIcon />
          </ListItemIcon>
          <ListItemText>Share Job</ListItemText>
        </MenuItem>
      </Menu>

      {/* Job Details Dialog */}
      <Dialog
        open={Boolean(selectedJob)}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background:
              'linear-gradient(135deg, rgba(30,30,30,0.98) 0%, rgba(40,40,40,0.98) 100%)',
            border: '1px solid rgba(255,215,0,0.2)',
          },
        }}
      >
        {selectedJob && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: alpha(selectedJob.color || '#FFD700', 0.2),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: selectedJob.color || '#FFD700',
                  }}
                >
                  {selectedJob.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h5"
                    sx={{ color: '#fff', fontWeight: 700 }}
                  >
                    {selectedJob.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    {selectedJob.company}
                  </Typography>
                </Box>
                <IconButton
                  onClick={handleCloseDetails}
                  sx={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  <CloseIcon />
                </IconButton>
              </Stack>
            </DialogTitle>

            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <LocationOnIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                      <Typography sx={{ color: '#fff' }}>
                        {selectedJob.location} ({selectedJob.distance}km away)
                      </Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AttachMoneyIcon
                        sx={{ color: 'rgba(255,255,255,0.5)' }}
                      />
                      <Typography sx={{ color: '#4CAF50', fontWeight: 600 }}>
                        {formatSalary(selectedJob.salary)}
                      </Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CalendarTodayIcon
                        sx={{ color: 'rgba(255,255,255,0.5)' }}
                      />
                      <Typography sx={{ color: '#fff' }}>
                        Duration: {selectedJob.duration || 'Not specified'}
                      </Typography>
                    </Stack>
                  </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <GroupIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                      <Typography sx={{ color: '#fff' }}>
                        {selectedJob.applicants} applicants
                      </Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={1}>
                      <StarIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                      <Typography sx={{ color: '#2196F3', fontWeight: 600 }}>
                        {selectedJob.matchScore}% match
                      </Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TimeIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                      <Typography sx={{ color: '#fff' }}>
                        Posted {selectedJob.timeAgo || '2 hours ago'}
                      </Typography>
                    </Stack>
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Divider
                    sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }}
                  />
                  <Typography variant="h6" sx={{ color: '#FFD700', mb: 2 }}>
                    Job Description
                  </Typography>
                  <Typography
                    sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}
                  >
                    {selectedJob.description}
                  </Typography>
                </Grid>

                {selectedJob.requirements && (
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ color: '#FFD700', mb: 2 }}>
                      Requirements
                    </Typography>
                    <Box component="ul" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      {selectedJob.requirements.map((req, index) => (
                        <Typography component="li" key={index} sx={{ mb: 0.5 }}>
                          {req}
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button
                onClick={() => handleSaveJob(selectedJob.id)}
                startIcon={
                  savedJobs.has(selectedJob.id) ? (
                    <BookmarkIcon />
                  ) : (
                    <BookmarkBorderIcon />
                  )
                }
                sx={{
                  color: '#FFD700',
                  borderColor: 'rgba(255,215,0,0.3)',
                  '&:hover': {
                    borderColor: '#FFD700',
                    backgroundColor: alpha('#FFD700', 0.1),
                  },
                }}
              >
                {savedJobs.has(selectedJob.id) ? 'Saved' : 'Save'}
              </Button>

              {selectedJob.status !== 'applied' ? (
                <Button
                  variant="contained"
                  onClick={() => {
                    handleApply(selectedJob.id);
                    handleCloseDetails();
                  }}
                  disabled={selectedJob.status === 'loading'}
                  sx={{
                    background:
                      'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                    color: '#000',
                    fontWeight: 700,
                    '&:hover': {
                      background:
                        'linear-gradient(135deg, #FFC000 0%, #FFB300 100%)',
                    },
                  }}
                >
                  Apply Now
                </Button>
              ) : (
                <Button
                  variant="contained"
                  disabled
                  startIcon={<CheckCircleIcon />}
                  sx={{
                    backgroundColor: '#4CAF50',
                    color: '#fff',
                  }}
                >
                  Applied
                </Button>
              )}
            </DialogActions>
          </motion.div>
        )}
      </Dialog>

      {/* Feedback Snackbar */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseFeedback}
          severity={feedback.severity}
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EnhancedAvailableJobs;
