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
  Collapse,
  Fab,
  Badge,
  Tooltip,
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
  MonetizationOn,
  ExpandMore,
  ExpandLess,
  Tune,
  Clear,
  FilterList,
  Verified,
  Phone,
  Email,
  Portfolio,
  EmojiEvents,
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
    skills: ['Plumbing', 'Pipe Repair', 'Water Heater Installation', 'Emergency Repairs'],
    location: 'San Francisco, CA',
    hourlyRate: 85,
    completedJobs: 156,
    responseTime: '< 2 hours',
    verified: true,
    description: 'Licensed plumber with 8+ years experience. Specialized in emergency repairs and kitchen/bathroom renovations.',
    availability: 'Available',
    specialties: ['Emergency Repairs', 'Bathroom Renovation'],
    certifications: ['Licensed Plumber', 'EPA Certified'],
    portfolioImages: 3,
    languages: ['English', 'Spanish']
  },
  {
    id: 'sample-2',
    name: 'Marcus Thompson',
    title: 'Licensed Electrician & Smart Home Expert',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    rating: 4.8,
    reviewCount: 93,
    skills: ['Electrical Wiring', 'Home Automation', 'Circuit Breakers', 'Smart Systems'],
    location: 'Austin, TX',
    hourlyRate: 90,
    completedJobs: 89,
    responseTime: '< 1 hour',
    verified: true,
    description: 'Master electrician specializing in residential and commercial electrical systems. Tesla Powerwall certified installer.',
    availability: 'Available',
    specialties: ['Smart Home Integration', 'Solar Installation'],
    certifications: ['Master Electrician', 'Tesla Certified'],
    portfolioImages: 8,
    languages: ['English']
  },
  {
    id: 'sample-3',
    name: 'Elena Rodriguez',
    title: 'Professional Carpenter & Custom Furniture Maker',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    rating: 4.9,
    reviewCount: 201,
    skills: ['Carpentry', 'Custom Furniture', 'Kitchen Cabinets', 'Woodworking'],
    location: 'Denver, CO',
    hourlyRate: 75,
    completedJobs: 234,
    responseTime: '< 30 min',
    verified: true,
    description: 'Award-winning carpenter with expertise in custom woodwork and furniture design. Featured in Home & Garden Magazine.',
    availability: 'Busy until Feb 15',
    specialties: ['Custom Cabinetry', 'Hardwood Flooring'],
    certifications: ['Master Carpenter', 'OSHA Certified'],
    portfolioImages: 15,
    languages: ['English', 'Spanish']
  },
  {
    id: 'sample-4',
    name: 'David Chen',
    title: 'Interior Designer & Paint Specialist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    rating: 4.7,
    reviewCount: 78,
    skills: ['Interior Design', 'Painting', 'Color Consultation', 'Space Planning'],
    location: 'Seattle, WA',
    hourlyRate: 65,
    completedJobs: 145,
    responseTime: '< 3 hours',
    verified: true,
    description: 'Creative interior designer with a focus on modern and sustainable design solutions. Color theory expert.',
    availability: 'Available',
    specialties: ['Modern Design', 'Eco-Friendly Solutions'],
    certifications: ['Interior Design Degree', 'LEED Certified'],
    portfolioImages: 12,
    languages: ['English', 'Mandarin']
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
  
  const getAvailabilityColor = (availability) => {
    if (availability === 'Available') return 'success';
    if (availability.includes('Busy')) return 'warning';
    return 'default';
  };
  
  return (
    <Card
      sx={{
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
          icon={<Verified />}
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
            fontSize: '0.75rem'
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
          backgroundColor: alpha(theme.palette.background.default, 0.9),
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
      
      <CardContent sx={{ p: 3 }}>
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
            sx={{ 
              color: theme.palette.text.secondary,
              fontSize: '0.95rem',
              lineHeight: 1.4,
              fontWeight: 500,
              mb: 2
            }}
          >
            {worker.title}
          </Typography>

          <Chip
            label={worker.availability}
            color={getAvailabilityColor(worker.availability)}
            size="small"
            sx={{ mb: 2, fontWeight: 'bold' }}
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Rating 
              value={worker.rating} 
              precision={0.1} 
              readOnly 
              size="small"
              sx={{ '& .MuiRating-iconFilled': { color: theme.palette.secondary.main } }}
            />
            <Typography 
              variant="body2" 
              sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}
            >
              {worker.rating} ({worker.reviewCount})
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
            <LocationOn fontSize="small" sx={{ color: theme.palette.secondary.main }} />
            <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
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
                <Typography variant="h6" sx={{ color: theme.palette.secondary.main, fontWeight: 'bold' }}>
                  ${worker.hourlyRate}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                  per hour
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
                <Typography variant="h6" sx={{ color: theme.palette.secondary.main, fontWeight: 'bold' }}>
                  {worker.completedJobs}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                  jobs done
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary, fontWeight: 'bold', mb: 1 }}>
            Top Skills
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {(worker.skills || []).slice(0, 4).map((skill) => (
              <Chip 
                key={skill} 
                label={skill} 
                size="small" 
                sx={{ 
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                  color: theme.palette.text.primary,
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.5)}`
                }}
              />
            ))}
          </Box>
        </Box>

        <Stack spacing={2}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            p: 1.5,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.secondary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
          }}>
            <Schedule fontSize="small" sx={{ color: theme.palette.secondary.main, mr: 1 }} />
            <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
              Responds {worker.responseTime}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} justifyContent="center">
            <Tooltip title="Portfolio Items">
              <Chip 
                icon={<Portfolio />} 
                label={worker.portfolioImages} 
                size="small"
                variant="outlined"
              />
            </Tooltip>
            <Tooltip title="Certifications">
              <Chip 
                icon={<EmojiEvents />} 
                label={worker.certifications?.length || 0} 
                size="small"
                variant="outlined"
              />
            </Tooltip>
          </Stack>
        </Stack>
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
            }
          }}
        >
          {isDemo ? 'Message (Demo)' : 'Contact'}
        </Button>
      </CardActions>
    </Card>
  );
};

const CompactSearchFilters = ({ searchParams, setSearchParams, skillOptions, onSearch, onClearFilters }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.2)}`,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Box sx={{ flexGrow: 1 }}>
          <TextField
            fullWidth
            placeholder="Search by name, skills, or specialization..."
            value={searchParams.searchTerm}
            onChange={(e) =>
              setSearchParams((prev) => ({
                ...prev,
                searchTerm: e.target.value,
              }))
            }
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.background.default, 0.3),
                '& fieldset': { 
                  borderColor: theme.palette.secondary.main,
                  borderWidth: 1
                },
                '&:hover fieldset': { 
                  borderColor: theme.palette.secondary.light,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.secondary.main,
                  borderWidth: 2
                }
              }
            }}
            InputProps={{
              startAdornment: <Search sx={{ color: theme.palette.secondary.main, mr: 1 }} />,
              endAdornment: (
                <Button
                  variant="contained"
                  onClick={onSearch}
                  sx={{
                    backgroundColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.contrastText,
                    minWidth: 'auto',
                    px: 2
                  }}
                >
                  Search
                </Button>
              )
            }}
          />
        </Box>
        <Button
          variant="outlined"
          startIcon={<Tune />}
          endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
          onClick={() => setExpanded(!expanded)}
          sx={{
            borderColor: theme.palette.secondary.main,
            color: theme.palette.secondary.main,
            borderWidth: 2,
            minWidth: 120
          }}
        >
          Filters
        </Button>
      </Stack>

      <Collapse in={expanded}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Box>
              <Typography gutterBottom fontWeight="medium" sx={{ color: theme.palette.text.primary }}>
                Minimum Rating: {searchParams.minRating}⭐
              </Typography>
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
                    backgroundColor: theme.palette.secondary.main,
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: theme.palette.secondary.main,
                  }
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
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
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="remote">Remote</MenuItem>
                <MenuItem value="onsite">On-site</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
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
                  label="Required Skills"
                  placeholder="Select skills"
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="text"
                startIcon={<Clear />}
                onClick={onClearFilters}
                sx={{ color: theme.palette.text.secondary }}
              >
                Clear All Filters
              </Button>
              <Button
                variant="contained"
                onClick={onSearch}
                sx={{
                  backgroundColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.contrastText
                }}
              >
                Apply Filters
              </Button>
            </Stack>
          </Grid>
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

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
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
  const theme = useTheme();
  const navigate = useNavigate();
  
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
    workMode: '',
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

  const handleClearFilters = () => {
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
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
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
              mb: 2
            }}
          >
            🎯 Find Your Perfect Professional
          </Typography>
          <Typography 
            variant="h5" 
            sx={{
              color: theme.palette.text.primary,
              fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
              fontWeight: 500,
              maxWidth: 900,
              mx: 'auto'
            }}
          >
            Search through thousands of verified professionals and find the perfect match for your project
          </Typography>
        </Box>

        {/* Compact Search Filters */}
        <CompactSearchFilters
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          skillOptions={skillOptions}
          onSearch={handleSearch}
          onClearFilters={handleClearFilters}
        />

        {/* Content Area */}
        {loading ? (
          <Grid container spacing={4}>
            {Array.from(new Array(8)).map((_, idx) => (
              <Grid item xs={12} sm={6} lg={3} key={idx}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Skeleton
                      variant="circular"
                      width={80}
                      height={80}
                      sx={{ mx: 'auto', mb: 1 }}
                    />
                    <Skeleton width="60%" height={24} sx={{ mx: 'auto', mb: 1 }} />
                    <Skeleton width="40%" height={20} sx={{ mx: 'auto', mb: 2 }} />
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
          <>
            {/* Results Summary */}
            <Box
              sx={{
                mb: 4,
                p: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ color: theme.palette.text.primary }}>
                👥 Found {results.workers.length} professional{results.workers.length !== 1 ? 's' : ''}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Page {results.pagination.currentPage || 1} of {results.pagination.totalPages || 1}
              </Typography>
            </Box>

            {/* Workers Grid */}
            <Grid container spacing={4}>
              {results.workers.map((worker, idx) => (
                <Grid item xs={12} sm={6} lg={3} key={worker.id || worker._id}>
                  <Grow in timeout={300 + idx * 100}>
                    <div>
                      <WorkerCard
                        worker={worker}
                        isSaved={savedWorkers.includes(worker.id || worker._id)}
                        onToggleSave={handleToggleSaveWorker}
                      />
                    </div>
                  </Grow>
                </Grid>
              ))}
            </Grid>
          </>
        )}
        
        {/* Pagination */}
        {!loading && !showSampleData && results.workers.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <Pagination
              count={Math.max(results.pagination.totalPages || 1, 1)}
              page={Math.max(results.pagination.currentPage || 1, 1)}
              onChange={(e, page) => handleSearch(page)}
              color="primary"
              size="large"
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 2,
                  fontWeight: 'bold'
                },
                '& .MuiPaginationItem-page.Mui-selected': {
                  backgroundColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.contrastText
                }
              }}
            />
          </Box>
        )}

        {/* Floating Action Button for Mobile */}
        <Fab
          color="primary"
          aria-label="post job"
          onClick={() => navigate('/jobs/post')}
          sx={{
            position: 'fixed',
            bottom: 90,
            right: 20,
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.secondary.contrastText,
            display: { xs: 'flex', md: 'none' },
            '&:hover': {
              backgroundColor: theme.palette.secondary.dark,
            }
          }}
        >
          <Star />
        </Fab>
      </Container>
    </Box>
  );
};

export default WorkerSearchPage;
