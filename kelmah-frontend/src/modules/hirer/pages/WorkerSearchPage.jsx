import React, { useState, useEffect } from 'react';
import Grow from '@mui/material/Grow';
import {
  Container,
  Breadcrumbs,
  Link,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Rating,
  Chip,
  CircularProgress,
  Pagination,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  Autocomplete,
  Skeleton,
  CardActions,
  IconButton,
  Stack,
  Divider,
} from '@mui/material';
import { 
  Search, 
  Star, 
  TrendingUp, 
  CheckCircle, 
  Group, 
  WorkspacePremium,
  LocationOn,
  Schedule,
  MonetizationOn 
} from '@mui/icons-material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import searchService from '../../search/services/searchService';
import { hirerService } from '../services/hirerService';
import MessageIcon from '@mui/icons-material/Message';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

// Sample data to showcase the platform
const sampleWorkers = [
  {
    id: 'sample-1',
    name: 'Sarah Johnson',
    title: 'Expert Plumber & Home Renovation Specialist',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
    rating: 4.9,
    reviewCount: 127,
    skills: ['Plumbing', 'Pipe Repair', 'Water Heater Installation'],
    location: 'San Francisco, CA',
    hourlyRate: 85,
    completedJobs: 156,
    responseTime: '< 2 hours',
    verified: true,
    description: 'Licensed plumber with 8+ years experience. Specialized in emergency repairs and kitchen/bathroom renovations.'
  },
  {
    id: 'sample-2',
    name: 'Marcus Thompson',
    title: 'Licensed Electrician & Smart Home Expert',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    rating: 4.8,
    reviewCount: 93,
    skills: ['Electrical Wiring', 'Home Automation', 'Circuit Breakers'],
    location: 'Austin, TX',
    hourlyRate: 90,
    completedJobs: 89,
    responseTime: '< 1 hour',
    verified: true,
    description: 'Master electrician specializing in residential and commercial electrical systems. Tesla Powerwall certified installer.'
  },
  {
    id: 'sample-3',
    name: 'Elena Rodriguez',
    title: 'Professional Carpenter & Custom Furniture Maker',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    rating: 4.9,
    reviewCount: 201,
    skills: ['Carpentry', 'Custom Furniture', 'Kitchen Cabinets'],
    location: 'Denver, CO',
    hourlyRate: 75,
    completedJobs: 234,
    responseTime: '< 30 min',
    verified: true,
    description: 'Award-winning carpenter with expertise in custom woodwork and furniture design. Featured in Home & Garden Magazine.'
  },
  {
    id: 'sample-4',
    name: 'David Chen',
    title: 'Interior Designer & Paint Specialist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    rating: 4.7,
    reviewCount: 78,
    skills: ['Interior Design', 'Painting', 'Color Consultation'],
    location: 'Seattle, WA',
    hourlyRate: 65,
    completedJobs: 145,
    responseTime: '< 3 hours',
    verified: true,
    description: 'Creative interior designer with a focus on modern and sustainable design solutions. Color theory expert.'
  }
];

const platformStats = [
  { icon: <Group />, value: '50,000+', label: 'Verified Professionals' },
  { icon: <CheckCircle />, value: '98%', label: 'Project Success Rate' },
  { icon: <TrendingUp />, value: '24/7', label: 'Customer Support' },
  { icon: <WorkspacePremium />, value: '4.9/5', label: 'Average Rating' }
];

const WorkerCard = ({ worker, isSaved, onToggleSave, isDemo = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        transition: 'transform 0.3s, box-shadow 0.3s',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: `0 12px 30px ${alpha(theme.palette.primary.main, 0.3)}`,
        },
      }}
    >
      {worker.verified && (
        <Chip
          icon={<CheckCircle />}
          label="Verified"
          color="success"
          size="small"
          sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}
        />
      )}
      
      <IconButton
        onClick={() => !isDemo && onToggleSave(worker.id || worker._id)}
        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
        color={isSaved ? 'primary' : 'default'}
        disabled={isDemo}
      >
        {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
      </IconButton>
      
      <CardContent sx={{ flexGrow: 1, pt: 5 }}>
        <Avatar
          src={worker.avatar}
          sx={{ width: 90, height: 90, mb: 2, mx: 'auto', border: `3px solid ${theme.palette.primary.main}` }}
        />
        <Typography variant="h6" align="center" fontWeight="bold">
          {worker.name}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          gutterBottom
          sx={{ minHeight: 40 }}
        >
          {worker.title}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
          <Rating value={worker.rating} precision={0.1} readOnly size="small" />
          <Typography variant="body2" sx={{ ml: 0.5 }}>
            ({worker.reviewCount || 0})
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center" justifyContent="center">
          <LocationOn fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {worker.location}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="primary" fontWeight="bold">
              ${worker.hourlyRate}/hr
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Rate
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="primary" fontWeight="bold">
              {worker.completedJobs}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Jobs Done
            </Typography>
          </Box>
        </Stack>
        
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 0.5,
            mb: 2,
          }}
        >
          {(worker.skills || []).slice(0, 3).map((skill) => (
            <Chip 
              key={skill} 
              label={skill} 
              size="small" 
              variant="outlined"
              sx={{ 
                fontSize: '0.7rem',
                backgroundColor: alpha(theme.palette.primary.main, 0.1)
              }}
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          <Schedule fontSize="small" color="success" />
          <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
            Responds {worker.responseTime}
          </Typography>
        </Box>
      </CardContent>
      
      <CardActions
        sx={{ p: 2, pt: 0, display: 'flex', flexDirection: 'column', gap: 1 }}
      >
        <Button
          fullWidth
          variant="contained"
          onClick={() => !isDemo && navigate(`/profiles/user/${worker.id || worker._id}`)}
          disabled={isDemo}
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            fontWeight: 'bold'
          }}
        >
          {isDemo ? 'View Profile (Demo)' : 'View Profile'}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<MessageIcon />}
          onClick={() => !isDemo && navigate('/messages?participantId=' + (worker.id || worker._id))}
          disabled={isDemo}
        >
          {isDemo ? 'Message (Demo)' : 'Message'}
        </Button>
      </CardActions>
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
          🔍 Discover Amazing Talent
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          Connect with thousands of verified professionals ready to bring your projects to life. 
          From home repairs to custom installations, find the perfect match for any job.
        </Typography>
        
        {/* Platform Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {platformStats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ color: theme.palette.primary.main, mb: 1 }}>
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
            onClick={() => navigate('/register')}
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
              px: 4,
              py: 1.5,
              fontWeight: 'bold'
            }}
          >
            Join as Client
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/register?type=worker')}
            sx={{ px: 4, py: 1.5, fontWeight: 'bold' }}
          >
            Join as Professional
          </Button>
        </Stack>
      </Box>

      {/* Sample Workers Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Meet Our Top Professionals
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Here's a preview of the quality talent you'll find on our platform
        </Typography>
        
        <Grid container spacing={3}>
          {sampleWorkers.map((worker, index) => (
            <Grid item xs={12} sm={6} md={3} key={worker.id}>
              <Grow in timeout={300 + index * 200}>
                <div>
                  <WorkerCard worker={worker} isDemo={true} />
                </div>
              </Grow>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Success Stories */}
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          💬 What Our Clients Say
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Rating value={5} readOnly size="small" sx={{ mb: 2 }} />
              <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                "Found the perfect electrician for my smart home project. Professional, fast, and great quality work!"
              </Typography>
              <Typography variant="subtitle2" color="primary">
                - Jennifer M., Homeowner
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Rating value={5} readOnly size="small" sx={{ mb: 2 }} />
              <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                "Kelmah made it so easy to find qualified contractors. Saved me weeks of searching!"
              </Typography>
              <Typography variant="subtitle2" color="primary">
                - Robert K., Business Owner
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Rating value={5} readOnly size="small" sx={{ mb: 2 }} />
              <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                "The verification process gives me confidence. All workers are truly skilled professionals."
              </Typography>
              <Typography variant="subtitle2" color="primary">
                - Maria S., Property Manager
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Call to Action */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Ready to find your perfect professional?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Start by adjusting your search filters above or browse our categories
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<Search />}
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

const WorkerSearchPage = () => {
  // Available skill options (mock)
  const skillOptions = [
    'Pipe Repair',
    'Water Heater Installation',
    'Drainage Systems',
    'Wiring',
    'Circuit Breakers',
    'Lighting',
    'Home Automation',
    'Audio Systems',
    'Cabinetry',
    'Furniture Making',
    'Framing',
    'Interior Painting',
    'Exterior Painting',
    'Wallpaper',
    'AC Installation',
    'Heating Systems',
    'Ventilation',
  ];
  const [searchParams, setSearchParams] = useState({
    searchTerm: '',
    skills: [],
    minRating: 0,
    location: '',
    workMode: '', // 'remote', 'onsite', 'hybrid'
  });
  const [savedWorkers, setSavedWorkers] = useState([]);
  const [results, setResults] = useState({ workers: [], pagination: {} });
  const [loading, setLoading] = useState(false);
  const [showSampleData, setShowSampleData] = useState(true);

  // Toggle save/favorite worker
  const handleToggleSaveWorker = async (workerId) => {
    if (savedWorkers.includes(workerId)) {
      try {
        await hirerService.unsaveWorker(workerId);
        setSavedWorkers((prev) => prev.filter((id) => id !== workerId));
      } catch (error) {
        console.error('Error unsaving worker:', error);
      }
    } else {
      try {
        await hirerService.saveWorker(workerId);
        setSavedWorkers((prev) => [...prev, workerId]);
      } catch (error) {
        console.error('Error saving worker:', error);
      }
    }
  };

  const handleSearch = async (page = 1) => {
    setLoading(true);
    setShowSampleData(false);
    try {
      const params = { page, ...searchParams };
      const response = await searchService.searchWorkers(params);
      const workers = response.results || response.workers || response;
      const pagination =
        (response.meta && response.meta.pagination) ||
        response.pagination ||
        {};
      setResults({ workers, pagination });
    } catch (error) {
      console.error('Error searching workers:', error);
      setResults({ workers: [], pagination: {} });
    } finally {
      setLoading(false);
    }
  };

  // Reset all filters to defaults and reload worker list
  const handleClearFilters = async () => {
    const defaultParams = {
      searchTerm: '',
      skills: [],
      minRating: 0,
      location: '',
      workMode: '',
    };
    setSearchParams(defaultParams);
    setShowSampleData(true);
    setResults({ workers: [], pagination: {} });
  };

  useEffect(() => {
    // Load saved favorites
    (async () => {
      try {
        const favs = await hirerService.getSavedWorkers();
        setSavedWorkers(favs.map((w) => w.id || w._id));
      } catch {}
    })();
  }, []);

  return (
    <Grow in timeout={500}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            component={RouterLink}
            to="/hirer/dashboard"
            underline="hover"
            color="inherit"
          >
            Dashboard
          </Link>
          <Typography color="text.primary">Find Talent</Typography>
        </Breadcrumbs>
        
        <Paper
          sx={{
            p: 3,
            mb: 4,
            position: 'sticky',
            top: (theme) => theme.spacing(10),
            zIndex: 2,
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <Typography variant="h4" gutterBottom fontWeight="bold">
            🎯 Find Your Perfect Professional
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Search through thousands of verified professionals and find the perfect match for your project
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Search by name or keyword"
                value={searchParams.searchTerm}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    searchTerm: e.target.value,
                  }))
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Location"
                value={searchParams.location}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography gutterBottom fontWeight="medium">Minimum Rating</Typography>
              <Slider
                value={searchParams.minRating}
                onChange={(e, newValue) =>
                  setSearchParams((prev) => ({ ...prev, minRating: newValue }))
                }
                step={0.5}
                marks
                min={0}
                max={5}
                valueLabelDisplay="auto"
                sx={{
                  '& .MuiSlider-thumb': {
                    background: 'linear-gradient(45deg, #FFD700 30%, #FFA500 90%)',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                multiple
                options={skillOptions}
                value={searchParams.skills}
                onChange={(event, newSkills) =>
                  setSearchParams((prev) => ({ ...prev, skills: newSkills }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Skills"
                    placeholder="Select skills"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Work Mode</InputLabel>
                <Select
                  value={searchParams.workMode}
                  label="Work Mode"
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      workMode: e.target.value,
                    }))
                  }
                  sx={{
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="remote">Remote</MenuItem>
                  <MenuItem value="onsite">On-site</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Search />}
                onClick={() => handleSearch()}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  fontWeight: 'bold'
                }}
              >
                Search
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => handleClearFilters()}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 'bold'
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Grid container spacing={3}>
            {Array.from(new Array(8)).map((_, idx) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Skeleton
                      variant="circular"
                      width={80}
                      height={80}
                      sx={{ mx: 'auto', mb: 1 }}
                    />
                    <Skeleton
                      width="60%"
                      height={24}
                      sx={{ mx: 'auto', mb: 1 }}
                    />
                    <Skeleton
                      width="40%"
                      height={20}
                      sx={{ mx: 'auto', mb: 2 }}
                    />
                    <Skeleton variant="rectangular" height={118} sx={{ borderRadius: 1 }} />
                  </CardContent>
                  <CardActions>
                    <Skeleton
                      variant="rectangular"
                      width="80%"
                      height={36}
                      sx={{ mx: 'auto', mb: 1, borderRadius: 1 }}
                    />
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : showSampleData || results.workers.length === 0 ? (
          <EmptyState />
        ) : (
          <Grid container spacing={3}>
            {results.workers.map((worker, idx) => (
              <Grow in timeout={300 + idx * 100} key={worker.id || worker._id}>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <WorkerCard
                    worker={worker}
                    isSaved={savedWorkers.includes(worker.id || worker._id)}
                    onToggleSave={handleToggleSaveWorker}
                  />
                </Grid>
              </Grow>
            ))}
          </Grid>
        )}
        
        {!loading && !showSampleData && results.workers.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={Math.max(results.pagination.totalPages || 1, 1)}
              page={Math.max(results.pagination.currentPage || 1, 1)}
              onChange={(e, page) => handleSearch(page)}
              color="primary"
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Box>
        )}
      </Container>
    </Grow>
  );
};

export default WorkerSearchPage;
