import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Box,
  Grid,
  Button,
  Alert,
  useMediaQuery,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { api } from '../../../services/apiClient';
import { secureStorage } from '../../../utils/secureStorage';

// Custom components
import JobSearchForm from '../components/common/JobSearchForm';
import CompactSearchBar from '../components/common/CompactSearchBar';
import MobileFilterDrawer from '../components/common/MobileFilterDrawer';
import CollapsibleHeroSection from '../components/common/CollapsibleHeroSection';
import WorkerSearchResults from '../components/results/WorkerSearchResults';
import JobMapView from '../components/map/JobMapView';
import SearchSuggestions from '../components/suggestions/SearchSuggestions';
import SmartJobRecommendations from '../components/SmartJobRecommendations';
import AdvancedFilters from '../components/AdvancedFilters';
import LocationBasedSearch from '../components/LocationBasedSearch';
import SEO from '../../common/components/common/SEO';

// Styled components
const PageWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0, 0, 4),
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  minHeight: 'calc(100dvh - 64px)',
}));

const extractLocationString = (location) => {
  if (!location) {
    return '';
  }

  if (typeof location === 'string') {
    return location;
  }

  if (typeof location === 'object') {
    return (
      location.address || location.city || location.name || location.label || ''
    );
  }

  return '';
};

const normalizeWorkerRecord = (worker = {}) => {
  const id =
    worker.id ||
    worker.userId ||
    (worker._id && worker._id.toString ? worker._id.toString() : worker._id);

  const skillsArray = Array.isArray(worker.skills)
    ? worker.skills.map((skill) =>
      typeof skill === 'string'
        ? skill
        : skill?.name || skill?.skillName || skill?.label || String(skill),
    )
    : Array.isArray(worker.specializations)
      ? worker.specializations.filter(Boolean)
      : [];

  return {
    id: id || `worker-${crypto.randomUUID()}`,
    userId: id || worker.userId,
    name:
      worker.name ||
      [worker.firstName, worker.lastName].filter(Boolean).join(' ') ||
      'Skilled Worker',
    title:
      worker.title ||
      worker.profession ||
      (Array.isArray(worker.specializations)
        ? worker.specializations[0]
        : '') ||
      'Professional Worker',
    location: worker.location || worker.city || 'Ghana',
    rating: Number(worker.rating ?? worker.averageRating ?? 0),
    reviewCount: worker.reviewCount ?? worker.totalReviews ?? 0,
    hourlyRate: Number(worker.hourlyRate ?? worker.rate ?? worker.minRate ?? 0),
    bio:
      worker.bio ||
      'Experienced professional delivering quality craftsmanship and reliable service.',
    skills: skillsArray,
    availabilityStatus:
      worker.availabilityStatus || worker.availability || 'available',
    profileImage:
      worker.profilePicture || worker.avatar || worker.profileImage || null,
    createdAt: worker.createdAt || null,
    updatedAt: worker.updatedAt || null,
    rankScore: Number(worker.rankScore ?? 0),
  };
};

const sortWorkerResults = (workers = [], sortOption = 'relevance') => {
  const list = [...workers];

  switch (sortOption) {
    case 'rating':
      return list.sort(
        (a, b) =>
          (b.rating || 0) - (a.rating || 0) ||
          (b.reviewCount || 0) - (a.reviewCount || 0),
      );
    case 'price':
      return list.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
    case 'newest':
      return list.sort((a, b) => {
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        return bTime - aTime;
      });
    case 'distance':
      // Distance sorting requires geo coordinates; retain current order for now
      return list;
    case 'relevance':
    default:
      return list.sort((a, b) => (b.rankScore || 0) - (a.rankScore || 0));
  }
};

const buildWorkerQueryParams = (params = {}) => {
  const query = {
    page: params.page || 1,
    limit: params.limit || 12,
  };

  const keyword =
    params.keyword ||
    params.query ||
    params.search ||
    params.workNeeded ||
    params.keywords;
  if (keyword) {
    query.keywords = keyword;
  }

  const locationValue = extractLocationString(params.location);
  if (locationValue) {
    query.city = locationValue.split(',')[0].trim();
  }

  if (params.location && params.location.coordinates) {
    const { coordinates } = params.location;
    const latitude = coordinates.latitude ?? coordinates[0];
    const longitude = coordinates.longitude ?? coordinates[1];

    if (latitude !== undefined && longitude !== undefined) {
      query.latitude = latitude;
      query.longitude = longitude;
      if (params.distance) {
        query.radius = params.distance;
      }
    }
  }

  const trade = params.trade || params.category || params.primaryTrade;
  if (trade) {
    query.primaryTrade = trade;
  }

  const jobType = params.jobType || params.workType || params.type;
  if (jobType) {
    query.workType = jobType;
  }

  const skills = params.skills || params.skill;
  if (Array.isArray(skills) && skills.length > 0) {
    query.skills = skills.join(',');
  } else if (typeof skills === 'string' && skills) {
    query.skills = skills;
  }

  const minRating = params.minRating || params.rating || params.minimumRating;
  if (minRating) {
    query.rating = minRating;
  }

  const maxRate = params.budgetMax || params.maxRate;
  if (maxRate) {
    query.maxRate = maxRate;
  }

  const availability = params.availability;
  if (availability) {
    query.availability = availability;
  }

  if (params.verifiedOnly) {
    query.verified = 'true';
  }

  return query;
};

/**
 * Search Page
 * Provides advanced job search functionality with location-based filtering
 */
const SearchPage = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Debug logging for navigation issues
  useEffect(() => {
    if (!import.meta.env.DEV) {
      return undefined;
    }

    console.log('🟢 SearchPage MOUNTED');
    console.log('🟢 location.pathname:', location.pathname);
    return () => {
      console.log('🔴 SearchPage UNMOUNTED');
    };
  }, []);

  // Get user authentication state
  const { user, isAuthenticated } = useSelector((state) => state.auth);
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
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Ref for aborting stale search requests
  const abortControllerRef = useRef(null);

  // Fetch search suggestions when user types
  const fetchSearchSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await api.get('/jobs/suggestions', {
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

  const executeWorkerSearch = useCallback(
    async (params = {}, { sortOption } = {}) => {
      // Cancel any in-flight search request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const apiEndpoint = '/workers';
      const apiParams = buildWorkerQueryParams(params);

      console.log('🔍 executeWorkerSearch - params:', params);
      console.log('🔍 executeWorkerSearch - query:', apiParams);

      setLoading(true);
      setError(null);

      try {
        const response = await api.get(apiEndpoint, {
          params: apiParams,
          signal: controller.signal,
        });
        console.log('🔍 API response:', response.data);

        if (!response.data || !response.data.success) {
          const message =
            response.data?.message || 'Failed to fetch worker search results';
          throw new Error(message);
        }

        const payload = response.data.data || response.data;
        const rawWorkers = Array.isArray(payload)
          ? payload
          : payload?.workers || payload?.results || [];

        const normalizedWorkers = rawWorkers.map((worker) =>
          normalizeWorkerRecord(worker),
        );

        const activeSort =
          sortOption || params.sort || sortOrder || 'relevance';
        const sortedWorkers = sortWorkerResults(normalizedWorkers, activeSort);

        setSearchResults(sortedWorkers);

        const paginationData =
          payload?.pagination || response.data.meta?.pagination || {};
        const totalItems =
          paginationData.totalWorkers ||
          paginationData.totalItems ||
          paginationData.total ||
          sortedWorkers.length;
        const perPage = paginationData.limit || apiParams.limit || 12;
        const totalPages =
          paginationData.totalPages ||
          paginationData.pages ||
          Math.max(1, Math.ceil(totalItems / perPage));

        setPagination({
          page:
            paginationData.currentPage ||
            paginationData.page ||
            apiParams.page ||
            1,
          limit: perPage,
          totalItems,
          totalPages,
          total: totalItems,
        });
      } catch (error) {
        // Ignore aborted requests (superseded by a newer search)
        if (error.name === 'AbortError' || error.name === 'CanceledError') return;
        console.error('Error searching:', error);
        setError(error.message || 'An error occurred while searching');
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    [sortOrder],
  );

  // Perform search with provided parameters
  const performSearch = useCallback(
    async (params) => {
      await executeWorkerSearch(params, {});
    },
    [executeWorkerSearch],
  );

  // Parse search parameters from URL on component mount
  useEffect(() => {
    // Guard: only run when we are still on a search route
    const currentPath = location.pathname || '';
    if (!currentPath.startsWith('/find-talents') && !currentPath.startsWith('/search')) {
      return;
    }

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
        params.sort = value;
      } else if (key === 'categories' || key === 'skills') {
        params[key] = value.split(',').filter(Boolean);
      } else if (key === 'location') {
        let decodedValue = value?.trim?.() ?? value;

        // Support legacy/double-encoded values (%7B...%7D or %257B...%257D)
        try {
          decodedValue = decodeURIComponent(decodedValue);
        } catch (_) {
          // Ignore decode failures; keep raw string
        }
        if (
          decodedValue &&
          decodedValue.startsWith('{') &&
          decodedValue.endsWith('}')
        ) {
          try {
            params.location = JSON.parse(decodedValue);
          } catch (error) {
            console.error('Failed to parse location from URL:', error);
            params.location = decodedValue;
          }
        } else {
          params.location = decodedValue;
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

    if (Object.keys(params).length === 0) {
      performSearch({ page: 1, limit: 12 });
    } else {
      performSearch(params);
    }
  }, [location.search, isAuthenticated, performSearch]);

  // Handle search form submission
  const handleSearch = (filters) => {
    const nextSort = filters.sort || searchParams.sort || sortOrder;

    const normalizedParams = {
      ...searchParams,
      ...filters,
      trade:
        filters.trade ||
        filters.category ||
        searchParams.trade ||
        searchParams.category ||
        filters.primaryTrade ||
        '',
      category: filters.category || filters.trade || filters.primaryTrade || '',
    };

    if (!normalizedParams.trade) {
      delete normalizedParams.trade;
    }
    if (!normalizedParams.category) {
      delete normalizedParams.category;
    }

    const newParams = {
      ...normalizedParams,
      page: 1,
      sort: nextSort,
    };

    if (nextSort !== sortOrder) {
      setSortOrder(nextSort);
    }

    const sanitizedParams = Object.entries(newParams).reduce(
      (acc, [key, value]) => {
        if (value === null || value === undefined) {
          return acc;
        }

        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed === '') {
            return acc;
          }
          acc[key] = trimmed;
          return acc;
        }

        if (Array.isArray(value)) {
          if (value.length === 0) {
            return acc;
          }
          acc[key] = value;
          return acc;
        }

        acc[key] = value;
        return acc;
      },
      {},
    );

    // Preserve explicit sort order even if "relevance"
    sanitizedParams.sort = nextSort;
    sanitizedParams.page = 1;

    setSearchParams(sanitizedParams);

    updateSearchURL(sanitizedParams, nextSort);

    performSearch(sanitizedParams);
  };

  // Update URL with search parameters
  const updateSearchURL = (params, sortOverride) => {
    const queryParams = new URLSearchParams();

    // Add all search parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        return;
      }

      if (key === 'location' && typeof value === 'object') {
        // URLSearchParams will encode as needed; avoid double-encoding.
        queryParams.set(key, JSON.stringify(value));
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          queryParams.set(key, value.join(','));
        }
      } else {
        queryParams.set(key, value.toString());
      }
    });

    // Add sort order to URL
    const effectiveSort = sortOverride || params.sort || sortOrder;
    if (effectiveSort && effectiveSort !== 'relevance') {
      queryParams.set('sort', effectiveSort);
    } else if (effectiveSort === 'relevance') {
      queryParams.delete('sort');
    }

    // Update URL with new search parameters only when we are on a search route.
    const currentPath = location.pathname || '';
    const isSearchContext =
      currentPath.startsWith('/find-talents') ||
      currentPath.startsWith('/search');

    if (!isSearchContext) {
      // Guard against in-flight search effects forcing navigation when the
      // user has already moved to a different page (e.g. worker profile).
      return;
    }

    const targetPath = currentPath.startsWith('/find-talents')
      ? currentPath
      : currentPath.startsWith('/search')
        ? currentPath
        : '/find-talents';

    const nextSearch = queryParams.toString();
    const currentSearch = (location.search || '').replace(/^[?]/, '');

    if (targetPath === currentPath && nextSearch === currentSearch) {
      return;
    }

    navigate(
      {
        pathname: targetPath,
        search: nextSearch,
      },
      { replace: true },
    );
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    const newParams = { ...searchParams, page: newPage };
    setSearchParams(newParams);
    updateSearchURL(newParams, newParams.sort || sortOrder);
    performSearch(newParams);
  };

  // Handle sort order change
  const handleSortChange = (newSortOrder) => {
    console.log('🔄 Sort changed to:', newSortOrder);
    setSortOrder(newSortOrder);

    // ✅ FIX: Preserve all search params when sorting
    const newParams = { ...searchParams, sort: newSortOrder };

    // Update stored params for downstream consumers
    setSearchParams(newParams);

    // Update URL with new sort order
    updateSearchURL(newParams, newSortOrder);

    // Perform search with preserved params AND new sort order
    performSearchWithSort(newParams, newSortOrder);
  };

  // Helper function to perform search with explicit sort order
  const performSearchWithSort = async (params, sort) => {
    console.log(
      '🔍 performSearchWithSort called with params:',
      params,
      'sort:',
      sort,
    );
    await executeWorkerSearch(params, { sortOption: sort });
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
      newParams.sort = 'relevance';
      setSortOrder('relevance');
    } else if (filterKey === 'keyword') {
      delete newParams.keyword;
      delete newParams.query;
      newParams.page = 1;
    } else if (filterKey === 'location') {
      delete newParams.location;
      delete newParams.distance;
      newParams.page = 1;
    } else if (filterKey === 'jobType') {
      delete newParams.jobType;
      delete newParams.workType;
      newParams.page = 1;
    } else if (filterKey === 'trade' || filterKey === 'category') {
      delete newParams.trade;
      delete newParams.category;
      delete newParams.primaryTrade;
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
    } else if (filterKey) {
      delete newParams[filterKey];
    }

    // Reset to first page
    newParams.page = 1;

    // Update state and URL
    setSearchParams(newParams);
    updateSearchURL(newParams, newParams.sort || sortOrder);
    performSearch(newParams);
  };

  // Toggle between list and map view
  const handleToggleView = () => {
    setShowMap(!showMap);
  };

  // Handle worker saving
  const handleSaveWorker = async (worker) => {
    try {
      await api.post(`/workers/${worker.id}/save`, {});

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
          <JobSearchForm
            onSearch={handleSearch}
            initialFilters={searchParams}
          />
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
        {(!isAuthenticated || (isAuthenticated && !isHirer)) && (
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
