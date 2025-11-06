import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Divider,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  useMediaQuery,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from '../../common/services/axios';
import {
  saveJobToServer,
  unsaveJobFromServer,
  selectSavedJobs,
  fetchSavedJobs,
} from '../../jobs/services/jobSlice';

// Custom components
import JobSearchForm from '../components/common/JobSearchForm';
import CompactSearchBar from '../components/common/CompactSearchBar';
import MobileFilterDrawer from '../components/common/MobileFilterDrawer';
import CollapsibleHeroSection from '../components/common/CollapsibleHeroSection';
import SearchResults from '../components/results/SearchResults';
import WorkerSearchResults from '../components/results/WorkerSearchResults';
import JobMapView from '../components/map/JobMapView';
import SearchSuggestions from '../components/suggestions/SearchSuggestions';
import SmartJobRecommendations from '../components/SmartJobRecommendations';
import AdvancedFilters from '../components/AdvancedFilters';
import LocationBasedSearch from '../components/LocationBasedSearch';
import SavedSearches from '../components/SavedSearches';
import SEO from '../../common/components/common/SEO';

// Styled components
const PageWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0, 0, 4),
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  minHeight: 'calc(100vh - 64px)',
}));

/**
 * Search Page
 * Provides advanced job search functionality with location-based filtering
 */
const SearchPage = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Get user authentication state
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const savedJobs = useSelector(selectSavedJobs) || [];
  const isHirer = user?.role === 'hirer' || user?.userType === 'hirer';

  // Search state
  const [searchParams, setSearchParams] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [sortOrder, setSortOrder] = useState('relevance');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Parse search parameters from URL on component mount
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const params = {};

    // Extract search parameters from URL
    for (const [key, value] of queryParams.entries()) {
      if (key === 'page') {
        params.page = parseInt(value, 10) || 1;
      } else if (key === 'limit') {
        params.limit = parseInt(value, 10) || 10;
      } else if (key === 'sort') {
        setSortOrder(value);
      } else if (key === 'categories' || key === 'skills') {
        params[key] = value.split(',').filter(Boolean);
      } else if (key === 'location') {
        try {
          params.location = JSON.parse(decodeURIComponent(value));
        } catch (err) {
          params.location = { address: value };
        }
      } else if (
        key === 'budgetMin' ||
        key === 'budgetMax' ||
        key === 'distance'
      ) {
        params[key] = parseFloat(value);
      } else {
        params[key] = value;
      }
    }

    setSearchParams(params);

    // Perform initial search for all users to show workers
    if (Object.keys(params).length === 0) {
      // No URL params - show all workers by default
      performSearch({ page: 1, limit: 12 });
    } else if (params.page !== pagination.page) {
      // URL params exist - perform search with those params
      performSearch(params);
    }
  }, [location.search, isAuthenticated]);

  // Fetch search suggestions when user types
  const fetchSearchSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await axios.get('/api/search/suggestions', {
        params: { query },
      });

      if (response.data.success) {
        setSearchSuggestions(response.data.data || []);
        setShowSuggestions(true);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Debounced search suggestion fetching
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchParams.keyword) {
        fetchSearchSuggestions(searchParams.keyword);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchParams.keyword]);

  // Perform search with provided parameters
  const performSearch = async (params = searchParams) => {
    console.log('🔍 performSearch called with params:', params);
    console.log('🔍 isAuthenticated:', isAuthenticated, 'isHirer:', isHirer);
    setLoading(true);
    setError(null);

    try {
      // Use consistent API endpoint for all users
      const apiEndpoint = '/workers';
      console.log('🔍 Using API endpoint:', apiEndpoint);

      // Prepare API parameters
      const apiParams = {
        page: params.page || 1,
        limit: params.limit || 10,
        sort: sortOrder,
      };

      // Add search filters
      if (params.keyword) apiParams.keyword = params.keyword;
      if (params.jobType) apiParams.jobType = params.jobType;
      if (params.experienceLevel)
        apiParams.experienceLevel = params.experienceLevel;
      if (params.budgetMin) apiParams.minBudget = params.budgetMin;
      if (params.budgetMax) apiParams.maxBudget = params.budgetMax;

      // Add categories and skills
      if (params.categories && params.categories.length > 0) {
        apiParams.categories = params.categories.join(',');
      }

      if (params.skills && params.skills.length > 0) {
        apiParams.skills = params.skills.join(',');
      }

      // Add location parameters
      if (params.location && params.location.coordinates) {
        apiParams.latitude = params.location.coordinates.latitude;
        apiParams.longitude = params.location.coordinates.longitude;
        apiParams.radius = params.distance || 50;
      }

      // Make API request to appropriate endpoint
      console.log(
        '🔍 Making API request to:',
        apiEndpoint,
        'with params:',
        apiParams,
      );
      const response = await axios.get(apiEndpoint, { params: apiParams });
      console.log('🔍 API response:', response.data);

      if (response.data && response.data.success) {
        // Unwrap standardized payloads: { data: { workers, pagination } } or { workers }
        const payload = response.data.data || response.data;
        const workers = Array.isArray(payload)
          ? payload
          : payload?.workers || payload?.results || [];
        console.log('🔍 Extracted workers:', workers);
        setSearchResults(workers);
        const paginationData =
          payload?.pagination || response.data.meta?.pagination || {};
        setPagination({
          page: paginationData.page || apiParams.page,
          limit: paginationData.limit || apiParams.limit,
          totalItems: paginationData.total || 0,
          totalPages: paginationData.totalPages || paginationData.pages || 1,
        });
      } else {
        setError(response.data.message || 'Failed to search');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setError(
        error.response?.data?.message || 'An error occurred while searching',
      );
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (filters) => {
    // Update search parameters
    const newParams = { ...filters, page: 1 };
    setSearchParams(newParams);

    // Update URL with new search parameters
    updateSearchURL(newParams);

    // Perform search
    performSearch(newParams);
  };

  // Update URL with search parameters
  const updateSearchURL = (params) => {
    const queryParams = new URLSearchParams();

    // Add all search parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        return;
      }

      if (key === 'location' && typeof value === 'object') {
        queryParams.set(key, encodeURIComponent(JSON.stringify(value)));
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          queryParams.set(key, value.join(','));
        }
      } else {
        queryParams.set(key, value.toString());
      }
    });

    // Add sort order to URL
    if (sortOrder !== 'relevance') {
      queryParams.set('sort', sortOrder);
    }

    // Update URL with new search parameters
    navigate(
      {
        pathname: '/search',
        search: queryParams.toString(),
      },
      { replace: true },
    );
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    const newParams = { ...searchParams, page: newPage };
    setSearchParams(newParams);
    updateSearchURL(newParams);
    performSearch(newParams);
  };

  // Handle sort order change
  const handleSortChange = (newSortOrder) => {
    setSortOrder(newSortOrder);

    // Update URL and perform search with new sort order
    const newParams = { ...searchParams };
    updateSearchURL(newParams);
    performSearch(newParams);
  };

  // Handle filter removal
  const handleRemoveFilter = (filterKey, filterValue) => {
    const newParams = { ...searchParams };

    if (filterKey === 'all') {
      // Clear all filters
      Object.keys(newParams).forEach((key) => {
        if (key !== 'page' && key !== 'limit') {
          delete newParams[key];
        }
      });
      newParams.page = 1;
    } else if (filterKey === 'categories' || filterKey === 'skills') {
      // Remove specific category or skill
      if (newParams[filterKey] && Array.isArray(newParams[filterKey])) {
        newParams[filterKey] = newParams[filterKey].filter(
          (item) => item !== filterValue,
        );

        if (newParams[filterKey].length === 0) {
          delete newParams[filterKey];
        }
      } else {
        delete newParams[filterKey];
      }
    } else if (filterKey === 'budget') {
      // Clear budget filters
      delete newParams.budgetMin;
      delete newParams.budgetMax;
    } else if (filterKey === 'location') {
      // Clear location filters
      delete newParams.location;
      delete newParams.distance;
    } else {
      // Clear specific filter
      delete newParams[filterKey];
    }

    // Reset to first page
    newParams.page = 1;

    // Update state and URL
    setSearchParams(newParams);
    updateSearchURL(newParams);
    performSearch(newParams);
  };

  // Toggle between list and map view
  const handleToggleView = () => {
    setShowMap(!showMap);
  };

  // Handle job saving
  const handleSaveJob = async (jobId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    try {
      const isCurrentlySaved = savedJobs.some(
        (saved) => saved.id === jobId || saved._id === jobId,
      );

      if (isCurrentlySaved) {
        await dispatch(unsaveJobFromServer(jobId));
      } else {
        await dispatch(saveJobToServer(jobId));
      }

      // Refresh saved jobs list
      await dispatch(fetchSavedJobs());
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  // Handle worker saving
  const handleSaveWorker = async (worker) => {
    try {
      await axios.post(
        `/api/workers/${worker.id}/save`,
        {},
        {
          headers: await (async () => {
            try {
              const { secureStorage } = await import(
                '../../../utils/secureStorage'
              );
              const token = secureStorage.getAuthToken();
              return token ? { Authorization: `Bearer ${token}` } : {};
            } catch {
              return {};
            }
          })(),
        },
      );

      // Update saved status in results
      setSearchResults((prevResults) =>
        prevResults.map((w) =>
          w.id === worker.id ? { ...w, isSaved: true } : w,
        ),
      );
    } catch (error) {
      console.error('Error saving worker:', error);

      // Check if error is due to authentication
      if (error.response?.status === 401) {
        navigate('/login', {
          state: {
            from: location,
            message: 'Please log in to save workers',
          },
        });
      }
    }
  };

  return (
    <PageWrapper>
      <SEO
        title="Job Search | Find Your Perfect Match"
        description="Search for jobs by location, skills, experience level, and more. Find your perfect match with our advanced job search tools."
      />

      <Container maxWidth="lg" sx={{ pt: 0 }}>
        {/* Search Form - Responsive: Compact on mobile, full on desktop */}
        {isMobile ? (
          <>
            <CompactSearchBar
              onSearchClick={() => performSearch(searchParams)}
              onFilterClick={() => setShowMobileFilters(true)}
              placeholder="Search skilled workers in Ghana..."
            />
            <MobileFilterDrawer
              open={showMobileFilters}
              onClose={() => setShowMobileFilters(false)}
              onSearch={handleSearch}
              initialFilters={searchParams}
            />
          </>
        ) : (
          <JobSearchForm onSearch={handleSearch} initialFilters={searchParams} />
        )}

        {/* Quick Actions - Show only for authenticated hirers */}
        {isAuthenticated && isHirer && (
          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
            <Button
              variant={showAdvancedFilters ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              Filters
            </Button>
            <Button
              variant={showLocationSearch ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setShowLocationSearch(!showLocationSearch)}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              Map
            </Button>
            <Button
              variant={showRecommendations ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setShowRecommendations(!showRecommendations)}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              Suggestions
            </Button>
          </Box>
        )}

        {/* Search Suggestions */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <SearchSuggestions
            suggestions={searchSuggestions}
            onSuggestionSelected={(suggestion) => {
              setShowSuggestions(false);
              if (suggestion.type === 'location' && suggestion.data) {
                handleSearch({
                  ...searchParams,
                  location: suggestion.data,
                });
              } else {
                handleSearch({
                  ...searchParams,
                  keyword: suggestion.text,
                });
              }
            }}
            onClose={() => setShowSuggestions(false)}
          />
        )}

        {/* Advanced Components - Only for authenticated hirers */}
        {isAuthenticated && isHirer && (
          <Grid container spacing={2}>
            {/* Left Column - Search Tools */}
            <Grid item xs={12} md={showMap ? 12 : 4}>
              {/* Smart Recommendations */}
              {showRecommendations && (
                <Box mb={2}>
                  <SmartJobRecommendations
                    maxRecommendations={3}
                    showHeader={true}
                    compact={true}
                    onJobSelect={(jobId, action) => {
                      if (action === 'view') {
                        navigate(`/jobs/${jobId}`);
                      }
                    }}
                    filterCriteria={searchParams}
                  />
                </Box>
              )}

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <Box mb={2}>
                  <AdvancedFilters
                    onFiltersChange={handleSearch}
                    initialFilters={searchParams}
                    compact={isMobile}
                  />
                </Box>
              )}

              {/* Location Search */}
              {showLocationSearch && (
                <Box mb={2}>
                  <LocationBasedSearch
                    onLocationSelect={(location, radius) => {
                      handleSearch({
                        ...searchParams,
                        location: {
                          address: location.name,
                          coordinates: {
                            latitude: location.coordinates[0],
                            longitude: location.coordinates[1],
                          },
                        },
                        distance: radius,
                      });
                    }}
                    initialLocation={searchParams.location}
                    radius={searchParams.distance || 10}
                    compact={isMobile}
                  />
                </Box>
              )}
            </Grid>

            {/* Right Column - Search Results */}
            {!showMap && (
              <Grid item xs={12} md={8}>
                <WorkerSearchResults
                  workers={searchResults}
                  loading={loading}
                  error={error}
                  filters={searchParams}
                  onRemoveFilter={handleRemoveFilter}
                  onSortChange={handleSortChange}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  showMap={showMap}
                  onToggleView={handleToggleView}
                  onSaveWorker={handleSaveWorker}
                />
              </Grid>
            )}
          </Grid>
        )}

        {/* Public User Results - Full Width */}
        {!isAuthenticated && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              {/* Collapsible Hero Section - Optimized for Mobile */}
              <CollapsibleHeroSection isAuthenticated={isAuthenticated} />

              <WorkerSearchResults
                workers={searchResults}
                loading={loading}
                error={error}
                filters={searchParams}
                onRemoveFilter={handleRemoveFilter}
                onSortChange={handleSortChange}
                pagination={pagination}
                onPageChange={handlePageChange}
                showMap={false}
                onToggleView={handleToggleView}
                onSaveWorker={handleSaveWorker}
                isPublicView={true}
              />
            </Grid>
          </Grid>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Map View (Full Width) - Only for authenticated hirers */}
        {isAuthenticated && isHirer && showMap && (
          <JobMapView
            jobs={searchResults}
            centerLocation={searchParams.location?.coordinates || null}
            radius={searchParams.distance || 50}
            loading={loading}
            onToggleView={handleToggleView}
          />
        )}
      </Container>
    </PageWrapper>
  );
};

export default SearchPage;
