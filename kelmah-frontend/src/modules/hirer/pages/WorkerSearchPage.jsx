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
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        background: theme.palette.background.paper,
        border: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
        borderRadius: 3,
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-8px) scale(1.02)',
          boxShadow: `0 20px 40px ${alpha(theme.palette.secondary.main, 0.4)}`,
          borderColor: theme.palette.secondary.main,
        },
      }}
    >
      {worker.verified && (
        <Chip
          icon={<CheckCircle />}
          label="VERIFIED PRO"
          size="small"
          sx={{ 
            position: 'absolute', 
            top: 12, 
            left: 12, 
            zIndex: 2,
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.secondary.contrastText,
            fontWeight: 'bold',
            fontSize: '0.75rem',
            '& .MuiChip-icon': {
              color: theme.palette.secondary.contrastText
            }
          }}
        />
      )}
      
      <IconButton
        onClick={() => !isDemo && onToggleSave(worker.id || worker._id)}
        sx={{ 
          position: 'absolute', 
          top: 12, 
          right: 12, 
          zIndex: 2,
          backgroundColor: alpha(theme.palette.background.default, 0.8),
          color: isSaved ? theme.palette.secondary.main : theme.palette.text.secondary,
          '&:hover': {
            backgroundColor: alpha(theme.palette.secondary.main, 0.1),
            color: theme.palette.secondary.main,
          }
        }}
        disabled={isDemo}
      >
        {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
      </IconButton>
      
      <CardContent sx={{ flexGrow: 1, pt: 6, px: 3, pb: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Avatar
            src={worker.avatar}
            sx={{ 
              width: 100, 
              height: 100, 
              mb: 2, 
              mx: 'auto', 
              border: `4px solid ${theme.palette.secondary.main}`,
              boxShadow: `0 8px 20px ${alpha(theme.palette.secondary.main, 0.3)}`
            }}
          />
          <Typography 
            variant="h6" 
            align="center" 
            fontWeight="bold"
            sx={{ 
              color: theme.palette.text.primary,
              fontSize: '1.25rem',
              lineHeight: 1.3,
              mb: 1
            }}
          >
            {worker.name}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ 
              minHeight: 44,
              fontSize: '0.95rem',
              lineHeight: 1.4,
              fontWeight: 500,
              color: theme.palette.text.secondary
            }}
          >
            {worker.title}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <Rating 
            value={worker.rating} 
            precision={0.1} 
            readOnly 
            size="small"
            sx={{
              '& .MuiRating-iconFilled': {
                color: theme.palette.secondary.main,
              }
            }}
          />
          <Typography 
            variant="body2" 
            sx={{ 
              ml: 1,
              color: theme.palette.text.primary,
              fontWeight: 'bold'
            }}
          >
            ({worker.reviewCount || 0})
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ mb: 3 }} alignItems="center" justifyContent="center">
          <LocationOn fontSize="small" sx={{ color: theme.palette.secondary.main }} />
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.primary,
              fontWeight: 500
            }}
          >
            {worker.location}
          </Typography>
        </Stack>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Box sx={{ 
              textAlign: 'center',
              p: 2,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.secondary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: theme.palette.secondary.main,
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}
              >
                ${worker.hourlyRate}/hr
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                HOURLY RATE
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ 
              textAlign: 'center',
              p: 2,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.secondary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: theme.palette.secondary.main,
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}
              >
                {worker.completedJobs}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                JOBS DONE
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 1,
            mb: 3,
          }}
        >
          {(worker.skills || []).slice(0, 3).map((skill) => (
            <Chip 
              key={skill} 
              label={skill} 
              size="small" 
              sx={{ 
                fontSize: '0.75rem',
                fontWeight: 'bold',
                backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                color: theme.palette.text.primary,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.5)}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.3),
                }
              }}
            />
          ))}
        </Box>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          p: 2,
          borderRadius: 2,
          backgroundColor: alpha(theme.palette.secondary.main, 0.05),
          border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
        }}>
          <Schedule fontSize="small" sx={{ color: theme.palette.secondary.main, mr: 1 }} />
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.primary,
              fontWeight: 'bold'
            }}
          >
            Responds {worker.responseTime}
          </Typography>
        </Box>
      </CardContent>
      
      <CardActions sx={{ p: 3, pt: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => !isDemo && navigate(`/profiles/user/${worker.id || worker._id}`)}
          disabled={isDemo}
          sx={{
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 'bold',
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.secondary.contrastText,
            borderRadius: 2,
            '&:hover': {
              backgroundColor: theme.palette.secondary.dark,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 20px ${alpha(theme.palette.secondary.main, 0.4)}`
            },
            '&:disabled': {
              backgroundColor: alpha(theme.palette.secondary.main, 0.5),
              color: alpha(theme.palette.secondary.contrastText, 0.7)
            }
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
          sx={{
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 'bold',
            borderColor: theme.palette.secondary.main,
            color: theme.palette.secondary.main,
            borderWidth: 2,
            borderRadius: 2,
            '&:hover': {
              borderColor: theme.palette.secondary.light,
              backgroundColor: alpha(theme.palette.secondary.main, 0.1),
              transform: 'translateY(-2px)',
            },
            '&:disabled': {
              borderColor: alpha(theme.palette.secondary.main, 0.5),
              color: alpha(theme.palette.secondary.main, 0.5)
            }
          }}
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
            pointerEvents: 'none'
          }
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
            zIndex: 1
          }}
        >
          🔍 Discover Amazing Talent
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
            zIndex: 1
          }}
        >
          Connect with thousands of verified professionals ready to bring your projects to life. 
          From home repairs to custom installations, find the perfect match for any job.
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
                    boxShadow: `0 8px 25px ${alpha(theme.palette.secondary.main, 0.3)}`
                  }
                }}
              >
                <Box sx={{ color: theme.palette.secondary.main, mb: 2, fontSize: 48 }}>
                  {stat.icon}
                </Box>
                <Typography 
                  variant="h4" 
                  fontWeight="bold" 
                  sx={{ 
                    color: theme.palette.secondary.main,
                    fontSize: { xs: '1.5rem', sm: '2rem' }
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
                    fontSize: { xs: '0.9rem', sm: '1rem' }
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
            onClick={() => navigate('/register')}
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
                boxShadow: `0 8px 25px ${alpha(theme.palette.secondary.main, 0.5)}`
              }
            }}
          >
            Join as Client
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/register?type=worker')}
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
              }
            }}
          >
            Join as Professional
          </Button>
        </Stack>
      </Box>

      {/* Sample Workers Section */}
      <Box sx={{ mb: 8 }}>
        <Typography 
          variant="h3" 
          gutterBottom 
          fontWeight="bold"
          sx={{
            color: theme.palette.secondary.main,
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
            mb: 2
          }}
        >
          Meet Our Top Professionals
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 6,
            color: theme.palette.text.primary,
            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
            fontWeight: 500,
            maxWidth: 600,
            mx: 'auto'
          }}
        >
          Here's a preview of the quality talent you'll find on our platform
        </Typography>
        
        <Grid container spacing={4}>
          {sampleWorkers.map((worker, index) => (
            <Grid item xs={12} sm={6} lg={3} key={worker.id}>
              <Grow in timeout={500 + index * 200}>
                <div>
                  <WorkerCard worker={worker} isDemo={true} />
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
          border: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`
        }}
      >
        <Typography 
          variant="h4" 
          gutterBottom 
          fontWeight="bold"
          sx={{
            color: theme.palette.secondary.main,
            mb: 4,
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}
        >
          💬 What Our Clients Say
        </Typography>
        <Grid container spacing={4}>
          {[
            {
              rating: 5,
              text: "Found the perfect electrician for my smart home project. Professional, fast, and great quality work!",
              author: "Jennifer M., Homeowner"
            },
            {
              rating: 5,
              text: "Kelmah made it so easy to find qualified contractors. Saved me weeks of searching!",
              author: "Robert K., Business Owner"
            },
            {
              rating: 5,
              text: "The verification process gives me confidence. All workers are truly skilled professionals.",
              author: "Maria S., Property Manager"
            }
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
                    boxShadow: `0 8px 25px ${alpha(theme.palette.secondary.main, 0.3)}`
                  }
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
                    }
                  }} 
                />
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 3, 
                    fontStyle: 'italic',
                    color: theme.palette.text.primary,
                    fontSize: '1.1rem',
                    lineHeight: 1.6
                  }}
                >
                  "{testimonial.text}"
                </Typography>
                <Typography 
                  variant="subtitle1" 
                  sx={{
                    color: theme.palette.secondary.main,
                    fontWeight: 'bold'
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
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}
        >
          Ready to find your perfect professional?
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 4,
            color: theme.palette.text.primary,
            fontSize: { xs: '1rem', sm: '1.1rem' },
            fontWeight: 500
          }}
        >
          Start by adjusting your search filters above or browse our categories
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<Search />}
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
              boxShadow: `0 12px 30px ${alpha(theme.palette.secondary.main, 0.5)}`
            }
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
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link
            component={RouterLink}
            to="/hirer/dashboard"
            underline="hover"
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': { color: theme.palette.secondary.main }
            }}
          >
            Dashboard
          </Link>
          <Typography sx={{ color: theme.palette.secondary.main, fontWeight: 'bold' }}>
            Find Talent
          </Typography>
        </Breadcrumbs>
        
        <Paper
          sx={{
            p: 4,
            mb: 4,
            position: 'sticky',
            top: (theme) => theme.spacing(2),
            zIndex: 10,
            borderRadius: 3,
            backgroundColor: theme.palette.background.paper,
            border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.3)}`,
            backdropFilter: 'blur(20px)',
          }}
        >
          <Typography 
            variant="h3" 
            gutterBottom 
            fontWeight="bold"
            sx={{
              color: theme.palette.secondary.main,
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
              textAlign: 'center',
              mb: 2
            }}
          >
            🎯 Find Your Perfect Professional
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 4,
              color: theme.palette.text.primary,
              textAlign: 'center',
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontWeight: 500,
              maxWidth: 800,
              mx: 'auto'
            }}
          >
            Search through thousands of verified professionals and find the perfect match for your project
          </Typography>
          
          <Grid container spacing={3} alignItems="center">
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
                    backgroundColor: alpha(theme.palette.background.default, 0.5),
                    '& fieldset': {
                      borderColor: theme.palette.secondary.main,
                      borderWidth: 2
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.secondary.light,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.secondary.main,
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                    '&.Mui-focused': {
                      color: theme.palette.secondary.main
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: theme.palette.text.primary,
                    fontSize: '1rem',
                    fontWeight: 500
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
                    backgroundColor: alpha(theme.palette.background.default, 0.5),
                    '& fieldset': {
                      borderColor: theme.palette.secondary.main,
                      borderWidth: 2
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.secondary.light,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.secondary.main,
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                    '&.Mui-focused': {
                      color: theme.palette.secondary.main
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: theme.palette.text.primary,
                    fontSize: '1rem',
                    fontWeight: 500
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
                        backgroundColor: alpha(theme.palette.background.default, 0.5),
                        '& fieldset': {
                          borderColor: theme.palette.secondary.main,
                          borderWidth: 2
                        },
                        '&:hover fieldset': {
                          borderColor: theme.palette.secondary.light,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: theme.palette.secondary.main,
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: theme.palette.text.secondary,
                        fontWeight: 600,
                        '&.Mui-focused': {
                          color: theme.palette.secondary.main
                        }
                      },
                      '& .MuiInputBase-input': {
                        color: theme.palette.text.primary,
                        fontSize: '1rem',
                        fontWeight: 500
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
                    backgroundColor: alpha(theme.palette.background.default, 0.5),
                    '& fieldset': {
                      borderColor: theme.palette.secondary.main,
                      borderWidth: 2
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.secondary.light,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.secondary.main,
                    }
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
