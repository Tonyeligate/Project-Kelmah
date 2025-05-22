import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Divider,
  Paper,
  Avatar,
  Rating
} from '@mui/material';
import { 
  Search as SearchIcon, 
  LocationOn, 
  AttachMoney, 
  FilterList,
  Sort,
  Bookmark,
  BookmarkBorder,
  Star,
  AddCircleOutline,
  QueryBuilder
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { Link, useNavigate } from 'react-router-dom';

// Import images for job categories
import plumbingImg from '../../assets/images/plumbing.jpg.jpeg';
import electricalImg from '../../assets/images/electrical.jpg';
import carpentryImg from '../../assets/images/carpentry.jpg';
import constructionImg from '../../assets/images/construction.jpg';

// Styled components
const JobFilterPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: 'rgba(26, 26, 26, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 215, 0, 0.1)',
}));

const JobCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  background: 'rgba(26, 26, 26, 0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 215, 0, 0.1)',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.3)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
  }
}));

const CategoryChip = styled(Chip)(({ theme, selected }) => ({
  margin: theme.spacing(0.5),
  background: selected ? 'linear-gradient(45deg, #FFD700, #FFA500)' : 'rgba(255, 255, 255, 0.1)',
  color: selected ? '#000' : '#fff',
  borderColor: selected ? 'transparent' : 'rgba(255, 215, 0, 0.3)',
  '&:hover': {
    background: selected ? 'linear-gradient(45deg, #FFD700, #FFA500)' : 'rgba(255, 215, 0, 0.2)',
  }
}));

const StyledRating = styled(Rating)({
  '& .MuiRating-iconFilled': {
    color: '#FFD700',
  },
});

// Mock data for jobs
const MOCK_JOBS = [
  {
    id: 1,
    title: 'Bathroom Plumbing Repair',
    category: 'Plumbing',
    image: plumbingImg,
    location: 'New York, NY',
    rate: '$45-60/hr',
    rating: 4.8,
    reviews: 124,
    description: 'Need experienced plumber to fix leaky faucet and replace shower head. Must have 5+ years experience and own tools.',
    tags: ['Residential', 'Same-Day', 'Emergency'],
    postedDate: '2 days ago',
    workerName: 'John Smith',
    workerAvatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: 2,
    title: 'Kitchen Renovation - Electrical',
    category: 'Electrical',
    image: electricalImg,
    location: 'Boston, MA',
    rate: '$55-70/hr',
    rating: 4.9,
    reviews: 89,
    description: 'Installing new light fixtures and updating electrical wiring for kitchen renovation. Licensed electrician required.',
    tags: ['Residential', 'Scheduled', 'Licensed'],
    postedDate: '1 day ago',
    workerName: 'Lisa Johnson',
    workerAvatar: 'https://randomuser.me/api/portraits/women/46.jpg'
  },
  {
    id: 3,
    title: 'Custom Cabinets Construction',
    category: 'Carpentry',
    image: carpentryImg,
    location: 'Chicago, IL',
    rate: '$500-800 (Fixed)',
    rating: 4.7,
    reviews: 56,
    description: 'Need skilled carpenter to build custom kitchen cabinets. Materials will be provided, looking for quality craftsmanship.',
    tags: ['Commercial', 'Multi-day', 'Skilled'],
    postedDate: '3 days ago',
    workerName: 'Michael Brown',
    workerAvatar: 'https://randomuser.me/api/portraits/men/42.jpg'
  },
  {
    id: 4,
    title: 'Office Building Renovation',
    category: 'Construction',
    image: constructionImg,
    location: 'Austin, TX',
    rate: '$8,000-12,000 (Project)',
    rating: 4.6,
    reviews: 38,
    description: 'Complete office renovation including wall removal, flooring, and ceiling work. Team of 3-4 professionals needed for 2-week project.',
    tags: ['Commercial', 'Long-term', 'Team'],
    postedDate: '5 days ago',
    workerName: 'Construction Experts LLC',
    workerAvatar: 'https://randomuser.me/api/portraits/men/66.jpg'
  },
  {
    id: 5,
    title: 'Emergency Water Heater Replacement',
    category: 'Plumbing',
    image: plumbingImg,
    location: 'Denver, CO',
    rate: '$350-500 (Fixed)',
    rating: 4.5,
    reviews: 74,
    description: 'Need immediate replacement of 40-gallon water heater. Same day service required. Licensed plumber only.',
    tags: ['Residential', 'Emergency', 'Same-Day'],
    postedDate: '12 hours ago',
    workerName: 'Robert Wilson',
    workerAvatar: 'https://randomuser.me/api/portraits/men/22.jpg'
  },
  {
    id: 6,
    title: 'Home Theater Wiring',
    category: 'Electrical',
    image: electricalImg,
    location: 'Seattle, WA',
    rate: '$65/hr',
    rating: 4.9,
    reviews: 41,
    description: 'Installation of in-wall wiring for home theater system. Need professional cable management and outlet installation.',
    tags: ['Residential', 'Scheduled', 'High-End'],
    postedDate: '4 days ago',
    workerName: 'Tech Electric Solutions',
    workerAvatar: 'https://randomuser.me/api/portraits/women/28.jpg'
  },
];

// Categories for filtering
const CATEGORIES = [
  'All', 'Plumbing', 'Electrical', 'Carpentry', 'Construction', 'HVAC', 'Painting', 'Masonry'
];

const JobsPage = () => {
  const [jobs, setJobs] = useState(MOCK_JOBS);
  const [filteredJobs, setFilteredJobs] = useState(MOCK_JOBS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const navigate = useNavigate();

  // Apply filters
  useEffect(() => {
    let result = [...jobs];
    
    // Apply search query
    if (searchQuery) {
      result = result.filter(job => 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        job.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'All') {
      result = result.filter(job => job.category === selectedCategory);
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'newest':
        // For mock data we'll just use the original order
        break;
      case 'oldest':
        result = [...result].reverse();
        break;
      case 'highest_rated':
        result = [...result].sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest_rated':
        result = [...result].sort((a, b) => a.rating - b.rating);
        break;
      default:
        break;
    }
    
    setFilteredJobs(result);
  }, [jobs, searchQuery, selectedCategory, sortBy, priceRange]);

  const toggleSaveJob = (jobId) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs(savedJobs.filter(id => id !== jobId));
    } else {
      setSavedJobs([...savedJobs, jobId]);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      py: 8, 
      px: 2,
      background: '#1a1a1a'
    }}>
      <Container maxWidth="xl">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography 
            variant="h2" 
            component="h1" 
            sx={{ 
              mb: 4,
              textAlign: 'center',
              background: 'linear-gradient(45deg, #FFD700, #FFA500)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}
          >
            Available Jobs
          </Typography>
        </motion.div>

        {/* Post a Job Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Button
              variant="contained"
              startIcon={<AddCircleOutline />}
              onClick={() => navigate('/jobs/new')}
              sx={{
                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                color: '#000',
                fontWeight: 'bold',
                px: 3,
                py: 1,
                borderRadius: 2,
                '&:hover': {
                  background: 'linear-gradient(45deg, #FFA500, #FFD700)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
                }
              }}
            >
              Post a Job
            </Button>
          </Box>
        </motion.div>

        {/* Search Bar */}
        <Box sx={{ mb: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <TextField
              fullWidth
              placeholder="Search for jobs, skills, or keywords..."
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#FFD700' }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.05)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 215, 0, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 215, 0, 0.5) !important',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FFD700 !important',
                  },
                }
              }}
            />
          </motion.div>
        </Box>

        {/* Category Pills */}
        <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {CATEGORIES.map((category, index) => (
              <CategoryChip
                key={category}
                label={category}
                clickable
                selected={selectedCategory === category}
                onClick={() => handleCategoryChange(category)}
                variant={selectedCategory === category ? "filled" : "outlined"}
              />
            ))}
          </motion.div>
        </Box>

        <Grid container spacing={4}>
          {/* Filters & Sorting Section */}
          <Grid item xs={12} md={3}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <JobFilterPaper>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#FFD700' }}>
                    Filters
                  </Typography>
                  <IconButton onClick={() => setIsFiltersOpen(!isFiltersOpen)} sx={{ color: '#FFD700' }}>
                    <FilterList />
                  </IconButton>
                </Box>

                <Box sx={{ display: { xs: isFiltersOpen ? 'block' : 'none', md: 'block' } }}>
                  {/* Sort By */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, color: '#fff' }}>
                      Sort By
                    </Typography>
                    <FormControl fullWidth variant="outlined" size="small">
                      <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        sx={{
                          borderRadius: 2,
                          background: 'rgba(255, 255, 255, 0.05)',
                          '& fieldset': {
                            borderColor: 'rgba(255, 215, 0, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 215, 0, 0.5) !important',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#FFD700 !important',
                          },
                        }}
                      >
                        <MenuItem value="newest">Newest First</MenuItem>
                        <MenuItem value="oldest">Oldest First</MenuItem>
                        <MenuItem value="highest_rated">Highest Rated</MenuItem>
                        <MenuItem value="lowest_rated">Lowest Rated</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Rate Range */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, color: '#fff' }}>
                      Rate Range ($/hr)
                    </Typography>
                    <Slider
                      value={priceRange}
                      onChange={(e, newValue) => setPriceRange(newValue)}
                      valueLabelDisplay="auto"
                      min={0}
                      max={100}
                      sx={{
                        color: '#FFD700',
                        '& .MuiSlider-thumb': {
                          background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                        },
                        '& .MuiSlider-track': {
                          background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                        },
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        ${priceRange[0]}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        ${priceRange[1]}+
                      </Typography>
                    </Box>
                  </Box>

                  {/* Job Type */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, color: '#fff' }}>
                      Job Type
                    </Typography>
                    {['Residential', 'Commercial', 'Emergency', 'Same-Day', 'Long-term'].map((type) => (
                      <Box key={type} sx={{ display: 'flex', alignItems: 'center', my: 0.5 }}>
                        <Chip
                          label={type}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            borderColor: 'rgba(255, 215, 0, 0.3)',
                            color: '#fff',
                            '&:hover': {
                              background: 'rgba(255, 215, 0, 0.1)',
                            }
                          }}
                          onClick={() => {/* Add filtering logic here */}}
                        />
                      </Box>
                    ))}
                  </Box>

                  {/* Saved Jobs Button */}
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<BookmarkBorder />}
                    sx={{
                      borderColor: '#FFD700',
                      color: '#FFD700',
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: '#FFA500',
                        background: 'rgba(255, 215, 0, 0.1)',
                      }
                    }}
                  >
                    Saved Jobs ({savedJobs.length})
                  </Button>
                </Box>
              </JobFilterPaper>
            </motion.div>
          </Grid>

          {/* Job Listings */}
          <Grid item xs={12} md={9}>
            <Grid container spacing={3}>
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <Grid item xs={12} sm={6} md={4} key={job.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <JobCard elevation={3}>
                        <CardContent>
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Typography variant="h6" component="h2" sx={{ 
                                color: '#FFD700',
                                fontWeight: 'bold',
                                mb: 1
                              }}>
                                {job.title}
                              </Typography>
                              <IconButton 
                                size="small" 
                                onClick={() => toggleSaveJob(job.id)}
                                sx={{ color: savedJobs.includes(job.id) ? '#FFD700' : 'rgba(255, 255, 255, 0.5)' }}
                              >
                                {savedJobs.includes(job.id) ? <Bookmark /> : <BookmarkBorder />}
                              </IconButton>
                            </Box>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                              <Chip 
                                size="small" 
                                label={job.category} 
                                sx={{
                                  background: 'rgba(255, 215, 0, 0.15)',
                                  color: '#FFD700',
                                  border: '1px solid rgba(255, 215, 0, 0.3)'
                                }}
                              />
                              <Chip 
                                size="small" 
                                label={job.type} 
                                sx={{
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  color: '#fff',
                                  border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                              />
                            </Box>
                          </Box>

                          <Typography variant="body2" color="text.secondary" sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)',
                            height: 60,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            mb: 2
                          }}>
                            {job.description}
                          </Typography>

                          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1.5 }} />

                          <Grid container spacing={1} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AttachMoney sx={{ color: '#FFD700', fontSize: 20, mr: 0.5 }} />
                                <Typography variant="body2" sx={{ color: '#fff' }}>
                                  ${job.rate.min} - ${job.rate.max}{job.rate.type === 'hourly' ? '/hr' : ''}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationOn sx={{ color: '#FFD700', fontSize: 20, mr: 0.5 }} />
                                <Typography variant="body2" sx={{ color: '#fff' }}>
                                  {job.location}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <QueryBuilder sx={{ color: '#FFD700', fontSize: 20, mr: 0.5 }} />
                                <Typography variant="body2" sx={{ color: '#fff' }}>
                                  Posted {job.postedDate}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>

                          <Button 
                            variant="contained" 
                            fullWidth
                            onClick={() => navigate(`/jobs/${job.id}`)}
                            sx={{
                              mt: 1,
                              background: 'linear-gradient(45deg, rgba(255, 215, 0, 0.8), rgba(255, 165, 0, 0.8))',
                              color: '#000',
                              fontWeight: 'bold',
                              borderRadius: 1,
                              '&:hover': {
                                background: 'linear-gradient(45deg, rgba(255, 215, 0, 1), rgba(255, 165, 0, 1))',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                              }
                            }}
                          >
                            View Details
                          </Button>
                        </CardContent>
                      </JobCard>
                    </motion.div>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 4, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    background: 'rgba(26, 26, 26, 0.7)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 215, 0, 0.1)',
                  }}>
                    <Typography variant="h5" sx={{ mb: 2, color: '#FFD700' }}>
                      No jobs found
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
                      Try adjusting your filters or search query to find more opportunities.
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default JobsPage; 