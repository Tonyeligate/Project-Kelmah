import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Skeleton,
  Pagination,
  Drawer,
  IconButton,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  Stack,
  Rating,
  Divider,
  alpha,
  Grow,
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterListIcon,
  TrendingUp,
  CheckCircle,
  Group,
  WorkspacePremium,
  LocationOn,
  Schedule,
  MonetizationOn,
  Business,
  Star,
  Verified,
  AccessTime,
} from '@mui/icons-material';
import useAuth from '../../auth/hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchJobs,
  setFilters,
  selectJobs,
  selectJobsLoading,
  selectJobsError,
  selectJobFilters,
  selectJobsPagination,
} from '../services/jobSlice';
import JobCard from '../components/common/JobCard';
import { useNavigate } from 'react-router-dom';

// Sample jobs to showcase the platform
const sampleJobs = [
  {
    id: 'sample-job-1',
    title: 'Complete Bathroom Renovation',
    description: 'Need a full bathroom renovation including new tiles, toilet, sink, and shower installation. Looking for experienced professionals with plumbing and electrical skills.',
    budget: { min: 3500, max: 5000, currency: 'USD' },
    location: 'Accra, Ghana',
    jobType: 'contract',
    experience: 'mid',
    skills: ['Plumbing', 'Tiling', 'Electrical'],
    urgency: 'high',
    postedDate: '2024-01-15',
    applicants: 12,
    client: {
      name: 'Johnson Family',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      rating: 4.8,
      jobsPosted: 8,
      verified: true
    },
    featured: true,
    estimatedDuration: '2-3 weeks'
  },
  {
    id: 'sample-job-2',
    title: 'Kitchen Cabinet Installation',
    description: 'Install new kitchen cabinets and countertops. All materials provided. Need skilled carpenter with experience in kitchen installations.',
    budget: { min: 2000, max: 3000, currency: 'USD' },
    location: 'Kumasi, Ghana',
    jobType: 'freelance',
    experience: 'senior',
    skills: ['Carpentry', 'Installation'],
    urgency: 'medium',
    postedDate: '2024-01-14',
    applicants: 8,
    client: {
      name: 'Sarah Mitchell',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
      rating: 4.9,
      jobsPosted: 15,
      verified: true
    },
    featured: false,
    estimatedDuration: '1-2 weeks'
  },
  {
    id: 'sample-job-3',
    title: 'Office Interior Painting',
    description: 'Paint interior walls of a modern office space. 2000 sq ft area. Premium paint will be provided. Looking for professional painters.',
    budget: { min: 1500, max: 2500, currency: 'USD' },
    location: 'Tema, Ghana',
    jobType: 'contract',
    experience: 'entry',
    skills: ['Painting', 'Interior Design'],
    urgency: 'low',
    postedDate: '2024-01-13',
    applicants: 15,
    client: {
      name: 'TechCorp Ltd',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
      rating: 4.7,
      jobsPosted: 25,
      verified: true
    },
    featured: false,
    estimatedDuration: '1 week'
  },
  {
    id: 'sample-job-4',
    title: 'Smart Home Electrical Setup',
    description: 'Install smart home electrical systems including automated lighting, security cameras, and smart switches throughout the house.',
    budget: { min: 4000, max: 6000, currency: 'USD' },
    location: 'Cape Coast, Ghana',
    jobType: 'full-time',
    experience: 'senior',
    skills: ['Electrical', 'Home Automation', 'Security Systems'],
    urgency: 'high',
    postedDate: '2024-01-12',
    applicants: 6,
    client: {
      name: 'Dr. Kwame Asante',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      rating: 5.0,
      jobsPosted: 3,
      verified: true
    },
    featured: true,
    estimatedDuration: '3-4 weeks'
  }
];

const platformStats = [
  { icon: <Business />, value: '10,000+', label: 'Active Jobs' },
  { icon: <CheckCircle />, value: '95%', label: 'Completion Rate' },
  { icon: <Group />, value: '25,000+', label: 'Happy Clients' },
  { icon: <Star />, value: '4.8/5', label: 'Average Rating' }
];

const EnhancedJobCard = ({ job, onViewDetails, isDemo = false }) => {
  const theme = useTheme();
  
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getUrgencyLabel = (urgency) => {
    switch (urgency) {
      case 'high': return 'Urgent';
      case 'medium': return 'Normal';
      case 'low': return 'Flexible';
      default: return 'Normal';
    }
  };

  return (
    <Card
      sx={{
        mb: 2,
        transition: 'all 0.3s ease',
        background: job.featured 
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
          : 'transparent',
        border: job.featured 
          ? `2px solid ${alpha(theme.palette.primary.main, 0.3)}`
          : `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        borderRadius: 3,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {job.featured && (
          <Chip
            icon={<Star />}
            label="Featured Job"
            color="primary"
            size="small"
            sx={{ mb: 2, fontWeight: 'bold' }}
          />
        )}
        
        <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
          <Avatar
            src={job.client?.avatar}
            sx={{ width: 50, height: 50, border: `2px solid ${theme.palette.primary.main}` }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                {job.title}
              </Typography>
              {job.client?.verified && (
                <Verified color="primary" fontSize="small" />
              )}
            </Stack>
            
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                by {job.client?.name}
              </Typography>
              <Rating value={job.client?.rating || 5} precision={0.1} size="small" readOnly />
              <Typography variant="body2" color="text.secondary">
                ({job.client?.jobsPosted} jobs posted)
              </Typography>
            </Stack>
          </Box>
          <Chip
            label={getUrgencyLabel(job.urgency)}
            color={getUrgencyColor(job.urgency)}
            size="small"
          />
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
          {job.description}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MonetizationOn fontSize="small" color="success" sx={{ mr: 0.5 }} />
            <Typography variant="body2" fontWeight="bold" color="success.main">
              ${job.budget?.min} - ${job.budget?.max}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              {job.location}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Schedule fontSize="small" color="action" sx={{ mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              {job.estimatedDuration}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          {job.skills?.map((skill, index) => (
            <Chip
              key={index}
              label={skill}
              size="small"
              variant="outlined"
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                fontSize: '0.75rem'
              }}
            />
          ))}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" fontWeight="bold" color="primary">
                {job.applicants}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Applicants
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" fontWeight="bold" color="primary">
                {job.jobType?.charAt(0).toUpperCase() + job.jobType?.slice(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Job Type
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" fontWeight="bold" color="primary">
                {new Date(job.postedDate).toLocaleDateString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Posted
              </Typography>
            </Box>
          </Stack>
          
          <Button
            variant="contained"
            onClick={() => !isDemo && onViewDetails(job.id)}
            disabled={isDemo}
            sx={{
              background: job.featured 
                ? `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`
                : theme.palette.primary.main,
              fontWeight: 'bold',
              px: 3
            }}
          >
            {isDemo ? 'View Details (Demo)' : 'View Details'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

const EmptyState = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          borderRadius: 4,
          p: 6,
          mb: 6,
        }}
      >
        <Typography variant="h3" component="h2" gutterBottom fontWeight="bold">
          💼 Discover Amazing Opportunities
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          Connect with clients who need your skills. From quick tasks to long-term projects, 
          find work that matches your expertise and schedule.
        </Typography>
        
        {/* Platform Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {platformStats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ color: theme.palette.primary.main, mb: 1, fontSize: 40 }}>
                  {stat.icon}
                </Box>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register?type=worker')}
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
              px: 4,
              py: 1.5,
              fontWeight: 'bold'
            }}
          >
            Join as Professional
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/register')}
            sx={{ px: 4, py: 1.5, fontWeight: 'bold' }}
          >
            Post a Job
          </Button>
        </Stack>
      </Box>

      {/* Sample Jobs Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Featured Opportunities
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Here are some of the exciting projects waiting for skilled professionals
        </Typography>
        
        <Grid container spacing={3}>
          {sampleJobs.map((job, index) => (
            <Grid item xs={12} key={job.id}>
              <Grow in timeout={300 + index * 200}>
                <div>
                  <EnhancedJobCard job={job} isDemo={true} />
                </div>
              </Grow>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Success Stories */}
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          💬 Success Stories
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Rating value={5} readOnly size="small" sx={{ mb: 2 }} />
              <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                "Found my dream plumbing job through Kelmah. Great clients and fair pay!"
              </Typography>
              <Typography variant="subtitle2" color="primary">
                - Michael O., Plumber
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Rating value={5} readOnly size="small" sx={{ mb: 2 }} />
              <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                "Consistently find quality electrical projects. Platform is easy to use!"
              </Typography>
              <Typography variant="subtitle2" color="primary">
                - Sarah A., Electrician
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Rating value={5} readOnly size="small" sx={{ mb: 2 }} />
              <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                "Built my carpentry business through connections made on Kelmah!"
              </Typography>
              <Typography variant="subtitle2" color="primary">
                - David K., Carpenter
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Call to Action */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Ready to find your next opportunity?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Use the filters above to find jobs that match your skills and preferences
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<SearchIcon />}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            px: 4,
            py: 1.5,
            fontWeight: 'bold'
          }}
        >
          Start Your Search
        </Button>
      </Box>
    </Box>
  );
};

const JobsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const filters = useSelector(selectJobFilters);
  const { currentPage, totalPages } = useSelector(selectJobsPagination);

  // Ensure jobs is always an array
  const jobs = useSelector(selectJobs) || [];
  const loading = useSelector(selectJobsLoading);
  const error = useSelector(selectJobsError);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSampleData, setShowSampleData] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Fetch jobs on mount for all users
  useEffect(() => {
    // Don't fetch immediately, show sample data first
    // dispatch(fetchJobs(filters));
  }, []);

  // Handle pagination change
  const handlePageChange = (event, value) => {
    const newFilters = { ...filters, page: value };
    dispatch(setFilters(newFilters));
    dispatch(fetchJobs(newFilters));
    setShowSampleData(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const newFilters = { ...filters, search: searchQuery.trim() };
    dispatch(setFilters(newFilters));
    dispatch(fetchJobs(newFilters));
    setShowSampleData(false);
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    dispatch(setFilters(newFilters));
    dispatch(fetchJobs(newFilters));
    setShowSampleData(false);
  };

  const handleLoadSavedJobs = () => {
    const newFilters = { ...filters, saved: true };
    dispatch(setFilters(newFilters));
    dispatch(fetchJobs(newFilters));
    setShowSampleData(false);
  };

  const handleLoadRecommendedJobs = () => {
    const newFilters = { ...filters, recommended: true };
    dispatch(setFilters(newFilters));
    dispatch(fetchJobs(newFilters));
    setShowSampleData(false);
  };

  const renderFilterSection = () => (
    <Paper sx={{ p: 3, backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 3 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ color: theme.palette.secondary.main, fontWeight: 'bold' }}
      >
        🔍 Find Your Perfect Job
      </Typography>

      <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search jobs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.common.white, 0.1),
              '& fieldset': { borderColor: alpha(theme.palette.common.white, 0.3) },
              '&:hover fieldset': { borderColor: alpha(theme.palette.common.white, 0.5) },
            },
            '& .MuiInputBase-input': { color: 'white' },
            '& .MuiInputLabel-root': { color: alpha(theme.palette.common.white, 0.7) }
          }}
          InputProps={{
            endAdornment: (
              <Button type="submit" sx={{ minWidth: 'auto', color: 'white' }}>
                <SearchIcon />
              </Button>
            ),
          }}
        />
      </Box>

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel sx={{ color: alpha(theme.palette.common.white, 0.7) }}>Job Type</InputLabel>
        <Select
          value={filters.job_type || ''}
          label="Job Type"
          onChange={(e) => handleFilterChange('job_type', e.target.value)}
          sx={{
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.common.white, 0.1),
            color: 'white',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(theme.palette.common.white, 0.3)
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(theme.palette.common.white, 0.5)
            },
            '& .MuiSvgIcon-root': { color: 'white' }
          }}
        >
          <MenuItem value="">All Types</MenuItem>
          <MenuItem value="full-time">Full Time</MenuItem>
          <MenuItem value="part-time">Part Time</MenuItem>
          <MenuItem value="contract">Contract</MenuItem>
          <MenuItem value="freelance">Freelance</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel sx={{ color: alpha(theme.palette.common.white, 0.7) }}>Experience Level</InputLabel>
        <Select
          value={filters.experience || ''}
          label="Experience Level"
          onChange={(e) => handleFilterChange('experience', e.target.value)}
          sx={{
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.common.white, 0.1),
            color: 'white',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(theme.palette.common.white, 0.3)
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(theme.palette.common.white, 0.5)
            },
            '& .MuiSvgIcon-root': { color: 'white' }
          }}
        >
          <MenuItem value="">All Levels</MenuItem>
          <MenuItem value="entry">Entry Level</MenuItem>
          <MenuItem value="mid">Mid Level</MenuItem>
          <MenuItem value="senior">Senior Level</MenuItem>
        </Select>
      </FormControl>

      {user && (
        <Box sx={{ mt: 3 }}>
          <Button
            fullWidth
            variant="contained"
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.primary.main} 90%)`,
              color: 'white',
              mb: 1,
              py: 1.2,
              fontWeight: 'bold',
              borderRadius: 2,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.secondary.dark} 30%, ${theme.palette.primary.dark} 90%)`,
              },
            }}
            onClick={handleLoadSavedJobs}
          >
            💾 Saved Jobs
          </Button>
          <Button
            fullWidth
            variant="contained"
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
              color: 'white',
              py: 1.2,
              fontWeight: 'bold',
              borderRadius: 2,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
              },
            }}
            onClick={handleLoadRecommendedJobs}
          >
            ⭐ Recommended Jobs
          </Button>
        </Box>
      )}
    </Paper>
  );

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
            🚀 Find Your Next Opportunity
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Discover jobs that match your skills and grow your career
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Filters Sidebar */}
          {!isMobile && (
            <Grid item xs={12} md={3}>
              {renderFilterSection()}
            </Grid>
          )}

          {/* Jobs List */}
          <Grid item xs={12} md={isMobile ? 12 : 9}>
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Grid container spacing={3} sx={{ p: 2 }}>
                {Array.from(new Array(6)).map((_, idx) => (
                  <Grid item xs={12} key={idx}>
                    <Paper sx={{ p: 3, borderRadius: 3 }} elevation={2}>
                      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <Skeleton variant="circular" width={50} height={50} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Skeleton variant="text" width="60%" height={32} />
                          <Skeleton variant="text" width="40%" height={20} />
                        </Box>
                      </Stack>
                      <Skeleton variant="text" width="100%" />
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="rectangular" height={60} sx={{ mt: 2, borderRadius: 1 }} />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : showSampleData || jobs.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <Box
                  sx={{
                    mb: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                    p: 2,
                    borderRadius: 2,
                  }}
                >
                  {isMobile && (
                    <IconButton
                      onClick={() => setFilterDrawerOpen(true)}
                      sx={{ color: theme.palette.primary.main, mr: 1 }}
                    >
                      <FilterListIcon />
                    </IconButton>
                  )}
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    📊 Showing {jobs.length} job{jobs.length !== 1 ? 's' : ''}
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Sort by</InputLabel>
                    <Select
                      value={filters.sort || ''}
                      label="Sort by"
                      onChange={(e) => handleFilterChange('sort', e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">Default</MenuItem>
                      <MenuItem value="date_desc">Newest</MenuItem>
                      <MenuItem value="date_asc">Oldest</MenuItem>
                      <MenuItem value="budget_desc">Highest Budget</MenuItem>
                      <MenuItem value="budget_asc">Lowest Budget</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onViewDetails={(id) => navigate(`/jobs/${id}`)}
                  />
                ))}
              </>
            )}
            
            {/* Pagination Controls */}
            {!loading && !showSampleData && totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={filters.page || 1}
                  onChange={handlePageChange}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
      
      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="left"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
      >
        <Box sx={{ width: 300, p: 2 }}>
          {renderFilterSection()}
        </Box>
      </Drawer>
    </>
  );
};

export default JobsPage;
