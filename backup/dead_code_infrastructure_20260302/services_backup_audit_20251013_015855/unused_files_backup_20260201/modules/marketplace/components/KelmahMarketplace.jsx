import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  Chip,
  Rating,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
  Paper,
  Stack,
  Divider,
  alpha,
  Skeleton,
  InputAdornment,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip,
  Fab,
  Zoom,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  Work as WorkIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Verified as VerifiedIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  Message as MessageIcon,
  Phone as PhoneIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Build as BuildIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  Brush as BrushIcon,
  Computer as ComputerIcon,
  LocalShipping as ShippingIcon,
  Restaurant as RestaurantIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';

// Ghana-inspired color theme
const GhanaTheme = {
  red: '#DC143C', // Ghana flag red
  gold: '#FFD700', // Ghana flag gold
  green: '#2E7D32', // Ghana flag green
  trust: '#1976D2', // Trust blue
};

// Styled components for mobile-first design
const MobileOptimizedCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
  [theme.breakpoints.down('md')]: {
    borderRadius: 12,
    margin: theme.spacing(1, 0),
  },
}));

const CategoryChip = styled(Chip)(({ theme, category }) => ({
  borderRadius: 20,
  fontWeight: 600,
  padding: theme.spacing(0.5, 1),
  '&:hover': {
    transform: 'scale(1.05)',
  },
  background: getCategoryColor(category),
  color: 'white',
}));

const SearchBar = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 25,
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(10px)',
    '&:hover': {
      backgroundColor: alpha(theme.palette.background.paper, 0.9),
    },
    '&.Mui-focused': {
      backgroundColor: theme.palette.background.paper,
      boxShadow: `0 0 0 2px ${alpha(GhanaTheme.red, 0.3)}`,
    },
  },
}));

// Helper function for category colors
function getCategoryColor(category) {
  const colors = {
    construction: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    technology: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    design: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    writing: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    business: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    domestic: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    automotive: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    food: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    default: `linear-gradient(135deg, ${GhanaTheme.red} 0%, ${GhanaTheme.gold} 100%)`,
  };
  return colors[category] || colors.default;
}

// Ghana regions for location filtering
const ghanaRegions = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Central',
  'Eastern',
  'Northern',
  'Upper East',
  'Upper West',
  'Volta',
  'Brong-Ahafo',
  'Western North',
  'Ahafo',
  'Bono',
  'Bono East',
  'Oti',
  'Savannah',
  'North East',
];

// Professional categories common in Ghana
const professionalCategories = [
  {
    id: 'construction',
    name: 'Construction & Building',
    icon: <HomeIcon />,
    count: 1250,
  },
  {
    id: 'technology',
    name: 'IT & Technology',
    icon: <ComputerIcon />,
    count: 890,
  },
  { id: 'design', name: 'Graphics & Design', icon: <BrushIcon />, count: 670 },
  {
    id: 'business',
    name: 'Business Services',
    icon: <BusinessIcon />,
    count: 540,
  },
  { id: 'domestic', name: 'Domestic Services', icon: <HomeIcon />, count: 980 },
  {
    id: 'automotive',
    name: 'Automotive Services',
    icon: <ShippingIcon />,
    count: 420,
  },
  { id: 'food', name: 'Food & Catering', icon: <RestaurantIcon />, count: 310 },
  { id: 'crafts', name: 'Arts & Crafts', icon: <BrushIcon />, count: 280 },
];

const KelmahMarketplace = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [workers, setWorkers] = useState([]);
  const [featuredWorkers, setFeaturedWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Mock data for featured workers
  const mockFeaturedWorkers = useMemo(
    () => [
      {
        id: 1,
        name: 'Kwame Asante',
        profession: 'Master Carpenter',
        rating: 4.9,
        reviewCount: 147,
        location: 'Kumasi, Ashanti',
        avatar: '/api/placeholder/60/60',
        verified: true,
        skills: ['Furniture Making', 'Home Renovation', 'Cabinet Installation'],
        hourlyRate: 25,
        availability: 'Available Now',
        completedJobs: 89,
        responseTime: '< 1 hour',
        successRate: 98,
        category: 'construction',
        description:
          'Experienced carpenter with 10+ years in custom furniture and home renovation.',
        portfolio: [
          '/api/placeholder/150/150',
          '/api/placeholder/150/150',
          '/api/placeholder/150/150',
        ],
      },
      {
        id: 2,
        name: 'Akosua Mensah',
        profession: 'UI/UX Designer',
        rating: 4.8,
        reviewCount: 92,
        location: 'Accra, Greater Accra',
        avatar: '/api/placeholder/60/60',
        verified: true,
        skills: ['Mobile App Design', 'Web Design', 'Brand Identity'],
        hourlyRate: 35,
        availability: 'Available This Week',
        completedJobs: 156,
        responseTime: '< 30 min',
        successRate: 96,
        category: 'design',
        description:
          'Creative designer specializing in modern, user-centered digital experiences.',
        portfolio: [
          '/api/placeholder/150/150',
          '/api/placeholder/150/150',
          '/api/placeholder/150/150',
        ],
      },
      {
        id: 3,
        name: 'Yaw Oppong',
        profession: 'Full-Stack Developer',
        rating: 4.9,
        reviewCount: 203,
        location: 'Tema, Greater Accra',
        avatar: '/api/placeholder/60/60',
        verified: true,
        skills: ['React', 'Node.js', 'Mobile Apps'],
        hourlyRate: 45,
        availability: 'Available Now',
        completedJobs: 234,
        responseTime: '< 15 min',
        successRate: 99,
        category: 'technology',
        description:
          'Senior developer with expertise in modern web and mobile technologies.',
        portfolio: [
          '/api/placeholder/150/150',
          '/api/placeholder/150/150',
          '/api/placeholder/150/150',
        ],
      },
      // Add more mock workers...
    ],
    [],
  );

  // Load featured workers
  useEffect(() => {
    setFeaturedWorkers(mockFeaturedWorkers);
  }, [mockFeaturedWorkers]);

  // Handle search
  const handleSearch = useCallback(
    (query, category, location) => {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const filtered = mockFeaturedWorkers.filter((worker) => {
          const matchesQuery =
            !query ||
            worker.name.toLowerCase().includes(query.toLowerCase()) ||
            worker.profession.toLowerCase().includes(query.toLowerCase()) ||
            worker.skills.some((skill) =>
              skill.toLowerCase().includes(query.toLowerCase()),
            );

          const matchesCategory = !category || worker.category === category;
          const matchesLocation =
            !location || worker.location.includes(location);

          return matchesQuery && matchesCategory && matchesLocation;
        });

        setWorkers(filtered);
        setLoading(false);
      }, 800);
    },
    [mockFeaturedWorkers],
  );

  // Handle favorite toggle
  const toggleFavorite = useCallback((workerId) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(workerId)) {
        newFavorites.delete(workerId);
      } else {
        newFavorites.add(workerId);
      }
      return newFavorites;
    });
  }, []);

  // Trigger search when filters change
  useEffect(() => {
    handleSearch(searchQuery, selectedCategory, selectedLocation);
  }, [searchQuery, selectedCategory, selectedLocation, handleSearch]);

  // Worker card component
  const WorkerCard = ({ worker }) => (
    <MobileOptimizedCard>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box
          display="flex"
          alignItems="flex-start"
          justifyContent="space-between"
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                worker.verified ? (
                  <VerifiedIcon
                    sx={{ fontSize: 16, color: GhanaTheme.trust }}
                  />
                ) : null
              }
            >
              <Avatar
                src={worker.avatar}
                sx={{
                  width: { xs: 50, md: 60 },
                  height: { xs: 50, md: 60 },
                  border: `2px solid ${GhanaTheme.gold}`,
                }}
              >
                {worker.name.charAt(0)}
              </Avatar>
            </Badge>
            <Box flex={1}>
              <Typography variant="h6" fontWeight={600} color="text.primary">
                {worker.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {worker.profession}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Rating
                  value={worker.rating}
                  readOnly
                  size="small"
                  precision={0.1}
                />
                <Typography variant="caption" color="text.secondary">
                  {worker.rating} ({worker.reviewCount} reviews)
                </Typography>
              </Box>
            </Box>
          </Box>
          <IconButton
            onClick={() => toggleFavorite(worker.id)}
            sx={{
              color: favorites.has(worker.id)
                ? GhanaTheme.red
                : 'text.secondary',
            }}
          >
            {favorites.has(worker.id) ? (
              <FavoriteIcon />
            ) : (
              <FavoriteBorderIcon />
            )}
          </IconButton>
        </Box>

        {/* Skills */}
        <Box mb={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {worker.skills.slice(0, 3).map((skill) => (
              <Chip
                key={skill}
                label={skill}
                size="small"
                sx={{
                  backgroundColor: alpha(GhanaTheme.green, 0.1),
                  color: GhanaTheme.green,
                  fontWeight: 500,
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Stats */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Box textAlign="center">
              <Typography variant="h6" fontWeight={600} color={GhanaTheme.red}>
                GH₵{worker.hourlyRate}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                per hour
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box textAlign="center">
              <Typography
                variant="h6"
                fontWeight={600}
                color={GhanaTheme.green}
              >
                {worker.completedJobs}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                jobs completed
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Location and availability */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
        >
          <Box display="flex" alignItems="center" gap={0.5}>
            <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {worker.location}
            </Typography>
          </Box>
          <Chip
            label={worker.availability}
            size="small"
            sx={{
              backgroundColor: alpha(GhanaTheme.gold, 0.2),
              color: GhanaTheme.red,
              fontWeight: 500,
            }}
          />
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<MessageIcon />}
            sx={{
              background: `linear-gradient(135deg, ${GhanaTheme.red} 0%, ${GhanaTheme.gold} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${GhanaTheme.red} 20%, ${GhanaTheme.gold} 80%)`,
              },
            }}
          >
            Contact
          </Button>
          <Button
            variant="outlined"
            startIcon={<WorkIcon />}
            sx={{
              borderColor: GhanaTheme.green,
              color: GhanaTheme.green,
              '&:hover': {
                backgroundColor: alpha(GhanaTheme.green, 0.1),
                borderColor: GhanaTheme.green,
              },
            }}
          >
            Hire
          </Button>
        </Stack>
      </CardContent>
    </MobileOptimizedCard>
  );

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${GhanaTheme.red} 0%, ${GhanaTheme.gold} 100%)`,
          color: 'white',
          py: { xs: 4, md: 8 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />

        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography
                  variant="h2"
                  fontWeight={700}
                  gutterBottom
                  sx={{ fontSize: { xs: '2rem', md: '3rem' } }}
                >
                  Find Skilled Professionals in Ghana
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 4,
                    opacity: 0.9,
                    fontSize: { xs: '1rem', md: '1.25rem' },
                  }}
                >
                  Connect with verified local talent for your next project
                </Typography>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight={700}>
                    10,000+
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Verified Professionals
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          </Grid>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Paper
              elevation={8}
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 4,
                mt: 4,
                background: alpha('#ffffff', 0.95),
                backdropFilter: 'blur(10px)',
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={5}>
                  <SearchBar
                    fullWidth
                    placeholder="Search for services or professionals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: GhanaTheme.red }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      label="Category"
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {professionalCategories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Location</InputLabel>
                    <Select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      label="Location"
                    >
                      <MenuItem value="">All Ghana</MenuItem>
                      {ghanaRegions.map((region) => (
                        <MenuItem key={region} value={region}>
                          {region}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={1}>
                  <IconButton
                    onClick={() => setShowFilters(!showFilters)}
                    sx={{
                      bgcolor: GhanaTheme.red,
                      color: 'white',
                      '&:hover': { bgcolor: GhanaTheme.red },
                    }}
                  >
                    <FilterIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Paper>
          </motion.div>
        </Container>
      </Box>

      {/* Categories Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" fontWeight={600} textAlign="center" mb={4}>
          Popular Categories
        </Typography>
        <Grid container spacing={3}>
          {professionalCategories.map((category) => (
            <Grid item xs={6} sm={4} md={3} key={category.id}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    cursor: 'pointer',
                    borderRadius: 3,
                    background: getCategoryColor(category.id),
                    color: 'white',
                    '&:hover': {
                      boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                    },
                  }}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <Box sx={{ fontSize: 40, mb: 2 }}>{category.icon}</Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {category.name}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {category.count}+ professionals
                  </Typography>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Featured Workers */}
      <Container maxWidth="lg" sx={{ pb: 6 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Typography variant="h4" fontWeight={600}>
            {workers.length > 0 ? 'Search Results' : 'Featured Professionals'}
          </Typography>
          {workers.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {workers.length} professionals found
            </Typography>
          )}
        </Box>

        {loading ? (
          <Grid container spacing={3}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} lg={4} key={index}>
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Skeleton variant="circular" width={60} height={60} />
                    <Box flex={1}>
                      <Skeleton variant="text" width="80%" height={24} />
                      <Skeleton variant="text" width="60%" height={20} />
                    </Box>
                  </Box>
                  <Skeleton variant="text" width="100%" height={60} />
                  <Box mt={2}>
                    <Skeleton variant="rectangular" width="100%" height={36} />
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={3}>
            {(workers.length > 0 ? workers : featuredWorkers).map((worker) => (
              <Grid item xs={12} sm={6} lg={4} key={worker.id}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * (worker.id % 6) }}
                >
                  <WorkerCard worker={worker} />
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Trust Indicators */}
      <Box sx={{ bgcolor: alpha(GhanaTheme.green, 0.1), py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight={600} textAlign="center" mb={4}>
            Why Choose Kelmah?
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4} textAlign="center">
              <VerifiedIcon
                sx={{ fontSize: 48, color: GhanaTheme.trust, mb: 2 }}
              />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Verified Professionals
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All professionals undergo thorough verification including
                background checks and skill assessments.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} textAlign="center">
              <MoneyIcon sx={{ fontSize: 48, color: GhanaTheme.gold, mb: 2 }} />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Secure Payments
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Protected payments through escrow system with support for Mobile
                Money and bank transfers.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} textAlign="center">
              <PeopleIcon sx={{ fontSize: 48, color: GhanaTheme.red, mb: 2 }} />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Local Community
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supporting Ghanaian talent and businesses with a platform
                designed for our local needs.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Zoom in={true}>
          <Fab
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              background: `linear-gradient(135deg, ${GhanaTheme.red} 0%, ${GhanaTheme.gold} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${GhanaTheme.red} 20%, ${GhanaTheme.gold} 80%)`,
              },
            }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <SearchIcon />
          </Fab>
        </Zoom>
      )}
    </Box>
  );
};

export default KelmahMarketplace;
