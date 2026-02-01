import React, { useMemo } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Home as HomeIcon,
  WorkOutline as JobsIcon,
  ChatBubbleOutline as MessagesIcon,
  PersonOutline as ProfileIcon,
  BusinessCenter as ManageIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { BRAND_COLORS } from '../../../theme';
import { useNotifications } from '../../notifications/contexts/NotificationContext';

// Styled Components - Clean mobile-first design
const StyledPaper = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 1200,
  borderTop: theme.palette.mode === 'dark' 
    ? '1px solid rgba(255, 215, 0, 0.2)' 
    : '1px solid rgba(0, 0, 0, 0.1)',
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(24, 23, 18, 0.98)' 
    : 'rgba(255, 255, 255, 0.98)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
  // Safe area for iOS devices
  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
}));

const StyledBottomNavigation = styled(BottomNavigation)(({ theme }) => ({
  backgroundColor: 'transparent',
  height: 56,
  minHeight: 56,
}));

const StyledBottomNavigationAction = styled(BottomNavigationAction)(
  ({ theme }) => ({
    color: theme.palette.mode === 'dark' ? '#888' : '#666',
    minWidth: 64,
    maxWidth: 120,
    padding: '6px 12px 8px',
    transition: 'all 0.2s ease',
    '&.Mui-selected': {
      color: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
      '& .MuiBottomNavigationAction-label': {
        fontSize: '0.7rem',
        fontWeight: 700,
        opacity: 1,
      },
      '& .MuiSvgIcon-root': {
        transform: 'scale(1.15)',
      },
    },
    '& .MuiBottomNavigationAction-label': {
      fontSize: '0.65rem',
      fontWeight: 500,
      marginTop: 2,
      opacity: 0.9,
      transition: 'all 0.2s ease',
    },
    '& .MuiSvgIcon-root': {
      fontSize: '1.4rem',
      transition: 'transform 0.2s ease',
    },
    // Better touch targets
    '&:active': {
      backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(255, 215, 0, 0.1)' 
        : 'rgba(0, 0, 0, 0.05)',
    },
  }),
);

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const path = location.pathname;
  const { unreadCount = 0 } = useNotifications();
  
  // Get user role from Redux auth state (not path-based)
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const userRole = user?.role || user?.userType || '';
  
  // Determine user role - use auth state primarily, path as fallback
  const isHirer = userRole === 'hirer' || path.startsWith('/hirer');
  const isWorker = userRole === 'worker' || path.startsWith('/worker');

  // Determine current active tab based on path - comprehensive matching
  const currentValue = useMemo(() => {
    // Dashboard/Home detection
    if (path.includes('/dashboard') || path === '/' || path === '/home') {
      return 'home';
    }
    // Jobs/Work management (hirer: my jobs, worker: search jobs)
    if (
      path.includes('/jobs') || 
      path.includes('/find-work') ||
      path.includes('/applications') ||
      path.includes('/job-search')
    ) {
      return 'jobs';
    }
    // Talent/Worker search (hirer specific)
    if (
      path.includes('/find-talent') || 
      path.includes('/search') ||
      path.includes('/workers')
    ) {
      return 'search';
    }
    // Messages
    if (path.includes('/messages') || path.includes('/chat')) {
      return 'messages';
    }
    // Profile
    if (path.includes('/profile') || path.includes('/settings')) {
      return 'profile';
    }
    return 'home';
  }, [path]);

  // Navigation items based on user role
  const navigationItems = useMemo(() => {
    if (isHirer) {
      return [
        {
          label: 'Home',
          value: 'home',
          icon: <HomeIcon />,
          path: '/hirer/dashboard',
        },
        {
          label: 'My Jobs',
          value: 'jobs',
          icon: <ManageIcon />,
          path: '/hirer/jobs',
        },
        {
          label: 'Find Talent',
          value: 'search',
          icon: <SearchIcon />,
          path: '/hirer/find-talent',
        },
        {
          label: 'Messages',
          value: 'messages',
          icon: <MessagesIcon />,
          path: '/messages',
          badge: unreadCount > 0 ? unreadCount : null,
        },
        {
          label: 'Profile',
          value: 'profile',
          icon: <ProfileIcon />,
          path: '/profile',
        },
      ];
    }
    // Worker navigation
    return [
      {
        label: 'Home',
        value: 'home',
        icon: <HomeIcon />,
        path: '/worker/dashboard',
      },
      {
        label: 'Find Jobs',
        value: 'jobs',
        icon: <JobsIcon />,
        path: '/worker/find-work',
      },
      {
        label: 'Messages',
        value: 'messages',
        icon: <MessagesIcon />,
        path: '/messages',
        badge: unreadCount > 0 ? unreadCount : null,
      },
      {
        label: 'Profile',
        value: 'profile',
        icon: <ProfileIcon />,
        path: '/worker/profile',
      },
    ];
  }, [isHirer, unreadCount]);

  const handleNavigation = (event, newValue) => {
    const item = navigationItems.find(i => i.value === newValue);
    if (item?.path) {
      navigate(item.path);
    }
  };

  return (
    <StyledPaper elevation={0}>
      <StyledBottomNavigation 
        value={currentValue} 
        onChange={handleNavigation} 
        showLabels
      >
        {navigationItems.map((item) => (
          <StyledBottomNavigationAction
            key={item.value}
            label={item.label}
            value={item.value}
            icon={
              item.badge ? (
                <Badge 
                  badgeContent={item.badge} 
                  color="error"
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      fontSize: '0.65rem',
                      minWidth: 16,
                      height: 16,
                    }
                  }}
                >
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )
            }
          />
        ))}
      </StyledBottomNavigation>
    </StyledPaper>
  );
};

export default MobileBottomNav;
