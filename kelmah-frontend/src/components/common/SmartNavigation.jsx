import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Work as WorkIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Home as HomeIcon,
  TrendingUp as TrendingIcon,
  Bookmark as BookmarkIcon,
  Notifications as NotificationIcon,
  InfoOutlined as InfoIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import secureStorage from '../../utils/secureStorage';

const QUICK_NAV_STORAGE_KEY = 'quick_nav_preferences';
const QUICK_NAV_PREF_TTL = 180 * 24 * 60 * 60 * 1000; // 6 months

const getPreferenceKey = (user) => {
  if (!user) return null;
  return user.id || user._id || user.userId || user.email || null;
};

const ELIGIBLE_PATH_PREFIXES = [
  '/jobs',
  '/search',
  '/worker/dashboard',
  '/worker/job',
  '/worker/applications',
  '/hirer/dashboard',
  '/hirer/find',
  '/hirer/jobs/post',
  '/messages',
];

const SmartNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const preferenceKey = useMemo(() => getPreferenceKey(user), [user]);

  const persistPreference = useCallback(
    (updates) => {
      if (!preferenceKey) return;
      try {
        const existing =
          secureStorage.getItem(QUICK_NAV_STORAGE_KEY, QUICK_NAV_PREF_TTL) ||
          {};
        const next = {
          ...existing,
          [preferenceKey]: {
            ...existing[preferenceKey],
            ...updates,
            updatedAt: Date.now(),
          },
        };
        secureStorage.setItem(QUICK_NAV_STORAGE_KEY, next, QUICK_NAV_PREF_TTL);
      } catch (error) {
        console.warn(
          'Quick navigation preference persistence failed:',
          error.message,
        );
      }
    },
    [preferenceKey],
  );

  // Toggle visibility based on current path eligibility
  useEffect(() => {
    const { pathname } = location;
    const isEligible = ELIGIBLE_PATH_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix),
    );

    if (isDismissed) {
      setShowSuggestions(false);
      return;
    }

    if (isEligible || isPinned) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [location.pathname, isPinned, isDismissed]);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !isAuthenticated ||
      !user ||
      !preferenceKey
    ) {
      return;
    }

    const storedPinned = sessionStorage.getItem('kelmah-nav-pinned');
    const storedIntro = sessionStorage.getItem('kelmah-nav-intro');

    if (storedPinned === 'true') {
      setIsPinned(true);
      setShowSuggestions(true);
    }

    if (storedIntro === 'seen') {
      setHasSeenIntro(true);
    } else {
      setShowInfo(true);
    }

    try {
      const storedPreferences =
        secureStorage.getItem(QUICK_NAV_STORAGE_KEY, QUICK_NAV_PREF_TTL) || {};
      const userPreferences = storedPreferences[preferenceKey] || null;

      if (userPreferences) {
        if (typeof userPreferences.pinned === 'boolean') {
          setIsPinned(userPreferences.pinned);
          sessionStorage.setItem(
            'kelmah-nav-pinned',
            userPreferences.pinned ? 'true' : 'false',
          );
          if (userPreferences.pinned) {
            setShowSuggestions(true);
          }
        }

        if (userPreferences.hidden) {
          setIsDismissed(true);
          setShowSuggestions(false);
        }

        if (userPreferences.introSeen) {
          setHasSeenIntro(true);
          setShowInfo(false);
          sessionStorage.setItem('kelmah-nav-intro', 'seen');
        }
      }
    } catch (error) {
      console.warn(
        'Quick navigation preference hydrate failed:',
        error.message,
      );
    }
  }, [isAuthenticated, user, preferenceKey]);

  // Don't show on mobile or if user is not authenticated
  if (isMobile || !isAuthenticated || !user) {
    return null;
  }

  const userRole = user.role || user.userType || user.userRole;

  // Get contextual navigation suggestions based on current page and user role
  const getNavigationSuggestions = () => {
    const suggestions = [];
    const currentPath = location.pathname;

    // Common suggestions for all users
    if (currentPath === '/jobs' || currentPath.includes('/jobs/')) {
      suggestions.push(
        {
          label: 'Search Jobs',
          icon: <SearchIcon />,
          path: '/search',
          description: 'Find more opportunities',
          color: '#4CAF50',
        },
        {
          label: 'My Applications',
          icon: <BookmarkIcon />,
          path: '/worker/applications',
          description: 'Track your applications',
          color: '#2196F3',
        },
      );
    }

    if (currentPath === '/search' || currentPath.includes('/search')) {
      suggestions.push({
        label: 'Browse All Jobs',
        icon: <WorkIcon />,
        path: '/jobs',
        description: 'View all available jobs',
        color: '#FF9800',
      });
    }

    // Role-specific suggestions
    if (userRole === 'worker') {
      suggestions.push(
        {
          label: 'Worker Dashboard',
          icon: <PersonIcon />,
          path: '/worker/dashboard',
          description: 'Manage your profile',
          color: '#9C27B0',
        },
        {
          label: 'Skills Assessment',
          icon: <TrendingIcon />,
          path: '/worker/skills',
          description: 'Improve your skills',
          color: '#E91E63',
        },
      );
    }

    if (userRole === 'hirer') {
      suggestions.push(
        {
          label: 'Hirer Dashboard',
          icon: <BusinessIcon />,
          path: '/hirer/dashboard',
          description: 'Manage your jobs',
          color: '#3F51B5',
        },
        {
          label: 'Find Workers',
          icon: <SearchIcon />,
          path: '/hirer/find-talent', // ✅ FIXED: Use correct authenticated route
          description: 'Search for skilled workers',
          color: '#00BCD4',
        },
      );
    }

    // Always include home
    suggestions.push({
      label: 'Home',
      icon: <HomeIcon />,
      path: '/',
      description: 'Return to homepage',
      color: '#607D8B',
    });

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  };

  const suggestions = getNavigationSuggestions();

  const handleTogglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('kelmah-nav-pinned', next ? 'true' : 'false');
      }
      persistPreference({ pinned: next, hidden: false });

      if (next) {
        setShowSuggestions(true);
      } else {
        const isEligible = ELIGIBLE_PATH_PREFIXES.some((prefix) =>
          location.pathname.startsWith(prefix),
        );
        setShowSuggestions(isEligible);
      }

      return next;
    });
    setIsDismissed(false);
  };

  const handleInfoToggle = () => {
    setShowInfo((prev) => {
      const next = !prev;
      if (!hasSeenIntro && typeof window !== 'undefined') {
        sessionStorage.setItem('kelmah-nav-intro', 'seen');
      }
      setHasSeenIntro(true);
      persistPreference({ introSeen: true });
      return next;
    });
  };

  const handleHide = () => {
    setIsPinned(false);
    setShowSuggestions(false);
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('kelmah-nav-pinned', 'false');
    }
    persistPreference({ hidden: true, pinned: false });
  };

  const handleRestore = () => {
    setIsDismissed(false);
    persistPreference({ hidden: false });
    const isEligible = ELIGIBLE_PATH_PREFIXES.some((prefix) =>
      location.pathname.startsWith(prefix),
    );
    setShowSuggestions(isEligible || isPinned);
  };

  if (suggestions.length === 0 || !showSuggestions) {
    if (isDismissed) {
      return (
        <Fade in timeout={300}>
          <Box
            sx={{
              position: 'fixed',
              top: '80px',
              right: '20px',
              zIndex: 1000,
            }}
          >
            <Button
              variant="outlined"
              size="small"
              onClick={handleRestore}
              sx={{
                borderColor: 'rgba(212,175,55,0.5)',
                color: '#D4AF37',
                backgroundColor: 'rgba(26,26,26,0.85)',
                textTransform: 'none',
                fontSize: '0.75rem',
              }}
            >
              Show Quick Navigation
            </Button>
          </Box>
        </Fade>
      );
    }

    return null;
  }

  return (
    <Slide
      direction="left"
      in={showSuggestions}
      mountOnEnter
      unmountOnExit
      timeout={400}
    >
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          width: '280px',
          p: 2,
          bgcolor: 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 2,
          zIndex: 1000,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.5,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              variant="h6"
              sx={{
                color: '#D4AF37',
                fontWeight: 'bold',
                fontSize: '0.9rem',
              }}
            >
              Quick Navigation
            </Typography>
            {!hasSeenIntro && (
              <Chip
                label="New"
                color="secondary"
                size="small"
                sx={{ height: 20 }}
              />
            )}
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title={isPinned ? 'Unpin shortcuts' : 'Pin shortcuts'}>
              <IconButton size="small" onClick={handleTogglePin}>
                {isPinned ? (
                  <PushPinIcon fontSize="inherit" />
                ) : (
                  <PushPinOutlinedIcon fontSize="inherit" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="What is this panel?">
              <IconButton size="small" onClick={handleInfoToggle}>
                <InfoIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <Fade in={showInfo} timeout={300} unmountOnExit>
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <Typography variant="caption" color="rgba(255,255,255,0.75)">
              {userRole === 'hirer'
                ? 'Jump to your next action with one click. Pin shortcuts to keep them handy across your hirer pages.'
                : 'Jump to your next action with one click. Pin shortcuts to keep them handy across your worker tools.'}
            </Typography>
          </Box>
        </Fade>

        <Stack spacing={1.5}>
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.path}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                fullWidth
                startIcon={suggestion.icon}
                onClick={() => navigate(suggestion.path)}
                sx={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                    border: `1px solid ${suggestion.color}`,
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 'bold',
                      color: suggestion.color,
                      fontSize: '0.8rem',
                    }}
                  >
                    {suggestion.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.7rem',
                    }}
                  >
                    {suggestion.description}
                  </Typography>
                </Box>
              </Button>
            </motion.div>
          ))}
        </Stack>

        <Button
          size="small"
          onClick={handleHide}
          sx={{
            mt: 2,
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.7rem',
            textTransform: 'none',
          }}
        >
          Hide for now
        </Button>
      </Paper>
    </Slide>
  );
};

export default SmartNavigation;
