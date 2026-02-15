import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  Chip,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
  Stack,
  TextField,
  InputAdornment,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Paper,
  Card,
  CardContent,
  Avatar,
  Badge,
  Skeleton,
  Rating,
  Slide,
} from '@mui/material';
import {
  Work as JobIcon,
  Person as WorkerIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  Verified as VerifiedIcon,
  LocationOn as LocationOnIcon,
  AttachMoney as MoneyIcon,
  Close as CloseIcon,
  MyLocation as MyLocationIcon,
  Clear as ClearIcon,
  Navigation as NavigationIcon,
  Chat as ChatIcon,
  Map as MapViewIcon,
  ViewList as ListViewIcon,
  GpsFixed as GpsFixedIcon,
  NearMe as NearMeIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import InteractiveMap from '../components/common/InteractiveMap';
import mapService from '../services/mapService';

// ────────────────────────────────────────────────────────────
//  Bottom Sheet – Uber/Bolt-style pull-up results panel
// ────────────────────────────────────────────────────────────
const BottomSheet = ({ open, onToggle, children, title, count, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  if (!isMobile) return null;

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Paper
        elevation={16}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: '65vh',
          zIndex: 1200,
          borderRadius: '20px 20px 0 0',
          overflow: 'hidden',
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Box
          onClick={onToggle}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pt: 1,
            pb: 1.5,
            cursor: 'pointer',
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              bgcolor: theme.palette.divider,
              mb: 1,
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {title}
            </Typography>
            {count > 0 && <Chip label={count} size="small" color="primary" />}
            {loading && <CircularProgress size={16} />}
          </Box>
        </Box>
        <Divider />
        <Box sx={{ overflow: 'auto', maxHeight: 'calc(65vh - 60px)', pb: 2 }}>
          {children}
        </Box>
      </Paper>
    </Slide>
  );
};

// ────────────────────────────────────────────────────────────
//  Result Card – compact job/worker card for the list
// ────────────────────────────────────────────────────────────
const ResultCard = ({ item, viewType, onSelect, onNavigate, onMessage }) => {
  const theme = useTheme();
  const isJob = viewType === 'jobs';

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      layout
    >
      <Card
        onClick={() => onSelect(item)}
        sx={{
          mx: 2,
          mb: 1.5,
          cursor: 'pointer',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          transition: 'all 0.25s ease',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 4px 20px ${theme.palette.primary.main}22`,
            transform: 'translateY(-2px)',
          },
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Avatar
              src={!isJob ? item.profileImage : undefined}
              sx={{
                width: 48,
                height: 48,
                bgcolor: isJob
                  ? theme.palette.secondary.main + '22'
                  : theme.palette.primary.main + '22',
                color: isJob
                  ? theme.palette.secondary.main
                  : theme.palette.primary.main,
              }}
            >
              {isJob ? <JobIcon /> : <WorkerIcon />}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                <Typography variant="subtitle2" noWrap fontWeight="bold">
                  {isJob ? item.title : item.name}
                </Typography>
                {item.verified && (
                  <VerifiedIcon sx={{ fontSize: 16, color: '#4CAF50' }} />
                )}
                {item.urgent && (
                  <Chip
                    label="URGENT"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.6rem',
                      bgcolor: '#FF5722',
                      color: '#fff',
                      fontWeight: 'bold',
                    }}
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" noWrap>
                {item.category}
                {item.distance != null &&
                  ` · ${mapService.formatDistance(item.distance)}`}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 0.75, alignItems: 'center' }}>
                {isJob ? (
                  <Chip
                    icon={<MoneyIcon sx={{ fontSize: 14 }} />}
                    label={`GHS ${item.budget?.toLocaleString() ?? '—'}`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 24 }}
                  />
                ) : (
                  <>
                    {item.rating > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                        <StarIcon sx={{ fontSize: 14, color: '#FF9800' }} />
                        <Typography variant="caption" fontWeight="bold">
                          {item.rating.toFixed(1)}
                        </Typography>
                      </Box>
                    )}
                    {item.hourlyRate && (
                      <Typography variant="caption" color="secondary">
                        GHS {item.hourlyRate}/hr
                      </Typography>
                    )}
                    {item.online && (
                      <Chip
                        label="Online"
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.6rem',
                          bgcolor: '#4CAF5022',
                          color: '#4CAF50',
                          fontWeight: 'bold',
                        }}
                      />
                    )}
                  </>
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 'auto' }}>
              <Tooltip title="Get Directions">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(item);
                  }}
                  sx={{
                    bgcolor: theme.palette.primary.main + '15',
                    color: theme.palette.primary.main,
                    width: 32,
                    height: 32,
                  }}
                >
                  <NavigationIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Message">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMessage(item);
                  }}
                  sx={{
                    bgcolor: theme.palette.secondary.main + '15',
                    color: theme.palette.secondary.main,
                    width: 32,
                    height: 32,
                  }}
                >
                  <ChatIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ────────────────────────────────────────────────────────────
//  MAIN PAGE – Professional Uber/Bolt-style Map
// ────────────────────────────────────────────────────────────
const ProfessionalMapPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const refreshTimer = useRef(null);

  // State
  const [viewType, setViewType] = useState(searchParams.get('view') || 'jobs');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    distance: Number(searchParams.get('radius')) || 25,
    sortBy: 'distance',
  });
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });
  const [locating, setLocating] = useState(true);
  const [listMode, setListMode] = useState(false);

  const mapCenter = useMemo(
    () =>
      userLocation
        ? [userLocation.latitude, userLocation.longitude]
        : [5.6037, -0.187],
    [userLocation],
  );

  // Get location on mount
  useEffect(() => {
    setLocating(true);
    mapService
      .getCurrentLocation()
      .then((loc) => {
        setUserLocation(loc);
        setLocating(false);
      })
      .catch(() => {
        setLocating(false);
        setSnack({
          open: true,
          message: 'Could not detect your location — showing Accra',
          severity: 'warning',
        });
      });
  }, []);

  // Fetch live data
  const fetchData = useCallback(async () => {
    const loc = userLocation || { latitude: 5.6037, longitude: -0.187 };
    setLoading(true);
    try {
      const params = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        radius: filters.distance,
        category: filters.category || undefined,
      };
      const data =
        viewType === 'jobs'
          ? await mapService.searchJobsNearLocation(params)
          : await mapService.searchWorkersNearLocation(params);
      setMarkers(data);
    } catch {
      setMarkers([]);
    } finally {
      setLoading(false);
    }
  }, [userLocation, viewType, filters.distance, filters.category]);

  useEffect(() => {
    if (!locating) fetchData();
  }, [fetchData, locating]);

  // Auto-refresh every 30s
  useEffect(() => {
    refreshTimer.current = setInterval(() => {
      if (!locating) fetchData();
    }, 30_000);
    return () => clearInterval(refreshTimer.current);
  }, [fetchData, locating]);

  // Handlers
  const handleMarkerClick = useCallback(
    (marker) => {
      setSelectedItem(marker);
      if (isMobile) setSheetOpen(true);
    },
    [isMobile],
  );

  const handleViewDetails = useCallback(
    (item) => {
      if (item.type === 'job') navigate(`/jobs/${item.id}`);
      else navigate(`/workers/${item.id}`);
    },
    [navigate],
  );

  const handleNavigate = useCallback((item) => {
    if (!item.coordinates) return;
    const { latitude, longitude } = item.coordinates;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      '_blank',
    );
  }, []);

  const handleMessage = useCallback(
    (item) => {
      const userId =
        item.type === 'job' ? item.hirer?.id || item.hirer : item.id;
      if (!userId) {
        setSnack({
          open: true,
          message: 'Unable to identify recipient for this conversation.',
          severity: 'warning',
        });
        return;
      }

      navigate(`/messages?recipient=${userId}`);
    },
    [navigate],
  );

  const handleClearFilters = useCallback(() => {
    setFilters({ category: '', distance: 25, sortBy: 'distance' });
    setSearchQuery('');
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return markers;
    const q = searchQuery.toLowerCase();
    return markers.filter(
      (m) =>
        (m.title || '').toLowerCase().includes(q) ||
        (m.name || '').toLowerCase().includes(q) ||
        (m.category || '').toLowerCase().includes(q) ||
        (m.skills || []).some((s) => s.toLowerCase().includes(q)),
    );
  }, [markers, searchQuery]);

  const categories = mapService.getVocationalCategories();

  // ── Render ──
  return (
    <Box
      sx={{
        height: 'calc(100dvh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        bgcolor: theme.palette.background.default,
      }}
    >
      {/* TOP BAR */}
      <Box
        sx={{
          px: { xs: 1.5, md: 3 },
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: { xs: 'wrap', md: 'nowrap' },
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          zIndex: 10,
        }}
      >
        <TextField
          size="small"
          placeholder={
            viewType === 'jobs'
              ? 'Search jobs near you…'
              : 'Search workers near you…'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1, minWidth: 180 }}
        />

        <ToggleButtonGroup
          value={viewType}
          exclusive
          onChange={(_, v) => v && setViewType(v)}
          size="small"
        >
          <ToggleButton value="jobs" sx={{ px: 1.5 }}>
            <JobIcon sx={{ mr: 0.5, fontSize: 18 }} /> Jobs
          </ToggleButton>
          <ToggleButton value="workers" sx={{ px: 1.5 }}>
            <WorkerIcon sx={{ mr: 0.5, fontSize: 18 }} /> Workers
          </ToggleButton>
        </ToggleButtonGroup>

        <Tooltip title="Filters">
          <IconButton
            onClick={() => setShowFilters(!showFilters)}
            color={showFilters ? 'primary' : 'default'}
            size="small"
          >
            <FilterIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Refresh">
          <IconButton onClick={fetchData} disabled={loading} size="small">
            {loading ? <CircularProgress size={18} /> : <RefreshIcon />}
          </IconButton>
        </Tooltip>

        {isMobile && (
          <Tooltip title={listMode ? 'Map View' : 'List View'}>
            <IconButton
              size="small"
              onClick={() => setListMode(!listMode)}
              color="primary"
            >
              {listMode ? <MapViewIcon /> : <ListViewIcon />}
            </IconButton>
          </Tooltip>
        )}

        <Chip
          label={`${filtered.length} found`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        />
      </Box>

      {/* FILTER BAR */}
      <Collapse in={showFilters}>
        <Box
          sx={{
            px: { xs: 1.5, md: 3 },
            py: 1.5,
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',
            bgcolor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              onChange={(e) =>
                setFilters((f) => ({ ...f, category: e.target.value }))
              }
              label="Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Radius</InputLabel>
            <Select
              value={filters.distance}
              onChange={(e) =>
                setFilters((f) => ({ ...f, distance: e.target.value }))
              }
              label="Radius"
            >
              {[5, 10, 25, 50, 100].map((r) => (
                <MenuItem key={r} value={r}>
                  Within {r} km
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Sort</InputLabel>
            <Select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((f) => ({ ...f, sortBy: e.target.value }))
              }
              label="Sort"
            >
              <MenuItem value="distance">Nearest</MenuItem>
              <MenuItem value="rating">Top Rated</MenuItem>
              <MenuItem value="price">Price</MenuItem>
              <MenuItem value="date">Newest</MenuItem>
            </Select>
          </FormControl>

          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
          >
            Clear
          </Button>
        </Box>
      </Collapse>

      {/* MAIN CONTENT */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* SIDE PANEL (desktop) */}
        {!isMobile && (
          <Box
            sx={{
              width: 380,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              borderRight: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.paper,
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold">
                  {viewType === 'jobs' ? 'Nearby Jobs' : 'Nearby Workers'}
                </Typography>
                <Chip
                  icon={<GpsFixedIcon sx={{ fontSize: 14 }} />}
                  label={
                    locating ? 'Locating…' : `${filtered.length} results`
                  }
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
              {loading && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
              {loading && filtered.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Box key={i} sx={{ px: 2, mb: 1.5 }}>
                    <Skeleton variant="rounded" height={80} />
                  </Box>
                ))
              ) : filtered.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                  <NearMeIcon
                    sx={{
                      fontSize: 48,
                      color: theme.palette.text.disabled,
                      mb: 1,
                    }}
                  />
                  <Typography variant="body1" color="text.secondary">
                    No {viewType} found nearby
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Try increasing your search radius or changing filters
                  </Typography>
                </Box>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filtered.map((item) => (
                    <ResultCard
                      key={item.id}
                      item={item}
                      viewType={viewType}
                      onSelect={handleMarkerClick}
                      onNavigate={handleNavigate}
                      onMessage={handleMessage}
                    />
                  ))}
                </AnimatePresence>
              )}
            </Box>
          </Box>
        )}

        {/* MAP */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            display: isMobile && listMode ? 'none' : 'flex',
          }}
        >
          <InteractiveMap
            center={mapCenter}
            zoom={14}
            markers={filtered}
            onMarkerClick={handleMarkerClick}
            showUserLocation
            showSearchRadius
            searchRadius={filters.distance}
            height="100%"
            controls={{
              location: true,
              zoom: true,
              layers: true,
              fullscreen: true,
            }}
          />

          {locating && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1100,
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <MyLocationIcon
                  sx={{ fontSize: 48, color: theme.palette.primary.main }}
                />
              </motion.div>
            </Box>
          )}
        </Box>

        {/* MOBILE LIST VIEW */}
        {isMobile && listMode && (
          <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
            {loading && filtered.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Box key={i} sx={{ px: 2, mb: 1.5 }}>
                  <Skeleton variant="rounded" height={80} />
                </Box>
              ))
            ) : filtered.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                <NearMeIcon
                  sx={{
                    fontSize: 48,
                    color: theme.palette.text.disabled,
                    mb: 1,
                  }}
                />
                <Typography variant="body1" color="text.secondary">
                  No {viewType} found nearby
                </Typography>
              </Box>
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.map((item) => (
                  <ResultCard
                    key={item.id}
                    item={item}
                    viewType={viewType}
                    onSelect={handleMarkerClick}
                    onNavigate={handleNavigate}
                    onMessage={handleMessage}
                  />
                ))}
              </AnimatePresence>
            )}
          </Box>
        )}
      </Box>

      {/* MOBILE BOTTOM SHEET */}
      {isMobile && !listMode && (
        <BottomSheet
          open={sheetOpen}
          onToggle={() => setSheetOpen(!sheetOpen)}
          title={viewType === 'jobs' ? 'Nearby Jobs' : 'Nearby Workers'}
          count={filtered.length}
          loading={loading}
        >
          {filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No {viewType} found nearby
              </Typography>
            </Box>
          ) : (
            filtered.map((item) => (
              <ResultCard
                key={item.id}
                item={item}
                viewType={viewType}
                onSelect={handleViewDetails}
                onNavigate={handleNavigate}
                onMessage={handleMessage}
              />
            ))
          )}
        </BottomSheet>
      )}

      {/* SELECTED-ITEM FLYOUT (desktop) */}
      {!isMobile && selectedItem && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            style={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              zIndex: 1100,
              width: 360,
            }}
          >
            <Card
              elevation={12}
              sx={{
                borderRadius: 3,
                border: `2px solid ${theme.palette.primary.main}33`,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  height: 4,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                }}
              />
              <CardContent sx={{ p: 2.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <Avatar
                      src={selectedItem.profileImage}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: theme.palette.primary.main + '22',
                        color: theme.palette.primary.main,
                      }}
                    >
                      {selectedItem.type === 'job' ? (
                        <JobIcon />
                      ) : (
                        <WorkerIcon />
                      )}
                    </Avatar>
                    <Box>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        noWrap
                        sx={{ maxWidth: 200 }}
                      >
                        {selectedItem.title || selectedItem.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedItem.category}
                        {selectedItem.distance != null &&
                          ` · ${mapService.formatDistance(selectedItem.distance)}`}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedItem(null)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                {selectedItem.skills?.length > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 0.5,
                      flexWrap: 'wrap',
                      mb: 1.5,
                    }}
                  >
                    {selectedItem.skills.slice(0, 4).map((s) => (
                      <Chip
                        key={s}
                        label={s}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                )}

                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  {selectedItem.budget && (
                    <Chip
                      icon={<MoneyIcon />}
                      label={`GHS ${selectedItem.budget.toLocaleString()}`}
                      size="small"
                      color="secondary"
                    />
                  )}
                  {selectedItem.rating > 0 && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <Rating
                        value={selectedItem.rating}
                        precision={0.5}
                        size="small"
                        readOnly
                      />
                      <Typography variant="caption">
                        ({selectedItem.reviewCount || 0})
                      </Typography>
                    </Box>
                  )}
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    onClick={() => handleViewDetails(selectedItem)}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    {selectedItem.type === 'job'
                      ? 'View Job'
                      : 'View Profile'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleNavigate(selectedItem)}
                    sx={{ borderRadius: 2, minWidth: 44 }}
                  >
                    <NavigationIcon />
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleMessage(selectedItem)}
                    sx={{ borderRadius: 2, minWidth: 44 }}
                  >
                    <ChatIcon />
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}

      {/* SNACKBAR */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfessionalMapPage;
