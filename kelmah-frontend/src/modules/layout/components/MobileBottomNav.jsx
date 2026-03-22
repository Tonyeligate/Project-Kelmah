import React, { useCallback, useMemo } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Home as HomeIcon,
  WorkOutline as JobsIcon,
  ChatBubbleOutline as MessagesIcon,
  PersonOutline as ProfileIcon,
  PostAdd as PostJobIcon,
  Search as SearchIcon,
  AssignmentTurnedIn as ApplicationsIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { BRAND_COLORS } from '../../../theme';
import { useNotifications } from '../../notifications/contexts/NotificationContext';
import { Z_INDEX, BOTTOM_NAV_HEIGHT } from '../../../constants/layout';
import useKeyboardVisible from '../../../hooks/useKeyboardVisible';
import { useBreakpointDown } from '../../../hooks/useResponsive';

// Styled Components - Clean mobile-first design
const StyledPaper = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: Z_INDEX.bottomNav,
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
  height: BOTTOM_NAV_HEIGHT,
  minHeight: BOTTOM_NAV_HEIGHT,
}));

const StyledBottomNavigationAction = styled(BottomNavigationAction)(
  ({ theme }) => ({
    color: theme.palette.mode === 'dark' ? '#888' : '#666',
    flex: 1,
    maxWidth: 120,
    minHeight: 56,
    minWidth: 44,
    padding: '6px 4px 8px',
    transition: 'all 0.2s ease',
    '&:focus-visible': {
      outline: `3px solid ${theme.palette.mode === 'dark' ? BRAND_COLORS.gold : theme.palette.primary.main}`,
      outlineOffset: '2px',
      borderRadius: 10,
    },
    '&.Mui-selected': {
      color: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
      '& .MuiBottomNavigationAction-label': {
        fontSize: '0.78rem',
        fontWeight: 700,
        opacity: 1,
      },
      '& .MuiSvgIcon-root': {
        transform: 'scale(1.15)',
      },
    },
    '& .MuiBottomNavigationAction-label': {
      fontSize: '0.68rem',
      fontWeight: 500,
      marginTop: 2,
      opacity: 0.9,
      maxWidth: '100%',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
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
    '@media (max-width:360px)': {
      padding: '6px 2px 8px',
      minHeight: 52,
      '& .MuiBottomNavigationAction-label': {
        fontSize: '0.64rem',
      },
      '&.Mui-selected .MuiBottomNavigationAction-label': {
        fontSize: '0.72rem',
      },
    },
  }),
);

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const isMobile = useBreakpointDown('sm');
  const { unreadCount = 0 } = useNotifications();
  const { isKeyboardVisible } = useKeyboardVisible();
  
  // Get user role from Redux auth state (not path-based)
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Return null if user is not authenticated (as requested, nav is for authenticated users only)
  if (!isAuthenticated) {
    return null;
  }

  const userRole = user?.role || user?.userType || user?.userRole || null;
  const isHirer = userRole === 'hirer' || path.startsWith('/hirer');

  const isWorker = userRole === 'worker' || path.startsWith('/worker');

  // Determine current active tab based on path - comprehensive matching
  const currentValue = useMemo(() => {
    // Dashboard/Home detection
    if (path.includes('/dashboard') || path === '/' || path === '/home') {
      return 'home';
    }

    // Role-specific tab matching
    if (isHirer) {
      if (path.startsWith('/hirer/jobs')) {
        return 'postJob';
      }
      if (path.startsWith('/hirer/find')) {
        return 'findTalent';
      }
      if (path.startsWith('/hirer/applications')) {
        return 'applications';
      }
    }

    if (isWorker) {
      if (
        path.startsWith('/worker/find-work') ||
        path.startsWith('/worker/job-search') ||
        path.startsWith('/worker/job-alerts') ||
        path.startsWith('/worker/saved-jobs') ||
        path.startsWith('/jobs')
      ) {
        return 'findWork';
      }
      if (path.startsWith('/worker/applications')) {
        return 'applications';
      }
      if (path.startsWith('/worker/profile') || path.startsWith('/settings')) {
        return 'profile';
      }
    }

    // Messages
    if (path.includes('/messages') || path.includes('/chat')) {
      return 'messages';
    }

    // Keep no tab selected on unrelated pages (wallet/contracts/etc.)
    return null;
  }, [path, isHirer, isWorker]);

  const getActionAriaLabel = useCallback((item) => {
    if (item.value === 'messages' && item.badge) {
      const messageLabel = item.badge === 1 ? 'message' : 'messages';
      return `Go to ${item.label}, ${item.badge} unread ${messageLabel}`;
    }
    return `Go to ${item.label}`;
  }, []);

  // Navigation items based on user role - capped at 5 primary actions for clean UX.
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
          label: isMobile ? 'Post' : 'Post Job',
          value: 'postJob',
          icon: <PostJobIcon />,
          path: '/hirer/jobs/post',
        },
        {
          label: isMobile ? 'Talent' : 'Find Talent',
          value: 'findTalent',
          icon: <SearchIcon />,
          path: '/hirer/find-talents',
        },
        {
          label: isMobile ? 'My Jobs' : 'Applications',
          value: 'applications',
          icon: <ApplicationsIcon />,
          path: '/hirer/applications',
        },
        {
          label: isMobile ? 'Inbox' : 'Messages',
          value: 'messages',
          icon: <MessagesIcon />,
          path: '/messages',
          badge: unreadCount > 0 ? unreadCount : null,
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
        label: isMobile ? 'Find' : 'Find Work',
        value: 'findWork',
        icon: <JobsIcon />,
        path: '/worker/find-work',
      },
      {
        label: isMobile ? 'My Jobs' : 'Applications',
        value: 'applications',
        icon: <ApplicationsIcon />,
        path: '/worker/applications',
      },
      {
        label: isMobile ? 'Inbox' : 'Messages',
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
  }, [isHirer, isMobile, unreadCount]);

  const handleNavigation = (event, newValue) => {
    const item = navigationItems.find(i => i.value === newValue);
    if (item?.path) {
      navigate(item.path);
    }
  };

  // Hide bottom nav when virtual keyboard is open
  if (isKeyboardVisible) return null;

  return (
    <StyledPaper elevation={0} component="nav" aria-label="Main navigation">
      <StyledBottomNavigation 
        value={currentValue} 
        onChange={handleNavigation} 
        aria-label="Primary mobile navigation"
        showLabels
      >
        {navigationItems.map((item) => (
          <StyledBottomNavigationAction
            key={item.value}
            label={item.label}
            value={item.value}
            aria-label={getActionAriaLabel(item)}
            icon={
              item.badge ? (
                <Badge 
                  badgeContent={item.badge} 
                  color="error"
                  aria-label={`${item.badge} unread ${item.badge === 1 ? 'message' : 'messages'}`}
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      fontSize: '0.72rem',
                      minWidth: 18,
                      height: 18,
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
