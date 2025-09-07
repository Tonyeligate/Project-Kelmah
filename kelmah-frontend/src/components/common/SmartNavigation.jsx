import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const SmartNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Show suggestions after a delay on job-related pages
  useEffect(() => {
    const timer = setTimeout(() => {
      if (location.pathname.includes('/jobs') || location.pathname.includes('/search')) {
        setShowSuggestions(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [location.pathname]);

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
        }
      );
    }

    if (currentPath === '/search' || currentPath.includes('/search')) {
      suggestions.push(
        {
          label: 'Browse All Jobs',
          icon: <WorkIcon />,
          path: '/jobs',
          description: 'View all available jobs',
          color: '#FF9800',
        }
      );
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
        }
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
          path: '/find-talents',
          description: 'Search for skilled workers',
          color: '#00BCD4',
        }
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

  if (suggestions.length === 0 || !showSuggestions) {
    return null;
  }

  return (
    <Fade in={showSuggestions} timeout={1000}>
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
        <Typography
          variant="h6"
          sx={{
            color: '#D4AF37',
            fontWeight: 'bold',
            mb: 2,
            fontSize: '0.9rem',
          }}
        >
          Quick Navigation
        </Typography>
        
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
          onClick={() => setShowSuggestions(false)}
          sx={{
            mt: 2,
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.7rem',
            textTransform: 'none',
          }}
        >
          Dismiss
        </Button>
      </Paper>
    </Fade>
  );
};

export default SmartNavigation;
