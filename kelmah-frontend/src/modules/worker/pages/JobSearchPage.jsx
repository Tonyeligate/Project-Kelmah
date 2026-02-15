/**
 * JobSearchPage — Worker "Find Work" page
 *
 * Redesigned: Feb 2026
 * Philosophy: search-first, professional, no marketing splash.
 * Workers visit daily — get them to results fast.
 *
 * DATA FLOW:
 *   useJobsQuery(filters) → jobsService.getJobs() → GET /api/jobs
 *   useSavedJobsQuery()   → jobsService.getSavedJobs() → GET /api/jobs/saved
 *   useSaveJobMutation()  → jobsService.saveJob()   → POST /api/jobs/:id/save
 *   useUnsaveJobMutation()→ jobsService.unsaveJob()  → DELETE /api/jobs/:id/save
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
  Badge,
  Drawer,
  Slider,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  Close as CloseIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Bookmark as BookmarkIcon,
  LocationOn as LocationOnIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon,
  WorkOutline as WorkIcon,
  TuneRounded as TuneIcon,
  SortRounded as SortIcon,
  Clear as ClearIcon,
  ElectricalServices as ElectricalIcon,
  Plumbing as PlumbingIcon,
  Construction as ConstructionIcon,
  Handyman as HandymanIcon,
  FormatPaint as PaintIcon,
  Roofing as RoofingIcon,
  Thermostat as HvacIcon,
  HomeRepairService as HomeIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useJobsQuery,
  useSavedJobsQuery,
  useSaveJobMutation,
  useUnsaveJobMutation,
  useSavedJobIds,
} from '../../jobs/hooks/useJobsQuery';
import tradeCategories from '../../jobs/data/tradeCategories.json';
import ghanaLocations from '../../jobs/data/ghanaLocations.json';

// ─── Constants ──────────────────────────────────────────────
const ITEMS_PER_PAGE = 12;

const CATEGORY_ICONS = {
  Electrical: ElectricalIcon,
  Plumbing: PlumbingIcon,
  Construction: ConstructionIcon,
  Carpentry: HandymanIcon,
  Painting: PaintIcon,
  Roofing: RoofingIcon,
  HVAC: HvacIcon,
  Masonry: HomeIcon,
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'budget_high', label: 'Budget: High → Low' },
  { value: 'budget_low', label: 'Budget: Low → High' },
  { value: 'deadline', label: 'Deadline Soon' },
];

// ─── Utility: format relative time ─────────────────────────
const timeAgo = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' });
};

// ─── Utility: format currency ───────────────────────────────
const formatBudget = (budget, currency = 'GHS') => {
  if (!budget && budget !== 0) return 'Negotiable';
  const num = typeof budget === 'object' ? budget.max || budget.min || 0 : budget;
  return `${currency === 'GHS' ? 'GH₵' : '$'}${Number(num).toLocaleString()}`;
};

// ─── Subcomponent: Search Header ────────────────────────────
const SearchHeader = ({ search, setSearch, onSearch, resultCount, isLoading }) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        background: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(12px)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
      }}
    >
      <Stack spacing={1.5}>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ display: { xs: 'none', md: 'block' } }}
        >
          Find Work
        </Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            placeholder="Search by job title, skill, or keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearch('');
                      onSearch('');
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: {
                borderRadius: 2,
                bgcolor: alpha(theme.palette.background.default, 0.5),
              },
            }}
          />
          <Button
            variant="contained"
            onClick={() => onSearch()}
            aria-label="Search jobs"
            sx={{
              minWidth: { xs: 44, md: 100 },
              minHeight: 44,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            <SearchIcon sx={{ display: { md: 'none' } }} />
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>Search</Box>
          </Button>
        </Stack>
        {!isLoading && (
          <Typography variant="body2" color="text.secondary">
            {resultCount} {resultCount === 1 ? 'job' : 'jobs'} available
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};

// ─── Subcomponent: Category Chips ───────────────────────────
const CategoryChips = ({ selected, onChange }) => {
  const theme = useTheme();
  const categories = tradeCategories.filter((c) => c.value);
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        overflowX: 'auto',
        py: 1,
        px: 0.5,
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
      }}
    >
      <Chip
        label="All"
        variant={selected ? 'outlined' : 'filled'}
        onClick={() => onChange('')}
        sx={{
          fontWeight: 600,
          ...(!selected && {
            bgcolor: alpha(theme.palette.primary.main, 0.15),
            color: theme.palette.primary.main,
            borderColor: theme.palette.primary.main,
          }),
        }}
      />
      {categories.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.value];
        const isActive = selected === cat.value;
        return (
          <Chip
            key={cat.value}
            icon={Icon ? <Icon sx={{ fontSize: 16, ml: 0.5 }} /> : undefined}
            label={cat.value}
            variant={isActive ? 'filled' : 'outlined'}
            onClick={() => onChange(isActive ? '' : cat.value)}
            sx={{
              fontWeight: 500,
              whiteSpace: 'nowrap',
              ...(isActive && {
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: theme.palette.primary.main,
                borderColor: theme.palette.primary.main,
              }),
            }}
          />
        );
      })}
    </Stack>
  );
};

// ─── Subcomponent: Filter Panel ─────────────────────────────
const FilterPanel = ({
  location,
  setLocation,
  budgetRange,
  setBudgetRange,
  sortBy,
  setSortBy,
  onReset,
}) => {
  const theme = useTheme();
  return (
    <Stack spacing={2.5}>
      {/* Location */}
      <FormControl size="small" fullWidth>
        <InputLabel>Location</InputLabel>
        <Select
          value={location}
          label="Location"
          onChange={(e) => setLocation(e.target.value)}
          sx={{ borderRadius: 2 }}
        >
          {ghanaLocations.map((loc) => (
            <MenuItem key={loc.value} value={loc.value}>
              {loc.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Budget Range */}
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Budget Range (GH₵)
        </Typography>
        <Slider
          value={budgetRange}
          onChange={(_, v) => setBudgetRange(v)}
          valueLabelDisplay="auto"
          min={0}
          max={50000}
          step={500}
          valueLabelFormat={(v) => `GH₵${v.toLocaleString()}`}
          sx={{
            color: theme.palette.primary.main,
            '& .MuiSlider-thumb': { width: 24, height: 24 },
          }}
        />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            GH₵{budgetRange[0].toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            GH₵{budgetRange[1].toLocaleString()}
          </Typography>
        </Stack>
      </Box>

      {/* Sort */}
      <FormControl size="small" fullWidth>
        <InputLabel>Sort By</InputLabel>
        <Select
          value={sortBy}
          label="Sort By"
          onChange={(e) => setSortBy(e.target.value)}
          sx={{ borderRadius: 2 }}
        >
          {SORT_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="text"
        size="small"
        onClick={onReset}
        sx={{ alignSelf: 'flex-start', textTransform: 'none', color: 'text.secondary' }}
      >
        Reset Filters
      </Button>
    </Stack>
  );
};

// ─── Subcomponent: Job Card (clean, professional) ───────────
const FindWorkJobCard = ({ job, isSaved, onSave, onUnsave }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleClick = () => navigate(`/jobs/${job.id}`);
  const handleSaveToggle = (e) => {
    e.stopPropagation();
    if (isSaved) {
      onUnsave({ jobId: job.id });
    } else {
      onSave({ jobId: job.id, job });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      layout
    >
      <Card
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          bgcolor: theme.palette.background.paper,
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: alpha(theme.palette.primary.main, 0.4),
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.08)}`,
          },
        }}
      >
        {job.coverImage && (
          <CardMedia
            component="img"
            height={140}
            image={job.coverImage}
            alt={job.title || 'Job image'}
            sx={{ objectFit: 'cover' }}
          />
        )}
        <CardContent
          sx={{ p: { xs: 2, md: 2.5 }, '&:last-child': { pb: { xs: 2, md: 2.5 } } }}
        >
          {/* Top row: title + save */}
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            spacing={1}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{
                  color: 'text.primary',
                  mb: 0.25,
                  whiteSpace: { xs: 'normal', sm: 'nowrap' },
                  display: '-webkit-box',
                  WebkitLineClamp: { xs: 2, sm: 1 },
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {job.title}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="caption" color="text.secondary">
                  {job.hirerName || job.employer?.name || 'Employer'}
                </Typography>
                {(job.hirerVerified || job.employer?.verified) && (
                  <VerifiedIcon sx={{ fontSize: 14, color: theme.palette.info.main }} />
                )}
                <Typography variant="caption" color="text.secondary">
                  · {timeAgo(job.postedDate)}
                </Typography>
              </Stack>
            </Box>
            <Tooltip title={isSaved ? 'Unsave' : 'Save job'}>
              <IconButton
                size="small"
                onClick={handleSaveToggle}
                aria-label={isSaved ? 'Unsave job' : 'Save job'}
                sx={{
                  color: isSaved ? theme.palette.primary.main : 'text.secondary',
                  minWidth: 44,
                  minHeight: 44,
                  '&:hover': { color: theme.palette.primary.main },
                }}
              >
                {isSaved ? (
                  <BookmarkIcon fontSize="small" />
                ) : (
                  <BookmarkBorderIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Description */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.5,
            }}
          >
            {job.description || 'No description provided.'}
          </Typography>

          {/* Skills */}
          {job.skills?.length > 0 && (
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}
            >
              {job.skills.slice(0, isMobile ? 3 : 5).map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    color: theme.palette.primary.main,
                    fontWeight: 500,
                  }}
                />
              ))}
              {job.skills.length > (isMobile ? 3 : 5) && (
                <Chip
                  label={`+${job.skills.length - (isMobile ? 3 : 5)}`}
                  size="small"
                  sx={{ height: 24, fontSize: '0.7rem' }}
                />
              )}
            </Stack>
          )}

          {/* Meta row: budget, location, category, urgency */}
          <Divider sx={{ my: 1.5, borderColor: alpha(theme.palette.divider, 0.4) }} />
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
            sx={{ gap: 1 }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center">
              <MoneyIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
              <Typography variant="body2" fontWeight={600} color="primary.main">
                {formatBudget(job.budget, job.currency)}
              </Typography>
            </Stack>
            {job.location && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {job.location}
                </Typography>
              </Stack>
            )}
            {job.category && (
              <Chip
                label={job.category}
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.7rem', borderRadius: 1 }}
              />
            )}
            {job.urgent && (
              <Chip
                label="Urgent"
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  color: theme.palette.error.main,
                  fontWeight: 600,
                }}
              />
            )}
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ─── Subcomponent: Stats Bar ────────────────────────────────
const StatsBar = ({ data }) => {
  const theme = useTheme();
  const stats = useMemo(() => {
    const jobs = data?.jobs || data?.data || [];
    const totalJobs = data?.totalJobs || jobs.length;
    const categories = new Set(jobs.map((j) => j.category).filter(Boolean));
    const locations = new Set(jobs.map((j) => j.location).filter(Boolean));
    return [
      { label: 'Open Jobs', value: totalJobs, icon: WorkIcon },
      { label: 'Categories', value: categories.size, icon: TuneIcon },
      { label: 'Locations', value: locations.size, icon: LocationOnIcon },
    ];
  }, [data]);

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        py: 1.5,
        px: 2,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.primary.main, 0.04),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
      }}
    >
      {stats.map((s) => (
        <Stack key={s.label} direction="row" spacing={0.75} alignItems="center">
          <s.icon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
          <Typography variant="body2" fontWeight={600}>
            {s.value}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            {s.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
};

// ─── Skeleton Loader ────────────────────────────────────────
const JobCardSkeleton = () => (
  <Card sx={{ borderRadius: 3, p: 2.5 }}>
    <Skeleton variant="text" width="70%" height={24} />
    <Skeleton variant="text" width="40%" height={16} sx={{ mt: 0.5 }} />
    <Skeleton variant="text" width="100%" height={16} sx={{ mt: 1.5 }} />
    <Skeleton variant="text" width="90%" height={16} />
    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
      <Skeleton variant="rounded" width={60} height={24} />
      <Skeleton variant="rounded" width={60} height={24} />
      <Skeleton variant="rounded" width={60} height={24} />
    </Stack>
    <Divider sx={{ my: 1.5 }} />
    <Stack direction="row" spacing={2}>
      <Skeleton variant="text" width={80} height={20} />
      <Skeleton variant="text" width={100} height={20} />
    </Stack>
  </Card>
);

// ─── Empty State ────────────────────────────────────────────
const EmptyState = ({ hasFilters, onReset }) => (
  <Box sx={{ textAlign: 'center', py: 8 }}>
    <WorkIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
    <Typography variant="h6" fontWeight={600} gutterBottom>
      {hasFilters ? 'No jobs match your filters' : 'No jobs available yet'}
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}
    >
      {hasFilters
        ? 'Try adjusting your search terms or filters to find more opportunities.'
        : 'Check back soon — new jobs are posted regularly by hirers across Ghana.'}
    </Typography>
    {hasFilters && (
      <Button
        variant="outlined"
        onClick={onReset}
        sx={{ textTransform: 'none', borderRadius: 2 }}
      >
        Clear All Filters
      </Button>
    )}
  </Box>
);

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
const JobSearchPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Auth state
  const { user } = useSelector((state) => state.auth || {});

  // ─── Filter state (synced with URL params) ────────────────
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');
  const [activeSearch, setActiveSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [budgetRange, setBudgetRange] = useState([0, 50000]);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // ─── Build query filters ─────────────────────────────────
  const queryFilters = useMemo(() => {
    const f = {};
    if (activeSearch) f.search = activeSearch;
    if (category) f.category = category;
    if (location) f.location = location;
    f.page = page;
    f.limit = ITEMS_PER_PAGE;
    return f;
  }, [activeSearch, category, location, page]);

  // ─── Queries ──────────────────────────────────────────────
  const {
    data: jobsData,
    isLoading,
    isFetching,
    error,
  } = useJobsQuery(queryFilters);
  const { data: savedData } = useSavedJobsQuery({}, { enabled: Boolean(user) });
  const savedIds = useSavedJobIds(savedData);

  const saveMutation = useSaveJobMutation({
    onSuccess: () =>
      setSnackbar({ open: true, message: 'Job saved!', severity: 'success' }),
    onError: () =>
      setSnackbar({ open: true, message: 'Could not save job', severity: 'error' }),
  });
  const unsaveMutation = useUnsaveJobMutation({
    onSuccess: () =>
      setSnackbar({
        open: true,
        message: 'Job removed from saved',
        severity: 'info',
      }),
    onError: () =>
      setSnackbar({
        open: true,
        message: 'Could not unsave job',
        severity: 'error',
      }),
  });

  // ─── Derived data ────────────────────────────────────────
  const jobs = useMemo(() => {
    const items = jobsData?.jobs || jobsData?.data || [];
    const sorted = [...items];
    switch (sortBy) {
      case 'budget_high':
        sorted.sort((a, b) => (b.budget || 0) - (a.budget || 0));
        break;
      case 'budget_low':
        sorted.sort((a, b) => (a.budget || 0) - (b.budget || 0));
        break;
      case 'deadline':
        sorted.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        break;
      default:
        sorted.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    }
    // Client-side budget filter
    return sorted.filter((j) => {
      const b =
        typeof j.budget === 'object'
          ? j.budget.max || j.budget.min || 0
          : j.budget || 0;
      return b >= budgetRange[0] && (budgetRange[1] >= 50000 || b <= budgetRange[1]);
    });
  }, [jobsData, sortBy, budgetRange]);

  const totalPages =
    jobsData?.totalPages || Math.ceil(jobs.length / ITEMS_PER_PAGE) || 1;
  const hasFilters = Boolean(
    activeSearch ||
      category ||
      location ||
      budgetRange[0] > 0 ||
      budgetRange[1] < 50000,
  );

  // ─── Handlers ─────────────────────────────────────────────
  const handleSearch = useCallback(
    (override) => {
      const value = typeof override === 'string' ? override : searchText;
      setActiveSearch(value);
      setPage(1);
      const params = new URLSearchParams();
      if (value) params.set('search', value);
      if (category) params.set('category', category);
      if (location) params.set('location', location);
      setSearchParams(params, { replace: true });
    },
    [searchText, category, location, setSearchParams],
  );

  const handleCategoryChange = useCallback(
    (cat) => {
      setCategory(cat);
      setPage(1);
      const params = new URLSearchParams(window.location.search);
      if (cat) params.set('category', cat);
      else params.delete('category');
      setSearchParams(params, { replace: true });
    },
    [setSearchParams],
  );

  const handleResetFilters = useCallback(() => {
    setSearchText('');
    setActiveSearch('');
    setCategory('');
    setLocation('');
    setBudgetRange([0, 50000]);
    setSortBy('newest');
    setPage(1);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  // Sync URL params on mount
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && cat !== category) setCategory(cat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Filter panel content ────────────────────────────────
  const filterContent = (
    <FilterPanel
      location={location}
      setLocation={(v) => {
        setLocation(v);
        setPage(1);
      }}
      budgetRange={budgetRange}
      setBudgetRange={setBudgetRange}
      sortBy={sortBy}
      setSortBy={setSortBy}
      onReset={handleResetFilters}
    />
  );

  // ─── Render ───────────────────────────────────────────────
  return (
    <>
      <Helmet>
        <title>Find Work | Kelmah</title>
        <meta
          name="description"
          content="Browse available jobs and find work opportunities across Ghana on Kelmah."
        />
      </Helmet>

      <Box
        sx={{
          minHeight: '100dvh',
          bgcolor: 'background.default',
          pb: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
        }}
      >
        <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 3 } }}>
          {/* ─── Search Header ─────────────────────────── */}
          <SearchHeader
            search={searchText}
            setSearch={setSearchText}
            onSearch={handleSearch}
            resultCount={jobsData?.totalJobs || jobs.length}
            isLoading={isLoading}
          />

          {/* ─── Category Chips ────────────────────────── */}
          <Box sx={{ mt: 2 }}>
            <CategoryChips selected={category} onChange={handleCategoryChange} />
          </Box>

          {/* ─── Stats Bar ─────────────────────────────── */}
          {!isLoading && jobs.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <StatsBar data={jobsData} />
            </Box>
          )}

          {/* ─── Toolbar: view toggle + filter button ──── */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: 2 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              {isMobile && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterListIcon />}
                  onClick={() => setFilterDrawerOpen(true)}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  Filters
                  {hasFilters && <Badge color="primary" variant="dot" sx={{ ml: 1 }} />}
                </Button>
              )}
              <FormControl
                size="small"
                sx={{ minWidth: 150, display: { xs: 'none', md: 'flex' } }}
              >
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  displayEmpty
                  startAdornment={
                    <SortIcon
                      sx={{ mr: 0.5, fontSize: 18, color: 'text.secondary' }}
                    />
                  }
                  sx={{ borderRadius: 2, fontSize: '0.85rem' }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, v) => v && setViewMode(v)}
              size="small"
            >
              <ToggleButton value="grid" sx={{ px: 1.5 }}>
                <GridViewIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="list" sx={{ px: 1.5 }}>
                <ListViewIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {/* ─── Main Content: Sidebar + Jobs Grid ─────── */}
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {/* Desktop Sidebar Filters */}
            {!isMobile && (
              <Grid item xs={12} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    position: 'sticky',
                    top: 80,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                    <FilterListIcon
                      sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }}
                    />
                    Filters
                  </Typography>
                  {filterContent}
                </Paper>
              </Grid>
            )}

            {/* Jobs Grid */}
            <Grid item xs={12} md={isMobile ? 12 : 9}>
              {/* Loading skeletons */}
              {isLoading && (
                <Grid container spacing={2}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Grid
                      item
                      xs={12}
                      sm={viewMode === 'grid' ? 6 : 12}
                      key={i}
                    >
                      <JobCardSkeleton />
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Fetching indicator */}
              {!isLoading && isFetching && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 1, display: 'block' }}
                >
                  Updating results…
                </Typography>
              )}

              {/* Error state */}
              {error && !isLoading && (
                <Alert severity="warning" sx={{ borderRadius: 2, mb: 2 }}>
                  Could not load jobs. Please try again.
                </Alert>
              )}

              {/* Empty state */}
              {!isLoading && !error && jobs.length === 0 && (
                <EmptyState hasFilters={hasFilters} onReset={handleResetFilters} />
              )}

              {/* Job Cards */}
              {!isLoading && jobs.length > 0 && (
                <>
                  <AnimatePresence mode="popLayout">
                    <Grid container spacing={2}>
                      {jobs.map((job) => (
                        <Grid
                          item
                          xs={12}
                          sm={viewMode === 'grid' ? 6 : 12}
                          lg={viewMode === 'grid' ? 6 : 12}
                          key={job.id}
                        >
                          <FindWorkJobCard
                            job={job}
                            isSaved={savedIds.has(job.id)}
                            onSave={(payload) => saveMutation.mutate(payload)}
                            onUnsave={(payload) => unsaveMutation.mutate(payload)}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </AnimatePresence>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Stack alignItems="center" sx={{ mt: 4 }}>
                      <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, p) => {
                          setPage(p);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        color="primary"
                        shape="rounded"
                        size={isMobile ? 'small' : 'medium'}
                      />
                    </Stack>
                  )}
                </>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ─── Mobile Filter Drawer ──────────────────────── */}
      <Drawer
        anchor="bottom"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '75vh',
            p: 3,
            pb: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
          },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Filters
          </Typography>
          <IconButton onClick={() => setFilterDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
        {filterContent}
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 3, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          onClick={() => setFilterDrawerOpen(false)}
        >
          Apply Filters
        </Button>
      </Drawer>

      {/* ─── Snackbar ──────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default JobSearchPage;
