import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  Divider,
  Typography,
  useMediaQuery,
  Drawer,
} from '@mui/material';
import { styled, useTheme as useMuiTheme } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Dashboard as DashboardIcon,
  Work as WorkIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';

import { useTheme } from '../../../theme/ThemeProvider';
import { logout } from '../../auth/services/authSlice';
import { PRIMARY_COLORS, BRAND_GRADIENTS } from '../../../design-system/foundations/colors';
import { SEMANTIC_SPACING, BORDER_RADIUS, Z_INDEX } from '../../../design-system/foundations/spacing';
import { TYPOGRAPHY_SCALE, FONT_WEIGHTS } from '../../../design-system/foundations/typography';
import { IconButton as DesignIconButton } from '../../../design-system/components/UI/Button';
import { Flex, Inline } from '../../../design-system/components/Layout/Grid';
import Container from '../../../design-system/components/Layout/Container';

/**
 * Enhanced Header Component with Design System Integration
 * 
 * Features:
 * - Responsive design with mobile drawer
 * - Theme toggle with smooth animations
 * - User menu with profile actions
 * - Notification center
 * - Consistent brand styling
 * - Accessibility improvements
 */

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  backdropFilter: 'blur(20px)',
  zIndex: Z_INDEX.sticky,
  
  // Glassmorphism effect
  background: theme.palette.mode === 'dark' 
    ? 'rgba(0, 0, 0, 0.8)' 
    : 'rgba(255, 215, 0, 0.9)',
  
  transition: theme.transitions.create(['background', 'border-color'], {
    duration: theme.transitions.duration.standard,
  }),
}));

const LogoContainer = styled(motion.div)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  cursor: 'pointer',
  padding: `${SEMANTIC_SPACING.component.xs} ${SEMANTIC_SPACING.component.sm}`,
  borderRadius: BORDER_RADIUS.md,
  transition: theme.transitions.create(['background-color', 'transform']),
  
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'scale(1.02)',
  },
}));

const LogoText = styled(Typography)(({ theme }) => ({
  fontFamily: TYPOGRAPHY_SCALE['display-md'].fontFamily,
  fontSize: TYPOGRAPHY_SCALE['heading-lg'].fontSize,
  fontWeight: FONT_WEIGHTS.bold,
  background: theme.palette.mode === 'dark' 
    ? BRAND_GRADIENTS.gold 
    : BRAND_GRADIENTS.black,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textDecoration: 'none',
  letterSpacing: '-0.02em',
}));

const LogoAccent = styled('span')(({ theme }) => ({
  color: theme.palette.mode === 'dark' 
    ? PRIMARY_COLORS.gold[500]
    : PRIMARY_COLORS.black[900],
  fontWeight: FONT_WEIGHTS.extrabold,
}));

const NavigationLink = styled(Link)(({ theme, active }) => ({
  textDecoration: 'none',
  color: theme.palette.text.primary,
  padding: `${SEMANTIC_SPACING.component.sm} ${SEMANTIC_SPACING.component.md}`,
  borderRadius: BORDER_RADIUS.md,
  fontSize: TYPOGRAPHY_SCALE['label-md'].fontSize,
  fontWeight: active ? FONT_WEIGHTS.semibold : FONT_WEIGHTS.medium,
  position: 'relative',
  overflow: 'hidden',
  transition: theme.transitions.create(['color', 'background-color']),
  
  '&:before': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: active ? '100%' : 0,
    height: '2px',
    background: theme.palette.mode === 'dark' 
      ? BRAND_GRADIENTS.gold 
      : BRAND_GRADIENTS.black,
    transition: theme.transitions.create('width'),
  },
  
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.primary.main,
    
    '&:before': {
      width: '100%',
    },
  },
}));

const ThemeToggleButton = styled(IconButton)(({ theme }) => ({
  borderRadius: BORDER_RADIUS.full,
  padding: SEMANTIC_SPACING.component.sm,
  backgroundColor: theme.palette.action.hover,
  border: `1px solid ${theme.palette.divider}`,
  transition: theme.transitions.create(['background-color', 'transform', 'box-shadow']),
  
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    transform: 'rotate(180deg)',
    boxShadow: `0 0 20px ${theme.palette.primary.main}40`,
  },
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: theme.palette.mode === 'dark' 
    ? PRIMARY_COLORS.gold[500]
    : PRIMARY_COLORS.black[900],
  color: theme.palette.mode === 'dark' 
    ? PRIMARY_COLORS.black[900]
    : PRIMARY_COLORS.gold[500],
  fontSize: TYPOGRAPHY_SCALE['label-lg'].fontSize,
  fontWeight: FONT_WEIGHTS.semibold,
  cursor: 'pointer',
  transition: theme.transitions.create(['transform', 'box-shadow']),
  
  '&:hover': {
    transform: 'scale(1.1)',
    boxShadow: `0 0 15px ${theme.palette.primary.main}40`,
  },
}));

const NotificationBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    fontSize: '0.75rem',
    fontWeight: FONT_WEIGHTS.semibold,
    minWidth: '18px',
    height: '18px',
    animation: 'pulse 2s infinite',
  },
  
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.1)' },
    '100%': { transform: 'scale(1)' },
  },
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: BORDER_RADIUS.xl,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(26, 26, 26, 0.95)'
      : 'rgba(255, 215, 0, 0.95)',
    backdropFilter: 'blur(20px)',
    boxShadow: `0 10px 40px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
    minWidth: '250px',
    marginTop: SEMANTIC_SPACING.component.sm,
  },
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  padding: `${SEMANTIC_SPACING.component.sm} ${SEMANTIC_SPACING.component.md}`,
  borderRadius: BORDER_RADIUS.sm,
  margin: `${SEMANTIC_SPACING.component.xs} ${SEMANTIC_SPACING.component.sm}`,
  fontSize: TYPOGRAPHY_SCALE['body-sm'].fontSize,
  gap: SEMANTIC_SPACING.component.sm,
  
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'translateX(4px)',
  },
  
  '& .MuiSvgIcon-root': {
    fontSize: '1.2rem',
  },
}));

const MobileDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 280,
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
    padding: SEMANTIC_SPACING.layout.md,
  },
}));

const Header = () => {
  const muiTheme = useMuiTheme();
  const { mode, toggleTheme } = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationMenuAnchor, setNotificationMenuAnchor] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationMenuAnchor(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationMenuAnchor(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleUserMenuClose();
    navigate('/');
  };

  const handleProfileClick = () => {
    navigate('/profile');
    handleUserMenuClose();
  };

  const handleDashboardClick = () => {
    const dashboardPath = user?.role === 'worker' ? '/worker/dashboard' : '/hirer/dashboard';
    navigate(dashboardPath);
    handleUserMenuClose();
  };

  const navigationItems = [
    { path: '/', label: 'Home', icon: <DashboardIcon /> },
    { path: '/jobs', label: 'Jobs', icon: <WorkIcon /> },
    { path: '/workers', label: 'Find Talent', icon: <PersonIcon /> },
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderNavigationItems = () => (
    <Inline gap="sm">
      {navigationItems.map((item) => (
        <NavigationLink
          key={item.path}
          to={item.path}
          active={location.pathname === item.path}
        >
          {item.label}
        </NavigationLink>
      ))}
    </Inline>
  );

  const renderUserMenu = () => (
    <StyledMenu
      anchorEl={userMenuAnchor}
      open={Boolean(userMenuAnchor)}
      onClose={handleUserMenuClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${muiTheme.palette.divider}` }}>
        <Typography variant="subtitle2" color="text.secondary">
          Signed in as
        </Typography>
        <Typography variant="body1" fontWeight={600}>
          {user?.name || user?.email}
        </Typography>
      </Box>
      
      <StyledMenuItem onClick={handleDashboardClick}>
        <DashboardIcon />
        Dashboard
      </StyledMenuItem>
      
      <StyledMenuItem onClick={handleProfileClick}>
        <AccountCircleIcon />
        Profile
      </StyledMenuItem>
      
      <StyledMenuItem onClick={() => navigate('/settings')}>
        <SettingsIcon />
        Settings
      </StyledMenuItem>
      
      <Divider sx={{ my: 1 }} />
      
      <StyledMenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
        <LogoutIcon />
        Sign Out
      </StyledMenuItem>
    </StyledMenu>
  );

  const renderNotificationMenu = () => (
    <StyledMenu
      anchorEl={notificationMenuAnchor}
      open={Boolean(notificationMenuAnchor)}
      onClose={handleNotificationMenuClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${muiTheme.palette.divider}` }}>
        <Typography variant="h6">Notifications</Typography>
      </Box>
      
      <StyledMenuItem>
        <Typography variant="body2" color="text.secondary">
          No new notifications
        </Typography>
      </StyledMenuItem>
    </StyledMenu>
  );

  return (
    <>
      <StyledAppBar position="sticky" elevation={0}>
        <Container size="2xl" padding="none">
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            {/* Logo */}
            <LogoContainer
              component={Link}
              to="/"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogoText variant="h5" component="div">
                <LogoAccent>K</LogoAccent>elmah
              </LogoText>
            </LogoContainer>

            {/* Desktop Navigation */}
            {!isMobile && (
              <Flex justify="center" align="center">
                {renderNavigationItems()}
              </Flex>
            )}

            {/* Actions */}
            <Flex align="center" gap="sm">
              {/* Theme Toggle */}
              <ThemeToggleButton
                onClick={toggleTheme}
                aria-label="Toggle theme"
                title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                  </motion.div>
                </AnimatePresence>
              </ThemeToggleButton>

              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <DesignIconButton
                    size="md"
                    onClick={handleNotificationMenuOpen}
                    aria-label="View notifications"
                  >
                    <NotificationBadge badgeContent={0} max={99}>
                      <NotificationsIcon />
                    </NotificationBadge>
                  </DesignIconButton>

                  {/* User Avatar */}
                  <UserAvatar
                    onClick={handleUserMenuOpen}
                    aria-label="User menu"
                    src={user?.avatar}
                  >
                    {getInitials(user?.name)}
                  </UserAvatar>
                </>
              ) : (
                <Inline gap="sm">
                  <NavigationLink to="/auth/login">Sign In</NavigationLink>
                  <NavigationLink to="/auth/register">Get Started</NavigationLink>
                </Inline>
              )}

              {/* Mobile Menu Button */}
              {isMobile && (
                <DesignIconButton
                  size="md"
                  onClick={() => setMobileDrawerOpen(true)}
                  aria-label="Open navigation menu"
                >
                  <MenuIcon />
                </DesignIconButton>
              )}
            </Flex>
          </Toolbar>
        </Container>
      </StyledAppBar>

      {/* Mobile Drawer */}
      <MobileDrawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      >
        <Box sx={{ py: 2 }}>
          <LogoContainer sx={{ mb: 3, justifyContent: 'center' }}>
            <LogoText variant="h5">
              <LogoAccent>K</LogoAccent>elmah
            </LogoText>
          </LogoContainer>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {navigationItems.map((item) => (
              <NavigationLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileDrawerOpen(false)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: SEMANTIC_SPACING.component.sm,
                  width: '100%',
                }}
              >
                {item.icon}
                {item.label}
              </NavigationLink>
            ))}
          </Box>
        </Box>
      </MobileDrawer>

      {/* Menus */}
      {renderUserMenu()}
      {renderNotificationMenu()}
    </>
  );
};

export default Header;
