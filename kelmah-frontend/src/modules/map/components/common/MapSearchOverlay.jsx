import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  Slider,
  Typography,
  Chip,
  Button,
  IconButton,
  Collapse,
  Card,
  CardContent,
  Avatar,
  Rating,
  Drawer,
  useMediaQuery,
  useTheme,
  InputAdornment,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Skeleton,
  Badge,
  Stack,
  LinearProgress,
  Tooltip,
  Zoom,
  Slide,
  Grow,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  Backdrop,
  Fab,
  AppBar,
  Toolbar,
  Container,
  CardActions,
  ButtonGroup,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  TuneRounded as TuneIcon,
  LocationOn as LocationIcon,
  WorkOutline as JobIcon,
  Person as WorkerIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  Build as BuildIcon,
  Schedule as ScheduleIcon,
  Verified as VerifiedIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  FilterList as FilterIcon,
  SortByAlpha as SortIcon,
  Refresh as RefreshIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingIcon, // FIXED: Use TrendingUp instead of non-existent Trending
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  Category as CategoryIcon,
  LocationCity as CityIcon,
  Map as MapIcon,
  Visibility as VisibilityIcon,
  RadioButtonChecked as LiveIcon,
  FlashOn as FlashIcon,
  EmojiEvents as AwardIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  AccessTime as TimeIcon,
  MonetizationOn as PriceIcon,
  Dashboard as DashboardIcon,
  MyLocation as MyLocationIcon,
  Layers as LayersIcon,
  PhotoCamera as PhotoIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Satellite as SatelliteIcon,
  Terrain as TerrainIcon,
  Traffic as TrafficIcon,
  DirectionsWalk as WalkIcon,
  DirectionsCar as DriveIcon,
  DirectionsTransit as TransitIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Launch as LaunchIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Grade as PremiumIcon,
  LocalOffer as OfferIcon,
  TrendingFlat as HorizontalTrendIcon,
  CallMade as CallMadeIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import LocationSelector from './LocationSelector';
import mapService from '../../services/mapService';

// 🎨 STUNNING ANIMATED BACKGROUND WITH PROFESSIONAL GRADIENTS
const AnimatedBackground = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 193, 7, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(0, 0, 0, 0.05) 0%, transparent 40%),
          linear-gradient(135deg, 
            rgba(0, 0, 0, 0.9) 0%, 
            rgba(26, 26, 26, 0.95) 25%,
            rgba(40, 40, 40, 0.98) 50%,
            rgba(26, 26, 26, 0.95) 75%,
            rgba(0, 0, 0, 0.9) 100%
          )
        `,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(255, 215, 0, 0.03) 2px,
              rgba(255, 215, 0, 0.03) 4px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255, 215, 0, 0.03) 2px,
              rgba(255, 215, 0, 0.03) 4px
            )
          `,
          animation: 'gridFlow 20s linear infinite',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            radial-gradient(circle at 50% 50%, 
              rgba(255, 215, 0, 0.1) 0%, 
              rgba(255, 215, 0, 0.05) 30%,
              transparent 70%
            )
          `,
          animation: 'pulse 4s ease-in-out infinite alternate',
        },
        '@keyframes gridFlow': {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(-4px, -4px)' },
        },
        '@keyframes pulse': {
          '0%': { opacity: 0.3 },
          '100%': { opacity: 0.7 },
        },
      }}
    />
  );
};

// 🚀 PROFESSIONAL FLOATING ACTION BUTTON WITH STUNNING ANIMATIONS
const FloatingControls = ({
  onToggleFullscreen,
  isFullscreen,
  onCenterMap,
  onRefresh,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const actions = [
    {
      icon: <RefreshIcon />,
      name: 'Refresh Map',
      onClick: onRefresh,
      color: 'primary',
    },
    {
      icon: <CenterIcon />,
      name: 'Center Map',
      onClick: onCenterMap,
      color: 'secondary',
    },
    { icon: <LayersIcon />, name: 'Toggle Layers', color: 'info' },
    { icon: <PhotoIcon />, name: 'Take Screenshot', color: 'success' },
    {
      icon: isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />,
      name: isFullscreen ? 'Exit Fullscreen' : 'Fullscreen',
      onClick: onToggleFullscreen,
      color: 'warning',
    },
  ];

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1300,
      }}
    >
      <SpeedDial
        ariaLabel="Map Controls"
        sx={{
          '& .MuiSpeedDial-fab': {
            background: `linear-gradient(135deg, 
              ${theme.palette.mode === 'dark' ? '#FFD700' : '#B8860B'} 0%, 
              ${theme.palette.mode === 'dark' ? '#FFA500' : '#DAA520'} 100%
            )`,
            color: '#000',
            width: 64,
            height: 64,
            '&:hover': {
              background: `linear-gradient(135deg, 
                ${theme.palette.mode === 'dark' ? '#FFE55C' : '#CD853F'} 0%, 
                ${theme.palette.mode === 'dark' ? '#FFB347' : '#DEB887'} 100%
              )`,
              transform: 'scale(1.1)',
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 8px 32px rgba(255, 215, 0, 0.3)`,
          },
          '& .MuiSpeedDialAction-fab': {
            width: 48,
            height: 48,
            background: `linear-gradient(135deg, 
              rgba(255, 215, 0, 0.9) 0%, 
              rgba(255, 193, 7, 0.9) 100%
            )`,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            color: '#000',
            '&:hover': {
              background: `linear-gradient(135deg, 
                rgba(255, 215, 0, 1) 0%, 
                rgba(255, 193, 7, 1) 100%
              )`,
              transform: 'scale(1.15)',
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        }}
        icon={<SpeedDialIcon />}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        direction="up"
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={() => {
              action.onClick?.();
              setOpen(false);
            }}
            sx={{
              '& .MuiSpeedDialAction-staticTooltip': {
                background: 'rgba(0, 0, 0, 0.9)',
                color: '#FFD700',
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
              },
            }}
          />
        ))}
      </SpeedDial>
    </Box>
  );
};

// 🌟 PREMIUM SEARCH BAR WITH STUNNING VISUAL EFFECTS
const PremiumSearchBar = ({
  searchTerm,
  onSearchChange,
  onClear,
  suggestions = [],
}) => {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: { xs: 'calc(100vw - 32px)', sm: 500, md: 600, lg: 700 },
        margin: '0 auto',
      }}
    >
      <motion.div
        animate={{
          scale: focused ? 1.02 : 1,
          y: focused ? -2 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="🔍 Search jobs, workers, locations..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <motion.div
                  animate={{ rotate: focused ? 360 : 0 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                >
                  <SearchIcon sx={{ color: '#FFD700', fontSize: 28 }} />
                </motion.div>
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  onClick={onClear}
                  sx={{
                    color: '#FFD700',
                    '&:hover': {
                      background: 'rgba(255, 215, 0, 0.1)',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              height: 60,
              background: `linear-gradient(135deg, 
                rgba(255, 255, 255, 0.95) 0%, 
                rgba(248, 248, 248, 0.95) 100%
              )`,
              backdropFilter: 'blur(20px)',
              borderRadius: 4,
              border: `2px solid ${focused ? '#FFD700' : 'rgba(255, 215, 0, 0.3)'}`,
              boxShadow: focused
                ? `0 12px 40px rgba(255, 215, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8)`
                : `0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)`,
              fontSize: '1.1rem',
              fontWeight: 500,
              color: '#333',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                borderColor: '#FFD700',
                boxShadow: `0 12px 40px rgba(255, 215, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
              },
              '& fieldset': {
                border: 'none',
              },
              '& input': {
                fontSize: '1.1rem',
                fontWeight: 500,
                '&::placeholder': {
                  color: 'rgba(0, 0, 0, 0.6)',
                  fontWeight: 400,
                },
              },
            },
          }}
        />
      </motion.div>

      {/* 🌟 PREMIUM SUGGESTIONS DROPDOWN */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Paper
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1500,
                mt: 1,
                background: `linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.98) 0%, 
                  rgba(248, 248, 248, 0.98) 100%
                )`,
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                borderRadius: 3,
                boxShadow: `0 16px 48px rgba(0, 0, 0, 0.15)`,
                maxHeight: 400,
                overflow: 'auto',
              }}
            >
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ListItem
                    button
                    onClick={() => onSearchChange(suggestion.title)}
                    sx={{
                      py: 2,
                      px: 3,
                      '&:hover': {
                        background:
                          'linear-gradient(90deg, rgba(255, 215, 0, 0.1), rgba(255, 193, 7, 0.05))',
                        transform: 'translateX(4px)',
                      },
                      transition: 'all 0.2s ease',
                      borderBottom:
                        index < suggestions.length - 1
                          ? '1px solid rgba(0, 0, 0, 0.05)'
                          : 'none',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          background:
                            'linear-gradient(135deg, #FFD700, #FFA500)',
                          color: '#000',
                          width: 40,
                          height: 40,
                        }}
                      >
                        {suggestion.type === 'job' ? (
                          <JobIcon />
                        ) : (
                          <WorkerIcon />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={suggestion.title}
                      secondary={suggestion.location}
                      primaryTypographyProps={{
                        fontWeight: 600,
                        color: '#333',
                      }}
                      secondaryTypographyProps={{
                        color: 'rgba(0, 0, 0, 0.6)',
                      }}
                    />
                  </ListItem>
                </motion.div>
              ))}
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

// 💎 ULTRA-PREMIUM FILTER PANEL WITH ADVANCED ANIMATIONS
const PremiumFilterPanel = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  categories = [],
  priceRange = [0, 1000],
  onPriceRangeChange,
  distance = 10,
  onDistanceChange,
  sortBy = 'relevance',
  onSortChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { label: 'Filters', icon: <FilterIcon /> },
    { label: 'Sort', icon: <SortIcon /> },
    { label: 'Location', icon: <LocationIcon /> },
    { label: 'Analytics', icon: <AnalyticsIcon /> },
  ];

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'left'}
      open={isOpen}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: isMobile ? '100%' : 400,
          height: isMobile ? '80vh' : '100%',
          background: `linear-gradient(135deg, 
            rgba(0, 0, 0, 0.95) 0%, 
            rgba(26, 26, 26, 0.98) 50%,
            rgba(40, 40, 40, 0.95) 100%
          )`,
          backdropFilter: 'blur(20px)',
          border: 'none',
          borderTop: isMobile ? '3px solid #FFD700' : 'none',
          borderRight: !isMobile ? '3px solid #FFD700' : 'none',
        },
      }}
    >
      <AnimatedBackground />

      {/* 🎯 PREMIUM HEADER WITH CLOSE BUTTON */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background:
            'linear-gradient(135deg, rgba(255, 215, 0, 0.9), rgba(255, 193, 7, 0.9))',
          color: '#000',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight="bold">
            🎯 Advanced Filters
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              color: '#000',
              '&:hover': {
                background: 'rgba(0, 0, 0, 0.1)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 📱 PREMIUM TABS NAVIGATION */}
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 215, 0, 0.2)' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255, 215, 0, 0.7)',
              fontWeight: 600,
              '&.Mui-selected': {
                color: '#FFD700',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#FFD700',
              height: 3,
            },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              label={tab.label}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {/* 🎨 TAB CONTENT WITH STUNNING ANIMATIONS */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <AnimatePresence mode="wait">
          {/* FILTERS TAB */}
          {activeTab === 0 && (
            <motion.div
              key="filters"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Stack spacing={4}>
                {/* 💰 PRICE RANGE SLIDER */}
                <Card
                  sx={{
                    background: 'rgba(255, 215, 0, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: 3,
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        color: '#FFD700',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <PriceIcon /> Price Range
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}
                    >
                      GH₵{priceRange[0]} - GH₵{priceRange[1]}
                    </Typography>
                    <Slider
                      value={priceRange}
                      onChange={(e, newValue) => onPriceRangeChange(newValue)}
                      valueLabelDisplay="auto"
                      min={0}
                      max={5000}
                      step={50}
                      sx={{
                        color: '#FFD700',
                        '& .MuiSlider-thumb': {
                          background:
                            'linear-gradient(135deg, #FFD700, #FFA500)',
                          border: '3px solid #000',
                          '&:hover': {
                            boxShadow: '0 0 0 8px rgba(255, 215, 0, 0.2)',
                          },
                        },
                        '& .MuiSlider-track': {
                          background:
                            'linear-gradient(90deg, #FFD700, #FFA500)',
                          height: 6,
                        },
                        '& .MuiSlider-rail': {
                          background: 'rgba(255, 215, 0, 0.2)',
                          height: 6,
                        },
                      }}
                    />
                  </CardContent>
                </Card>

                {/* 📍 DISTANCE SLIDER */}
                <Card
                  sx={{
                    background: 'rgba(255, 215, 0, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: 3,
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        color: '#FFD700',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <LocationIcon /> Distance: {distance} km
                    </Typography>
                    <Slider
                      value={distance}
                      onChange={(e, newValue) => onDistanceChange(newValue)}
                      valueLabelDisplay="auto"
                      min={1}
                      max={100}
                      step={1}
                      sx={{
                        color: '#FFD700',
                        '& .MuiSlider-thumb': {
                          background:
                            'linear-gradient(135deg, #FFD700, #FFA500)',
                          border: '3px solid #000',
                        },
                        '& .MuiSlider-track': {
                          background:
                            'linear-gradient(90deg, #FFD700, #FFA500)',
                          height: 6,
                        },
                        '& .MuiSlider-rail': {
                          background: 'rgba(255, 215, 0, 0.2)',
                          height: 6,
                        },
                      }}
                    />
                  </CardContent>
                </Card>

                {/* 🏷️ CATEGORIES */}
                <Card
                  sx={{
                    background: 'rgba(255, 215, 0, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: 3,
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        color: '#FFD700',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <CategoryIcon /> Categories
                    </Typography>
                    <Box
                      sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}
                    >
                      {[
                        'Construction',
                        'Plumbing',
                        'Electrical',
                        'Painting',
                        'Carpentry',
                        'Landscaping',
                      ].map((category) => (
                        <Chip
                          key={category}
                          label={category}
                          variant={
                            filters.categories?.includes(category)
                              ? 'filled'
                              : 'outlined'
                          }
                          onClick={() => {
                            const newCategories = filters.categories?.includes(
                              category,
                            )
                              ? filters.categories.filter((c) => c !== category)
                              : [...(filters.categories || []), category];
                            onFiltersChange({
                              ...filters,
                              categories: newCategories,
                            });
                          }}
                          sx={{
                            background: filters.categories?.includes(category)
                              ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                              : 'transparent',
                            color: filters.categories?.includes(category)
                              ? '#000'
                              : '#FFD700',
                            border: '1px solid #FFD700',
                            fontWeight: 600,
                            '&:hover': {
                              background:
                                'linear-gradient(135deg, #FFD700, #FFA500)',
                              color: '#000',
                              transform: 'scale(1.05)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Stack>
            </motion.div>
          )}

          {/* SORT TAB */}
          {activeTab === 1 && (
            <motion.div
              key="sort"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Stack spacing={3}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#FFD700',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <SortIcon /> Sort Options
                </Typography>

                <ToggleButtonGroup
                  value={sortBy}
                  exclusive
                  onChange={(e, newValue) => newValue && onSortChange(newValue)}
                  orientation="vertical"
                  fullWidth
                  sx={{
                    '& .MuiToggleButton-root': {
                      color: 'rgba(255, 215, 0, 0.7)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      py: 2,
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                        color: '#000',
                        fontWeight: 'bold',
                      },
                      '&:hover': {
                        background: 'rgba(255, 215, 0, 0.1)',
                      },
                    },
                  }}
                >
                  <ToggleButton value="relevance">
                    <Stack direction="row" alignItems="center" gap={1}>
                      <TrendingIcon />
                      <span>Relevance</span>
                    </Stack>
                  </ToggleButton>
                  <ToggleButton value="price-low">
                    <Stack direction="row" alignItems="center" gap={1}>
                      <MoneyIcon />
                      <span>Price: Low to High</span>
                    </Stack>
                  </ToggleButton>
                  <ToggleButton value="price-high">
                    <Stack direction="row" alignItems="center" gap={1}>
                      <PriceIcon />
                      <span>Price: High to Low</span>
                    </Stack>
                  </ToggleButton>
                  <ToggleButton value="rating">
                    <Stack direction="row" alignItems="center" gap={1}>
                      <StarIcon />
                      <span>Highest Rated</span>
                    </Stack>
                  </ToggleButton>
                  <ToggleButton value="distance">
                    <Stack direction="row" alignItems="center" gap={1}>
                      <LocationIcon />
                      <span>Nearest First</span>
                    </Stack>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </motion.div>
          )}

          {/* LOCATION TAB */}
          {activeTab === 2 && (
            <motion.div
              key="location"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Stack spacing={3}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#FFD700',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <LocationIcon /> Location Settings
                </Typography>

                <LocationSelector />

                <Button
                  variant="contained"
                  startIcon={<MyLocationIcon />}
                  fullWidth
                  sx={{
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    color: '#000',
                    fontWeight: 'bold',
                    py: 2,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #FFE55C, #FFB347)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Use My Current Location
                </Button>
              </Stack>
            </motion.div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 3 && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Stack spacing={3}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#FFD700',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <AnalyticsIcon /> Search Analytics
                </Typography>

                <Card
                  sx={{
                    background: 'rgba(255, 215, 0, 0.05)',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: 3,
                  }}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography sx={{ color: '#FFD700' }}>
                          Jobs Found
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ color: '#FFF', fontWeight: 'bold' }}
                        >
                          247
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography sx={{ color: '#FFD700' }}>
                          Workers Available
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ color: '#FFF', fontWeight: 'bold' }}
                        >
                          156
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography sx={{ color: '#FFD700' }}>
                          Avg. Response Time
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ color: '#FFF', fontWeight: 'bold' }}
                        >
                          2.3h
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* 🎯 ACTION BUTTONS */}
      <Box
        sx={{
          p: 3,
          borderTop: '1px solid rgba(255, 215, 0, 0.2)',
          background: 'rgba(0, 0, 0, 0.3)',
        }}
      >
        <Stack spacing={2}>
          <Button
            variant="contained"
            fullWidth
            sx={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              color: '#000',
              fontWeight: 'bold',
              py: 2,
              '&:hover': {
                background: 'linear-gradient(135deg, #FFE55C, #FFB347)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Apply Filters
          </Button>
          <Button
            variant="outlined"
            fullWidth
            sx={{
              color: '#FFD700',
              border: '1px solid #FFD700',
              py: 1.5,
              '&:hover': {
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid #FFD700',
              },
            }}
          >
            Reset All
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

// Professional stats card component
const QuickStatsCard = ({
  icon: IconComponent,
  title,
  value,
  color,
  trend,
}) => {
  const theme = useTheme();

  return (
    <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
      <Card
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${color}08 100%)`,
          border: `1px solid ${color}22`,
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, ${color} 0%, ${color}66 100%)`,
          },
          '&:hover': {
            boxShadow: `0 4px 20px ${color}33`,
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', color, lineHeight: 1 }}
              >
                {value}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem' }}
              >
                {title}
              </Typography>
            </Box>
            <Avatar
              sx={{
                bgcolor: `${color}22`,
                color: color,
                width: 36,
                height: 36,
              }}
            >
              <IconComponent fontSize="small" />
            </Avatar>
          </Box>
          {trend && (
            <Box sx={{ mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={Math.abs(trend)}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: `${color}22`,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: color,
                  },
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Enhanced result item with professional animations
const ProfessionalResultItem = ({ item, onClick, index }) => {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        sx={{
          mb: 1.5,
          cursor: 'pointer',
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${item.type === 'job' ? theme.palette.secondary.main : theme.palette.primary.main}05 100%)`,
          border: `1px solid ${item.type === 'job' ? theme.palette.secondary.main : theme.palette.primary.main}22`,
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            background: `linear-gradient(180deg, ${item.type === 'job' ? theme.palette.secondary.main : theme.palette.primary.main} 0%, ${item.type === 'job' ? theme.palette.secondary.dark : theme.palette.primary.dark} 100%)`,
          },
          '&:hover': {
            boxShadow: `0 8px 32px ${item.type === 'job' ? theme.palette.secondary.main : theme.palette.primary.main}33`,
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onClick={() => console.log('Selected:', item)}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              badgeContent={
                item.urgent ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <FlashIcon sx={{ color: '#FF5722', fontSize: 16 }} />
                  </motion.div>
                ) : item.verified ? (
                  <VerifiedIcon sx={{ color: '#4CAF50', fontSize: 16 }} />
                ) : null
              }
            >
              <Avatar
                src={item.profileImage}
                sx={{
                  bgcolor:
                    item.type === 'job'
                      ? theme.palette.secondary.main + '22'
                      : theme.palette.primary.main + '22',
                  color:
                    item.type === 'job'
                      ? theme.palette.secondary.main
                      : theme.palette.primary.main,
                  width: 56,
                  height: 56,
                  border: `2px solid ${item.type === 'job' ? theme.palette.secondary.main : theme.palette.primary.main}33`,
                  boxShadow: `0 4px 16px ${item.type === 'job' ? theme.palette.secondary.main : theme.palette.primary.main}22`,
                }}
              >
                {item.type === 'job' ? <JobIcon /> : <WorkerIcon />}
              </Avatar>
            </Badge>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    color:
                      item.type === 'job'
                        ? theme.palette.secondary.main
                        : theme.palette.primary.main,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.2,
                    fontSize: '1rem',
                  }}
                >
                  {item.title || item.name}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    ml: 1,
                  }}
                >
                  {item.online && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#4CAF50',
                          boxShadow: '0 0 8px rgba(76, 175, 80, 0.6)',
                        }}
                      />
                    </motion.div>
                  )}
                </Box>
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2, lineHeight: 1.4 }}
              >
                {(item.description || item.bio)?.substring(0, 120)}...
              </Typography>

              {/* Professional stats row */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                  gap: 2,
                  mb: 2,
                }}
              >
                {item.rating > 0 && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        mb: 0.5,
                      }}
                    >
                      <StarIcon fontSize="small" sx={{ color: '#FF9800' }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {item.rating.toFixed(1)}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      ({item.reviewCount || 0})
                    </Typography>
                  </Box>
                )}

                {(item.budget || item.hourlyRate) && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        mb: 0.5,
                      }}
                    >
                      <PriceIcon
                        fontSize="small"
                        sx={{ color: theme.palette.secondary.main }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        GHS {item.budget?.toLocaleString() || item.hourlyRate}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {item.budget ? 'budget' : 'per hour'}
                    </Typography>
                  </Box>
                )}

                {item.distance && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        mb: 0.5,
                      }}
                    >
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {mapService.formatDistance(item.distance)}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      away
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Enhanced skills display */}
              {item.skills && item.skills.length > 0 && (
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 'medium',
                      mb: 1,
                      display: 'block',
                    }}
                  >
                    {item.type === 'job'
                      ? 'Required Skills:'
                      : 'Specializations:'}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(item.skills || []).slice(0, 3).map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor:
                            item.type === 'job'
                              ? theme.palette.secondary.main + '66'
                              : theme.palette.primary.main + '66',
                          color:
                            item.type === 'job'
                              ? theme.palette.secondary.main
                              : theme.palette.primary.main,
                          fontSize: '0.7rem',
                          height: 24,
                          '&:hover': {
                            bgcolor:
                              item.type === 'job'
                                ? theme.palette.secondary.main + '11'
                                : theme.palette.primary.main + '11',
                          },
                        }}
                      />
                    ))}
                    {(item.skills || []).length > 3 && (
                      <Chip
                        label={`+${(item.skills || []).length - 3}`}
                        size="small"
                        variant="filled"
                        sx={{
                          bgcolor:
                            item.type === 'job'
                              ? theme.palette.secondary.main + '22'
                              : theme.palette.primary.main + '22',
                          color:
                            item.type === 'job'
                              ? theme.palette.secondary.main
                              : theme.palette.primary.main,
                          fontSize: '0.7rem',
                          height: 24,
                        }}
                      />
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const MapSearchOverlay = ({
  onSearch = () => {},
  onFilterChange = () => {},
  onLocationChange = () => {},
  searchResults = [],
  loading = false,
  searchType = 'jobs',
  userLocation = null,
  isVisible = true,
  onClose = () => {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(25);
  const [filters, setFilters] = useState({
    budget: [500, 10000],
    rating: 0,
    experience: '',
    availability: '',
    urgent: false,
    verified: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [sortBy, setSortBy] = useState('distance');
  const [activeTab, setActiveTab] = useState(0);

  // Enhanced vocational data with more details
  const vocationalCategories = mapService.getVocationalCategories();
  const vocationalSkills = {
    Carpentry: [
      'Cabinet Making',
      'Furniture Building',
      'Framing',
      'Finish Carpentry',
      'Wood Restoration',
    ],
    Masonry: [
      'Bricklaying',
      'Stone Work',
      'Concrete Work',
      'Block Work',
      'Tile Installation',
    ],
    Plumbing: [
      'Pipe Installation',
      'Drain Cleaning',
      'Water Systems',
      'Gas Lines',
      'Bathroom Renovation',
    ],
    Electrical: [
      'House Wiring',
      'Circuit Installation',
      'Lighting Systems',
      'Generator Installation',
      'Security Systems',
    ],
    Painting: [
      'Interior Painting',
      'Exterior Painting',
      'Spray Painting',
      'Wall Preparation',
      'Decorative Finishes',
    ],
    Welding: [
      'Arc Welding',
      'Gas Welding',
      'Metal Fabrication',
      'Repair Welding',
      'Structural Welding',
    ],
    HVAC: [
      'Air Conditioning',
      'Heating Systems',
      'Ventilation',
      'Refrigeration',
      'Duct Installation',
    ],
    Roofing: [
      'Roof Installation',
      'Roof Repair',
      'Gutter Installation',
      'Waterproofing',
      'Insulation',
    ],
    Landscaping: [
      'Garden Design',
      'Tree Maintenance',
      'Irrigation Systems',
      'Lawn Care',
      'Hardscaping',
    ],
    Security: [
      'CCTV Installation',
      'Alarm Systems',
      'Access Control',
      'Security Consultation',
      'Guard Services',
    ],
  };

  const sortOptions = [
    { value: 'distance', label: 'Distance', icon: LocationIcon },
    { value: 'rating', label: 'Rating', icon: StarIcon },
    { value: 'price', label: 'Price', icon: MoneyIcon },
    { value: 'recent', label: 'Most Recent', icon: TimeIcon },
  ];

  // Professional stats for quick overview
  const quickStats = [
    {
      title: 'Active',
      value: searchResults.filter((r) => r.type === searchType).length,
      icon: LiveIcon,
      color: '#4CAF50',
      trend: 15,
    },
    {
      title: 'Verified',
      value: searchResults.filter((r) => r.verified).length,
      icon: VerifiedIcon,
      color: '#2196F3',
      trend: 8,
    },
    {
      title: 'Urgent',
      value: searchResults.filter((r) => r.urgent).length,
      icon: FlashIcon,
      color: '#FF5722',
      trend: -5,
    },
    {
      title: 'Top Rated',
      value: searchResults.filter((r) => r.rating >= 4.5).length,
      icon: AwardIcon,
      color: '#FF9800',
      trend: 12,
    },
  ];

  // Handle search functionality
  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      onSearch({
        query,
        location,
        radius,
        filters: {
          ...filters,
          categories: selectedCategories,
          skills: selectedSkills,
        },
        sortBy,
        type: searchType,
      });
    },
    [
      location,
      radius,
      filters,
      selectedCategories,
      selectedSkills,
      sortBy,
      searchType,
      onSearch,
    ],
  );

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedSkills([]);
    handleSearch('');
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleLocationChange = (newLocation, newRadius) => {
    setLocation(newLocation);
    setRadius(newRadius);
    onLocationChange(newLocation, newRadius);
  };

  // 🌟 STUNNING MAIN RENDER WITH FULL SCREEN UTILIZATION
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1000,
        pointerEvents: isVisible ? 'auto' : 'none',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* 🎨 ANIMATED BACKGROUND OVERLAY */}
      <AnimatedBackground />

      {/* 🎯 TOP SEARCH BAR - PREMIUM POSITIONING */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 16, sm: 24, md: 32 },
          left: { xs: 16, sm: 24, md: 32 },
          right: { xs: 16, sm: 24, md: 32 },
          zIndex: 1100,
        }}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Stack spacing={2}>
            {/* 🔍 MAIN SEARCH BAR */}
            <PremiumSearchBar
              searchTerm={searchQuery}
              onSearchChange={handleSearch}
              onClear={handleClearSearch}
              suggestions={[
                {
                  title: 'Experienced Carpenter - Furniture Building',
                  location: '2.5 km away',
                  type: 'worker',
                },
                {
                  title: 'Kitchen Renovation Project',
                  location: 'Downtown',
                  type: 'job',
                },
                {
                  title: 'Master Electrician - 24/7 Service',
                  location: '1.2 km away',
                  type: 'worker',
                },
                {
                  title: 'Bathroom Plumbing Installation',
                  location: 'Suburb Area',
                  type: 'job',
                },
              ]}
            />

            {/* 🎯 QUICK STATS ROW - PROFESSIONAL OVERVIEW */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            >
              <Grid container spacing={2}>
                {quickStats.map((stat, index) => (
                  <Grid item xs={6} sm={3} key={index}>
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        sx={{
                          background: `linear-gradient(135deg, 
                            rgba(255, 255, 255, 0.95) 0%, 
                            rgba(248, 248, 248, 0.95) 100%
                          )`,
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 215, 0, 0.2)',
                          borderRadius: 3,
                          textAlign: 'center',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '4px',
                            background: `linear-gradient(90deg, ${stat.color}, ${stat.color}88)`,
                          },
                          '&:hover': {
                            boxShadow: `0 12px 40px rgba(255, 215, 0, 0.25)`,
                            '&::before': {
                              height: '100%',
                              opacity: 0.1,
                            },
                          },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        <CardContent sx={{ py: 2 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mb: 1,
                            }}
                          >
                            <stat.icon
                              sx={{ color: stat.color, fontSize: 24, mr: 1 }}
                            />
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              color="#333"
                            >
                              {stat.value}
                            </Typography>
                          </Box>
                          <Typography
                            variant="body2"
                            color="rgba(0, 0, 0, 0.7)"
                            fontWeight={500}
                          >
                            {stat.title}
                          </Typography>
                          {stat.trend !== 0 && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: stat.trend > 0 ? '#4CAF50' : '#F44336',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mt: 0.5,
                              }}
                            >
                              {stat.trend > 0 ? '↗' : '↘'}{' '}
                              {Math.abs(stat.trend)}%
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>

            {/* 🎛️ ADVANCED CONTROLS ROW */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
            >
              <Stack
                direction="row"
                spacing={2}
                justifyContent="center"
                flexWrap="wrap"
              >
                <Button
                  variant="contained"
                  startIcon={<TuneIcon />}
                  onClick={() => setShowFilters(true)}
                  sx={{
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    color: '#000',
                    fontWeight: 'bold',
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #FFE55C, #FFB347)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(255, 215, 0, 0.4)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  Advanced Filters
                </Button>

                <ToggleButtonGroup
                  value={searchType}
                  exclusive
                  onChange={(e, newType) =>
                    newType && onFilterChange({ type: newType })
                  }
                  sx={{
                    '& .MuiToggleButton-root': {
                      background: 'rgba(255, 255, 255, 0.9)',
                      color: '#333',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      fontWeight: 600,
                      px: 2,
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                        color: '#000',
                        '&:hover': {
                          background:
                            'linear-gradient(135deg, #FFE55C, #FFB347)',
                        },
                      },
                      '&:hover': {
                        background: 'rgba(255, 215, 0, 0.1)',
                      },
                    },
                  }}
                >
                  <ToggleButton value="jobs">
                    <JobIcon sx={{ mr: 1 }} /> Jobs
                  </ToggleButton>
                  <ToggleButton value="workers">
                    <WorkerIcon sx={{ mr: 1 }} /> Workers
                  </ToggleButton>
                </ToggleButtonGroup>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    sx={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid #FFD700',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: '2px solid #FFD700',
                      },
                    }}
                  >
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <option.icon sx={{ fontSize: 18 }} />
                          <span>{option.label}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </motion.div>
          </Stack>
        </motion.div>
      </Box>

      {/* 🎭 LEFT SIDEBAR - CATEGORIES & QUICK FILTERS */}
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
      >
        <Paper
          sx={{
            position: 'absolute',
            top: { xs: 200, sm: 220, md: 240 },
            left: { xs: 16, sm: 24, md: 32 },
            width: { xs: 280, sm: 320, md: 360 },
            maxHeight: 'calc(100vh - 320px)',
            background: `linear-gradient(135deg, 
              rgba(255, 255, 255, 0.95) 0%, 
              rgba(248, 248, 248, 0.95) 100%
            )`,
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: 4,
            overflow: 'hidden',
            display: { xs: 'none', md: 'block' },
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                color: '#333',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CategoryIcon sx={{ color: '#FFD700' }} />
              Categories
            </Typography>

            <Stack spacing={2} sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {Object.entries(vocationalCategories).map(([category, data]) => (
                <motion.div
                  key={category}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Accordion
                    sx={{
                      background: selectedCategories.includes(category)
                        ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 193, 7, 0.05))'
                        : 'transparent',
                      '&:before': { display: 'none' },
                      border: selectedCategories.includes(category)
                        ? '1px solid rgba(255, 215, 0, 0.3)'
                        : '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px !important',
                      boxShadow: 'none',
                      '&:hover': {
                        background:
                          'linear-gradient(135deg, rgba(255, 215, 0, 0.05), rgba(255, 193, 7, 0.02))',
                      },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      onClick={() => {
                        const newCategories = selectedCategories.includes(
                          category,
                        )
                          ? selectedCategories.filter((c) => c !== category)
                          : [...selectedCategories, category];
                        setSelectedCategories(newCategories);
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={2}
                        sx={{ width: '100%' }}
                      >
                        <Avatar
                          sx={{
                            background: `linear-gradient(135deg, ${data.color}, ${data.color}88)`,
                            width: 40,
                            height: 40,
                          }}
                        >
                          {data.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography fontWeight={600} color="#333">
                            {category}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="rgba(0, 0, 0, 0.6)"
                          >
                            {data.count} available
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={data.avgRating}
                          sx={{
                            background:
                              'linear-gradient(135deg, #FFD700, #FFA500)',
                            color: '#000',
                            fontWeight: 'bold',
                          }}
                        />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {vocationalSkills[category]?.map((skill) => (
                          <Chip
                            key={skill}
                            label={skill}
                            size="small"
                            variant={
                              selectedSkills.includes(skill)
                                ? 'filled'
                                : 'outlined'
                            }
                            onClick={() => {
                              const newSkills = selectedSkills.includes(skill)
                                ? selectedSkills.filter((s) => s !== skill)
                                : [...selectedSkills, skill];
                              setSelectedSkills(newSkills);
                            }}
                            sx={{
                              background: selectedSkills.includes(skill)
                                ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                                : 'transparent',
                              color: selectedSkills.includes(skill)
                                ? '#000'
                                : '#666',
                              border: '1px solid rgba(255, 215, 0, 0.3)',
                              '&:hover': {
                                background:
                                  'linear-gradient(135deg, #FFD700, #FFA500)',
                                color: '#000',
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </motion.div>
              ))}
            </Stack>
          </Box>
        </Paper>
      </motion.div>

      {/* 🎯 RIGHT SIDEBAR - LIVE RESULTS & ANALYTICS */}
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
      >
        <Paper
          sx={{
            position: 'absolute',
            top: { xs: 200, sm: 220, md: 240 },
            right: { xs: 16, sm: 24, md: 32 },
            width: { xs: 300, sm: 340, md: 380 },
            maxHeight: 'calc(100vh - 320px)',
            background: `linear-gradient(135deg, 
              rgba(255, 255, 255, 0.95) 0%, 
              rgba(248, 248, 248, 0.95) 100%
            )`,
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: 4,
            overflow: 'hidden',
            display: { xs: 'none', lg: 'block' },
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                color: '#333',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <LiveIcon sx={{ color: '#4CAF50' }} />
              Live Results
              <Chip
                label={`${searchResults.length}`}
                size="small"
                sx={{
                  background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                  color: '#fff',
                  fontWeight: 'bold',
                  ml: 1,
                }}
              />
            </Typography>

            {loading ? (
              <Stack spacing={2}>
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    height={80}
                    sx={{ borderRadius: 2 }}
                  />
                ))}
              </Stack>
            ) : (
              <Stack spacing={2} sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {searchResults.slice(0, 6).map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                  >
                    <Card
                      sx={{
                        background:
                          'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 248, 248, 0.9))',
                        border: '1px solid rgba(255, 215, 0, 0.1)',
                        borderRadius: 3,
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: '0 8px 25px rgba(255, 215, 0, 0.2)',
                          border: '1px solid rgba(255, 215, 0, 0.3)',
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            src={result.avatar}
                            sx={{
                              width: 50,
                              height: 50,
                              background:
                                result.type === 'worker'
                                  ? 'linear-gradient(135deg, #2196F3, #1976D2)'
                                  : 'linear-gradient(135deg, #FF9800, #F57C00)',
                            }}
                          >
                            {result.type === 'worker' ? (
                              <WorkerIcon />
                            ) : (
                              <JobIcon />
                            )}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight="bold"
                              color="#333"
                            >
                              {result.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="rgba(0, 0, 0, 0.6)"
                            >
                              📍 {result.distance} • 💰 GH₵{result.price}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mt: 0.5,
                              }}
                            >
                              <Rating
                                value={result.rating}
                                size="small"
                                readOnly
                              />
                              <Typography
                                variant="caption"
                                sx={{ ml: 1, color: '#666' }}
                              >
                                ({result.reviews})
                              </Typography>
                            </Box>
                          </Box>
                          {result.urgent && (
                            <Chip
                              label="URGENT"
                              size="small"
                              sx={{
                                background:
                                  'linear-gradient(135deg, #FF5722, #D32F2F)',
                                color: '#fff',
                                fontWeight: 'bold',
                                animation: 'pulse 2s infinite',
                              }}
                            />
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Stack>
            )}
          </Box>
        </Paper>
      </motion.div>

      {/* 🎪 BOTTOM STATUS BAR - FULL WIDTH UTILIZATION */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.0, ease: 'easeOut' }}
      >
        <Paper
          sx={{
            position: 'absolute',
            bottom: { xs: 16, sm: 24, md: 32 },
            left: { xs: 16, sm: 24, md: 32 },
            right: { xs: 16, sm: 24, md: 32 },
            background: `linear-gradient(135deg, 
              rgba(0, 0, 0, 0.9) 0%, 
              rgba(26, 26, 26, 0.95) 100%
            )`,
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(255, 215, 0, 0.3)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={3}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LiveIcon sx={{ color: '#4CAF50', fontSize: 20 }} />
                  <Typography
                    variant="body2"
                    sx={{ color: '#FFD700', fontWeight: 600 }}
                  >
                    Live Search Active
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ color: '#FFF' }}>
                    Search Progress:
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={loading ? 45 : 100}
                    sx={{
                      flex: 1,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255, 215, 0, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                        borderRadius: 4,
                      },
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ color: '#FFD700', fontWeight: 600 }}
                  >
                    {loading ? '45%' : '100%'}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Tooltip title="Share Search">
                    <IconButton
                      size="small"
                      sx={{
                        color: '#FFD700',
                        '&:hover': {
                          background: 'rgba(255, 215, 0, 0.1)',
                          transform: 'scale(1.1)',
                        },
                      }}
                    >
                      <ShareIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Save Search">
                    <IconButton
                      size="small"
                      sx={{
                        color: '#FFD700',
                        '&:hover': {
                          background: 'rgba(255, 215, 0, 0.1)',
                          transform: 'scale(1.1)',
                        },
                      }}
                    >
                      <BookmarkIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export Results">
                    <IconButton
                      size="small"
                      sx={{
                        color: '#FFD700',
                        '&:hover': {
                          background: 'rgba(255, 215, 0, 0.1)',
                          transform: 'scale(1.1)',
                        },
                      }}
                    >
                      <LaunchIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </motion.div>

      {/* 🎛️ ADVANCED FILTER DRAWER */}
      <PremiumFilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={handleFilterChange}
        categories={Object.keys(vocationalCategories)}
        priceRange={filters.budget}
        onPriceRangeChange={(range) =>
          handleFilterChange({ ...filters, budget: range })
        }
        distance={radius}
        onDistanceChange={setRadius}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* 🚀 FLOATING ACTION CONTROLS */}
      <FloatingControls
        onToggleFullscreen={() => {}}
        isFullscreen={false}
        onCenterMap={() => {}}
        onRefresh={() => handleSearch(searchQuery)}
      />

      {/* 🎨 CSS ANIMATIONS */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </Box>
  );
};

export default MapSearchOverlay;
