import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  Typography,
  useTheme,
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
import {
  Z_INDEX,
  BOTTOM_NAV_HEIGHT,
  TOUCH_TARGET_MIN,
} from '../../../constants/layout';
import { withSafeAreaBottom } from '../../../utils/safeArea';
import useKeyboardVisible from '../../../hooks/useKeyboardVisible';

// Styled Components - Clean mobile-first design
const StyledPaper = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: Z_INDEX.bottomNav,
  borderTop:
    theme.palette.mode === 'dark'
      ? '1px solid rgba(255, 215, 0, 0.2)'
      : '1px solid rgba(0, 0, 0, 0.1)',
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(24, 23, 18, 0.98)'
      : 'rgba(255, 255, 255, 0.98)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
  // Safe area for iOS devices
  paddingBottom: withSafeAreaBottom(0),
}));

const StyledBottomNavigation = styled(BottomNavigation)(() => ({
  backgroundColor: 'transparent',
  height: BOTTOM_NAV_HEIGHT,
  minHeight: BOTTOM_NAV_HEIGHT,
}));

const StyledBottomNavigationAction = styled(BottomNavigationAction)(
  ({ theme }) => ({
    color: theme.palette.mode === 'dark' ? '#888' : '#666',
    flex: 1,
    maxWidth: 'none',
    minHeight: BOTTOM_NAV_HEIGHT,
    minWidth: TOUCH_TARGET_MIN,
    padding: '6px 6px 8px',
    borderTop: '3px solid transparent',
    borderRadius: 10,
    transition: 'all 0.2s ease',
    gap: 2,
    '&:focus-visible': {
      outline: `3px solid ${theme.palette.mode === 'dark' ? BRAND_COLORS.gold : theme.palette.primary.main}`,
      outlineOffset: '2px',
      borderRadius: 10,
    },
    '&.Mui-selected': {
      color:
        theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
      borderTopColor:
        theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
      backgroundColor:
        theme.palette.mode === 'dark'
          ? 'rgba(255, 215, 0, 0.12)'
          : 'rgba(17, 24, 39, 0.07)',
      '& .MuiBottomNavigationAction-label': {
        fontSize: '0.82rem',
        fontWeight: 700,
        opacity: 1,
      },
      '& .MuiSvgIcon-root': {
        transform: 'scale(1.12)',
      },
    },
    '& .MuiBottomNavigationAction-label': {
      fontSize: '0.74rem',
      fontWeight: 600,
      marginTop: 3,
      opacity: 0.9,
      maxWidth: '100%',
      whiteSpace: 'normal',
      lineHeight: 1.05,
      textAlign: 'center',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      textOverflow: 'clip',
      transition: 'all 0.2s ease',
    },
    '& .MuiSvgIcon-root': {
      fontSize: '1.4rem',
      transition: 'transform 0.2s ease',
    },
    // Better touch targets
    '&:active': {
      backgroundColor:
        theme.palette.mode === 'dark'
          ? 'rgba(255, 215, 0, 0.1)'
          : 'rgba(0, 0, 0, 0.05)',
    },
    '@media (max-width:360px)': {
      padding: '6px 2px 8px',
      minHeight: 52,
      '& .MuiBottomNavigationAction-label': {
        fontSize: '0.7rem',
      },
      '&.Mui-selected .MuiBottomNavigationAction-label': {
        fontSize: '0.76rem',
      },
    },
  }),
);

const MobileBottomNav = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const { unreadCount = 0 } = useNotifications();
  const { isKeyboardVisible } = useKeyboardVisible();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Get user role from Redux auth state (not path-based)
  const { user, isAuthenticated } = useSelector((state) => state.auth);

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
          label: 'Post Job',
          value: 'postJob',
          icon: <PostJobIcon />,
          path: '/hirer/jobs/post',
        },
        {
          label: 'Find Talent',
          value: 'findTalent',
          icon: <SearchIcon />,
          path: '/hirer/find-talents',
        },
        {
          label: 'Responses',
          value: 'applications',
          icon: <ApplicationsIcon />,
          path: '/hirer/applications',
        },
        {
          label: 'Messages',
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
        label: 'Find Work',
        value: 'findWork',
        icon: <JobsIcon />,
        path: '/worker/find-work',
      },
      {
        label: 'Applied',
        value: 'applications',
        icon: <ApplicationsIcon />,
        path: '/worker/applications',
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
    const item = navigationItems.find((i) => i.value === newValue);
    if (item?.path) {
      setIsTransitioning(true);
      navigate(item.path);
    }
  };

  useEffect(() => {
    if (!isTransitioning) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsTransitioning(false);
    }, 260);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isTransitioning]);

  // Hide bottom nav when auth is unavailable or the virtual keyboard is open.
  if (!isAuthenticated || isKeyboardVisible) {
    return null;
  }

  return (
    <StyledPaper elevation={0} component="nav" aria-label="Main navigation">
      <Typography
        component="span"
        role="status"
        aria-live="polite"
        sx={{
          position: 'absolute',
          width: 1,
          height: 1,
          p: 0,
          m: -1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {unreadCount > 0
          ? `${unreadCount} unread ${unreadCount === 1 ? 'message' : 'messages'}`
          : 'No unread messages'}
      </Typography>
      <StyledBottomNavigation
        value={currentValue}
        onChange={handleNavigation}
        aria-label="Primary mobile navigation"
        showLabels
        sx={{
          transition: 'transform 0.22s ease',
          transform: isTransitioning ? 'scale(0.996)' : 'scale(1)',
        }}
      >
        {navigationItems.map((item) => (
          <StyledBottomNavigationAction
            key={item.value}
            label={item.label}
            value={item.value}
            aria-label={getActionAriaLabel(item)}
            icon={
              item.value === 'messages' ? (
                <Badge
                  badgeContent={item.badge || 0}
                  showZero
                  color="error"
                  aria-label={`${item.badge || 0} unread ${(item.badge || 0) === 1 ? 'message' : 'messages'}`}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      minWidth: 20,
                      height: 20,
                      border: '2px solid',
                      borderColor: theme.palette.background.paper,
                      visibility: item.badge ? 'visible' : 'hidden',
                    },
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
