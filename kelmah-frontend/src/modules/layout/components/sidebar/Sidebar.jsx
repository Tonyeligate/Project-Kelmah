import React, { useEffect, useMemo, useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  Typography,
  Avatar,
  Rating,
  LinearProgress,
  Button,
  Chip,
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useNotifications } from '../../../notifications/contexts/NotificationContext';
import { useMessages } from '../../../messaging/contexts/MessageContext';

// --- ICONS ---
import HomeIcon from '@mui/icons-material/Home';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import GavelIcon from '@mui/icons-material/Gavel';
import PaymentIcon from '@mui/icons-material/Payment';
import VerifiedIcon from '@mui/icons-material/Verified';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StarIcon from '@mui/icons-material/Star';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import WorkIcon from '@mui/icons-material/Work';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ChatIcon from '@mui/icons-material/Chat';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import { Star } from '@mui/icons-material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { getProfileCompletion } from '../../../../utils/userUtils';
import profileService from '../../../profile/services/profileService';
import {
  selectProfile,
  selectProfileLoading,
  setProfile,
  setError as setProfileError,
} from '../../../../store/slices/profileSlice';

const Sidebar = ({ variant = 'permanent', open = false, onClose }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const profile = useSelector(selectProfile);
  const profileLoading = useSelector(selectProfileLoading);
  const { unreadCount: unreadMessages } = useMessages();
  const { unreadCount: unreadNotifications } = useNotifications();
  const location = useLocation();
  const [profileRequested, setProfileRequested] = useState(false);
  const userIdentifier =
    user?.id || user?._id || user?.userId || user?.email || null;

  useEffect(() => {
    setProfileRequested(false);
  }, [userIdentifier]);

  useEffect(() => {
    if (!userIdentifier || profileRequested || profileLoading || profile) {
      return;
    }

    let isMounted = true;
    setProfileRequested(true);

    const fetchProfile = async () => {
      try {
        const profileData = await profileService.getProfile();
        if (isMounted && profileData) {
          dispatch(setProfile(profileData));
          dispatch(setProfileError(null));
        }
      } catch (error) {
        console.warn('Sidebar profile prefetch failed:', error.message);
        if (isMounted) {
          dispatch(
            setProfileError(
              error?.message || 'Unable to load profile information',
            ),
          );
          setProfileRequested(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [
    dispatch,
    userIdentifier,
    profile,
    profileLoading,
    profileRequested,
  ]);
  // Determine role for navigation strictly from authenticated user
  const navRole =
    user?.role === 'hirer' ||
      user?.userType === 'hirer' ||
      user?.userRole === 'hirer'
      ? 'hirer'
      : user?.role === 'worker' ||
        user?.userType === 'worker' ||
        user?.userRole === 'worker'
        ? 'worker'
        : null;
  const isVerified = true; // Mock data
  const completionInfo = useMemo(
    () => getProfileCompletion(user, profile),
    [user, profile],
  );
  const profileCompletion = completionInfo.percentage || 0;
  const missingFields = completionInfo.missing?.slice(0, 3) || [];
  const completionLabels = {
    firstName: 'Add first name',
    lastName: 'Add last name',
    email: 'Verify email',
    bio: 'Write a short bio',
    location: 'Set your location',
    phone: 'Add phone number',
    profileImage: 'Upload a profile photo',
    skills: 'List your skills',
    experience: 'Detail experience',
  };
  const [openSubMenus, setOpenSubMenus] = useState({});

  const handleSubMenuToggle = (itemText) => {
    setOpenSubMenus((prev) => ({
      ...prev,
      [itemText]: !prev[itemText],
    }));
  };

  // Define role-specific navigation items
  const roleNavItems =
    navRole === 'worker'
      ? [
        { text: 'Dashboard', icon: <HomeIcon />, path: '/worker/dashboard' },
        {
          text: 'My Schedule',
          icon: <CalendarTodayIcon />,
          path: '/worker/schedule',
        },
        {
          text: 'Find Work',
          icon: <FindInPageIcon />,
          path: '/worker/find-work',
        },
        {
          text: 'My Applications',
          icon: <AssignmentTurnedInIcon />,
          path: '/worker/applications',
        },
        {
          text: 'Active Contracts',
          icon: <GavelIcon />,
          path: '/worker/contracts',
        },
        { text: 'My Reviews', icon: <StarIcon />, path: '/worker/reviews' },
        {
          text: 'Payment Center',
          icon: <PaymentIcon />,
          path: '/worker/payment',
        },
        { text: 'Wallet', icon: <CreditCardIcon />, path: '/worker/wallet' },
        { text: 'Bills', icon: <ReceiptIcon />, path: '/payment/bill' },
      ]
      : navRole === 'hirer'
        ? [
          { text: 'Dashboard', icon: <HomeIcon />, path: '/hirer/dashboard' },
          {
            text: 'Post a Job',
            icon: <PaymentIcon />,
            path: '/hirer/jobs/post',
          },
          { text: 'Manage Jobs', icon: <WorkIcon />, path: '/hirer/jobs' },
          {
            text: 'Applications',
            icon: <AssignmentTurnedInIcon />,
            path: '/hirer/applications',
          },
          {
            text: 'Find Talent',
            icon: <FindInPageIcon />,
            path: '/hirer/find-talent',
          },
        ]
        : [];

  // Define common navigation items for all roles
  const commonNavItems = [
    {
      text: 'Notifications',
      icon: <NotificationsIcon />,
      path: '/notifications',
      badge: unreadNotifications,
    },
    {
      text: 'Messages',
      icon: <ChatIcon />,
      path: '/messages',
      badge: unreadMessages,
    },
    { text: 'Disputes', icon: <GavelIcon />, path: '/disputes' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  // Combine role-specific and common items
  const mainNavItems = [...roleNavItems, ...commonNavItems];

  return (
    <Drawer
      variant={variant}
      open={variant === 'temporary' ? open : undefined}
      onClose={variant === 'temporary' ? onClose : undefined}
      ModalProps={{ keepMounted: true }} // Improve mobile performance
      aria-label="Sidebar navigation"
      sx={{
        width: 280,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 280,
          boxSizing: 'border-box',
          backgroundColor: '#1C2536',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Avatar
          alt={user?.firstName || 'Worker'}
          src={
            user?.profileImage ||
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjMWExYTFhIi8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNjAiIHI9IjI1IiBmaWxsPSIjRkZENzAwIi8+CjxwYXRoIGQ9Im0zMCAxMjBjMC0yNSAyMC00NSA0NS00NXM0NSAyMCA0NSA0NSIgZmlsbD0iI0ZGRDcwMCIvPgo8L3N2Zz4K'
          }
          sx={{
            width: 80,
            height: 80,
            margin: '0 auto',
            mb: 2,
            border: '2px solid #FFD700',
          }}
        />
        <Typography variant="h6">{user?.firstName || 'Demo User'}</Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {user?.profession || 'Carpenter'}
        </Typography>

        {/* ✅ IMPROVED: Add current location indicator */}
        <Box
          sx={{
            mt: 2,
            p: 1,
            backgroundColor: 'rgba(212,175,55,0.1)',
            borderRadius: 1,
            border: '1px solid rgba(212,175,55,0.3)',
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: '#D4AF37', fontWeight: 'bold' }}
          >
            Currently on:{' '}
            {mainNavItems.find((item) => location.pathname === item.path)
              ?.text || 'Dashboard'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
          <Rating
            name="read-only"
            value={user?.rating || 4.5}
            precision={0.5}
            readOnly
            sx={{
              '& .MuiRating-iconFilled': { color: '#FFD700' },
              '& .MuiRating-iconEmpty': { color: 'rgba(255,255,255,0.26)' },
            }}
          />
        </Box>
        {isVerified && Chip && (
          <Chip
            icon={<VerifiedIcon />}
            label="Verified"
            color="success"
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
      <Box sx={{ px: 2, py: 2 }}>
        <Typography
          variant="body2"
          sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}
        >
          Profile Completion
        </Typography>
        <LinearProgress
          variant="determinate"
          value={profileCompletion}
          sx={{ height: 8, borderRadius: 999 }}
        />
        <Typography
          variant="caption"
          sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mt: 0.5 }}
        >
          {profileCompletion}% complete
        </Typography>
        {profileCompletion < 100 && missingFields.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mb: 0.5 }}
            >
              Next steps
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {missingFields.map((field) => (
                <Chip
                  key={field}
                  label={completionLabels[field] || field}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(212,175,55,0.5)',
                    color: '#FFD700',
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              ))}
            </Box>
            <Button
              component={RouterLink}
              to={navRole === 'hirer' ? '/hirer/profile/edit' : '/worker/profile/edit'}
              variant="text"
              size="small"
              sx={{ mt: 1, color: '#FFD700', textTransform: 'none' }}
            >
              Complete profile
            </Button>
          </Box>
        )}
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
      <List sx={{ flexGrow: 1 }}>
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <React.Fragment key={item.text}>
              <ListItem
                button
                component={item.path ? RouterLink : 'div'}
                to={item.path}
                onClick={() => item.subItems && handleSubMenuToggle(item.text)}
                sx={{
                  // ✅ IMPROVED: Add active state highlighting
                  backgroundColor: isActive
                    ? 'rgba(212,175,55,0.15)'
                    : 'transparent',
                  borderLeft: isActive
                    ? '4px solid #D4AF37'
                    : '4px solid transparent',
                  '&:hover': {
                    backgroundColor: isActive
                      ? 'rgba(212,175,55,0.2)'
                      : 'rgba(255,255,255,0.05)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? '#D4AF37' : '#fff',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {item.badge && item.badge > 0 ? (
                    <Badge color="error" badgeContent={item.badge} max={99}>
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: isActive ? '#D4AF37' : '#fff',
                      fontWeight: isActive ? 'bold' : 'normal',
                      transition: 'all 0.3s ease',
                    },
                  }}
                />
              </ListItem>
            </React.Fragment>
          );
        })}
      </List>
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Button
          component={RouterLink}
          to="/premium"
          variant="contained"
          fullWidth
          startIcon={<Star />}
          sx={{
            backgroundColor: '#FFD700',
            color: '#000',
            '&:hover': {
              backgroundColor: '#E6C200',
            },
          }}
        >
          Upgrade to Premium
        </Button>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
