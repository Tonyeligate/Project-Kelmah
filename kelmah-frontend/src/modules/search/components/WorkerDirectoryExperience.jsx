import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Box,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  FilterList as FilterListIcon,
  Map as MapIcon,
  BookmarkBorder as SavedSearchIcon,
  NotificationsActiveOutlined as JobAlertsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import PropTypes from 'prop-types';
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
import SavedSearches from '../components/SavedSearches';
import SEO from '../../common/components/common/SEO';
import { useBreakpointDown } from '@/hooks/useResponsive';

const WORKER_DIRECTORY_MAP_ENABLED =
  import.meta.env.VITE_ENABLE_WORKER_DIRECTORY_MAP === 'true';

const PageWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0, 0, 4),
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  minHeight: '100vh',
}));

const POPULAR_SEARCH_TERMS = [
  'Emergency Plumber Accra',
  'Roof Repair Kumasi',
  'Rewiring Tema',
  'AC Servicing Takoradi',
  'Cabinet Maker Cape Coast',
  'Certified Welder Tamale',
];

const normalizeWorkerRecord = (worker = {}) => {
  const id =
    worker.id ||
    worker.userId ||
    (worker._id && worker._id.toString ? worker._id.toString() : worker._id);
  const deterministicFallbackId =
    worker.email ||
    worker.phone ||
    [
      worker.name,
      worker.firstName,
      worker.lastName,
      worker.profession,
      worker.city,
    ]
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

const tokenizeSearchQuery = (query = '') =>
  Array.from(
    new Set(
      String(query)
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter((token) => token.length > 1),
    ),
  ).slice(0, 6);

const scoreWorkerTextRelevance = (worker = {}, query = '') => {
  const normalizedQuery = String(query).toLowerCase().trim();
  if (!normalizedQuery) {
    return 0;
  }

  const tokens = tokenizeSearchQuery(normalizedQuery);
  const fullName = [worker.name, worker.firstName, worker.lastName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const title = String(worker.title || worker.profession || '').toLowerCase();
  const bio = String(worker.bio || '').toLowerCase();
  const location = String(worker.location || worker.city || '').toLowerCase();
  const skills = [
    ...(Array.isArray(worker.skills) ? worker.skills : []),
    ...(Array.isArray(worker.specializations) ? worker.specializations : []),
  ]
    .map((skill) =>
      typeof skill === 'string'
        ? skill
        : skill?.name || skill?.skillName || skill?.label || '',
    )
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let score = 0;

  if (title.includes(normalizedQuery)) score += 140;
  if (skills.includes(normalizedQuery)) score += 120;
  if (fullName.includes(normalizedQuery)) score += 90;
  if (bio.includes(normalizedQuery)) score += 40;
  if (location.includes(normalizedQuery)) score += 20;

  tokens.forEach((token) => {
    if (title.includes(token)) score += 30;
    if (skills.includes(token)) score += 24;
    if (fullName.includes(token)) score += 16;
    if (bio.includes(token)) score += 8;
    if (location.includes(token)) score += 4;
  });

  return score;
};

const resolveWorkerDistance = (worker = {}) => {
  const candidates = [
    worker.distanceKm,
    worker.distance,
    worker.proximityKm,
    worker.proximity,
    worker.location?.distanceKm,
    worker.location?.distance,
  ];

  for (const value of candidates) {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue) && numericValue >= 0) {
      return numericValue;
    }
  }

  return Number.POSITIVE_INFINITY;
};

const resolveWorkerRate = (worker = {}) => {
  const rate = Number(worker.hourlyRate ?? worker.rate ?? worker.minRate);
  return Number.isFinite(rate) && rate > 0 ? rate : Number.POSITIVE_INFINITY;
};

const sortWorkerResults = (
  workers = [],
  sortOption = 'relevance',
  query = '',
) => {
  const list = [...workers];

  switch (sortOption) {
    case 'rating':
      return list.sort(
        (a, b) =>
          (b.rating || 0) - (a.rating || 0) ||
          (b.reviewCount || 0) - (a.reviewCount || 0),
      );
    case 'price':
      return list.sort((a, b) => {
        const rateDelta = resolveWorkerRate(a) - resolveWorkerRate(b);
        if (rateDelta !== 0) {
          return rateDelta;
        }

        return (b.rating || 0) - (a.rating || 0);
      });
    case 'newest':
      return list.sort((a, b) => {
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        return bTime - aTime;
      });
    case 'distance':
      return list.sort((a, b) => {
        const distanceDelta =
          resolveWorkerDistance(a) - resolveWorkerDistance(b);
        if (distanceDelta !== 0) {
          return distanceDelta;
        }

        return (b.rating || 0) - (a.rating || 0);
      });
    case 'relevance':
    default:
      return list.sort((a, b) => {
        const textDelta =
          scoreWorkerTextRelevance(b, query) -
          scoreWorkerTextRelevance(a, query);
        if (textDelta !== 0) {
          return textDelta;
        }

        return (
          (b.rankScore || 0) - (a.rankScore || 0) ||
          (b.rating || 0) - (a.rating || 0) ||
          (b.reviewCount || 0) - (a.reviewCount || 0)
        );
      });
  }
};

const WorkerDirectoryExperience = ({
  variant = 'public',
  basePath = '/find-talents',
  seoTitle = 'Find Skilled Workers | Kelmah',
  seoDescription = 'Search for skilled workers by location, skills, experience level, and more. Find carpenters, plumbers, electricians, and other professionals in Ghana.',
  showHero = variant === 'public',
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useBreakpointDown('md');
  const { enqueueSnackbar } = useSnackbar();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const canUseHirerTools =
    variant === 'hirer' && isAuthenticated && hasRole(user, ['hirer', 'admin']);
  const canUseWorkerAlertTools =
    isAuthenticated && hasRole(user, ['worker', 'admin']);

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
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showAdvancedFiltersDialog, setShowAdvancedFiltersDialog] =
    useState(false);
  const abortControllerRef = useRef(null);
  const suggestionsAbortRef = useRef(null);
  const activeSearchControllerRef = useRef(null);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
      suggestionsAbortRef.current?.abort();
      activeSearchControllerRef.current?.abort();
    },
    [],
  );

  const fetchSearchSuggestions = async (query, signal) => {
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(Boolean(String(query || '').trim()));
      return;
    }

    try {
      const suggestions = await workerService.getWorkerSearchSuggestions(
        query,
        {
          signal,
        },
      );

      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') return;
      setSearchSuggestions([]);
      setShowSuggestions(true);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchParams.keyword) {
        suggestionsAbortRef.current?.abort();
        const controller = new AbortController();
        suggestionsAbortRef.current = controller;
        fetchSearchSuggestions(searchParams.keyword, controller.signal);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
      suggestionsAbortRef.current?.abort();
    };
  }, [searchParams.keyword]);

  const executeWorkerSearch = useCallback(
    async (params = {}, { sortOption } = {}) => {
      activeSearchControllerRef.current?.abort();
      const controller = new AbortController();
      activeSearchControllerRef.current = controller;
      abortControllerRef.current = controller;
      setLoading(true);
      setError(null);

      const canUpdateState = () =>
        activeSearchControllerRef.current === controller &&
        !controller.signal.aborted;

      try {
        const result = await workerService.queryWorkerDirectory(params, {
          signal: controller.signal,
        });

        if (!canUpdateState()) {
          return;
        }

        const normalizedWorkers = result.workers.map((worker) =>
          normalizeWorkerRecord(worker),
        );
        const activeSort =
          sortOption || params.sort || sortOrder || 'relevance';
        const activeQuery =
          params.keyword ||
          params.query ||
          params.search ||
          params.keywords ||
          '';
        const sortedWorkers = sortWorkerResults(
          normalizedWorkers,
          activeSort,
          activeQuery,
        );

        setSearchResults(sortedWorkers);
        setPagination(result.pagination);
      } catch (requestError) {
        if (!canUpdateState()) {
          return;
        }

        if (
          requestError.name === 'AbortError' ||
          requestError.name === 'CanceledError'
        ) {
          return;
        }
        setError('Search could not load workers right now. Please try again.');
        setSearchResults([]);
      } finally {
        if (activeSearchControllerRef.current === controller) {
          activeSearchControllerRef.current = null;
          setLoading(false);
        }
      }
    },
    [sortOrder],
  );

  const updateSearchURL = useCallback(
    (params, sortOverride) => {
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
    },
    [basePath, location.pathname, location.search, navigate, sortOrder],
  );

  const handleMobileKeywordChange = useCallback((value) => {
    setSearchParams((prev) => ({
      ...prev,
      keyword: value,
      page: 1,
    }));
  }, []);

  const handleMobileSearchSubmit = useCallback(() => {
    const mergedParams = {
      ...searchParams,
      page: 1,
    };

    if (!mergedParams.keyword || !String(mergedParams.keyword).trim()) {
      delete mergedParams.keyword;
    }

    setSearchParams(mergedParams);
    updateSearchURL(mergedParams, mergedParams.sort || sortOrder);
  }, [searchParams, sortOrder, updateSearchURL]);

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

  const handleSortChange = (newSortOrder) => {
    if (loading) {
      return;
    }

    setSortOrder(newSortOrder);
    const newParams = { ...searchParams, sort: newSortOrder };
    setSearchParams(newParams);
    updateSearchURL(newParams, newSortOrder);
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
    if (!WORKER_DIRECTORY_MAP_ENABLED) {
      return;
    }

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

  const handleOpenFilterControls = useCallback(() => {
    if (isMobile) {
      setShowMobileFilters(true);
      return;
    }

    if (canUseHirerTools) {
      setShowAdvancedFilters(true);
      return;
    }

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [canUseHirerTools, isMobile]);

  const showResultFilterShortcut =
    isMobile || canUseHirerTools || isAuthenticated;

  const contextHeading = canUseHirerTools
    ? 'Find Talent for Your Jobs'
    : 'Find Skilled Workers in Ghana';
  const contextCopy = canUseHirerTools
    ? 'Search by trade, location, and availability to shortlist workers quickly.'
    : 'Search trusted workers by trade, location, and rate in one focused flow.';

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
      showMap={WORKER_DIRECTORY_MAP_ENABLED && showMap}
      onToggleView={WORKER_DIRECTORY_MAP_ENABLED ? handleToggleView : undefined}
      onOpenFilters={
        showResultFilterShortcut ? handleOpenFilterControls : undefined
      }
      onRetry={() =>
        executeWorkerSearch(searchParams, { sortOption: sortOrder })
      }
      onSaveWorker={handleSaveWorker}
      isPublicView={isPublicView}
    />
  );

  return (
    <PageWrapper
      sx={{
        minHeight: { xs: 'calc(100dvh - 56px)', md: 'calc(100dvh - 64px)' },
      }}
    >
      <SEO title={seoTitle} description={seoDescription} />

      <Container maxWidth="xl" sx={{ pt: 0 }}>
        {isMobile ? (
          <>
            <CompactSearchBar
              keyword={searchParams.keyword || ''}
              onKeywordChange={handleMobileKeywordChange}
              onSearchSubmit={handleMobileSearchSubmit}
              onFilterClick={() => setShowMobileFilters(true)}
              placeholder={'Try "plumber Kumasi" or "carpenter Accra"'}
            />
            <MobileFilterDrawer
              open={showMobileFilters}
              onClose={() => setShowMobileFilters(false)}
              onSearch={handleSearch}
              initialFilters={searchParams}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                mb: 1.5,
                lineHeight: 1.4,
                wordBreak: 'break-word',
              }}
            >
              Tip: Start with a trade and town first, then open filters only if
              you need to narrow results.
            </Typography>
          </>
        ) : (
          <JobSearchForm
            onSearch={handleSearch}
            initialFilters={searchParams}
          />
        )}

        <Box sx={{ mb: 2 }}>
          <Typography
            component="h1"
            variant={isMobile ? 'h5' : 'h4'}
            sx={{ fontWeight: 800, mb: 0.5 }}
          >
            {contextHeading}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {contextCopy}
          </Typography>
        </Box>

        {canUseHirerTools && !isMobile && (
          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
            <Button
              variant={showAdvancedFilters ? 'contained' : 'outlined'}
              size="small"
              startIcon={<FilterListIcon />}
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              sx={{ minWidth: 'auto', px: 2, minHeight: 44 }}
            >
              Filters
            </Button>
            <Button
              variant={showLocationSearch ? 'contained' : 'outlined'}
              size="small"
              startIcon={<MapIcon />}
              onClick={() => setShowLocationSearch((prev) => !prev)}
              sx={{ minWidth: 'auto', px: 2, minHeight: 44 }}
            >
              Nearby Search
            </Button>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', flexBasis: '100%', lineHeight: 1.4 }}
            >
              Use Filters for skills and rates, and Nearby Search to prioritize
              workers close to your selected area.
            </Typography>
          </Box>
        )}

        {isAuthenticated && (
          <Box mb={2}>
            <Box display="flex" gap={1} flexWrap="wrap">
              {!canUseHirerTools && !isMobile && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterListIcon />}
                  onClick={() => setShowAdvancedFiltersDialog(true)}
                  sx={{ minHeight: 44 }}
                >
                  Advanced Filters
                </Button>
              )}
              <Button
                variant="outlined"
                size="small"
                startIcon={<SavedSearchIcon />}
                onClick={() => setShowSavedSearches(true)}
                sx={{ minHeight: 44 }}
              >
                Saved Searches
              </Button>
              {canUseWorkerAlertTools && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<JobAlertsIcon />}
                  onClick={() => navigate('/worker/job-alerts')}
                  sx={{ minHeight: 44 }}
                >
                  Job Alerts
                </Button>
              )}
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                mt: 0.75,
                lineHeight: 1.4,
                wordBreak: 'break-word',
              }}
            >
              Save common searches so your team can rerun trusted filters in one
              tap.
            </Typography>
          </Box>
        )}

        {showSuggestions && (
          <SearchSuggestions
            suggestions={searchSuggestions}
            query={searchParams.keyword || ''}
            popularTerms={POPULAR_SEARCH_TERMS}
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
              const isMapViewActive = WORKER_DIRECTORY_MAP_ENABLED && showMap;
              const hasSidebar =
                !isMapViewActive && (showAdvancedFilters || showLocationSearch);
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
                                  ...(Array.isArray(coords) &&
                                  coords.length >= 2
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

                  {!isMapViewActive && (
                    <Grid item xs={12} md={hasSidebar ? 9 : 12}>
                      {renderResults(false)}
                    </Grid>
                  )}
                </Grid>
              );
            })()}

            {WORKER_DIRECTORY_MAP_ENABLED && showMap && (
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
              {showHero && (
                <CollapsibleHeroSection isAuthenticated={isAuthenticated} />
              )}
              {renderResults(true)}
            </Grid>
          </Grid>
        )}
      </Container>

      <Dialog
        open={showAdvancedFiltersDialog}
        onClose={() => setShowAdvancedFiltersDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          Advanced Filters
          <IconButton
            onClick={() => setShowAdvancedFiltersDialog(false)}
            aria-label="Close advanced filters dialog"
            sx={{
              width: 44,
              height: 44,
              '&:focus-visible': {
                outline: '3px solid',
                outlineColor: 'primary.main',
                outlineOffset: '2px',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <AdvancedFilters
            onFiltersChange={handleSearch}
            initialFilters={searchParams}
            showHeader={false}
            compact={isMobile}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={showSavedSearches}
        onClose={() => setShowSavedSearches(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          Saved Searches
          <IconButton
            onClick={() => setShowSavedSearches(false)}
            aria-label="Close saved searches dialog"
            sx={{
              width: 44,
              height: 44,
              '&:focus-visible': {
                outline: '3px solid',
                outlineColor: 'primary.main',
                outlineOffset: '2px',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <SavedSearches
            showHeader={false}
            onSearchSelect={(search) => {
              setShowSavedSearches(false);
              handleSearch({
                ...(search?.filters || {}),
                keyword: search?.query || search?.filters?.keyword || '',
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

WorkerDirectoryExperience.propTypes = {
  variant: PropTypes.oneOf(['public', 'hirer']),
  basePath: PropTypes.string,
  seoTitle: PropTypes.string,
  seoDescription: PropTypes.string,
  showHero: PropTypes.bool,
};

export default WorkerDirectoryExperience;
