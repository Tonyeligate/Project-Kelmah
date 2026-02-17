import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
import { API_ENDPOINTS } from '../../../config/environment';
import { api } from '../../../services/apiClient';
import { secureStorage } from '../../../utils/secureStorage';
import messagingService from '../../messaging/services/messagingService';

// No mock data - using real API data only

const isLikelyJwt = (token) =>
  typeof token === 'string' && token.split('.').length === 3;

const extractWorkerIdsFromBookmarks = (payload) => {
  const nested = payload?.data?.data || payload?.data || payload || {};

  if (Array.isArray(nested.workerIds)) {
    return nested.workerIds.map((id) => String(id));
  }

  if (Array.isArray(nested.bookmarks)) {
    return nested.bookmarks
      .map((entry) => entry?.workerId || entry?.worker?._id || entry?.worker?.id)
      .filter(Boolean)
      .map((id) => String(id));
  }

  if (Array.isArray(nested)) {
    return nested
      .map((entry) => entry?.workerId || entry?._id || entry?.id)
      .filter(Boolean)
      .map((id) => String(id));
  }

  return [];
};

const WorkerSearch = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [savedWorkers, setSavedWorkers] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOption, setSortOption] = useState('relevance');

  const [filters, setFilters] = useState({
    skills: [],
    minRating: 0,
    maxRate: 100,
    location: '',
    availability: 'all',
    experience: 'all',
    primaryTrade: '', // ✅ ADDED: Trade/Specialization filter
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef(null);
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

  // ✅ ADDED: Trade/Specialization options matching backend schema
  const tradeOptions = [
    'Electrical Work',
    'Plumbing Services',
    'Carpentry & Woodwork',
    'Painting & Decoration',
    'Masonry & Stonework',
    'Roofing Services',
    'HVAC & Climate Control',
    'Landscaping',
    'Construction & Building',
    'Welding Services',
    'Tiling & Flooring',
    'General Maintenance',
  ];

  const locationOptions = [
    'Accra, Greater Accra',
    'Kumasi, Ashanti',
    'Tema, Greater Accra',
    'Takoradi, Western',
    'Cape Coast, Central',
    'Tamale, Northern',
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Best Match' },
    { value: 'rating_desc', label: 'Rating (High to Low)' },
    { value: 'rating_asc', label: 'Rating (Low to High)' },
    { value: 'price_low', label: 'Hourly Rate (Low to High)' },
    { value: 'price_high', label: 'Hourly Rate (High to Low)' },
    { value: 'experience_desc', label: 'Experience (High to Low)' },
  ];

  const normalizeWorkerRecord = (worker = {}) => {
    const skillsArray = Array.isArray(worker.skills)
      ? worker.skills
        .map((skill) => {
          if (typeof skill === 'string') return skill;
          if (skill?.name) return skill.name;
          if (skill?.skillName) return skill.skillName;
          if (skill?.label) return skill.label;
          return typeof skill === 'object' && skill !== null
            ? JSON.stringify(skill)
            : String(skill || '').trim();
        })
        .filter(Boolean)
      : Array.isArray(worker.specializations)
        ? worker.specializations.filter(Boolean)
        : [];

    const experienceYears =
      worker.yearsOfExperience ?? worker.experienceYears ?? null;

    const parsedExperience = (() => {
      if (typeof worker.experience === 'string' && worker.experience.length) {
        return worker.experience;
      }
      if (experienceYears !== null && experienceYears !== undefined) {
        return `${experienceYears}+ years`;
      }
      return 'Experience not specified';
    })();

    const safeIdValue =
      worker.id ||
      worker.userId ||
      (worker._id && worker._id.toString
        ? worker._id.toString()
        : worker._id) ||
      worker.workerId ||
      worker.email ||
      null;
    const safeId = safeIdValue || `worker-${crypto.randomUUID()}`;

    const normalizedRate = Number(
      worker.hourlyRate ?? worker.rate ?? worker.minRate ?? 25,
    );

    return {
      id: safeId,
      userId: safeId,
      name:
        worker.name ||
        [worker.firstName, worker.lastName].filter(Boolean).join(' ') ||
        'Skilled Worker',
      title:
        worker.title ||
        worker.profession ||
        (Array.isArray(worker.specializations)
          ? worker.specializations[0]
          : null) ||
        'Professional Worker',
      location: worker.location || worker.city || 'Ghana',
      rating: Number(worker.rating ?? worker.averageRating ?? 0),
      reviewCount: worker.reviewCount ?? worker.totalReviews ?? 0,
      availability:
        worker.availability || worker.availabilityStatus || 'available',
      hourlyRate: Number.isFinite(normalizedRate) ? normalizedRate : 25,
      experience: parsedExperience,
      bio:
        worker.bio ||
        'Experienced professional delivering quality craftsmanship and reliable service.',
      skills: skillsArray,
      specializations:
        Array.isArray(worker.specializations) && worker.specializations.length
          ? worker.specializations
          : skillsArray,
      isVerified: Boolean(worker.isVerified),
      featured: Boolean(worker.featured),
      rankScore: Number(worker.rankScore ?? 0),
      avatar: worker.profilePicture || worker.avatar || null,
    };
  };

  const sortWorkerList = (list = [], option = 'relevance') => {
    const workersCopy = [...list];

    switch (option) {
      case 'rating_desc':
        return workersCopy.sort((a, b) => b.rating - a.rating);
      case 'rating_asc':
        return workersCopy.sort((a, b) => a.rating - b.rating);
      case 'price_low':
        return workersCopy.sort((a, b) => a.hourlyRate - b.hourlyRate);
      case 'price_high':
        return workersCopy.sort((a, b) => b.hourlyRate - a.hourlyRate);
      case 'experience_desc':
        return workersCopy.sort((a, b) => {
          const parseYears = (value) => {
            if (typeof value === 'number') return value;
            if (!value) return 0;
            const match = String(value).match(/(\d+(?:\.\d+)?)/);
            return match ? parseFloat(match[1]) : 0;
          };
          return parseYears(b.experience) - parseYears(a.experience);
        });
      case 'relevance':
      default:
        return workersCopy.sort((a, b) => b.rankScore - a.rankScore);
    }
  };

  useEffect(() => {
    console.log('WorkerSearch useEffect - making API calls');
    fetchWorkers();
    // Hydrate saved bookmarks
    (async () => {
      try {
        const token = secureStorage.getAuthToken();
        if (!isLikelyJwt(token)) {
          return;
        }

        console.log('WorkerSearch - fetching bookmarks');
        let res;
        try {
          res = await api.get(API_ENDPOINTS.USER.BOOKMARKS);
        } catch (bookmarkError) {
          if (bookmarkError?.response?.status === 404) {
            res = await api.get('/bookmarks');
          } else {
            throw bookmarkError;
          }
        }

        const ids = extractWorkerIdsFromBookmarks(res?.data);
        setSavedWorkers(ids);
      } catch (err) {
        console.log('WorkerSearch - bookmarks fetch failed:', err.message);
      }
    })();
  }, [page, filters, debouncedSearch, sortOption]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      console.log('WorkerSearch - fetchWorkers called');

      const sortMap = {
        relevance: 'relevance',
        rating_desc: 'rating',
        rating_asc: 'rating',
        price_low: 'price_low',
        price_high: 'price_high',
        experience_desc: 'experience',
      };

      const params = {
        page,
        limit: 20,
        sortBy: sortMap[sortOption] || 'relevance',
      };

      const searchTerms = [searchQuery, filters.primaryTrade]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
        .join(' ')
        .trim();

      if (searchTerms) {
        params.query = searchTerms;
      }

      if (filters.location) {
        params.location = filters.location.split(',')[0].trim();
      }

      if (filters.skills && filters.skills.length > 0) {
        params.skills = filters.skills.join(',');
      }

      if (filters.minRating > 0) {
        params.minRating = filters.minRating;
      }

      if (filters.maxRate < 100) {
        params.maxRate = filters.maxRate;
      }

      if (filters.availability && filters.availability !== 'all') {
        params.availability = filters.availability;
      }

      console.log('WorkerSearch - making API call to:', API_ENDPOINTS.USER.WORKERS_SEARCH, params);

      let response;
      try {
        response = await api.get(API_ENDPOINTS.USER.WORKERS_SEARCH, {
          params,
        });
      } catch (primaryError) {
        const shouldFallback =
          primaryError?.response?.status === 404 &&
          API_ENDPOINTS.USER.WORKERS_SEARCH !== '/workers/search';

        if (!shouldFallback) {
          throw primaryError;
        }

        response = await api.get('/workers/search', { params });
      }

      if (response.data) {
        const workersData =
          response.data.data?.workers || response.data.workers || [];
        const pagination = response.data.data?.pagination || {};

        const normalizedWorkers = Array.isArray(workersData)
          ? workersData.map((worker) => normalizeWorkerRecord(worker))
          : [];

        const sortedWorkers = sortWorkerList(normalizedWorkers, sortOption);

        setWorkers(sortedWorkers);
        setTotalPages(
          pagination.totalPages ||
          pagination.pages ||
          response.data.totalPages ||
          1,
        );

        try {
          localStorage.setItem(
            'worker_search_cache',
            JSON.stringify(sortedWorkers),
          );
        } catch (_) { }
      } else {
        throw new Error('No data received');
      }

      setError(null);
    } catch (err) {
      console.warn('User service unavailable for worker search:', err.message);
      console.log(
        'WorkerSearch - API call failed:',
        err.response?.status,
        err.response?.data,
      );
      setError('Unable to fetch workers. Please try again later.');
      // Provide a safe fallback list for offline/unavailable service
      let fallback = [];
      try {
        // Optionally load a cached list from localStorage
        const cached = localStorage.getItem('worker_search_cache');
        if (cached) fallback = JSON.parse(cached);
      } catch (_) { }

      let filteredWorkers = Array.isArray(fallback) ? [...fallback] : [];

      if (searchQuery && filteredWorkers.length) {
        filteredWorkers = filteredWorkers.filter(
          (worker) =>
            worker.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (Array.isArray(worker.skills) &&
              worker.skills.some((skill) =>
                String(skill).toLowerCase().includes(searchQuery.toLowerCase()),
              )) ||
            worker.title?.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      }

      if (filters.skills.length > 0 && filteredWorkers.length) {
        filteredWorkers = filteredWorkers.filter((worker) => {
          if (!Array.isArray(worker.skills)) return false;
          const normalizedSkills = worker.skills.map((skill) =>
            typeof skill === 'string'
              ? skill
              : skill?.name || skill?.skillName || skill,
          );
          return filters.skills.some((skill) =>
            normalizedSkills.includes(skill),
          );
        });
      }

      if (filters.location && filteredWorkers.length) {
        filteredWorkers = filteredWorkers.filter((worker) =>
          (worker.location || '').includes(filters.location),
        );
      }

      if (filters.primaryTrade && filteredWorkers.length) {
        filteredWorkers = filteredWorkers.filter((worker) => {
          const specializations = Array.isArray(worker.specializations)
            ? worker.specializations
            : [];
          const skillsList = Array.isArray(worker.skills) ? worker.skills : [];
          const normalizedSkills = skillsList.map((skill) =>
            typeof skill === 'string'
              ? skill
              : skill?.name || skill?.skillName || skill,
          );
          return (
            specializations.includes(filters.primaryTrade) ||
            normalizedSkills.includes(filters.primaryTrade)
          );
        });
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
            (worker.hourlyRate || 0) >= 0 &&
            (worker.hourlyRate || 0) <= filters.maxRate,
        );
      }

      const normalizedFallback = filteredWorkers.map((worker) =>
        normalizeWorkerRecord(worker),
      );
      const sortedFallback = sortWorkerList(normalizedFallback, sortOption);

      setWorkers(sortedFallback);
      setTotalPages(Math.ceil((sortedFallback.length || 0) / 6) || 1);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
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

  const handleSortChange = (event) => {
    const { value } = event.target;
    setSortOption(value);
    setPage(1);
  };

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchQuery(value);
    // Debounce API call by 400ms
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSaveWorker = async (workerId) => {
    try {
      const res = await api.post(`/users/workers/${workerId}/bookmark`);
      const bookmarked =
        res?.data?.data?.bookmarked ?? !savedWorkers.includes(workerId);
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
    navigate(`/worker-profile/${worker.id || worker._id}`);
  };

  const getAvailabilityColor = (availability) => {
    switch (String(availability || '').toLowerCase()) {
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
    switch (String(availability || '').toLowerCase()) {
      case 'available':
        return 'Available';
      case 'busy':
        return 'Busy';
      case 'unavailable':
        return 'Unavailable';
      default:
        return availability || 'Status Unknown';
    }
  };

  const isWorkerAvailable = (availability) =>
    String(availability || '')
      .toLowerCase()
      .includes('available');

  // Search Statistics with null safety
  const searchStats = {
    totalWorkers: Array.isArray(workers) ? workers.length : 0,
    availableWorkers: Array.isArray(workers)
      ? workers.filter((w) => isWorkerAvailable(w?.availability)).length
      : 0,
    averageRating:
      Array.isArray(workers) && workers.length > 0
        ? (
          workers.reduce((sum, w) => sum + (w?.rating || 0), 0) /
          workers.length
        ).toFixed(1)
        : 0,
    averageRate:
      Array.isArray(workers) && workers.length > 0
        ? Math.round(
          workers.reduce((sum, w) => sum + (w?.hourlyRate || 0), 0) /
          workers.length,
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
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
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

        <Grid item xs={6} sm={6} md={3}>
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

        <Grid item xs={6} sm={6} md={3}>
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

        <Grid item xs={6} sm={6} md={3}>
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
                inputProps={{ style: { fontSize: 16 } }}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>
                  <InputLabel id="worker-sort-label">Sort By</InputLabel>
                  <Select
                    labelId="worker-sort-label"
                    value={sortOption}
                    label="Sort By"
                    onChange={handleSortChange}
                  >
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => setFilterOpen(!filterOpen)}
                  sx={{ minHeight: 44, flex: { xs: 1, sm: '0 0 auto' } }}
                >
                  Filters
                </Button>
                {(filters.skills.length > 0 ||
                  filters.location ||
                  filters.primaryTrade ||
                  filters.availability !== 'all' ||
                  sortOption !== 'relevance') && (
                    <Button
                      size="small"
                      onClick={() => {
                        setFilters({
                          skills: [],
                          minRating: 0,
                          maxRate: 100,
                          location: '',
                          availability: 'all',
                          experience: 'all',
                          primaryTrade: '',
                        });
                        setSortOption('relevance');
                        setPage(1);
                      }}
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
                    {(Array.isArray(skillOptions) ? skillOptions : []).map(
                      (skill) => (
                        <Chip
                          key={skill}
                          label={skill}
                          onClick={() => handleSkillToggle(skill)}
                          color={
                            filters.skills.includes(skill)
                              ? 'primary'
                              : 'default'
                          }
                          variant={
                            filters.skills.includes(skill)
                              ? 'filled'
                              : 'outlined'
                          }
                          size="small"
                        />
                      ),
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Trade/Specialization
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={filters.primaryTrade}
                      onChange={(e) =>
                        handleFilterChange('primaryTrade', e.target.value)
                      }
                      displayEmpty
                    >
                      <MenuItem value="">All Trades</MenuItem>
                      {tradeOptions.map((trade) => (
                        <MenuItem key={trade} value={trade}>
                          {trade}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
                      {(Array.isArray(locationOptions)
                        ? locationOptions
                        : []
                      ).map((location) => (
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
            {(Array.isArray(workers) ? workers : []).map((worker) => (
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
                      {Array.isArray(worker.skills) &&
                        worker.skills.slice(0, 3).map((skill, index) => {
                          const label =
                            typeof skill === 'string'
                              ? skill
                              : skill?.name ||
                              skill?.skillName ||
                              skill?.label ||
                              String(skill || 'Skill');
                          return (
                            <Chip
                              key={index}
                              label={label}
                              size="small"
                              variant="outlined"
                            />
                          );
                        })}
                      {Array.isArray(worker.skills) &&
                        worker.skills.length > 3 && (
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
                      {(typeof worker.bio === 'string'
                        ? worker.bio
                        : ''
                      ).substring(0, 120)}
                      {typeof worker.bio === 'string' && worker.bio.length > 120
                        ? '...'
                        : ''}
                    </Typography>

                    {/* Action Buttons */}
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                      }}
                    >
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<MessageIcon />}
                        sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 110 }, minHeight: 44 }}
                        onClick={async () => {
                          try {
                            const convo =
                              await messagingService.createDirectConversation(
                                worker.id,
                              );
                            const newId =
                              convo?.id ||
                              convo?.data?.data?.conversation?.id ||
                              convo?.data?.conversation?.id ||
                              convo?.conversation?.id ||
                              convo?.data?.id;
                            if (newId)
                              navigate(`/messages?conversation=${newId}`);
                          } catch (e) {
                            console.error('Failed to start conversation', e);
                          }
                        }}
                      >
                        Message
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        startIcon={<WorkIcon />}
                        sx={{ flexGrow: 1, minWidth: { xs: 'calc(50% - 4px)', sm: 120 }, minHeight: 44 }}
                        onClick={() =>
                          navigate(`/hirer/jobs?inviteWorker=${worker.id}`)
                        }
                      >
                        Invite to Job
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ViewIcon />}
                        sx={{ flexGrow: 1, minWidth: { xs: 'calc(50% - 4px)', sm: 110 }, minHeight: 44 }}
                        onClick={() => handleDialogOpen(worker)}
                      >
                        View Profile
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleSaveWorker(worker.id)}
                        sx={{ minWidth: 44, minHeight: 44 }}
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

      {/* Worker Details - navigates to profile page via handleDialogOpen */}
    </Box>
  );
};

export default WorkerSearch;
