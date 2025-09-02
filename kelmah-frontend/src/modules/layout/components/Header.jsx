import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../auth/services/authSlice';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Button,
  alpha,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Dashboard as DashboardIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Menu as MenuIcon,
  Engineering as EngineeringIcon,
  Person as PersonIcon,
  Wallet as WalletIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import DesktopNav from './DesktopNav';
import MobileNav from './MobileNav';
// Removed AuthContext import to prevent dual state management conflicts
// import { useAuth } from '../../auth/contexts/AuthContext';
import { useAuthCheck } from '../../../hooks/useAuthCheck';
import { BRAND_COLORS } from '../../../theme';
import { useNotifications } from '../../notifications/contexts/NotificationContext';
import workersApi from '../../../api/services/workersApi';

// Enhanced Styled Components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? `linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(26, 26, 26, 0.95) 100%)`
    : `linear-gradient(135deg, rgba(255, 215, 0, 0.95) 0%, rgba(255, 193, 7, 0.95) 100%)`,
  backdropFilter: 'blur(20px)',
  borderBottom: theme.palette.mode === 'dark'
    ? `2px solid rgba(255, 215, 0, 0.5)`
    : `2px solid rgba(0, 0, 0, 0.3)`,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 8px 32px rgba(0, 0, 0, 0.9)'
    : '0 6px 25px rgba(0, 0, 0, 0.25)',
  position: 'sticky',
  top: 0,
  zIndex: 1100,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const BrandLogo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

const LogoIcon = styled(Box)(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: '50%',
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${BRAND_COLORS.gold} 0%, ${BRAND_COLORS.goldLight} 100%)`
    : `linear-gradient(135deg, ${BRAND_COLORS.black} 0%, ${BRAND_COLORS.blackLight} 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(1.5),
  color: theme.palette.mode === 'dark' ? BRAND_COLORS.black : BRAND_COLORS.gold,
  fontWeight: 800,
  fontSize: '1.5rem',
  fontFamily: 'Montserrat, sans-serif',
  boxShadow: theme.palette.mode === 'dark'
    ? `0 4px 15px rgba(255, 215, 0, 0.4)`
    : `0 4px 15px rgba(0, 0, 0, 0.3)`,
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    width: 36,
    height: 36,
    marginRight: theme.spacing(0.5),
    fontSize: '1.1rem',
  },
  // SportyBet-style mobile optimization
  '@media (max-width: 768px)': {
    width: 32,
    height: 32,
    marginRight: 4,
    fontSize: '1rem',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)`
      : `linear-gradient(45deg, transparent 30%, rgba(255, 215, 0, 0.3) 50%, transparent 70%)`,
    transform: 'translateX(-100%)',
    transition: 'transform 0.6s ease',
  },
  '&:hover::before': {
    transform: 'translateX(100%)',
  },
}));

const BrandText = styled(Typography)(({ theme }) => ({
  fontWeight: 800,
  fontFamily: 'Montserrat, sans-serif',
  fontSize: '1.75rem',
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${BRAND_COLORS.gold} 0%, ${BRAND_COLORS.goldLight} 100%)`
    : `linear-gradient(135deg, ${BRAND_COLORS.black} 0%, ${BRAND_COLORS.blackLight} 100%)`,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textShadow: theme.palette.mode === 'dark'
    ? '0 2px 10px rgba(255, 215, 0, 0.3)'
    : '0 2px 10px rgba(0, 0, 0, 0.2)',
  letterSpacing: '-0.02em',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.4rem',
  },
  // SportyBet-style mobile brand optimization
  '@media (max-width: 768px)': {
    fontSize: '1.2rem',
    fontWeight: 700,
  },
}));

const TaglineText = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.7)' 
    : 'rgba(0, 0, 0, 0.8)',
  fontWeight: 500,
  marginTop: '-2px',
  letterSpacing: '0.5px',
  [theme.breakpoints.down('md')]: {
    fontSize: '0.65rem',
  },
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark'
    ? 'rgba(255, 215, 0, 0.1)'
    : 'rgba(0, 0, 0, 0.1)',
  color: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
  border: theme.palette.mode === 'dark'
    ? `1px solid rgba(255, 215, 0, 0.2)`
    : `1px solid rgba(0, 0, 0, 0.2)`,
  margin: theme.spacing(0, 0.5),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  [theme.breakpoints.down('sm')]: {
    margin: theme.spacing(0, 0.25),
    padding: theme.spacing(1),
    minWidth: 'auto',
    width: 40,
    height: 40,
    '& .MuiSvgIcon-root': {
      fontSize: '1.2rem',
    },
  },
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 215, 0, 0.2)'
      : 'rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-1px) scale(1.05)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 4px 15px rgba(255, 215, 0, 0.3)'
      : '0 4px 15px rgba(0, 0, 0, 0.2)',
  },
  '&:active': {
    transform: 'translateY(0) scale(1)',
  },
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
  color: theme.palette.mode === 'dark' ? BRAND_COLORS.black : BRAND_COLORS.gold,
  fontWeight: 700,
  fontSize: '1rem',
  border: theme.palette.mode === 'dark'
    ? `2px solid rgba(255, 215, 0, 0.3)`
    : `2px solid rgba(0, 0, 0, 0.3)`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  [theme.breakpoints.down('sm')]: {
    width: 36,
    height: 36,
    fontSize: '0.9rem',
    border: theme.palette.mode === 'dark'
      ? `1.5px solid rgba(255, 215, 0, 0.3)`
      : `1.5px solid rgba(0, 0, 0, 0.3)`,
  },
  '&:hover': {
    transform: 'scale(1.1)',
    border: theme.palette.mode === 'dark'
      ? `2px solid ${BRAND_COLORS.gold}`
      : `2px solid ${BRAND_COLORS.black}`,
    boxShadow: theme.palette.mode === 'dark'
      ? `0 4px 15px rgba(255, 215, 0, 0.4)`
      : `0 4px 15px rgba(0, 0, 0, 0.3)`,
  },
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
    color: theme.palette.mode === 'dark' ? BRAND_COLORS.black : BRAND_COLORS.gold,
    fontWeight: 600,
    fontSize: '0.75rem',
    minWidth: '18px',
    height: '18px',
    border: `2px solid ${theme.palette.background.paper}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  },
}));

const AuthButton = styled(Button)(({ theme, variant }) => ({
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  padding: '8px 20px',
  fontSize: '0.9rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  [theme.breakpoints.down('sm')]: {
    padding: '6px 12px',
    fontSize: '0.8rem',
    minWidth: 'auto',
  },
  ...(variant === 'outlined' && {
    borderColor: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
    color: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
    borderWidth: '2px',
    '&:hover': {
      borderColor: theme.palette.mode === 'dark' ? BRAND_COLORS.goldLight : BRAND_COLORS.blackLight,
      backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(255, 215, 0, 0.1)' 
        : 'rgba(0, 0, 0, 0.08)',
      transform: 'translateY(-1px)',
      borderWidth: '2px',
    },
  }),
  ...(variant === 'contained' && {
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${BRAND_COLORS.gold} 0%, ${BRAND_COLORS.goldLight} 100%)`
      : `linear-gradient(135deg, ${BRAND_COLORS.black} 0%, ${BRAND_COLORS.blackLight} 100%)`,
    color: theme.palette.mode === 'dark' ? BRAND_COLORS.black : BRAND_COLORS.gold,
    boxShadow: theme.palette.mode === 'dark'
      ? '0 4px 15px rgba(255, 215, 0, 0.3)'
      : '0 4px 15px rgba(0, 0, 0, 0.3)',
    '&:hover': {
      background: theme.palette.mode === 'dark'
        ? `linear-gradient(135deg, ${BRAND_COLORS.goldLight} 0%, ${BRAND_COLORS.gold} 100%)`
        : `linear-gradient(135deg, ${BRAND_COLORS.blackLight} 0%, ${BRAND_COLORS.black} 100%)`,
      boxShadow: theme.palette.mode === 'dark'
        ? '0 6px 20px rgba(255, 215, 0, 0.4)'
        : '0 6px 20px rgba(0, 0, 0, 0.4)',
      transform: 'translateY(-2px)',
    },
  }),
}));

const StatusIndicator = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'online',
})(({ theme, online }) => ({
  position: 'absolute',
  bottom: 2,
  right: 2,
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: online ? '#4caf50' : '#f44336',
  border: `2px solid ${theme.palette.background.paper}`,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
}));

const Header = ({ toggleTheme, mode, isDashboardMode = false, autoShowMode = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  // Use Redux logout action instead of AuthContext
  const dispatch = useDispatch();
  const logout = () => dispatch(logoutUser());
  const authState = useAuthCheck();
  
  // ✅ FIXED: Enable proper mobile responsiveness based on screen size
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerAvailability, setHeaderAvailability] = useState(null);
  const [headerCompletion, setHeaderCompletion] = useState(null);
  
  // 🎯 AUTO-HIDE HEADER STATE
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [mouseY, setMouseY] = useState(0);

  // 🎯 ENHANCED: Comprehensive page type detection
  const isOnAuthPage = location.pathname.includes('/login') || 
                      location.pathname.includes('/register') ||
                      location.pathname.includes('/forgot-password') ||
                      location.pathname.includes('/reset-password') ||
                      location.pathname.includes('/verify-email');
  
  const isOnDashboardPage = location.pathname.includes('/dashboard') ||
                           location.pathname.startsWith('/worker') ||
                           location.pathname.startsWith('/hirer');
  
  const isOnHomePage = location.pathname === '/' || location.pathname === '/home';
  
  // 🚨 CRITICAL FIX: Bulletproof authentication state logic
  const { isAuthenticated, isInitialized, user, hasUser, canShowUserFeatures, shouldShowAuthButtons } = authState;
  
  // 🎯 SMART DISPLAY LOGIC: Context-aware element visibility
  const showUserFeatures = React.useMemo(() => {
    // Never show user features on auth pages
    if (isOnAuthPage) return false;
    
    // Only show if properly authenticated with user data
    if (!isInitialized || !isAuthenticated || !hasUser) return false;
    
    // Show user features on dashboard pages and other authenticated areas
    return canShowUserFeatures;
  }, [isOnAuthPage, isInitialized, isAuthenticated, hasUser, canShowUserFeatures]);
  
  const showAuthButtons = React.useMemo(() => {
    // Show auth buttons on auth pages for clear UX
    if (isOnAuthPage && isInitialized) return true;
    
    // Show auth buttons on home page and public pages if not authenticated
    if ((isOnHomePage || !isOnDashboardPage) && isInitialized && !isAuthenticated) return true;
    
    return false;
  }, [isOnAuthPage, isOnHomePage, isOnDashboardPage, isInitialized, isAuthenticated]);

  // 🎯 AUTO-HIDE HEADER FUNCTIONALITY
  React.useEffect(() => {
    if (!autoShowMode || isMobile) return; // Only on desktop with autoShowMode
    
    const handleMouseMove = (e) => {
      const currentY = e.clientY;
      setMouseY(currentY);
      
      // Show header when mouse is near top (within 50px)
      if (currentY < 50) {
        setIsHeaderVisible(true);
      } else {
        // Hide header when mouse moves away from top
        setIsHeaderVisible(false);
      }
    };

    const handleMouseLeave = () => {
      setIsHeaderVisible(false);
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [autoShowMode, isMobile]);

  // Load quick worker status for header chips
  React.useEffect(() => {
    const loadHeaderWorkerStatus = async () => {
      try {
        if (!showUserFeatures || user?.role !== 'worker') return;
        const id = user?.id || user?._id || user?.userId;
        if (id) {
          const [avail, comp] = await Promise.all([
            workersApi.getAvailabilityStatus(id).catch(() => null),
            workersApi.getProfileCompletion().catch(() => null),
          ]);
          if (avail) setHeaderAvailability(avail);
          if (comp) setHeaderCompletion(comp);
        }
      } catch (e) {
        // Non-blocking: header chips are optional
      }
    };
    loadHeaderWorkerStatus();
  }, [showUserFeatures, user?.role, user?.id, user?._id, user?.userId]);
  
  // 🔍 DEBUG: Authentication state logging (development only)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 HEADER AUTH STATE:', {
        pathname: location.pathname,
        isOnAuthPage,
        isAuthenticated,
        hasUser,
        showUserFeatures,
        showAuthButtons
      });
    }
  }, [location.pathname, isOnAuthPage, isAuthenticated, hasUser, showUserFeatures, showAuthButtons]);
  
  // ✅ NEW: Current page detection for responsive header content
  const getCurrentPageInfo = () => {
    const path = location.pathname;
    
    if (path.includes('/dashboard')) return { 
      name: 'Dashboard', 
      icon: DashboardIcon, 
      showBackButton: false 
    };
    if (path.includes('/jobs')) return { 
      name: 'Jobs', 
      icon: WorkIcon, 
      showBackButton: true 
    };
    if (path.includes('/contracts')) return { 
      name: 'Contracts', 
      icon: BusinessIcon, 
      showBackButton: true 
    };
    if (path.includes('/messages')) return { 
      name: 'Messages', 
      icon: MessageIcon, 
      showBackButton: true 
    };
    if (path.includes('/notifications')) return { 
      name: 'Notifications', 
      icon: NotificationsIcon, 
      showBackButton: true 
    };
    if (path.includes('/profile')) return { 
      name: 'Profile', 
      icon: PersonIcon, 
      showBackButton: true 
    };
    if (path.includes('/wallet')) return { 
      name: 'Wallet', 
      icon: WalletIcon, 
      showBackButton: true 
    };
    if (path.includes('/settings')) return { 
      name: 'Settings', 
      icon: SettingsIcon, 
      showBackButton: true 
    };
    if (path.includes('/login')) return { 
      name: 'Sign In', 
      icon: PersonIcon, 
      showBackButton: false 
    };
    if (path.includes('/register')) return { 
      name: 'Get Started', 
      icon: PersonIcon, 
      showBackButton: false 
    };
    
    return { 
      name: 'Kelmah', 
      icon: EngineeringIcon, 
      showBackButton: false 
    };
  };
  
  const currentPage = getCurrentPageInfo();
  
  // ✅ ENHANCED: Dynamic data based on user state and current page
  const { unreadCount: notifUnreadCount, notifications: notifList = [] } = useNotifications();
  const unreadNotifications = showUserFeatures ? (notifUnreadCount || 0) : 0;
  const unreadMessages = showUserFeatures ? 2 : 0;
  const isUserOnline = showUserFeatures ? true : false;

  const handleProfileMenuOpen = (event) => {
    if (showUserFeatures) {
    setAnchorEl(event.currentTarget);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event) => {
    if (showUserFeatures) {
    setNotificationsAnchor(event.currentTarget);
    }
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    try {
      console.log('🔄 Starting logout process...');
      await logout();
      console.log('✅ Logout successful, navigating to home...');
      navigate('/');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force navigation even if logout fails
      console.log('🔄 Force navigating to home despite logout error...');
      navigate('/');
    }
  };

  const navigateToDashboard = () => {
    handleMenuClose();
    if (user?.role === 'worker') {
      navigate('/worker/dashboard');
    } else if (user?.role === 'hirer') {
      navigate('/hirer/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U';
  };

  const getUserRole = () => {
    return user?.role || 'user';
  };

  const renderUserMenu = () => (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
      PaperProps={{
        elevation: 12,
        sx: {
          overflow: 'visible',
          filter: 'drop-shadow(0px 4px 16px rgba(0,0,0,0.2))',
          mt: 1.5,
          borderRadius: 3,
          minWidth: 280,
          border: theme.palette.mode === 'dark'
            ? `1px solid rgba(255, 215, 0, 0.3)`
            : `1px solid rgba(0, 0, 0, 0.2)`,
          backgroundColor: theme.palette.mode === 'dark' 
            ? BRAND_COLORS.blackMedium 
            : BRAND_COLORS.gold, // Pure gold instead of goldLight
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: theme.palette.mode === 'dark' 
              ? BRAND_COLORS.blackMedium 
              : BRAND_COLORS.gold, // Pure gold instead of goldLight
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
            border: theme.palette.mode === 'dark'
              ? `1px solid rgba(255, 215, 0, 0.3)`
              : `1px solid rgba(0, 0, 0, 0.2)`,
            borderBottom: 'none',
            borderRight: 'none',
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {/* User Info Header */}
      <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ position: 'relative' }}>
            <UserAvatar>
              {getUserInitials()}
            </UserAvatar>
            <StatusIndicator online={isUserOnline} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.name || user?.email || 'User'}
        </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
              <Chip
                label={getUserRole().charAt(0).toUpperCase() + getUserRole().slice(1)}
                size="small"
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 215, 0, 0.15)' 
                    : 'rgba(0, 0, 0, 0.1)',
                  color: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              />
              <Chip
                label={`On ${currentPage.name}`}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 215, 0, 0.3)' 
                    : 'rgba(0, 0, 0, 0.3)',
                  color: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
                  fontSize: '0.65rem',
                  fontWeight: 500,
                }}
              />
              <Chip
                label={isUserOnline ? 'Online' : 'Offline'}
                size="small"
                sx={{
                  backgroundColor: isUserOnline 
                    ? 'rgba(76, 175, 80, 0.1)' 
                    : 'rgba(244, 67, 54, 0.1)',
                  color: isUserOnline ? '#4caf50' : '#f44336',
                  fontSize: '0.65rem',
                  fontWeight: 500,
                }}
              />
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* Menu Items */}
      <MenuItem onClick={navigateToDashboard} sx={{ py: 1.5 }}>
        <ListItemIcon>
          <DashboardIcon color="primary" />
        </ListItemIcon>
        <ListItemText 
          primary="Dashboard" 
          primaryTypographyProps={{ fontWeight: 500 }}
        />
      </MenuItem>

      <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }} sx={{ py: 1.5 }}>
        <ListItemIcon>
          <PersonIcon color="primary" />
        </ListItemIcon>
        <ListItemText 
          primary="Profile" 
          primaryTypographyProps={{ fontWeight: 500 }}
        />
      </MenuItem>

      {user?.role === 'worker' && (
        <MenuItem onClick={() => { handleMenuClose(); navigate('/worker/wallet'); }} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <WalletIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Wallet" 
            primaryTypographyProps={{ fontWeight: 500 }}
          />
        </MenuItem>
      )}

      <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }} sx={{ py: 1.5 }}>
        <ListItemIcon>
          <SettingsIcon color="primary" />
        </ListItemIcon>
        <ListItemText 
          primary="Settings" 
          primaryTypographyProps={{ fontWeight: 500 }}
        />
      </MenuItem>

      <Divider sx={{ my: 1 }} />

      <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
        <ListItemIcon>
          <LogoutIcon color="error" />
        </ListItemIcon>
        <ListItemText 
          primary="Sign Out" 
          primaryTypographyProps={{ fontWeight: 500, color: 'error.main' }}
        />
      </MenuItem>
    </Menu>
  );

  const renderNotificationsMenu = () => (
    <Menu
      anchorEl={notificationsAnchor}
      open={Boolean(notificationsAnchor)}
      onClose={handleNotificationsClose}
      PaperProps={{
        elevation: 12,
        sx: {
          overflow: 'visible',
          filter: 'drop-shadow(0px 4px 16px rgba(0,0,0,0.2))',
          mt: 1.5,
          borderRadius: 3,
          minWidth: 320,
          maxHeight: 400,
          border: theme.palette.mode === 'dark'
            ? `1px solid rgba(255, 215, 0, 0.3)`
            : `1px solid rgba(0, 0, 0, 0.2)`,
          backgroundColor: theme.palette.mode === 'dark' 
            ? BRAND_COLORS.blackMedium 
            : BRAND_COLORS.gold, // Pure gold instead of goldLight
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" fontWeight={700}>
          Notifications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You have {unreadNotifications} unread notifications
        </Typography>
      </Box>

      {/* Render latest notifications (up to 5) */}
      {(notifList || []).slice(0, 5).map((n) => (
        <MenuItem key={n.id || n._id} onClick={() => { handleNotificationsClose(); navigate(n.actionUrl || '/notifications'); }} sx={{ py: 1.5 }}>
          <ListItemText
            primary={n.title || n.message || 'Notification'}
            secondary={new Date(n.createdAt || n.date).toLocaleString()}
            primaryTypographyProps={{ fontWeight: 500 }}
            secondaryTypographyProps={{ fontSize: '0.75rem' }}
          />
        </MenuItem>
      ))}

      <Divider />

      {/* Mark all as read */}
      <MenuItem
        onClick={() => {
          try {
            // Use NotificationContext to mark all as read
            const ctx = useNotifications();
            ctx.markAllAsRead?.();
          } catch (_) {}
          handleNotificationsClose();
        }}
        sx={{ 
          py: 1.2,
          justifyContent: 'center',
          color: 'text.secondary',
          fontWeight: 600,
        }}
      >
        Mark all as read
      </MenuItem>

      <MenuItem
        onClick={() => {
          handleNotificationsClose();
          navigate('/notifications');
        }}
        sx={{ 
          py: 1.5, 
          justifyContent: 'center',
          color: 'primary.main',
          fontWeight: 600,
        }}
      >
        View All Notifications
      </MenuItem>
    </Menu>
  );

  if (authState.isLoading || !authState.isReady) {
    return (
      <StyledAppBar position="static" elevation={0}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}> {/* Reduced from 70/80 to 56/64 */}
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <BrandLogo component={RouterLink} to="/">
              <LogoIcon>K</LogoIcon>
              <Box>
                <BrandText variant="h6">elmah</BrandText>
                <TaglineText>Ghana's Skilled Trades Platform</TaglineText>
              </Box>
            </BrandLogo>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ActionButton onClick={toggleTheme}>
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </ActionButton>
            </Box>
          </Box>
        </Toolbar>
      </StyledAppBar>
    );
  }

  return (
    <StyledAppBar 
      position={autoShowMode && !isMobile ? "fixed" : "static"} 
      elevation={0}
      sx={{
        // Auto-hide animation
        transform: autoShowMode && !isMobile 
          ? (isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)')
          : 'translateY(0)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: theme.zIndex.appBar + 1,
        // Fixed positioning for auto-hide mode
        ...(autoShowMode && !isMobile && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
        })
      }}
    >
      <Toolbar sx={{ 
        minHeight: { xs: 40, sm: 44, md: 48 }, // Further reduced: 48/52/56 → 40/44/48
        px: { xs: 1, sm: 2, md: 3 },
        py: { xs: 0.125, sm: 0.25 }, // Further reduced padding
        gap: { xs: 0.5, sm: 1 },
        // SportyBet-style compact mobile header
        '@media (max-width: 768px)': {
          minHeight: '36px', // Further reduced from 44px
          px: 1,
          py: 0.125, // Further reduced padding
        }
      }}>
        {/* Mobile Menu Button */}
        {isMobile && authState.isAuthenticated && (
          <ActionButton
            edge="start"
            aria-label="menu"
            onClick={() => setMobileMenuOpen(true)}
            sx={{ 
              mr: { xs: 0.5, sm: 1 },
              p: { xs: 1, sm: 1.5 },
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 215, 0, 0.15)'
                  : 'rgba(0, 0, 0, 0.15)',
              }
            }}
          >
            <MenuIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }} />
          </ActionButton>
        )}

        {/* ✅ ENHANCED: Smart Brand/Page Title Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          {/* Back Button (Mobile Only) */}
          {isMobile && currentPage.showBackButton && showUserFeatures && (
            <ActionButton
              onClick={() => navigate(-1)}
              sx={{ 
                mr: 1,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 215, 0, 0.15)'
                    : 'rgba(0, 0, 0, 0.15)',
                }
              }}
            >
              <motion.div
                whileHover={{ x: -2 }}
                whileTap={{ x: -4 }}
              >
                ←
              </motion.div>
            </ActionButton>
          )}

          {/* Brand Logo or Page Title */}
          <motion.div
            whileHover={{ scale: isMobile ? 1 : 1.02 }}
            whileTap={{ scale: isMobile ? 1 : 0.98 }}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            {isMobile && showUserFeatures ? (
              // ✅ Mobile: Show current page info with user context
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 215, 0, 0.1)'
                    : 'rgba(0, 0, 0, 0.1)',
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.5,
                  mr: 1
                }}>
                  <currentPage.icon sx={{ 
                    fontSize: '1.2rem', 
                    color: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
                    mr: 0.5 
                  }} />
                  <Typography 
                    variant="subtitle1" 
                    fontWeight={600}
                    color={theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black}
                    noWrap
                  >
                    {currentPage.name}
                  </Typography>
                </Box>
                {user && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        display: { xs: 'none', sm: 'block' },
                        maxWidth: 120,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.7rem'
                      }}
                    >
                      {user.firstName || user.name?.split(' ')[0] || user.email?.split('@')[0] || 'User'}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.disabled"
                      sx={{ 
                        display: { xs: 'none', sm: 'block' },
                        fontSize: '0.65rem',
                        textTransform: 'capitalize'
                      }}
                    >
                      {user.role || user.userType || 'User'}
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : isMobile && isOnAuthPage ? (
              // ✅ Mobile: Show auth page context
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 215, 0, 0.1)'
                    : 'rgba(0, 0, 0, 0.1)',
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.5,
                }}>
                  <currentPage.icon sx={{ 
                    fontSize: '1.2rem', 
                    color: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
                    mr: 0.5 
                  }} />
                  <Typography 
                    variant="subtitle1" 
                    fontWeight={600}
                    color={theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black}
                    noWrap
                  >
                    {currentPage.name}
                  </Typography>
                </Box>
              </Box>
            ) : (
              // ✅ Desktop: Show brand logo
              <BrandLogo component={RouterLink} to="/">
                <LogoIcon>
                  <EngineeringIcon sx={{ fontSize: '1.2rem' }} />
                </LogoIcon>
                <Box>
                  <BrandText variant="h6">elmah</BrandText>
                  <TaglineText>Ghana's Skilled Trades Platform</TaglineText>
                </Box>
              </BrandLogo>
            )}
          </motion.div>
        </Box>

        {/* Desktop Navigation */}
        {!isMobile && <DesktopNav />}

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 0.25, sm: 0.5, md: 1 },
          ml: 'auto'
        }}>
          {/* Theme Toggle */}
          <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`} arrow>
            <ActionButton onClick={toggleTheme}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 180, opacity: 0 }}
                  transition={{ duration: 0.3 }}
            >
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </motion.div>
              </AnimatePresence>
            </ActionButton>
          </Tooltip>

          {/* Show loading state during initialization */}
          {!authState.isReady ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
            </Box>
          ) : showUserFeatures ? (
            <>
              {/* Worker quick status chips */}
              {user?.role === 'worker' && (
                <Stack direction="row" spacing={0.75} sx={{ mr: 0.5 }}>
                  {headerAvailability && (
                    <Chip
                      size="small"
                      label={headerAvailability.isAvailable ? 'Available' : (headerAvailability.status || 'Busy')}
                      sx={{
                        backgroundColor: headerAvailability.isAvailable
                          ? 'rgba(76, 175, 80, 0.12)'
                          : 'rgba(255, 152, 0, 0.12)',
                        color: headerAvailability.isAvailable ? '#4caf50' : '#ff9800',
                        border: theme.palette.mode === 'dark'
                          ? '1px solid rgba(255, 215, 0, 0.15)'
                          : '1px solid rgba(0, 0, 0, 0.12)'
                      }}
                      onClick={() => navigate('/worker/profile/edit?section=availability')}
                      clickable
                    />
                  )}
                  {typeof (headerCompletion?.completion) === 'number' && (
                    <Chip
                      size="small"
                      label={`${Math.round(headerCompletion.completion)}%`}
                      sx={{
                        backgroundColor: 'rgba(255, 215, 0, 0.12)',
                        color: '#FFD700',
                        border: theme.palette.mode === 'dark'
                          ? '1px solid rgba(255, 215, 0, 0.15)'
                          : '1px solid rgba(0, 0, 0, 0.12)'
                      }}
                      onClick={() => navigate('/worker/profile/edit')}
                      clickable
                    />
                  )}
                </Stack>
              )}
              {/* Messages */}
              <Tooltip title="Messages" arrow>
                <ActionButton onClick={() => navigate('/messages')}>
                  <StyledBadge badgeContent={unreadMessages} color="primary">
                    <MessageIcon />
                  </StyledBadge>
                </ActionButton>
              </Tooltip>

              {/* Notifications */}
              <Tooltip title="Notifications" arrow>
                <ActionButton onClick={handleNotificationsOpen}>
                  <StyledBadge badgeContent={unreadNotifications} color="primary">
                    <NotificationsIcon />
                  </StyledBadge>
                </ActionButton>
              </Tooltip>

              {/* User Avatar */}
              <Tooltip title="Account menu" arrow>
                <Box sx={{ position: 'relative', ml: 1 }}>
                  <UserAvatar onClick={handleProfileMenuOpen}>
                    {getUserInitials()}
                  </UserAvatar>
                  <StatusIndicator online={isUserOnline} />
                </Box>
              </Tooltip>
            </>
          ) : showAuthButtons ? (
            <Stack direction="row" spacing={1} sx={{ ml: 1 }}>
              <AuthButton
                component={RouterLink}
                to="/login"
                variant="outlined"
                size="small"
              >
                Sign In
              </AuthButton>
              <AuthButton
                component={RouterLink}
                to="/register"
                variant="contained"
                size="small"
              >
                Get Started
              </AuthButton>
            </Stack>
          ) : null}
        </Box>
      </Toolbar>

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNav
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Menus */}
      {renderUserMenu()}
      {renderNotificationsMenu()}
    </StyledAppBar>
  );
};

export default Header;
