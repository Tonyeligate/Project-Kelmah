import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Box,
  Grid,
  Button,
  useMediaQuery,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
  FilterList as FilterListIcon,
  Map as MapIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { api } from '../../../services/apiClient';
import { hasRole } from '../../../utils/userUtils';
import workerService from '../../worker/services/workerService';
import JobSearchForm from '../components/common/JobSearchForm';
import CompactSearchBar from '../components/common/CompactSearchBar';
import MobileFilterDrawer from '../components/common/MobileFilterDrawer';
import CollapsibleHeroSection from '../components/common/CollapsibleHeroSection';
import WorkerSearchResults from '../components/results/WorkerSearchResults';
import JobMapView from '../components/map/JobMapView';
import SearchSuggestions from '../components/suggestions/SearchSuggestions';
import AdvancedFilters from '../components/AdvancedFilters';
import LocationBasedSearch from '../components/LocationBasedSearch';
import SEO from '../../common/components/common/SEO';

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
  const deterministicFallbackId =
    worker.email ||
    worker.phone ||
    [worker.name, worker.firstName, worker.lastName, worker.profession, worker.city]
      .filter(Boolean)
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') ||
    'worker-record';

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
    id: id || `worker-${deterministicFallbackId}`,
    userId: id || worker.userId,
    name:
      worker.name ||
      [worker.firstName, worker.lastName].filter(Boolean).join(' ') ||
      'Skilled Worker',
    title:
      worker.title ||
      worker.profession ||
      (Array.isArray(worker.specializations) ? worker.specializations[0] : '') ||
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

const WorkerDirectoryExperience = ({
  variant = 'public',
  basePath = '/find-talents',
  seoTitle = 'Find Skilled Workers | Kelmah',
  seoDescription = 'Search for skilled workers by location, skills, experience level, and more. Find carpenters, plumbers, electricians, and other professionals in Ghana.',
  showHero = variant === 'public',
}) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const canUseHirerTools =
    variant === 'hirer' && isAuthenticated && hasRole(user, ['hirer', 'admin']);

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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const abortControllerRef = useRef(null);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  const fetchSearchSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await api.get('/users/workers/suggest', {
        params: { query },
      });

      if (response.data?.success) {
        setSearchSuggestions(response.data.data || []);
        setShowSuggestions(true);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    } catch {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchParams.keyword) {
        fetchSearchSuggestions(searchParams.keyword);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchParams.keyword]);

  const executeWorkerSearch = useCallback(
    async (params = {}, { sortOption } = {}) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const apiParams = buildWorkerQueryParams(params);
      setLoading(true);
      setError(null);

      try {
        const response = await api.get('/users/workers', {
          params: apiParams,
          signal: controller.signal,
        });

        if (!response.data || !response.data.success) {
          throw new Error(
            response.data?.message || 'Failed to fetch worker search results',
          );
        }

        const payload = response.data.data || response.data;
        const rawWorkers = Array.isArray(payload)
          ? payload
          : payload?.workers || payload?.results || [];
        const normalizedWorkers = rawWorkers.map((worker) =>
          normalizeWorkerRecord(worker),
        );
        const activeSort = sortOption || params.sort || sortOrder || 'relevance';
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
      } catch (requestError) {
        if (
          requestError.name === 'AbortError' ||
          requestError.name === 'CanceledError'
        ) {
          return;
        }
        setError('Search did not work. Please try again.');
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    [sortOrder],
  );

  const performSearch = useCallback(
    async (params) => {
      await executeWorkerSearch(params, {});
    },
    [executeWorkerSearch],
  );

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const params = {};

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
        try {
          decodedValue = decodeURIComponent(decodedValue);
        } catch {
          // Ignore decode failures.
        }
        if (
          decodedValue &&
          decodedValue.startsWith('{') &&
          decodedValue.endsWith('}')
        ) {
          try {
            params.location = JSON.parse(decodedValue);
          } catch {
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
  }, [location.search, performSearch]);

  const updateSearchURL = (params, sortOverride) => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        return;
      }

      if (key === 'location' && typeof value === 'object') {
        queryParams.set(key, JSON.stringify(value));
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          queryParams.set(key, value.join(','));
        }
      } else {
        queryParams.set(key, value.toString());
      }
    });

    const effectiveSort = sortOverride || params.sort || sortOrder;
    if (effectiveSort && effectiveSort !== 'relevance') {
      queryParams.set('sort', effectiveSort);
    } else {
      queryParams.delete('sort');
    }

    const nextSearch = queryParams.toString();
    const currentSearch = (location.search || '').replace(/^[?]/, '');

    if (location.pathname === basePath && nextSearch === currentSearch) {
      return;
    }

    navigate(
      {
        pathname: basePath,
        search: nextSearch,
      },
      { replace: true },
    );
  };

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
          if (!trimmed) {
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

    sanitizedParams.sort = nextSort;
    sanitizedParams.page = 1;
    setSearchParams(sanitizedParams);
    updateSearchURL(sanitizedParams, nextSort);
  };

  const handlePageChange = (newPage) => {
    const newParams = { ...searchParams, page: newPage };
    setSearchParams(newParams);
    updateSearchURL(newParams, newParams.sort || sortOrder);
  };

  const performSearchWithSort = async (params, sort) => {
    await executeWorkerSearch(params, { sortOption: sort });
  };

  const handleSortChange = (newSortOrder) => {
    setSortOrder(newSortOrder);
    const newParams = { ...searchParams, sort: newSortOrder };
    setSearchParams(newParams);
    updateSearchURL(newParams, newSortOrder);
    performSearchWithSort(newParams, newSortOrder);
  };

  const handleRemoveFilter = (filterKey, filterValue) => {
    const newParams = { ...searchParams };

    if (filterKey === 'all') {
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
      delete newParams.budgetMin;
      delete newParams.budgetMax;
    } else if (filterKey) {
      delete newParams[filterKey];
    }

    newParams.page = 1;
    setSearchParams(newParams);
    updateSearchURL(newParams, newParams.sort || sortOrder);
  };

  const handleToggleView = () => {
    setShowMap((prev) => !prev);
  };

  const handleSaveWorker = async (worker) => {
    try {
      await workerService.bookmarkWorker(worker.id);
      setSearchResults((prevResults) =>
        prevResults.map((entry) =>
          entry.id === worker.id ? { ...entry, isSaved: true } : entry,
        ),
      );
      enqueueSnackbar('Worker saved to bookmarks', { variant: 'success' });
    } catch (saveError) {
      enqueueSnackbar('Failed to save worker', { variant: 'error' });
      if (saveError.response?.status === 401) {
        navigate('/login', {
          state: {
            from: location,
            message: 'Please log in to save workers',
          },
        });
      }
    }
  };

  const renderResults = (isPublicView = false) => (
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
      isPublicView={isPublicView}
    />
  );

  return (
    <PageWrapper>
      <SEO title={seoTitle} description={seoDescription} />

      <Container maxWidth="xl" sx={{ pt: 0 }}>
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

        {canUseHirerTools && (
          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
            <Button
              variant={showAdvancedFilters ? 'contained' : 'outlined'}
              size="small"
              startIcon={<FilterListIcon />}
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              aria-label="Show or hide filters"
              sx={{ minWidth: 'auto', px: 2, minHeight: 44 }}
            >
              Filters
            </Button>
            <Button
              variant={showLocationSearch ? 'contained' : 'outlined'}
              size="small"
              startIcon={<MapIcon />}
              onClick={() => setShowLocationSearch((prev) => !prev)}
              aria-label="Show or hide map view"
              sx={{ minWidth: 'auto', px: 2, minHeight: 44 }}
            >
              Nearby
            </Button>
          </Box>
        )}

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

        {canUseHirerTools ? (
          <>
            {(() => {
              const hasSidebar =
                !showMap && (showAdvancedFilters || showLocationSearch);
              return (
                <Grid container spacing={2}>
                  {hasSidebar && (
                    <Grid item xs={12} md={3}>
                      {showAdvancedFilters && (
                        <Box mb={2}>
                          <AdvancedFilters
                            onFiltersChange={handleSearch}
                            initialFilters={searchParams}
                            compact={isMobile}
                          />
                        </Box>
                      )}

                      {showLocationSearch && (
                        <Box mb={2}>
                          <LocationBasedSearch
                            onLocationSelect={(selectedLocation, radius) => {
                              const coords = selectedLocation?.coordinates;
                              handleSearch({
                                ...searchParams,
                                location: {
                                  address: selectedLocation?.name || '',
                                  ...(Array.isArray(coords) && coords.length >= 2
                                    ? {
                                        coordinates: {
                                          latitude: coords[0],
                                          longitude: coords[1],
                                        },
                                      }
                                    : {}),
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
                  )}

                  {!showMap && (
                    <Grid item xs={12} md={hasSidebar ? 9 : 12}>
                      {renderResults(false)}
                    </Grid>
                  )}
                </Grid>
              );
            })()}

            {showMap && (
              <JobMapView
                jobs={searchResults}
                centerLocation={searchParams.location?.coordinates || null}
                radius={searchParams.distance || 50}
                loading={loading}
                onToggleView={handleToggleView}
              />
            )}
          </>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              {showHero && <CollapsibleHeroSection isAuthenticated={isAuthenticated} />}
              {renderResults(true)}
            </Grid>
          </Grid>
        )}
      </Container>
    </PageWrapper>
  );
};

export default WorkerDirectoryExperience;
