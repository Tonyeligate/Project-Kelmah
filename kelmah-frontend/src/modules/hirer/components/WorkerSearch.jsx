import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Chip,
  Avatar,
  Rating,
  Pagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert,
  Skeleton,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Star as StarIcon,
  Message as MessageIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { userServiceClient } from '../../common/services/axios';
import messagingService from '../../messaging/services/messagingService';
import { useNavigate } from 'react-router-dom';

// No mock data - using real API data only

const WorkerSearch = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [savedWorkers, setSavedWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    skills: [],
    minRating: 0,
    maxRate: 100,
    location: '',
    availability: 'all',
    experience: 'all',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Available filter options
  const skillOptions = [
    'Carpentry',
    'Plumbing',
    'Electrical',
    'Interior Design',
    'Painting',
    'Tiling',
    'Landscaping',
    'Masonry',
    'Roofing',
    'HVAC',
  ];

  const locationOptions = [
    'Accra, Greater Accra',
    'Kumasi, Ashanti',
    'Tema, Greater Accra',
    'Takoradi, Western',
    'Cape Coast, Central',
    'Tamale, Northern',
  ];

  useEffect(() => {
    fetchWorkers();
    // Hydrate saved bookmarks
    (async () => {
      try {
        const res = await userServiceClient.get('/api/users/bookmarks');
        const ids = res?.data?.data?.workerIds || [];
        setSavedWorkers(ids);
      } catch (_) {}
    })();
  }, [page, filters, searchQuery]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);

      // Try to fetch from user service, fall back to mock data
      const queryParams = new URLSearchParams({
        page: page.toString(),
        search: searchQuery,
        ...filters,
        skills: filters.skills.join(','),
      });

      const response = await userServiceClient.get(
        `/api/users/workers/search?${queryParams}`,
      );

      if (response.data) {
        const workersData = response.data.data?.workers || response.data.workers || [];
        const pagination = response.data.data?.pagination || {};
        setWorkers(workersData);
        setTotalPages(pagination.pages || response.data.totalPages || 1);
        try { localStorage.setItem('worker_search_cache', JSON.stringify(workersData)); } catch (_) {}
      } else {
        throw new Error('No data received');
      }

      setError(null);
    } catch (err) {
      console.warn(
        'User service unavailable for worker search:',
        err.message,
      );
      setError('Unable to fetch workers. Please try again later.');
      // Provide a safe fallback list for offline/unavailable service
      let fallback = [];
      try {
        // Optionally load a cached list from localStorage
        const cached = localStorage.getItem('worker_search_cache');
        if (cached) fallback = JSON.parse(cached);
      } catch (_) {}

      let filteredWorkers = Array.isArray(fallback) ? [...fallback] : [];

      if (searchQuery && filteredWorkers.length) {
        filteredWorkers = filteredWorkers.filter(
          (worker) =>
            worker.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (Array.isArray(worker.skills) && worker.skills.some((skill) =>
              String(skill).toLowerCase().includes(searchQuery.toLowerCase()),
            )) ||
            worker.title?.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      }

      if (filters.skills.length > 0 && filteredWorkers.length) {
        filteredWorkers = filteredWorkers.filter((worker) =>
          Array.isArray(worker.skills) && filters.skills.some((skill) => worker.skills.includes(skill)),
        );
      }

      if (filters.location && filteredWorkers.length) {
        filteredWorkers = filteredWorkers.filter((worker) =>
          (worker.location || '').includes(filters.location),
        );
      }

      if (filters.availability !== 'all' && filteredWorkers.length) {
        filteredWorkers = filteredWorkers.filter(
          (worker) => worker.availability === filters.availability,
        );
      }

      if (filters.minRating > 0 && filteredWorkers.length) {
        filteredWorkers = filteredWorkers.filter(
          (worker) => (worker.rating || 0) >= filters.minRating,
        );
      }

      if (filteredWorkers.length) {
        filteredWorkers = filteredWorkers.filter(
          (worker) =>
            (worker.hourlyRate || 0) >= 0 && (worker.hourlyRate || 0) <= filters.maxRate,
        );
      }

      setWorkers(filteredWorkers);
      setTotalPages(Math.ceil((filteredWorkers.length || 0) / 6) || 1);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPage(1);
  };

  const handleSkillToggle = (skill) => {
    setFilters((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
    setPage(1);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSaveWorker = async (workerId) => {
    try {
      const res = await userServiceClient.post(`/api/users/workers/${workerId}/bookmark`);
      const bookmarked = res?.data?.data?.bookmarked ?? !savedWorkers.includes(workerId);
      setSavedWorkers((prev) => {
        const has = prev.includes(workerId);
        if (bookmarked && !has) return [...prev, workerId];
        if (!bookmarked && has) return prev.filter((id) => id !== workerId);
        return prev;
      });
    } catch (error) {
      console.error('Error saving worker:', error);
      setError('Failed to save worker');
    }
  };

  const handleDialogOpen = (worker) => {
    setSelectedWorker(worker);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedWorker(null);
  };

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'available':
        return 'success';
      case 'busy':
        return 'warning';
      case 'unavailable':
        return 'error';
      default:
        return 'default';
    }
  };

  const getAvailabilityLabel = (availability) => {
    switch (availability) {
      case 'available':
        return 'Available';
      case 'busy':
        return 'Busy';
      case 'unavailable':
        return 'Unavailable';
      default:
        return availability;
    }
  };

  // Search Statistics
  const searchStats = {
    totalWorkers: workers.length,
    availableWorkers: workers.filter((w) => w.availability === 'available')
      .length,
    averageRating:
      workers.length > 0
        ? (
            workers.reduce((sum, w) => sum + w.rating, 0) / workers.length
          ).toFixed(1)
        : 0,
    averageRate:
      workers.length > 0
        ? Math.round(
            workers.reduce((sum, w) => sum + w.hourlyRate, 0) / workers.length,
          )
        : 0,
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {searchStats.totalWorkers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Workers Found
                  </Typography>
                </Box>
                <GroupIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {searchStats.availableWorkers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Available Now
                  </Typography>
                </Box>
                <WorkIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {searchStats.averageRating}★
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Average Rating
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    ₵{searchStats.averageRate}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Average Rate/Hr
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter Controls */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search workers by name, skills, or title..."
                value={searchQuery}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" gap={2} alignItems="center">
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => setFilterOpen(!filterOpen)}
                  fullWidth={isMobile}
                >
                  Filters
                </Button>
                {(filters.skills.length > 0 ||
                  filters.location ||
                  filters.availability !== 'all') && (
                  <Button
                    size="small"
                    onClick={() =>
                      setFilters({
                        skills: [],
                        minRating: 0,
                        maxRate: 100,
                        location: '',
                        availability: 'all',
                        experience: 'all',
                      })
                    }
                  >
                    Clear
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Filters Accordion */}
          <Accordion
            expanded={filterOpen}
            onChange={() => setFilterOpen(!filterOpen)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight="bold">
                Advanced Filters
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Skills
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {skillOptions.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        onClick={() => handleSkillToggle(skill)}
                        color={
                          filters.skills.includes(skill) ? 'primary' : 'default'
                        }
                        variant={
                          filters.skills.includes(skill) ? 'filled' : 'outlined'
                        }
                        size="small"
                      />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Location
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={filters.location}
                      onChange={(e) =>
                        handleFilterChange('location', e.target.value)
                      }
                      displayEmpty
                    >
                      <MenuItem value="">All Locations</MenuItem>
                      {locationOptions.map((location) => (
                        <MenuItem key={location} value={location}>
                          {location}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Availability
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={filters.availability}
                      onChange={(e) =>
                        handleFilterChange('availability', e.target.value)
                      }
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="available">Available</MenuItem>
                      <MenuItem value="busy">Busy</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Minimum Rating
                  </Typography>
                  <Slider
                    value={filters.minRating}
                    onChange={(e, newValue) =>
                      handleFilterChange('minRating', newValue)
                    }
                    min={0}
                    max={5}
                    step={0.5}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Max Hourly Rate (₵{filters.maxRate})
                  </Typography>
                  <Slider
                    value={filters.maxRate}
                    onChange={(e, newValue) =>
                      handleFilterChange('maxRate', newValue)
                    }
                    min={0}
                    max={100}
                    step={5}
                    valueLabelDisplay="auto"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {/* Workers Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Skeleton variant="circular" width={64} height={64} />
                    <Box flex={1}>
                      <Skeleton variant="text" height={30} width="80%" />
                      <Skeleton variant="text" height={20} width="60%" />
                    </Box>
                  </Box>
                  <Skeleton variant="text" height={60} />
                  <Skeleton variant="rectangular" height={40} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : workers.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <SearchIcon
                sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary">
                No workers found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search criteria or filters
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {workers.map((worker) => (
              <Grid item xs={12} sm={6} md={4} key={worker.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: worker.featured ? 2 : 1,
                    borderColor: worker.featured ? 'primary.main' : 'grey.200',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                      transition: 'all 0.3s ease',
                    },
                  }}
                >
                  {worker.featured && (
                    <Chip
                      label="Featured"
                      color="primary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        zIndex: 1,
                      }}
                    />
                  )}

                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Worker Header */}
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar
                        src={worker.avatar}
                        sx={{ width: 64, height: 64 }}
                      >
                        {worker.name.charAt(0)}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="h6" fontWeight="bold">
                          {worker.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                        >
                          {worker.title}
                        </Typography>
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={0.5}
                          mt={0.5}
                        >
                          <LocationIcon
                            sx={{ fontSize: 16, color: 'text.secondary' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {worker.location}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Rating and Stats */}
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      mb={2}
                    >
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Rating value={worker.rating} readOnly size="small" />
                        <Typography variant="body2">
                          {worker.rating} ({worker.reviewCount})
                        </Typography>
                      </Box>
                      <Chip
                        label={getAvailabilityLabel(worker.availability)}
                        color={getAvailabilityColor(worker.availability)}
                        size="small"
                      />
                    </Box>

                    {/* Skills */}
                    <Typography variant="subtitle2" gutterBottom>
                      Skills
                    </Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap" mb={2}>
                      {worker.skills.slice(0, 3).map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {worker.skills.length > 3 && (
                        <Chip
                          label={`+${worker.skills.length - 3} more`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      )}
                    </Box>

                    {/* Pricing and Experience */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Hourly Rate
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          color="primary.main"
                        >
                          {formatCurrency(worker.hourlyRate)}/hr
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Experience
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {worker.experience}
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* Bio */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {worker.bio.substring(0, 120)}...
                    </Typography>

                    {/* Action Buttons */}
                    <Box display="flex" gap={1}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<MessageIcon />}
                        sx={{ flex: 1 }}
                        onClick={async () => {
                          try {
                            const convo = await messagingService.createDirectConversation(worker.id);
                            const newId = convo?.id || convo?.data?.data?.conversation?.id || convo?.data?.conversation?.id || convo?.conversation?.id || convo?.data?.id;
                            if (newId) navigate(`/messages?conversation=${newId}`);
                          } catch (e) {
                            console.error('Failed to start conversation', e);
                          }
                        }}
                      >
                        Message
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleDialogOpen(worker)}
                      >
                        View
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleSaveWorker(worker.id)}
                        color={
                          savedWorkers.includes(worker.id)
                            ? 'primary'
                            : 'default'
                        }
                      >
                        {savedWorkers.includes(worker.id) ? (
                          <BookmarkIcon />
                        ) : (
                          <BookmarkBorderIcon />
                        )}
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? 'small' : 'medium'}
              />
            </Box>
          )}
        </>
      )}

      {/* Worker Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            {selectedWorker && (
              <>
                <Avatar
                  src={selectedWorker.avatar}
                  sx={{ width: 56, height: 56 }}
                >
                  {selectedWorker.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedWorker.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedWorker.title}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedWorker && (
            <Box>
              {/* Stats */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Rating
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <StarIcon sx={{ fontSize: 20, color: 'gold' }} />
                    <Typography variant="h6">
                      {selectedWorker.rating}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ({selectedWorker.reviewCount})
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Completed Jobs
                  </Typography>
                  <Typography variant="h6">
                    {selectedWorker.completedJobs}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Response Time
                  </Typography>
                  <Typography variant="h6">
                    {selectedWorker.responseTime}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Hourly Rate
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {formatCurrency(selectedWorker.hourlyRate)}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Bio */}
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                About
              </Typography>
              <Typography variant="body2" paragraph>
                {selectedWorker.bio}
              </Typography>

              {/* Skills */}
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Skills & Expertise
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" mb={3}>
                {selectedWorker.skills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>

              {/* Certifications */}
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Certifications
              </Typography>
              <Box mb={3}>
                {selectedWorker.certifications.map((cert, index) => (
                  <Typography key={index} variant="body2" gutterBottom>
                    • {cert}
                  </Typography>
                ))}
              </Box>

              {/* Languages */}
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Languages
              </Typography>
              <Typography variant="body2" paragraph>
                {selectedWorker.languages.join(', ')}
              </Typography>

              {/* Portfolio Preview */}
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Portfolio
              </Typography>
              <Grid container spacing={2}>
                {selectedWorker.portfolio.map((item, index) => (
                  <Grid item xs={4} key={index}>
                    <Paper
                      sx={{
                        height: 120,
                        backgroundImage: `url(${item.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background:
                            'linear-gradient(transparent, rgba(0,0,0,0.7))',
                          color: 'white',
                          p: 1,
                          borderRadius: '0 0 8px 8px',
                        }}
                      >
                        <Typography variant="caption">{item.title}</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Close</Button>
          <Button
            variant="outlined"
            startIcon={
              selectedWorker && savedWorkers.includes(selectedWorker.id) ? (
                <BookmarkIcon />
              ) : (
                <BookmarkBorderIcon />
              )
            }
            onClick={() =>
              selectedWorker && handleSaveWorker(selectedWorker.id)
            }
          >
            {selectedWorker && savedWorkers.includes(selectedWorker.id)
              ? 'Saved'
              : 'Save Worker'}
          </Button>
          <Button variant="contained" startIcon={<MessageIcon />}>
            Send Message
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkerSearch;
