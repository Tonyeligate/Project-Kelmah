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
  Collapse,
  Fab,
  Badge,
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
  ExpandMore,
  ExpandLess,
  Tune,
  Clear,
  BookmarkBorder,
  Bookmark,
  Share,
  Visibility,
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
    description:
      'Need a full bathroom renovation including new tiles, toilet, sink, and shower installation. Looking for experienced professionals with plumbing and electrical skills.',
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
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      rating: 4.8,
      jobsPosted: 8,
      verified: true,
    },
    featured: true,
    estimatedDuration: '2-3 weeks',
    saved: false,
    views: 245,
  },
  {
    id: 'sample-job-2',
    title: 'Kitchen Cabinet Installation',
    description:
      'Install new kitchen cabinets and countertops. All materials provided. Need skilled carpenter with experience in kitchen installations.',
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
      avatar:
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
      rating: 4.9,
      jobsPosted: 15,
      verified: true,
    },
    featured: false,
    estimatedDuration: '1-2 weeks',
    saved: true,
    views: 189,
  },
  {
    id: 'sample-job-3',
    title: 'Office Interior Painting',
    description:
      'Paint interior walls of a modern office space. 2000 sq ft area. Premium paint will be provided. Looking for professional painters.',
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
      verified: true,
    },
    featured: false,
    estimatedDuration: '1 week',
    saved: false,
    views: 324,
  },
  {
    id: 'sample-job-4',
    title: 'Smart Home Electrical Setup',
    description:
      'Install smart home electrical systems including automated lighting, security cameras, and smart switches throughout the house.',
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
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      rating: 5.0,
      jobsPosted: 3,
      verified: true,
    },
    featured: true,
    estimatedDuration: '3-4 weeks',
    saved: false,
    views: 412,
  },
];

const platformStats = [
  { icon: <Business />, value: '10,000+', label: 'Active Jobs' },
  { icon: <CheckCircle />, value: '95%', label: 'Completion Rate' },
  { icon: <Group />, value: '25,000+', label: 'Happy Clients' },
  { icon: <Star />, value: '4.8/5', label: 'Average Rating' },
];

const EnhancedJobCard = ({
  job,
  onViewDetails,
  onToggleSave,
  isDemo = false,
}) => {
  const theme = useTheme();

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getUrgencyLabel = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'Urgent';
      case 'medium':
        return 'Normal';
      case 'low':
        return 'Flexible';
      default:
        return 'Normal';
    }
  };

  return (
    <Card
      sx={{
        mb: 3,
        transition: 'all 0.3s ease',
        background: job.featured
          ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`
          : theme.palette.background.paper,
        border: job.featured
          ? `2px solid ${alpha(theme.palette.secondary.main, 0.4)}`
          : `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        borderRadius: 3,
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 30px ${alpha(theme.palette.secondary.main, 0.2)}`,
          borderColor: theme.palette.secondary.main,
        },
      }}
    >
      {job.featured && (
        <Box
          sx={{
            background: `linear-gradient(90deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
            color: theme.palette.secondary.contrastText,
            px: 2,
            py: 0.5,
            fontSize: '0.75rem',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          ✨ FEATURED OPPORTUNITY
        </Box>
      )}

      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="flex-start"
              sx={{ mb: 2 }}
            >
              <Avatar
                src={job.client?.avatar}
                sx={{
                  width: 50,
                  height: 50,
                  border: `2px solid ${theme.palette.secondary.main}`,
                }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 1 }}
                >
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ color: theme.palette.text.primary }}
                  >
                    {job.title}
                  </Typography>
                  {job.client?.verified && (
                    <Verified
                      sx={{ color: theme.palette.secondary.main, fontSize: 20 }}
                    />
                  )}
                  <Chip
                    label={getUrgencyLabel(job.urgency)}
                    color={getUrgencyColor(job.urgency)}
                    size="small"
                  />
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    by {job.client?.name}
                  </Typography>
                  <Rating
                    value={job.client?.rating || 5}
                    precision={0.1}
                    size="small"
                    readOnly
                  />
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    ({job.client?.jobsPosted} jobs posted)
                  </Typography>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.primary,
                    lineHeight: 1.6,
                    mb: 2,
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
                  spacing={1}
                  sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
                >
                  {job.skills?.map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      size="small"
                      variant="outlined"
                      sx={{
                        backgroundColor: alpha(
                          theme.palette.secondary.main,
                          0.1,
                        ),
                        borderColor: alpha(theme.palette.secondary.main, 0.3),
                        color: theme.palette.text.primary,
                        fontSize: '0.75rem',
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 1 }}
                >
                  <MonetizationOn
                    sx={{ color: theme.palette.secondary.main, fontSize: 20 }}
                  />
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ color: theme.palette.secondary.main }}
                  >
                    ${job.budget?.min} - ${job.budget?.max}
                  </Typography>
                </Stack>
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  Project Budget
                </Typography>
              </Box>

              <Stack direction="row" spacing={2}>
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    sx={{ color: theme.palette.text.primary }}
                  >
                    {job.applicants}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Applicants
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    sx={{ color: theme.palette.text.primary }}
                  >
                    {job.views}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Views
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <LocationOn
                  fontSize="small"
                  sx={{ color: theme.palette.secondary.main }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.primary }}
                >
                  {job.location}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Schedule
                  fontSize="small"
                  sx={{ color: theme.palette.secondary.main }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.primary }}
                >
                  {job.estimatedDuration}
                </Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              Posted {new Date(job.postedDate).toLocaleDateString()}
            </Typography>
            <Chip
              label={
                job.jobType?.charAt(0).toUpperCase() + job.jobType?.slice(1)
              }
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          </Stack>

          <Stack direction="row" spacing={1}>
            <IconButton
              size="small"
              onClick={() => !isDemo && onToggleSave(job.id)}
              disabled={isDemo}
              sx={{
                color: job.saved
                  ? theme.palette.secondary.main
                  : theme.palette.text.secondary,
              }}
            >
              {job.saved ? <Bookmark /> : <BookmarkBorder />}
            </IconButton>
            <IconButton
              size="small"
              sx={{ color: theme.palette.text.secondary }}
            >
              <Share />
            </IconButton>
            <Button
              variant="contained"
              onClick={() => !isDemo && onViewDetails(job.id)}
              disabled={isDemo}
              sx={{
                background: job.featured
                  ? `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.secondary.light} 90%)`
                  : theme.palette.secondary.main,
                color: theme.palette.secondary.contrastText,
                fontWeight: 'bold',
                px: 3,
                '&:hover': {
                  backgroundColor: theme.palette.secondary.dark,
                },
              }}
            >
              {isDemo ? 'View (Demo)' : 'View Details'}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

const CompactFilters = ({
  filters,
  onFilterChange,
  onSearch,
  searchQuery,
  setSearchQuery,
  user,
  onLoadSaved,
  onLoadRecommended,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const handleClearFilters = () => {
    onFilterChange('job_type', '');
    onFilterChange('experience', '');
    onFilterChange('sort', '');
    setSearchQuery('');
    onSearch(
      { preventDefault: () => {} },
      { search: '', job_type: '', experience: '', sort: '' },
    );
  };

  const search = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <Paper
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.2)}`,
        position: 'sticky',
        top: theme.spacing(2),
        zIndex: 1100,
      }}
    >
      <form onSubmit={search}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems="center"
        >
          <Box sx={{ flexGrow: 1, width: '100%' }}>
            <TextField
              fullWidth
              placeholder="Search jobs by title, skills, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.default, 0.3),
                  '& fieldset': {
                    borderColor: theme.palette.secondary.main,
                    borderWidth: 1,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <SearchIcon
                    sx={{ color: theme.palette.secondary.main, mr: 1 }}
                  />
                ),
              }}
            />
          </Box>
          <Stack
            direction="row"
            spacing={1}
            sx={{ width: { xs: '100%', md: 'auto' } }}
          >
            <Button
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: theme.palette.secondary.main,
                color: theme.palette.secondary.contrastText,
                height: '56px',
                px: 3,
                flexShrink: 0,
              }}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<Tune />}
              endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setExpanded(!expanded)}
              sx={{
                borderColor: theme.palette.secondary.main,
                color: theme.palette.secondary.main,
                borderWidth: 2,
                height: '56px',
                flexShrink: 0,
              }}
            >
              Filters
            </Button>
          </Stack>
        </Stack>
      </form>

      <Collapse in={expanded} sx={{ mt: 2 }}>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Job Type</InputLabel>
              <Select
                value={filters.job_type || ''}
                label="Job Type"
                onChange={(e) => onFilterChange('job_type', e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="full-time">Full Time</MenuItem>
                <MenuItem value="part-time">Part Time</MenuItem>
                <MenuItem value="contract">Contract</MenuItem>
                <MenuItem value="freelance">Freelance</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Experience Level</InputLabel>
              <Select
                value={filters.experience || ''}
                label="Experience Level"
                onChange={(e) => onFilterChange('experience', e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All Levels</MenuItem>
                <MenuItem value="entry">Entry Level</MenuItem>
                <MenuItem value="mid">Mid Level</MenuItem>
                <MenuItem value="senior">Senior Level</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sort || ''}
                label="Sort By"
                onChange={(e) => onFilterChange('sort', e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">Default</MenuItem>
                <MenuItem value="date_desc">Newest</MenuItem>
                <MenuItem value="date_asc">Oldest</MenuItem>
                <MenuItem value="budget_desc">Highest Budget</MenuItem>
                <MenuItem value="budget_asc">Lowest Budget</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="text"
              startIcon={<Clear />}
              onClick={handleClearFilters}
              sx={{
                height: '56px',
                color: theme.palette.text.secondary,
              }}
            >
              Clear Filters
            </Button>
          </Grid>

          {user && (
            <>
              <Grid item xs={12} md={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={onLoadSaved}
                  startIcon={<Bookmark />}
                  sx={{
                    borderColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.main,
                    borderWidth: 1,
                    py: 1.5,
                  }}
                >
                  My Saved Jobs
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={onLoadRecommended}
                  startIcon={<Star />}
                  sx={{
                    borderColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.main,
                    borderWidth: 1,
                    py: 1.5,
                  }}
                >
                  Recommended for You
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </Collapse>
    </Paper>
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
          background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderRadius: 4,
          p: { xs: 4, sm: 6, md: 8 },
          mb: 6,
          border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 50% 50%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          },
        }}
      >
        <Typography
          variant="h2"
          component="h2"
          gutterBottom
          fontWeight="bold"
          sx={{
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            color: theme.palette.secondary.main,
            textShadow: `0 2px 4px ${alpha(theme.palette.common.black, 0.3)}`,
            position: 'relative',
            zIndex: 1,
          }}
        >
          💼 Discover Amazing Opportunities
        </Typography>
        <Typography
          variant="h6"
          sx={{
            mb: 4,
            maxWidth: 700,
            mx: 'auto',
            color: theme.palette.text.primary,
            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
            lineHeight: 1.6,
            fontWeight: 500,
            position: 'relative',
            zIndex: 1,
          }}
        >
          Connect with clients who need your skills. From quick tasks to
          long-term projects, find work that matches your expertise and
          schedule.
        </Typography>

        {/* Platform Stats */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {platformStats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    backgroundColor: alpha(theme.palette.background.paper, 0.9),
                    borderColor: theme.palette.secondary.main,
                    boxShadow: `0 8px 25px ${alpha(theme.palette.secondary.main, 0.3)}`,
                  },
                }}
              >
                <Box
                  sx={{
                    color: theme.palette.secondary.main,
                    mb: 2,
                    fontSize: 48,
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{
                    color: theme.palette.secondary.main,
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    textAlign: 'center',
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                  }}
                >
                  {stat.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          justifyContent="center"
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register?type=worker')}
            sx={{
              px: 4,
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              backgroundColor: theme.palette.secondary.main,
              color: theme.palette.secondary.contrastText,
              borderRadius: 3,
              '&:hover': {
                backgroundColor: theme.palette.secondary.dark,
                transform: 'translateY(-3px)',
                boxShadow: `0 8px 25px ${alpha(theme.palette.secondary.main, 0.5)}`,
              },
            }}
          >
            Join as Professional
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/register')}
            sx={{
              px: 4,
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              borderColor: theme.palette.secondary.main,
              color: theme.palette.secondary.main,
              borderWidth: 2,
              borderRadius: 3,
              '&:hover': {
                borderColor: theme.palette.secondary.light,
                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                transform: 'translateY(-3px)',
              },
            }}
          >
            Post a Job
          </Button>
        </Stack>
      </Box>

      {/* Sample Jobs Section */}
      <Box sx={{ mb: 8 }}>
        <Typography
          variant="h3"
          gutterBottom
          fontWeight="bold"
          sx={{
            color: theme.palette.secondary.main,
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
            mb: 2,
          }}
        >
          Featured Opportunities
        </Typography>
        <Typography
          variant="h6"
          sx={{
            mb: 6,
            color: theme.palette.text.primary,
            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
            fontWeight: 500,
            maxWidth: 600,
            mx: 'auto',
          }}
        >
          Here are some of the exciting projects waiting for skilled
          professionals
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
      <Box
        sx={{
          p: { xs: 4, sm: 6 },
          mb: 6,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          border: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          fontWeight="bold"
          sx={{
            color: theme.palette.secondary.main,
            mb: 4,
            fontSize: { xs: '1.5rem', sm: '2rem' },
          }}
        >
          💬 Success Stories
        </Typography>
        <Grid container spacing={4}>
          {[
            {
              rating: 5,
              text: 'Found my dream plumbing job through Kelmah. Great clients and fair pay!',
              author: 'Michael O., Plumber',
            },
            {
              rating: 5,
              text: 'Consistently find quality electrical projects. Platform is easy to use!',
              author: 'Sarah A., Electrician',
            },
            {
              rating: 5,
              text: 'Built my carpentry business through connections made on Kelmah!',
              author: 'David K., Carpenter',
            },
          ].map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Box
                sx={{
                  p: 4,
                  height: '100%',
                  borderRadius: 3,
                  backgroundColor: theme.palette.background.paper,
                  border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: theme.palette.secondary.main,
                    boxShadow: `0 8px 25px ${alpha(theme.palette.secondary.main, 0.3)}`,
                  },
                }}
              >
                <Rating
                  value={testimonial.rating}
                  readOnly
                  size="medium"
                  sx={{
                    mb: 3,
                    '& .MuiRating-iconFilled': {
                      color: theme.palette.secondary.main,
                    },
                  }}
                />
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    fontStyle: 'italic',
                    color: theme.palette.text.primary,
                    fontSize: '1.1rem',
                    lineHeight: 1.6,
                  }}
                >
                  "{testimonial.text}"
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: theme.palette.secondary.main,
                    fontWeight: 'bold',
                  }}
                >
                  - {testimonial.author}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Call to Action */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            color: theme.palette.secondary.main,
            fontWeight: 'bold',
            fontSize: { xs: '1.5rem', sm: '2rem' },
          }}
        >
          Ready to find your next opportunity?
        </Typography>
        <Typography
          variant="h6"
          sx={{
            mb: 4,
            color: theme.palette.text.primary,
            fontSize: { xs: '1rem', sm: '1.1rem' },
            fontWeight: 500,
          }}
        >
          Use the filters above to find jobs that match your skills and
          preferences
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<SearchIcon />}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          sx={{
            px: 5,
            py: 2.5,
            fontSize: '1.2rem',
            fontWeight: 'bold',
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.secondary.contrastText,
            borderRadius: 3,
            '&:hover': {
              backgroundColor: theme.palette.secondary.dark,
              transform: 'translateY(-3px)',
              boxShadow: `0 12px 30px ${alpha(theme.palette.secondary.main, 0.5)}`,
            },
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

  const jobs = useSelector(selectJobs) || [];
  const loading = useSelector(selectJobsLoading);
  const error = useSelector(selectJobsError);

  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [showSampleData, setShowSampleData] = useState(true);
  const [savedJobs, setSavedJobs] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handlePageChange = (event, value) => {
    const newFilters = { ...filters, page: value, search: searchQuery.trim() };
    dispatch(setFilters(newFilters));
    dispatch(fetchJobs(newFilters));
    setShowSampleData(false);
    window.scrollTo(0, 0);
  };

  const executeSearch = (overrideFilters = {}) => {
    const newFilters = {
      ...filters,
      page: 1,
      search: searchQuery.trim(),
      ...overrideFilters,
    };
    dispatch(setFilters(newFilters));
    dispatch(fetchJobs(newFilters));
    setShowSampleData(false);
  };

  const handleSearch = () => {
    executeSearch();
  };

  const handleFilterChange = (field, value) => {
    executeSearch({ [field]: value });
  };

  const handleLoadSavedJobs = () => {
    executeSearch({ saved: true });
  };

  const handleLoadRecommendedJobs = () => {
    executeSearch({ recommended: true });
  };

  const handleToggleSaveJob = (jobId) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs((prev) => prev.filter((id) => id !== jobId));
    } else {
      setSavedJobs((prev) => [...prev, jobId]);
    }
  };

  useEffect(() => {
    // Only fetch on initial mount if there are no jobs and not loading
    // This prevents re-fetching when navigating back to the page
    if (jobs.length === 0 && !loading) {
      // We start with sample data, so no initial fetch is needed.
      // A search or filter action will trigger the first fetch.
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            fontWeight="bold"
            sx={{
              color: theme.palette.secondary.main,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              textShadow: `0 2px 4px ${alpha(theme.palette.common.black, 0.3)}`,
              mb: 2,
            }}
          >
            🚀 Find Your Next Opportunity
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: theme.palette.text.primary,
              fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
              fontWeight: 500,
              maxWidth: 800,
              mx: 'auto',
            }}
          >
            Discover jobs that match your skills and grow your career
          </Typography>
        </Box>

        {/* Compact Filters */}
        <CompactFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          user={user}
          onLoadSaved={handleLoadSavedJobs}
          onLoadRecommended={handleLoadRecommendedJobs}
        />

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Content Area */}
        {loading ? (
          <Grid container spacing={3}>
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
                  <Skeleton
                    variant="rectangular"
                    height={60}
                    sx={{ mt: 2, borderRadius: 1 }}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : showSampleData || (jobs.length === 0 && !loading) ? (
          <EmptyState />
        ) : (
          <>
            {/* Results Summary */}
            <Box
              sx={{
                mb: 3,
                p: 3,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: 'center',
                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
              }}
            >
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ color: theme.palette.text.primary, mb: { xs: 1, sm: 0 } }}
              >
                📊 Showing {jobs.length} job{jobs.length !== 1 ? 's' : ''}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Page {currentPage || 1} of {totalPages || 1}
              </Typography>
            </Box>

            {/* Jobs List */}
            <Grid container spacing={0}>
              {jobs.map((job) => (
                <Grid item xs={12} key={job.id}>
                  <EnhancedJobCard
                    job={job}
                    onViewDetails={(id) => navigate(`/jobs/${id}`)}
                    onToggleSave={handleToggleSaveJob}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Pagination Controls */}
        {!loading && !showSampleData && totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <Pagination
              count={totalPages}
              page={currentPage || 1}
              onChange={handlePageChange}
              color="primary"
              size={isMobile ? 'small' : 'large'}
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 2,
                  fontWeight: 'bold',
                },
                '& .MuiPaginationItem-page.Mui-selected': {
                  backgroundColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.contrastText,
                },
              }}
            />
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default JobsPage;
