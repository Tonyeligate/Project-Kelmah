/**
 * JobsPage - Main Jobs Listing Page
 *
 * DATA FLOW MAP:
 * ================================================================================
 *
 * 1. JOB LISTINGS FETCH
 *    UI Component: JobsPage.jsx (this file)
 *    ↓
 *    Service: jobsService.getJobs()
 *    Location: kelmah-frontend/src/modules/jobs/services/jobsService.js
 *    ↓
 *    API Call: GET /api/jobs?status=open&category={}&location={}&search={}
 *    Backend: kelmah-backend/services/job-service/routes/jobRoutes.js
 *    ↓
 *    Response: { success: true, items: [...], total: 12, page: 1 }
 *    ↓
 *    Transform: transformJobListItem() - handles employer data mapping
 *    ↓
 *    State Update: setJobs(transformedData)
 *    ↓
 *    UI Render: Job cards displayed with employer info, badges, filters
 *
 * 2. SEARCH/FILTER FLOW
 *    User Input: SearchFilters component (search bar, dropdowns)
 *    ↓
 *    State: searchQuery, selectedCategory, selectedLocation
 *    ↓
 *    useEffect: Triggers API refetch when filters change
 *    ↓
 *    Re-renders: filteredJobs → uniqueJobs (deduplicated) → UI
 *
 * 3. JOB CARD CLICK
 *    User Action: Click on job card
 *    ↓
 *    Navigation: navigate(`/jobs/${job._id}`)
 *    ↓
 *    Route: /jobs/:id → JobDetailsPage.jsx
 *
 * 4. APPLY BUTTON CLICK
 *    User Action: Click "Apply Now"
 *    ↓
 *    Auth Check: useAuthCheck() hook
 *    ↓
 *    If not authenticated: navigate('/login', { state: { from, message } })
 *    If authenticated: navigate(`/jobs/${job._id || job.id}/apply`)
 *    ↓
 *    Route: /jobs/:id/apply → JobApplicationForm.jsx
 *
 * EMPLOYER DATA HANDLING:
 * ================================================================================
 * Backend: getJobs() manually populates hirer via direct MongoDB driver query
 *   (firstName, lastName, profileImage, avatar, verified, isVerified, rating, email)
 * Frontend: transformJobListItem() handles multiple fallbacks:
 *   1. Full hirer object (preferred — returned by backend populate)
 *   2. hirer_name string
 *   3. company/companyName fields
 *   4. Fallback: "Employer Name Pending" with _isFallback + _needsAdminReview flags
 *
 */

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { hasRole } from '../../../utils/userUtils';
// JobResultsSection removed — cards are rendered inline below
import JobsCardsGrid from '../components/JobsCardsGrid';
import JobsCompactSearchBar from '../components/JobsCompactSearchBar';
import JobsMobileFilterDrawer from '../components/JobsMobileFilterDrawer';
import DiscoveryShellFrame from '../components/DiscoveryShellFrame';
import tradeCategoriesData from '../data/tradeCategories.json';
import ghanaLocations from '../data/ghanaLocations.json';
import { useJobsQuery } from '../hooks/useJobsQuery';
import jobsApi from '../services/jobsService';
import { getSortedUniqueJobs } from '../utils/jobListUtils';
import PageCanvas from '@/modules/common/components/PageCanvas';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Skeleton,
  Pagination,
  Drawer,
  IconButton,
  useTheme,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  Stack,
  Rating,
  Divider,
  alpha,
  Grow,
  Collapse,
  Fab,
  Badge,
  Slider,
  Switch,
  FormControlLabel,
  Tooltip,
  ButtonBase,
  LinearProgress,
  Autocomplete,
  InputAdornment,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  ToggleButton,
  ToggleButtonGroup,
  Zoom,
  Fade,
  Slide,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CardMedia,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link,
  Snackbar,
} from '@mui/material';
// Core icons loaded immediately for first paint
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Work as WorkIcon,
  CheckCircle,
  Group,
  Star,
  LocationOn,
  MonetizationOn,
  Verified,
  ElectricalServices as ElectricalIcon,
  Plumbing as PlumbingIcon,
  Construction as ConstructionIcon,
  Thermostat as HvacIcon,
  Handyman as CarpenterIcon,
  FormatPaint as PaintingIcon,
  Hardware as WeldingIcon,
  Layers as MasonryIcon,
  Roofing as RoofingIcon,
  GridOn as FlooringIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  FlashOn as FlashOnIcon,
  LocalFireDepartment as FireIcon,
  Visibility,
  BookmarkBorder,
  Bookmark as BookmarkFilledIcon,
  Share,
  Refresh as RefreshIcon,
  NotificationsActive as AlertIcon,
} from '@mui/icons-material';

// AUD2-H01 FIX: Removed LazyIcons wrapper — all icons are already eagerly imported above.
// Creating React.lazy() wrappers for eagerly-imported modules creates redundant async chunks
// without any bundle-size benefit.
import { motion, AnimatePresence } from 'framer-motion';
// styled + keyframes import removed — HeroSection (only user) was dead code
import { format, formatDistanceToNow } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
// Auth state via Redux only
// import useAuth from '../../auth/hooks/useAuth';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthCheck } from '../../../hooks/useAuthCheck';
import { useBreakpointDown } from '../../../hooks/useResponsive';
import { useJobsFiltersState } from '../hooks/useJobsFiltersState';
import {
  createFeatureLogger,
  devError,
} from '@/modules/common/utils/devLogger';
import { formatGhanaCurrency } from '@/utils/formatters';
import BreadcrumbNavigation from '../../../components/common/BreadcrumbNavigation';
import PullToRefresh from '../../../components/common/PullToRefresh';
import usePrefersReducedMotion from '../../../hooks/usePrefersReducedMotion';
import useNetworkSpeed from '../../../hooks/useNetworkSpeed';
import { HEADER_HEIGHT_MOBILE, Z_INDEX } from '../../../constants/layout';

const jobsDebugLog = createFeatureLogger({
  flagName: 'VITE_DEBUG_JOBS',
  level: 'log',
});

// ✓ MOBILE-AUDIT P1: Removed dead code — 7 keyframe animations + HeroSection styled component
// (float, shimmer, pulse, slideInFromBottom, gradientShift, sparkle, rotateGlow)
// HeroSection was never rendered in JSX.

// Animated Stat Card Component with CountUp
const AnimatedStatCard = ({ value, suffix = '', label, isLive = false }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <Paper
      ref={ref}
      sx={{
        p: { xs: 2, sm: 2.5, md: 3 }, // ✓ Responsive padding
        textAlign: 'center',
        bgcolor: 'var(--k-bg-surface)',
        border: '1px solid var(--k-accent-border)',
        minHeight: { xs: 'auto', sm: '140px', md: '160px' }, // ✓ Auto on mobile
        display: 'flex', // ✓ Better centering
        flexDirection: 'column',
        justifyContent: 'center',
        '&:hover': {
          border: '1px solid var(--k-gold)',
          boxShadow: '0 8px 32px rgba(212,175,55,0.2)',
          transform: { xs: 'none', sm: 'translateY(-4px)' }, // ✓ Desktop-only hover
        },
        transition: 'all 0.3s ease-in-out',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated glow effect on hover */}
      <Box
        sx={{
          position: 'absolute',
          left: '-100%',
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)',
          transition: 'left 0.5s ease-in-out',
          '.MuiPaper-root:hover &': {
            left: '100%',
          },
        }}
      />

      <Typography
        variant="h3"
        sx={{
          color: 'var(--k-gold)',
          fontWeight: 'bold',
          mb: { xs: 0.5, sm: 0.75, md: 1 }, // ✓ Responsive margin
          fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' }, // ✓ Responsive font size
          position: 'relative',
          zIndex: 1,
        }}
      >
        {inView ? (
          <CountUp
            end={value}
            duration={2.5}
            separator=","
            suffix={suffix}
            useEasing={true}
          />
        ) : (
          '0'
        )}
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: 'var(--k-text-secondary)',
          fontWeight: 'medium',
          fontSize: { xs: '0.875rem', sm: '0.9rem', md: '1rem' },
          position: 'relative',
          zIndex: 1,
        }}
      >
        {label}
      </Typography>

      {/* Live indicator for real-time stats */}
      {isLive && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'success.light',
              boxShadow: (theme) => `0 0 8px ${theme.palette.success.light}`,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  opacity: 1,
                },
                '50%': {
                  opacity: 0.5,
                },
              },
              // ✓ MOBILE-AUDIT: Respect prefers-reduced-motion
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'success.light',
              fontWeight: 'medium',
            }}
          >
            LIVE
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

// Ghana vocational trade categories — matches backend Job.requirements.primarySkills enum
const ghanaTradeCategories = [
  {
    name: 'Plumbing',
    icon: <PlumbingIcon />,
    color: 'info.main',
    description: 'Pipe fitting, water systems & repairs',
  },
  {
    name: 'Electrical',
    icon: <ElectricalIcon />,
    color: 'secondary.main',
    description: 'Wiring, installations & power systems',
  },
  {
    name: 'Carpentry',
    icon: <CarpenterIcon />,
    color: 'warning.dark',
    description: 'Woodwork, furniture & fittings',
  },
  {
    name: 'Construction',
    icon: <ConstructionIcon />,
    color: 'error.main',
    description: 'Building, renovation & structural work',
  },
  {
    name: 'Painting',
    icon: <PaintingIcon />,
    color: 'secondary.main',
    description: 'Interior & exterior painting',
  },
  {
    name: 'Welding',
    icon: <WeldingIcon />,
    color: 'warning.main',
    description: 'Metal fabrication & welding',
  },
  {
    name: 'Masonry',
    icon: <MasonryIcon />,
    color: 'warning.dark',
    description: 'Block laying, tiling & stonework',
  },
  {
    name: 'Roofing',
    icon: <RoofingIcon />,
    color: 'success.main',
    description: 'Roof installation & repair',
  },
];

const CATEGORY_ICON_MAP = {
  Plumbing: PlumbingIcon,
  Electrical: ElectricalIcon,
  Carpentry: CarpenterIcon,
  Construction: ConstructionIcon,
  Painting: PaintingIcon,
  Welding: WeldingIcon,
  Masonry: MasonryIcon,
  HVAC: HvacIcon,
  Roofing: RoofingIcon,
  Flooring: FlooringIcon,
  '': WorkIcon,
};

const getCategoryIcon = (category) => {
  if (!category) return WorkIcon;
  return CATEGORY_ICON_MAP[category] || WorkIcon;
};

const SORT_LABELS = {
  relevance: 'Most Relevant',
  newest: 'Newest First',
  budget_high: 'Budget: High to Low',
  budget_low: 'Budget: Low to High',
};

const tradeCategories = tradeCategoriesData.map((category) => ({
  ...category,
  icon: CATEGORY_ICON_MAP[category.value] || WorkIcon,
}));

function JobsPaginationControls({
  loading,
  error,
  uniqueJobs,
  totalJobs,
  hasMore,
  loadMoreRef,
  isJobsFetching,
  onLoadMore,
  totalPages,
  page,
  onPageChange,
}) {
  if (loading || error || uniqueJobs.length === 0) {
    return null;
  }

  return (
    <Box sx={{ textAlign: 'center', mt: 4, mb: 2 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Showing {uniqueJobs.length} of {totalJobs} opportunities
      </Typography>

      {/* Mobile: infinite-scroll sentinel */}
      {hasMore && (
        <Box
          ref={loadMoreRef}
          role="status"
          aria-live="polite"
          sx={{
            display: { xs: 'flex', md: 'none' },
            justifyContent: 'center',
            py: 3,
          }}
        >
          {isJobsFetching ? (
            <Box sx={{ width: '100%', display: 'grid', gap: 1.25 }}>
              {[1, 2].map((item) => (
                <Box
                  key={`jobs-mobile-loading-skeleton-${item}`}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 1.5,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Skeleton
                    variant="text"
                    width="70%"
                    height={24}
                    sx={{ mb: 0.5 }}
                  />
                  <Skeleton
                    variant="text"
                    width="45%"
                    height={18}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton variant="rounded" width="100%" height={56} />
                </Box>
              ))}
            </Box>
          ) : (
            <Button
              variant="outlined"
              size="medium"
              onClick={onLoadMore}
              disabled={isJobsFetching}
              aria-label={
                isJobsFetching
                  ? 'Loading more opportunities'
                  : 'Load more opportunities'
              }
              sx={{
                borderColor: 'var(--k-gold)',
                color: 'var(--k-gold)',
                px: 4,
                py: 1,
                '&:hover': {
                  borderColor: 'var(--k-gold-dark)',
                  bgcolor: 'var(--k-accent-soft)',
                },
                '&:focus-visible': {
                  outline: '3px solid var(--k-gold)',
                  outlineOffset: '2px',
                },
              }}
            >
              Load More
            </Button>
          )}
        </Box>
      )}

      {/* Desktop: page numbers */}
      {totalPages > 1 && (
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            justifyContent: 'center',
            mt: 2,
          }}
        >
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => onPageChange(newPage)}
            sx={{
              '& .MuiPaginationItem-root': {
                color: 'text.primary',
                '&.Mui-selected': {
                  bgcolor: 'var(--k-gold)',
                  color: 'var(--k-text-on-accent)',
                },
              },
            }}
          />
        </Box>
      )}

      {!hasMore && uniqueJobs.length > 0 && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          You&apos;ve seen all available opportunities
        </Typography>
      )}
    </Box>
  );
}

function JobsResultsHeader({
  isMobile,
  selectedCategory,
  hasActiveFilters,
  effectiveSearch,
  selectedLocation,
  budgetFilterActive,
  budgetRange,
  quickFilters,
  sortBy,
  onClearSearch,
  onClearCategory,
  onClearLocation,
  onClearBudget,
  onToggleQuickFilter,
  onClearAllFilters,
  totalJobs,
  uniqueJobsLength,
}) {
  const activeQuickFiltersCount = Object.values(quickFilters).filter(Boolean)
    .length;
  const activeFilterCount = [
    Boolean(effectiveSearch),
    Boolean(selectedCategory),
    Boolean(selectedLocation),
    Boolean(budgetFilterActive),
  ].filter(Boolean).length;

  return (
    <Box
      sx={{
        mb: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      <Box>
        <Typography
          variant="h5"
          sx={{ color: 'var(--k-gold)', fontWeight: 'bold', mb: 1 }}
        >
          {selectedCategory ? `${selectedCategory} Jobs` : 'Job Results'}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mb: 1.25,
            display: { xs: 'none', md: 'block' },
          }}
        >
          Sorted by {SORT_LABELS[sortBy] || SORT_LABELS.relevance}. Use filters
          and chips to narrow results quickly.
        </Typography>
        {hasActiveFilters &&
          (isMobile ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
                p: 1,
                borderRadius: 1.5,
                bgcolor: 'var(--k-accent-soft)',
                border: '1px solid var(--k-accent-border)',
              }}
            >
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {activeFilterCount + activeQuickFiltersCount} filters active
              </Typography>
              <Button
                size="small"
                onClick={onClearAllFilters}
                sx={{
                  color: 'error.main',
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  minWidth: 'auto',
                  minHeight: 44,
                }}
              >
                Clear all
              </Button>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
                alignItems: 'center',
                '& .MuiChip-root': {
                  minHeight: 44,
                  maxWidth: '100%',
                },
                '& .MuiChip-label': {
                  whiteSpace: 'normal',
                  lineHeight: 1.2,
                },
              }}
            >
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Active filters:
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  width: '100%',
                  lineHeight: 1.4,
                  display: { xs: 'none', md: 'block' },
                }}
              >
                Remove a chip to widen results, or clear everything if the list
                feels too narrow.
              </Typography>
              {effectiveSearch && (
                <Chip
                  label={`Search: "${effectiveSearch}"`}
                  size="small"
                  onDelete={onClearSearch}
                  sx={{
                    bgcolor: 'var(--k-accent-soft-strong)',
                    color: 'var(--k-gold)',
                    '& .MuiChip-deleteIcon': { color: 'var(--k-gold)' },
                  }}
                />
              )}
              {selectedCategory && (
                <Chip
                  label={`Category: ${selectedCategory}`}
                  size="small"
                  onDelete={onClearCategory}
                  sx={{
                    bgcolor: 'var(--k-accent-soft-strong)',
                    color: 'var(--k-gold)',
                    '& .MuiChip-deleteIcon': { color: 'var(--k-gold)' },
                  }}
                />
              )}
              {selectedLocation && (
                <Chip
                  label={`Location: ${selectedLocation}`}
                  size="small"
                  onDelete={onClearLocation}
                  sx={{
                    bgcolor: 'var(--k-accent-soft-strong)',
                    color: 'var(--k-gold)',
                    '& .MuiChip-deleteIcon': { color: 'var(--k-gold)' },
                  }}
                />
              )}
              {budgetFilterActive && (
                <Chip
                  label={`Budget: ${formatGhanaCurrency(budgetRange[0])} – ${formatGhanaCurrency(budgetRange[1])}`}
                  size="small"
                  onDelete={onClearBudget}
                  sx={{
                    bgcolor: 'var(--k-accent-soft-strong)',
                    color: 'var(--k-gold)',
                    '& .MuiChip-deleteIcon': { color: 'var(--k-gold)' },
                  }}
                />
              )}
              {Object.entries(quickFilters)
                .filter(([, v]) => v)
                .map(([key]) => (
                  <Chip
                    key={key}
                    label={
                      key === 'fullTime'
                        ? 'Hourly'
                        : key === 'contract'
                          ? 'Fixed Price'
                          : key.charAt(0).toUpperCase() + key.slice(1)
                    }
                    size="small"
                    onDelete={() => onToggleQuickFilter(key)}
                    sx={{
                      bgcolor: 'var(--k-accent-soft-strong)',
                      color: 'var(--k-gold)',
                      '& .MuiChip-deleteIcon': { color: 'var(--k-gold)' },
                    }}
                  />
                ))}
              <Button
                size="small"
                onClick={onClearAllFilters}
                sx={{
                  color: 'error.main',
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  minWidth: 'auto',
                  minHeight: 44,
                }}
              >
                Clear filters
              </Button>
            </Box>
          ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Chip
          label={`${totalJobs || uniqueJobsLength} jobs found`}
          icon={<WorkIcon sx={{ fontSize: 18 }} />}
          sx={{
            bgcolor: 'var(--k-accent-soft-strong)',
            color: 'var(--k-gold)',
            fontWeight: 'bold',
            fontSize: '0.875rem',
            px: 1,
          }}
        />
      </Box>
    </Box>
  );
}

function JobsGridStatePanels({
  loading,
  error,
  retryJobsFetch,
  uniqueJobs,
  effectiveSearch,
  selectedCategory,
  selectedLocation,
  budgetFilterActive,
  onClearSearch,
  onClearCategory,
  onClearLocation,
  onClearBudget,
  clearAllFilters,
}) {
  return (
    <>
      {loading && (
        <Box>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Grid item xs={12} sm={6} md={6} lg={4} xl={3} key={item}>
                <Card
                  sx={{
                    height: '100%',
                    bgcolor: 'var(--k-bg-surface)',
                    border: '1px solid var(--k-accent-border)',
                    borderRadius: 2,
                    minHeight: { xs: 'auto', sm: 320 },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', mb: 2, gap: 2 }}>
                      <Skeleton
                        variant="circular"
                        width={40}
                        height={40}
                        sx={{ bgcolor: 'var(--k-surface-muted)' }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton
                          variant="text"
                          width="80%"
                          sx={{ bgcolor: 'var(--k-surface-muted)', mb: 1 }}
                        />
                        <Skeleton
                          variant="text"
                          width="50%"
                          sx={{ bgcolor: 'var(--k-surface-muted)' }}
                        />
                      </Box>
                    </Box>
                    <Skeleton
                      variant="text"
                      width="100%"
                      sx={{ bgcolor: 'var(--k-surface-muted)', mb: 1 }}
                    />
                    <Skeleton
                      variant="text"
                      width="90%"
                      sx={{ bgcolor: 'var(--k-surface-muted)', mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Skeleton
                        variant="rectangular"
                        width={70}
                        height={24}
                        sx={{
                          bgcolor: 'var(--k-surface-muted)',
                          borderRadius: 1,
                        }}
                      />
                      <Skeleton
                        variant="rectangular"
                        width={70}
                        height={24}
                        sx={{
                          bgcolor: 'var(--k-surface-muted)',
                          borderRadius: 1,
                        }}
                      />
                      <Skeleton
                        variant="rectangular"
                        width={70}
                        height={24}
                        sx={{
                          bgcolor: 'var(--k-surface-muted)',
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height={40}
                      sx={{
                        bgcolor: 'var(--k-surface-muted)',
                        borderRadius: 1,
                        mt: 2,
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {error && (
        <Box sx={{ py: 4 }}>
          <Paper
            sx={{
              p: 4,
              bgcolor: 'var(--k-danger-soft)',
              border: '1px solid var(--k-danger-border)',
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(244,67,54,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 48 }}>☝️</Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{ color: 'var(--k-danger-text)', mb: 2, fontWeight: 'bold' }}
            >
              We Could Not Load Jobs Yet
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
              {error ||
                'Your internet may be slow, or the service may still be starting. Please try again in a few seconds.'}
            </Typography>
            <Button
              variant="contained"
              onClick={retryJobsFetch}
              sx={{
                bgcolor: 'var(--k-gold)',
                color: 'var(--k-text-on-accent)',
                fontWeight: 'bold',
                '&:hover': { bgcolor: 'var(--k-gold-dark)' },
              }}
            >
              Try Again
            </Button>
          </Paper>
        </Box>
      )}

      {!loading && !error && uniqueJobs.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Box
            sx={{
              bgcolor: 'var(--k-bg-surface)',
              border: '2px dashed var(--k-accent-border-strong)',
              borderRadius: 3,
              p: 6,
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            <SearchIcon
              sx={{ fontSize: 80, color: 'var(--k-gold)', mb: 2, opacity: 0.5 }}
            />
            <Typography
              variant="h5"
              sx={{ color: 'var(--k-gold)', mb: 2, fontWeight: 'bold' }}
            >
              No jobs found
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
              {effectiveSearch || selectedCategory || selectedLocation
                ? 'Try removing one filter or changing your search words.'
                : 'No jobs are available right now. Check back soon for new work.'}
            </Typography>
            {(effectiveSearch ||
              selectedCategory ||
              selectedLocation ||
              budgetFilterActive) && (
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
                sx={{ mb: 2, justifyContent: 'center' }}
              >
                {effectiveSearch && (
                  <Chip
                    label={`Remove search: "${effectiveSearch}"`}
                    onDelete={onClearSearch}
                    sx={{
                      bgcolor: 'var(--k-accent-soft-strong)',
                      color: 'var(--k-gold)',
                    }}
                  />
                )}
                {selectedCategory && (
                  <Chip
                    label={`Remove category: ${selectedCategory}`}
                    onDelete={onClearCategory}
                    sx={{
                      bgcolor: 'var(--k-accent-soft-strong)',
                      color: 'var(--k-gold)',
                    }}
                  />
                )}
                {selectedLocation && (
                  <Chip
                    label={`Remove location: ${selectedLocation}`}
                    onDelete={onClearLocation}
                    sx={{
                      bgcolor: 'var(--k-accent-soft-strong)',
                      color: 'var(--k-gold)',
                    }}
                  />
                )}
                {budgetFilterActive && (
                  <Chip
                    label="Remove budget filter"
                    onDelete={onClearBudget}
                    sx={{
                      bgcolor: 'var(--k-accent-soft-strong)',
                      color: 'var(--k-gold)',
                    }}
                  />
                )}
              </Stack>
            )}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {(effectiveSearch || selectedCategory || selectedLocation) && (
                <Button
                  variant="contained"
                  onClick={clearAllFilters}
                  sx={{
                    bgcolor: 'var(--k-gold)',
                    color: 'var(--k-text-on-accent)',
                    fontWeight: 'bold',
                    '&:hover': { bgcolor: 'var(--k-gold-dark)' },
                  }}
                >
                  Clear filters
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={retryJobsFetch}
                sx={{
                  borderColor: 'var(--k-gold)',
                  color: 'var(--k-gold)',
                  '&:hover': {
                    borderColor: 'var(--k-gold-dark)',
                    bgcolor: 'var(--k-accent-soft)',
                  },
                }}
              >
                Refresh Jobs
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
}

function JobsFiltersPanel({
  isMobile,
  isSmallMobile,
  searchQuery,
  onSearchInputChange,
  onSearchSubmit,
  mobileFilterOpen,
  onOpenMobileFilters,
  onCloseMobileFilters,
  onApplyMobileFilters,
  selectedCategory,
  onCategoryChange,
  selectedLocation,
  onLocationChange,
  budgetRange,
  showFilters,
  onToggleFilters,
  hasActiveFilters,
  activeFilterCount,
  isJobsFetching,
  budgetFilterActive,
  onBudgetFilterToggle,
  onBudgetRangeChange,
  quickFilters,
  onToggleQuickFilter,
  sortBy,
  onSortChange,
  onClearAllFilters,
}) {
  if (isMobile) {
    return (
      <Box
        sx={{
          position: 'sticky',
          top: {
            xs: `calc(${HEADER_HEIGHT_MOBILE + 12}px + var(--kelmah-network-banner-offset, 0px))`,
            sm: `calc(${HEADER_HEIGHT_MOBILE + 16}px + var(--kelmah-network-banner-offset, 0px))`,
          },
          zIndex: Z_INDEX.sticky,
          pb: 0.25,
          pt: 0.25,
          bgcolor: 'background.default',
        }}
      >
        <JobsCompactSearchBar
          searchValue={searchQuery}
          onSearchChange={onSearchInputChange}
          onSearchSubmit={onSearchSubmit}
          onFilterClick={onOpenMobileFilters}
          activeFilterCount={activeFilterCount}
          sortLabel={SORT_LABELS[sortBy] || SORT_LABELS.relevance}
          placeholder={
            isSmallMobile ? 'Search jobs...' : 'Search jobs, skills...'
          }
        />
        <JobsMobileFilterDrawer
          open={mobileFilterOpen}
          onClose={onCloseMobileFilters}
          onApply={onApplyMobileFilters}
          initialFilters={{
            search: searchQuery,
            category: selectedCategory,
            location: selectedLocation,
            salaryRange: budgetRange,
          }}
          tradeCategories={tradeCategoriesData}
          locations={ghanaLocations}
        />
      </Box>
    );
  }

  return (
    <Paper
      elevation={8}
      sx={{
        p: { xs: 1.5, sm: 2 },
        bgcolor: 'var(--k-bg-surface)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--k-accent-border)',
        borderRadius: { xs: 2, sm: 2 },
        mx: { xs: 1, sm: 0 },
      }}
    >
      <Grid
        container
        spacing={{ xs: 1.5, sm: 2 }}
        alignItems="stretch"
        sx={{
          width: '100%',
          margin: 0,
        }}
      >
        <Grid
          item
          xs={12}
          sm={5}
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
        >
          <TextField
            fullWidth
            size="small"
            value={searchQuery}
            onChange={(e) => onSearchInputChange(e.target.value)}
            placeholder={
              isSmallMobile
                ? 'Search jobs...'
                : 'Search jobs, skills, companies...'
            }
            inputProps={{
              'aria-label': 'Search for jobs, skills, or companies',
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'var(--k-text-primary)',
                height: '44px',
                '& fieldset': {
                  borderColor: 'var(--k-accent-border)',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--k-gold)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--k-gold)',
                },
              },
              '& .MuiInputBase-input': {
                fontSize: { xs: '1rem', sm: '0.875rem' },
                padding: '10px 14px',
                '&::placeholder': {
                  color: 'var(--k-text-muted)',
                  opacity: 1,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{
                      color: 'var(--k-gold)',
                      fontSize: { xs: '1.2rem', sm: '1rem' },
                    }}
                  />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={2.5}>
          <FormControl fullWidth size="small">
            <InputLabel
              shrink
              sx={{
                color: 'var(--k-text-secondary)',
                fontSize: { xs: '0.8rem', sm: '0.75rem' },
                transform: 'translate(14px, -9px) scale(0.85)',
                '&.Mui-focused': {
                  color: 'var(--k-gold)',
                },
              }}
            >
              Trade Category
            </InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              displayEmpty
              inputProps={{
                'aria-label': 'Select trade category',
              }}
              sx={{
                color: 'var(--k-text-primary)',
                fontSize: { xs: '1rem', sm: '0.875rem' },
                height: '44px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--k-accent-border)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--k-gold)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--k-gold)',
                },
                '& .MuiSvgIcon-root': {
                  color: 'var(--k-gold)',
                },
                '& .MuiSelect-select': {
                  padding: '10px 14px',
                },
              }}
            >
              <MenuItem value="">
                <Typography variant="body2">All Categories</Typography>
              </MenuItem>
              {tradeCategories.map((category) => (
                <MenuItem key={category.value} value={category.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <category.icon
                      sx={{
                        mr: 1,
                        color: 'var(--k-gold)',
                        fontSize: 18,
                      }}
                    />
                    <Typography variant="body2">{category.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={2.5}>
          <FormControl fullWidth size="small">
            <InputLabel
              shrink
              sx={{
                color: 'var(--k-text-secondary)',
                fontSize: { xs: '0.8rem', sm: '0.75rem' },
                transform: 'translate(14px, -9px) scale(0.85)',
                '&.Mui-focused': {
                  color: 'var(--k-gold)',
                },
              }}
            >
              Location
            </InputLabel>
            <Select
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
              displayEmpty
              inputProps={{
                'aria-label': 'Select location',
              }}
              sx={{
                color: 'var(--k-text-primary)',
                fontSize: { xs: '1rem', sm: '0.875rem' },
                height: '44px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--k-accent-border)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--k-gold)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--k-gold)',
                },
                '& .MuiSvgIcon-root': {
                  color: 'var(--k-gold)',
                },
                '& .MuiSelect-select': {
                  padding: '10px 14px',
                },
              }}
            >
              <MenuItem value="">
                <Typography variant="body2">All Locations</Typography>
              </MenuItem>
              {ghanaLocations.map((location) => (
                <MenuItem key={location.value} value={location.value}>
                  <Typography variant="body2">{location.label}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid
          item
          xs={12}
          sm={2}
          sx={{
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          <Tooltip title="Search for jobs" placement="top">
            <Box component="span" sx={{ width: '100%', display: 'flex' }}>
              <Button
                fullWidth
                variant="contained"
                size="medium"
                startIcon={
                  isJobsFetching ? (
                    <CircularProgress size={16} sx={{ color: 'black' }} />
                  ) : (
                    <SearchIcon />
                  )
                }
                disabled={isJobsFetching}
                onClick={onSearchSubmit}
                sx={{
                  bgcolor: 'var(--k-gold)',
                  color: 'var(--k-text-on-accent)',
                  fontWeight: 'bold',
                  fontSize: { xs: '1rem', sm: '0.875rem' },
                  height: '44px',
                  minWidth: { xs: '100%', sm: 'auto' },
                  padding: '10px 14px',
                  boxShadow: '0 4px 12px rgba(212,175,55,0.4)',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    bgcolor: 'var(--k-gold-dark)',
                    boxShadow: '0 6px 16px rgba(212,175,55,0.6)',
                    transform: {
                      xs: 'none',
                      sm: 'translateY(-2px)',
                    },
                  },
                  transition: 'all 0.3s ease',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                }}
              >
                Search
              </Button>
            </Box>
          </Tooltip>
        </Grid>
      </Grid>

      <Box sx={{ mt: { xs: 1, sm: 1 }, textAlign: 'center' }}>
        <Button
          startIcon={<FilterListIcon />}
          onClick={onToggleFilters}
          size="small"
          sx={{
            color: 'var(--k-gold)',
            fontSize: { xs: '0.875rem', sm: '0.75rem' },
            padding: { xs: '8px 14px', sm: '4px 8px' },
            minHeight: 44,
            '&:hover': {
              bgcolor: 'var(--k-accent-soft)',
            },
          }}
        >
          {showFilters ? 'Hide' : 'Show'} Filters
          {hasActiveFilters && (
            <Badge
              badgeContent={activeFilterCount}
              sx={{
                ml: 1,
                '& .MuiBadge-badge': {
                  bgcolor: 'var(--k-gold)',
                  color: 'var(--k-text-on-accent)',
                  fontSize: '0.65rem',
                  minWidth: 16,
                  height: 16,
                },
              }}
            />
          )}
        </Button>
      </Box>

      {isJobsFetching && (
        <LinearProgress
          sx={{
            mt: 1,
            bgcolor: 'var(--k-accent-soft)',
            '& .MuiLinearProgress-bar': { bgcolor: 'var(--k-gold)' },
            height: 2,
            borderRadius: 1,
          }}
        />
      )}

      <Collapse in={showFilters}>
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: '1px solid var(--k-accent-border)',
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: 'var(--k-gold)', fontWeight: 'bold' }}
                >
                  Budget Range
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={budgetFilterActive}
                      onChange={(e) => onBudgetFilterToggle(e.target.checked)}
                      size="small"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: 'var(--k-gold)',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                          { bgcolor: 'var(--k-gold)' },
                      }}
                    />
                  }
                  label={
                    <Typography
                      variant="caption"
                      sx={{ color: 'var(--k-text-muted)' }}
                    >
                      {budgetFilterActive ? 'On' : 'Off'}
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              </Box>
              <Slider
                value={budgetRange}
                onChange={(e, newValue) => onBudgetRangeChange(newValue)}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => formatGhanaCurrency(v)}
                min={0}
                max={100000}
                step={500}
                disabled={!budgetFilterActive}
                size="small"
                sx={{
                  color: budgetFilterActive ? 'var(--k-gold)' : 'grey.600',
                  '& .MuiSlider-thumb': {
                    bgcolor: budgetFilterActive ? 'var(--k-gold)' : 'grey.500',
                    width: { xs: 28, sm: 20 },
                    height: { xs: 28, sm: 20 },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                    },
                  },
                  '& .MuiSlider-track': {
                    bgcolor: budgetFilterActive ? 'var(--k-gold)' : 'grey.600',
                  },
                  '& .MuiSlider-rail': {
                    bgcolor: 'var(--k-accent-border)',
                  },
                }}
              />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mt: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: 'var(--k-text-secondary)' }}
                >
                  {formatGhanaCurrency(budgetRange[0])}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'var(--k-text-secondary)' }}
                >
                  {formatGhanaCurrency(budgetRange[1])}+
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography
                variant="body2"
                sx={{ mb: 1, color: 'var(--k-gold)', fontWeight: 'bold' }}
              >
                Quick Filters
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {[
                  { key: 'urgent', label: 'Urgent' },
                  { key: 'verified', label: 'Verified Hirer' },
                  { key: 'fullTime', label: 'Hourly' },
                  { key: 'contract', label: 'Fixed Price' },
                ].map(({ key, label }) => (
                  <Chip
                    key={key}
                    label={label}
                    size="small"
                    variant={quickFilters[key] ? 'filled' : 'outlined'}
                    onClick={() => onToggleQuickFilter(key)}
                    sx={{
                      borderColor: 'var(--k-gold)',
                      color: quickFilters[key]
                        ? 'var(--k-text-on-accent)'
                        : 'var(--k-gold)',
                      bgcolor: quickFilters[key]
                        ? 'var(--k-gold)'
                        : 'transparent',
                      fontSize: '0.8rem',
                      minHeight: 44,
                      minWidth: 44,
                      cursor: 'pointer',
                      fontWeight: quickFilters[key] ? 'bold' : 'normal',
                      '&:hover': {
                        bgcolor: quickFilters[key]
                          ? 'var(--k-gold-dark)'
                          : 'var(--k-accent-soft)',
                      },
                      '& .MuiChip-label': {
                        px: 1,
                        whiteSpace: 'normal',
                        lineHeight: 1.2,
                      },
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography
                variant="body2"
                sx={{ mb: 1, color: 'var(--k-gold)', fontWeight: 'bold' }}
              >
                Sort By
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value)}
                  sx={{
                    color: 'var(--k-text-primary)',
                    fontSize: '0.875rem',
                    minHeight: 44,
                    height: 44,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--k-accent-border)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--k-gold)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--k-gold)',
                    },
                    '& .MuiSvgIcon-root': { color: 'var(--k-gold)' },
                    '& .MuiSelect-select': {
                      minHeight: 44,
                      display: 'flex',
                      alignItems: 'center',
                      boxSizing: 'border-box',
                    },
                  }}
                >
                  <MenuItem value="relevance">Most Relevant</MenuItem>
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="budget_high">Budget: High → Low</MenuItem>
                  <MenuItem value="budget_low">Budget: Low → High</MenuItem>
                </Select>
              </FormControl>
              {hasActiveFilters && (
                <Button
                  size="small"
                  onClick={onClearAllFilters}
                  sx={{
                    mt: 1,
                    color: 'error.main',
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    minHeight: 44,
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                    },
                  }}
                >
                  • Clear filters
                </Button>
              )}
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
}

function JobsCategoryBrowseGrid({
  categoryData,
  selectedCategory,
  onSelectCategory,
  isMobile,
}) {
  if (isMobile) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.75,
          overflowX: 'hidden',
          py: 0.25,
          px: 0.25,
          width: '100%',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {categoryData.map((cat) => {
          const isActive = selectedCategory === cat.name;
          return (
            <Chip
              key={cat.name}
              clickable
              onClick={() => onSelectCategory(isActive ? '' : cat.name)}
              icon={cat.icon}
              label={cat.name}
              sx={{
                borderRadius: 999,
                border: isActive
                  ? '1px solid var(--k-gold)'
                  : '1px solid var(--k-accent-border)',
                bgcolor: isActive
                  ? 'var(--k-accent-soft)'
                  : 'var(--k-bg-surface)',
                color: isActive ? 'var(--k-gold)' : 'var(--k-text-secondary)',
                height: 44,
                maxWidth: '100%',
                whiteSpace: 'nowrap',
                '& .MuiChip-icon': {
                  color: isActive ? 'var(--k-gold)' : cat.color,
                },
                '& .MuiChip-label': {
                  px: 0.9,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              }}
            />
          );
        })}
      </Box>
    );
  }

  return (
    <Grid container spacing={{ xs: 1, sm: 1.5 }}>
      {categoryData.map((cat) => {
        const isActive = selectedCategory === cat.name;
        return (
          <Grid item xs={3} sm={3} md={1.5} key={cat.name}>
            <Paper
              component={ButtonBase}
              onClick={() => onSelectCategory(isActive ? '' : cat.name)}
              aria-label={`Browse ${cat.name} jobs`}
              aria-pressed={isActive}
              sx={{
                p: { xs: 1.5, sm: 2 },
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isActive
                  ? 'var(--k-accent-soft)'
                  : 'var(--k-bg-surface)',
                border: isActive
                  ? '2px solid var(--k-gold)'
                  : '1px solid var(--k-accent-border)',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'var(--k-accent-soft)',
                  border: '1px solid var(--k-accent-border-strong)',
                  transform: { xs: 'none', sm: 'translateY(-2px)' },
                },
                '&:active': { transform: 'scale(0.96)' },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                minHeight: { xs: 72, sm: 80 },
                justifyContent: 'center',
              }}
              elevation={isActive ? 4 : 0}
            >
              <Box
                sx={{
                  color: isActive ? 'secondary.main' : cat.color,
                  fontSize: { xs: 28, sm: 32 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s ease',
                }}
              >
                {cat.icon}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: isActive
                    ? 'secondary.main'
                    : 'var(--k-text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                  lineHeight: 1.2,
                  transition: 'color 0.2s ease',
                }}
              >
                {cat.name}
              </Typography>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}

// Platform metrics are now derived from real data inside the component via platformStats state.
// No hardcoded vanity numbers — stats are computed from actual job counts.

// Class-based Error Boundary — React requires class components for getDerivedStateFromError
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    devError('JobsPage Error:', error, errorInfo);
  }

  handleRetry() {
    this.setState({ hasError: false }, () => {
      if (typeof this.props.onRetry === 'function') {
        this.props.onRetry();
      }
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography
              variant="h5"
              sx={{ color: 'var(--k-text-primary)', mb: 2 }}
            >
              Something went wrong
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: 'var(--k-text-secondary)', mb: 3 }}
            >
              We&apos;re having trouble loading jobs. Please try refreshing the
              page.
            </Typography>
            <Button
              variant="contained"
              onClick={this.handleRetry}
              sx={{
                bgcolor: 'var(--k-gold)',
                color: 'var(--k-text-on-accent)',
              }}
            >
              Try Again
            </Button>
          </Box>
        )
      );
    }

    return this.props.children;
  }
}

const JobsPage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const authState = useAuthCheck();
  const isMobile = useBreakpointDown('md');
  const isSmallMobile = useBreakpointDown('sm');
  const prefersReducedMotion = usePrefersReducedMotion();
  const { isSlow: isSlowNetwork } = useNetworkSpeed();
  // When reduced motion is preferred OR network is slow, disable framer-motion transitions
  const motionProps =
    prefersReducedMotion || isSlowNetwork
      ? { initial: false, animate: false, transition: { duration: 0 } }
      : {};

  // Category browse grid expects objects with { name, icon, color }.
  // Keep a stable reference to avoid unnecessary rerenders.
  const categoryData = useMemo(() => ghanaTradeCategories, []);

  const initialFilterState = useMemo(() => {
    const parseNumber = (value, fallback) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const parseBoolean = (value) => value === '1' || value === 'true';

    const minBudgetParam = searchParams.get('minBudget');
    const maxBudgetParam = searchParams.get('maxBudget');
    const minBudget = parseNumber(minBudgetParam, 0);
    const maxBudget = parseNumber(maxBudgetParam, 100000);
    const hasBudgetParams = minBudgetParam !== null || maxBudgetParam !== null;

    return {
      searchQuery: searchParams.get('q') || '',
      selectedCategory: searchParams.get('category') || '',
      selectedLocation: searchParams.get('location') || '',
      sortBy: searchParams.get('sort') || 'relevance',
      page: Math.max(1, parseNumber(searchParams.get('page'), 1)),
      budgetRange: [
        Math.min(minBudget, maxBudget),
        Math.max(minBudget, maxBudget),
      ],
      budgetFilterActive:
        hasBudgetParams || parseBoolean(searchParams.get('budget')),
      quickFilters: {
        urgent: parseBoolean(searchParams.get('urgent')),
        verified: parseBoolean(searchParams.get('verified')),
        fullTime: parseBoolean(searchParams.get('fullTime')),
        contract: parseBoolean(searchParams.get('contract')),
      },
    };
  }, [searchParams]);

  const {
    searchQuery,
    setSearchQuery,
    submittedSearch,
    setSubmittedSearch,
    selectedCategory,
    setSelectedCategory,
    selectedLocation,
    setSelectedLocation,
    budgetRange,
    setBudgetRange,
    budgetFilterActive,
    setBudgetFilterActive,
    sortBy,
    setSortBy,
    quickFilters,
    showFilters,
    mobileFilterOpen,
    page,
    setPage,
    totalPages,
    setTotalPages,
    totalJobs,
    setTotalJobs,
    hasMore,
    effectiveSearch,
    hasActiveFilters,
    activeFilterCount,
    toggleQuickFilter,
    clearAllFilters,
    handleOpenMobileFilters,
    handleCloseMobileFilters,
    handleApplyMobileFilters,
    handleToggleFilters,
    handleBudgetFilterToggle,
    handleBudgetRangeChange,
    handleBrowseCategorySelect,
    jobsQueryFilters,
  } = useJobsFiltersState(initialFilterState);

  const isWorkerUser = hasRole(user, ['worker', 'admin']);
  const isHirerUser = hasRole(user, ['hirer']);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bookmark (saved jobs) state
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // Load saved jobs on mount
  useEffect(() => {
    let cancelled = false;
    if (isAuthenticated) {
      jobsApi
        .getSavedJobs()
        .then((res) => {
          if (cancelled) return;
          const ids = (res?.jobs || [])
            .map((j) => j.id || j._id)
            .filter(Boolean);
          setSavedJobIds(new Set(ids));
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const handleToggleBookmark = useCallback(
    async (jobId) => {
      if (!authState.isAuthenticated) {
        navigate('/login', {
          state: {
            from: `/jobs/${jobId}`,
            message: 'Please sign in to save jobs',
          },
        });
        return;
      }
      const isSaved = savedJobIds.has(jobId);
      // Optimistic update
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        isSaved ? next.delete(jobId) : next.add(jobId);
        return next;
      });
      try {
        if (isSaved) {
          await jobsApi.unsaveJob(jobId);
          setSnackbar({ open: true, message: 'Job removed from saved' });
        } else {
          await jobsApi.saveJob(jobId);
          setSnackbar({ open: true, message: 'Job saved successfully!' });
        }
      } catch (err) {
        // Rollback on failure
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          isSaved ? next.add(jobId) : next.delete(jobId);
          return next;
        });
        setSnackbar({
          open: true,
          message: 'Failed to update saved jobs. Try again.',
        });
      }
    },
    [authState.isAuthenticated, savedJobIds, navigate],
  );

  const handleCreateJobAlert = useCallback(() => {
    if (!authState.isAuthenticated) {
      navigate('/login', {
        state: { from: '/jobs', message: 'Sign in to manage job alerts' },
      });
      return;
    }
    // Build alert preferences from current filters
    const alertFilters = {
      category: selectedCategory || 'All categories',
      location: selectedLocation || 'All locations',
      search: searchQuery || '',
    };
    setSnackbar({
      open: true,
      message: `Review and save these ${alertFilters.category} filters${alertFilters.location !== 'All locations' ? ` for ${alertFilters.location}` : ''} in notification settings.`,
    });
    navigate('/notifications/settings', {
      state: { draftAlert: true, filters: alertFilters },
    });
  }, [
    authState.isAuthenticated,
    selectedCategory,
    selectedLocation,
    searchQuery,
    navigate,
  ]);

  const handlePrimaryJobAction = useCallback(
    (jobId) => {
      if (!jobId) {
        return;
      }

      if (!authState.isAuthenticated) {
        navigate('/login', {
          state: {
            from: isHirerUser ? '/hirer/find-talents' : `/jobs/${jobId}/apply`,
            message: isHirerUser
              ? 'Sign in to find talent'
              : 'Please sign in to apply for this job',
          },
        });
        return;
      }

      if (isHirerUser) {
        navigate('/hirer/find-talents');
        return;
      }

      if (!isWorkerUser) {
        setSnackbar({
          open: true,
          message:
            'Only worker accounts can apply for jobs. Switch to a worker account to continue.',
        });
        return;
      }

      navigate(`/jobs/${jobId}/apply`);
    },
    [authState.isAuthenticated, isHirerUser, isWorkerUser, navigate],
  );

  // Infinite scroll sentinel (mobile): ref is placed on the sentinel element
  const { ref: loadMoreRef, inView: loadMoreInView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });
  const mobileAutoLoadLockRef = useRef(false);

  const [platformStats, setPlatformStats] = useState({
    availableJobs: 0,
    activeEmployers: 0,
    skilledWorkers: 0,
    successRate: 0,
    loading: true,
  });
  const jobsCountRef = useRef(0);
  // Ghana-aware helpers for better UX and ranking
  const GHANA_REGIONS = [
    'Greater Accra',
    'Ashanti',
    'Western',
    'Eastern',
    'Central',
    'Volta',
    'Northern',
    'Upper East',
    'Upper West',
    'Bono',
  ];
  const GHANA_CITIES = [
    'Accra',
    'Kumasi',
    'Tema',
    'Takoradi',
    'Tamale',
    'Ho',
    'Koforidua',
    'Cape Coast',
    'Sunyani',
    'Wa',
  ];
  const SKILL_MATCHING_WEIGHTS = {
    exact: 100,
    related: 60,
    category: 40,
    location: 30,
  };

  const {
    data: jobsResponse,
    isLoading: isJobsLoading,
    isFetching: isJobsFetching,
    error: jobsQueryError,
    refetch: refetchJobs,
  } = useJobsQuery(jobsQueryFilters, { keepPreviousData: true });

  const retryJobsFetch = useCallback(async () => {
    setError(null);
    if (page !== 1) {
      setPage(1);
      return;
    }
    await refetchJobs();
  }, [page, refetchJobs]);

  const handleSearchSubmit = useCallback(async () => {
    const nextSearch = searchQuery.trim();
    setSubmittedSearch(nextSearch);
    setError(null);
    if (page !== 1) {
      setPage(1);
      return;
    }
    if (nextSearch === effectiveSearch) {
      await refetchJobs();
    }
  }, [searchQuery, page, effectiveSearch, refetchJobs]);

  // Infinite scroll: auto-load next page when sentinel enters viewport (mobile)
  useEffect(() => {
    if (
      loadMoreInView &&
      hasMore &&
      !isJobsFetching &&
      !isJobsLoading &&
      !mobileAutoLoadLockRef.current
    ) {
      mobileAutoLoadLockRef.current = true;
      setPage((p) => p + 1);
    }
  }, [loadMoreInView, hasMore, isJobsFetching, isJobsLoading]);

  useEffect(() => {
    if (!isJobsFetching) {
      mobileAutoLoadLockRef.current = false;
    }
  }, [isJobsFetching]);

  useEffect(() => {
    const hasDataArray = (payload) =>
      Array.isArray(payload) ? payload : payload?.jobs || payload?.data || [];

    if (jobsResponse) {
      const normalizedJobs = hasDataArray(jobsResponse);
      // Extract pagination metadata from the API response
      setTotalPages(jobsResponse.totalPages || 1);
      setTotalJobs(jobsResponse.totalJobs || normalizedJobs.length);

      if (page === 1) {
        // First page: replace jobs
        setJobs(normalizedJobs);
      } else {
        // Subsequent pages: append new jobs
        setJobs((prev) => {
          const existingIds = new Set(prev.map((j) => j.id || j._id));
          const newJobs = normalizedJobs.filter(
            (j) => !existingIds.has(j.id || j._id),
          );
          return [...prev, ...newJobs];
        });
      }
      jobsDebugLog(
        `Jobs loaded via React Query (page ${page}):`,
        normalizedJobs.length,
      );
      return;
    }

    if (!isJobsLoading && !jobsResponse) {
      setJobs([]);
    }
  }, [jobsResponse, isJobsLoading, page]);

  useEffect(() => {
    if (jobsQueryError) {
      devError('Error fetching jobs via React Query:', jobsQueryError);
      setError('Unable to load jobs. Please try again.');
      return;
    }
    if (!isJobsLoading && !isJobsFetching) {
      setError(null);
    }
  }, [jobsQueryError, isJobsLoading, isJobsFetching]);

  useEffect(() => {
    setLoading(isJobsLoading && !jobsResponse);
  }, [isJobsLoading, jobsResponse]);

  useEffect(() => {
    jobsCountRef.current = jobs.length;
  }, [jobs.length]);

  // Fetch platform statistics from the real API endpoint
  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      try {
        const data = await jobsApi.getPlatformStats();
        if (!cancelled && data) {
          setPlatformStats({
            availableJobs: data.availableJobs || 0,
            activeEmployers: data.activeEmployers || 0,
            skilledWorkers: data.skilledWorkers || 0,
            successRate: data.successRate || 0,
            loading: false,
          });
        } else if (!cancelled) {
          // API unavailable — derive available-jobs count from loaded data
          setPlatformStats((prev) => ({
            ...prev,
            availableJobs: jobsCountRef.current,
            loading: false,
          }));
        }
      } catch {
        if (!cancelled) {
          setPlatformStats((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    fetchStats();

    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []); // Fetch once on mount, refresh via interval

  // Deduplicate jobs by ID (server handles filtering; no redundant client-side filter)
  const uniqueJobs = useMemo(
    () => getSortedUniqueJobs(jobs, sortBy),
    [jobs, sortBy],
  );

  useEffect(() => {
    const nextSearchParams = new URLSearchParams();
    const trimmedSearch = searchQuery.trim();

    if (trimmedSearch) {
      nextSearchParams.set('q', trimmedSearch);
    }
    if (selectedCategory) {
      nextSearchParams.set('category', selectedCategory);
    }
    if (selectedLocation) {
      nextSearchParams.set('location', selectedLocation);
    }
    if (sortBy !== 'relevance') {
      nextSearchParams.set('sort', sortBy);
    }
    if (page > 1) {
      nextSearchParams.set('page', String(page));
    }
    if (budgetFilterActive) {
      nextSearchParams.set('minBudget', String(budgetRange[0]));
      nextSearchParams.set('maxBudget', String(budgetRange[1]));
    }
    if (quickFilters.urgent) {
      nextSearchParams.set('urgent', '1');
    }
    if (quickFilters.verified) {
      nextSearchParams.set('verified', '1');
    }
    if (quickFilters.fullTime) {
      nextSearchParams.set('fullTime', '1');
    }
    if (quickFilters.contract) {
      nextSearchParams.set('contract', '1');
    }

    const currentParams = searchParams.toString();
    const nextParams = nextSearchParams.toString();
    if (currentParams !== nextParams) {
      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [
    searchQuery,
    selectedCategory,
    selectedLocation,
    sortBy,
    page,
    budgetFilterActive,
    budgetRange,
    quickFilters,
    searchParams,
    setSearchParams,
  ]);

  return (
    <ErrorBoundary>
      <PageCanvas
        disableContainer
        sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}
      >
        <PullToRefresh onRefresh={retryJobsFetch}>
          <Box
            sx={{
              minHeight: '100vh',
              color: 'text.primary',
              backgroundColor: 'background.default',
              backgroundImage:
                theme.palette.mode === 'dark'
                  ? 'radial-gradient(circle at 10% 0%, rgba(255,215,0,0.12) 0%, transparent 28%), radial-gradient(circle at 88% 8%, rgba(255,215,0,0.06) 0%, transparent 22%)'
                  : 'linear-gradient(180deg, rgba(249,247,237,0.98) 0%, rgba(255,255,255,0.96) 100%)',
            }}
          >
            {/* Breadcrumb Navigation */}
            <BreadcrumbNavigation />

            <Container maxWidth="xl" sx={{ py: 0, pt: 1 }}>
              <Helmet>
                <title>
                  Find Skilled Trade Jobs - Kelmah | Ghana's Premier Job
                  Platform
                </title>
                <meta
                  name="description"
                  content="Discover high-paying skilled trade opportunities across Ghana. Connect with top employers in electrical, plumbing, carpentry, HVAC, and construction."
                />
              </Helmet>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                {...motionProps}
              >
                <DiscoveryShellFrame
                  heading="Find Jobs in Ghana"
                  subheading="Search by trade, location, and budget, then refine with filters."
                  isMobile={isMobile}
                  quickPicks={
                    !hasActiveFilters && !effectiveSearch ? (
                      <Box
                        sx={{
                          mb: { xs: 2, md: 0 },
                          px: { xs: 0.5, sm: 0 },
                          display: { xs: 'block', md: 'none' },
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: 'var(--k-gold)',
                            fontWeight: 'bold',
                            mb: { xs: 1, md: 0 },
                            fontSize: { xs: '0.95rem', sm: '1rem' },
                            textAlign: 'left',
                          }}
                        >
                          Quick trade picks
                        </Typography>
                        <JobsCategoryBrowseGrid
                          categoryData={categoryData}
                          selectedCategory={selectedCategory}
                          onSelectCategory={handleBrowseCategorySelect}
                          isMobile={isMobile}
                        />
                      </Box>
                    ) : null
                  }
                >
                  <JobsFiltersPanel
                    isMobile={isMobile}
                    isSmallMobile={isSmallMobile}
                    searchQuery={searchQuery}
                    onSearchInputChange={setSearchQuery}
                    onSearchSubmit={handleSearchSubmit}
                    mobileFilterOpen={mobileFilterOpen}
                    onOpenMobileFilters={handleOpenMobileFilters}
                    onCloseMobileFilters={handleCloseMobileFilters}
                    onApplyMobileFilters={handleApplyMobileFilters}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    selectedLocation={selectedLocation}
                    onLocationChange={setSelectedLocation}
                    budgetRange={budgetRange}
                    showFilters={showFilters}
                    onToggleFilters={handleToggleFilters}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    isJobsFetching={isJobsFetching}
                    budgetFilterActive={budgetFilterActive}
                    onBudgetFilterToggle={handleBudgetFilterToggle}
                    onBudgetRangeChange={handleBudgetRangeChange}
                    quickFilters={quickFilters}
                    onToggleQuickFilter={toggleQuickFilter}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    onClearAllFilters={clearAllFilters}
                  />
                </DiscoveryShellFrame>
              </motion.div>

              {/* Enhanced Jobs Grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                {...motionProps}
              >
                <JobsResultsHeader
                  isMobile={isMobile}
                  selectedCategory={selectedCategory}
                  hasActiveFilters={hasActiveFilters}
                  effectiveSearch={effectiveSearch}
                  selectedLocation={selectedLocation}
                  budgetFilterActive={budgetFilterActive}
                  budgetRange={budgetRange}
                  quickFilters={quickFilters}
                  sortBy={sortBy}
                  onClearSearch={() => {
                    setSearchQuery('');
                    setSubmittedSearch(null);
                  }}
                  onClearCategory={() => setSelectedCategory('')}
                  onClearLocation={() => setSelectedLocation('')}
                  onClearBudget={() => {
                    setBudgetFilterActive(false);
                    setBudgetRange([0, 100000]);
                  }}
                  onToggleQuickFilter={toggleQuickFilter}
                  onClearAllFilters={clearAllFilters}
                  totalJobs={totalJobs}
                  uniqueJobsLength={uniqueJobs.length}
                />

                <JobsGridStatePanels
                  loading={loading}
                  error={error}
                  retryJobsFetch={retryJobsFetch}
                  uniqueJobs={uniqueJobs}
                  effectiveSearch={effectiveSearch}
                  selectedCategory={selectedCategory}
                  selectedLocation={selectedLocation}
                  budgetFilterActive={budgetFilterActive}
                  onClearSearch={() => {
                    setSearchQuery('');
                    setSubmittedSearch(null);
                  }}
                  onClearCategory={() => setSelectedCategory('')}
                  onClearLocation={() => setSelectedLocation('')}
                  onClearBudget={() => {
                    setBudgetFilterActive(false);
                    setBudgetRange([0, 100000]);
                  }}
                  clearAllFilters={clearAllFilters}
                />

                {!loading && !error && (
                  <JobsCardsGrid
                    uniqueJobs={uniqueJobs}
                    isMobile={isMobile}
                    isSmallMobile={isSmallMobile}
                    motionProps={motionProps}
                    navigate={navigate}
                    handlePrimaryJobAction={handlePrimaryJobAction}
                    isHirerUser={isHirerUser}
                    handleToggleBookmark={handleToggleBookmark}
                    savedJobIds={savedJobIds}
                    theme={theme}
                    getCategoryIcon={getCategoryIcon}
                  />
                )}
              </motion.div>

              <JobsPaginationControls
                loading={loading}
                error={error}
                uniqueJobs={uniqueJobs}
                totalJobs={totalJobs}
                hasMore={hasMore}
                loadMoreRef={loadMoreRef}
                isJobsFetching={isJobsFetching}
                onLoadMore={() => setPage((p) => p + 1)}
                totalPages={totalPages}
                page={page}
                onPageChange={(newPage) => {
                  setPage(newPage);
                  // On desktop pagination, replace jobs instead of append
                  setJobs([]);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </Container>
          </Box>
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            message={snackbar.message}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          />
        </PullToRefresh>
      </PageCanvas>
    </ErrorBoundary>
  );
};

export default JobsPage;
