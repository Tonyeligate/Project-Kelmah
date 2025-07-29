import React, { useState, useEffect } from 'react';
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
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Grow,
  Collapse,
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
  ExpandLess,
  ExpandMore,
  Home as HomeIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useTheme } from '../../../theme/ThemeProvider';
import { PRIMARY_COLORS, BRAND_GRADIENTS } from '../../foundations/colors';
import { SEMANTIC_SPACING, BORDER_RADIUS, Z_INDEX } from '../../foundations/spacing';
import { TYPOGRAPHY_SCALE, FONT_WEIGHTS } from '../../foundations/typography';
import { Flex, Inline } from '../Layout/Grid';
import Container from '../Layout/Container';
import Typography from '../UI/Typography';
import { SearchInput } from '../UI/Input';

/**
 * Enhanced Navigation Header with Design System Integration
 * 
 * Features:
 * - Responsive design with mobile drawer
 * - Advanced theme toggle with smooth animations
 * - Search functionality
 * - User menu with profile actions
 * - Notification center with real-time updates
 * - Breadcrumb navigation
 * - Sticky behavior with blur effects
 * - Multi-level navigation support
 */

const StyledAppBar = styled(AppBar)(({ theme, scrolled }) => ({
  backgroundColor: scrolled 
    ? theme.palette.mode === 'dark' 
      ? 'rgba(0, 0, 0, 0.85)' 
      : 'rgba(255, 215, 0, 0.85)'
    : theme.palette.mode === 'dark'
      ? 'rgba(0, 0, 0, 0.95)'
      : 'rgba(255, 215, 0, 0.95)',
  borderBottom: `1px solid ${theme.palette.divider}`,
  boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.1)' : 'none',
  backdropFilter: 'blur(20px)',
  zIndex: Z_INDEX.sticky,
  transition: theme.transitions.create(['background-color', 'box-shadow'], {
    duration: theme.transitions.duration.standard,
  }),
}));

const LogoContainer = styled(motion.div)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  cursor: 'pointer',
  padding: `${SEMANTIC_SPACING.component.xs} ${SEMANTIC_SPACING.component.sm}`,
  borderRadius: BORDER_RADIUS.lg,
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
  fontWeight: FONT_WEIGHTS.black,
  textShadow: theme.palette.mode === 'dark' 
    ? `0 0 20px ${PRIMARY_COLORS.gold[500]}40`
    : 'none',
}));

const NavigationLink = styled(Link)(({ theme, active }) => ({
  textDecoration: 'none',
  color: theme.palette.text.primary,
  padding: `${SEMANTIC_SPACING.component.sm} ${SEMANTIC_SPACING.component.md}`,
  borderRadius: BORDER_RADIUS.lg,
  fontSize: TYPOGRAPHY_SCALE['label-md'].fontSize,
  fontWeight: active ? FONT_WEIGHTS.semibold : FONT_WEIGHTS.medium,
  position: 'relative',
  overflow: 'hidden',
  transition: theme.transitions.create(['color', 'background-color', 'transform']),
  
  '&:before': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: active ? '100%' : 0,
    height: '3px',
    background: theme.palette.mode === 'dark' 
      ? BRAND_GRADIENTS.gold 
      : BRAND_GRADIENTS.black,
    transition: theme.transitions.create('width'),
    borderRadius: '2px 2px 0 0',
  },
  
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.primary.main,
    transform: 'translateY(-1px)',
    
    '&:before': {
      width: '100%',
    },
  },
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  maxWidth: '400px',
  width: '100%',
  
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

const ThemeToggleButton = styled(IconButton)(({ theme }) => ({
  borderRadius: BORDER_RADIUS.full,
  padding: SEMANTIC_SPACING.component.sm,
  backgroundColor: theme.palette.action.hover,
  border: `2px solid ${theme.palette.divider}`,
  position: 'relative',
  overflow: 'hidden',
  transition: theme.transitions.create(['background-color', 'transform', 'box-shadow']),
  
  '&:before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: theme.palette.mode === 'dark' 
      ? `conic-gradient(from 0deg, ${PRIMARY_COLORS.gold[500]}40, transparent, ${PRIMARY_COLORS.gold[500]}40)`
      : `conic-gradient(from 0deg, ${PRIMARY_COLORS.black[900]}40, transparent, ${PRIMARY_COLORS.black[900]}40)`,
    borderRadius: 'inherit',
    animation: 'spin 3s linear infinite',
    opacity: 0,
    transition: 'opacity 0.3s',
  },
  
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    transform: 'scale(1.1)',
    boxShadow: `0 0 20px ${theme.palette.primary.main}30`,
    
    '&:before': {
      opacity: 1,
    },
  },
  
  '@keyframes spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
}));

const NotificationButton = styled(IconButton)(({ theme, hasNotifications }) => ({
  position: 'relative',
  transition: theme.transitions.create(['transform', 'background-color']),
  
  '&:hover': {
    transform: 'scale(1.1)',
    backgroundColor: theme.palette.action.hover,
  },
  
  ...(hasNotifications && {
    animation: 'pulse 2s infinite',
    
    '@keyframes pulse': {
      '0%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.05)' },
      '100%': { transform: 'scale(1)' },
    },
  }),
}));

const UserAvatar = styled(Avatar)(({ theme, online }) => ({
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
  position: 'relative',
  transition: theme.transitions.create(['transform', 'box-shadow']),
  border: `3px solid ${online ? '#22C55E' : 'transparent'}`,
  
  '&:hover': {
    transform: 'scale(1.1)',
    boxShadow: `0 0 20px ${theme.palette.primary.main}40`,
  },
  
  '&:after': online ? {
    content: '""',
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    backgroundColor: '#22C55E',
    borderRadius: '50%',
    border: `2px solid ${theme.palette.background.paper}`,
  } : {},
}));

const EnhancedHeader = ({
  user,
  isAuthenticated = false,
  notifications = [],
  onLogout,
  onNotificationClick,
  onSearchSubmit,
  searchPlaceholder = "Search jobs, professionals...",
  navigationItems = [],
  showSearch = true,
  showNotifications = true,
  sticky = true,
  maxWidth = "2xl",
}) => {
  const muiTheme = useMuiTheme();
  const { mode, toggleTheme } = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationMenuAnchor, setNotificationMenuAnchor] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [expandedItems, setExpandedItems] = useState({});

  // Handle scroll effect
  useEffect(() => {
    if (!sticky) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sticky]);

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

  const handleSearch = (event) => {
    if (event.key === 'Enter' || event.type === 'click') {
      onSearchSubmit?.(searchValue);
    }
  };

  const toggleMobileItem = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Default navigation items
  const defaultNavItems = [
    { 
      id: 'home',
      path: '/', 
      label: 'Home', 
      icon: <HomeIcon />,
    },
    { 
      id: 'jobs',
      path: '/jobs', 
      label: 'Jobs', 
      icon: <WorkIcon />,
      children: [
        { path: '/jobs/search', label: 'Search Jobs' },
        { path: '/jobs/create', label: 'Post a Job' },
        { path: '/jobs/manage', label: 'Manage Jobs' },
      ]
    },
    { 
      id: 'professionals',
      path: '/workers', 
      label: 'Find Talent', 
      icon: <PersonIcon />,
    },
  ];

  const navItems = navigationItems.length > 0 ? navigationItems : defaultNavItems;

  const renderNavigationItems = () => (
    <Inline gap="xs">
      {navItems.map((item) => (
        <motion.div
          key={item.id}
          whileHover={{ y: -2 }}
          whileTap={{ y: 0 }}
        >
          <NavigationLink
            to={item.path}
            active={location.pathname === item.path || 
                   (item.children && item.children.some(child => location.pathname === child.path))}
          >
            {item.label}
          </NavigationLink>
        </motion.div>
      ))}
    </Inline>
  );

  const renderMobileNavigation = () => (
    <List>
      {navItems.map((item) => (
        <React.Fragment key={item.id}>
          <ListItem
            button
            onClick={() => {
              if (item.children) {
                toggleMobileItem(item.id);
              } else {
                navigate(item.path);
                setMobileDrawerOpen(false);
              }
            }}
            sx={{
              borderRadius: BORDER_RADIUS.md,
              mb: 1,
              '&:hover': {
                backgroundColor: muiTheme.palette.action.hover,
              }
            }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
            {item.children && (
              expandedItems[item.id] ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItem>
          
          {item.children && (
            <Collapse in={expandedItems[item.id]} timeout="auto">
              <List component="div" disablePadding>
                {item.children.map((child) => (
                  <ListItem
                    key={child.path}
                    button
                    onClick={() => {
                      navigate(child.path);
                      setMobileDrawerOpen(false);
                    }}
                    sx={{ 
                      pl: 4,
                      borderRadius: BORDER_RADIUS.sm,
                      ml: 2,
                      mr: 1,
                      mb: 0.5,
                    }}
                  >
                    <ListItemText primary={child.label} />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          )}
        </React.Fragment>
      ))}
    </List>
  );

  return (
    <>
      <StyledAppBar position={sticky ? "sticky" : "static"} scrolled={scrolled}>
        <Container size={maxWidth} padding="none">
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            {/* Logo */}
            <LogoContainer
              component={Link}
              to="/"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogoText>
                <LogoAccent>K</LogoAccent>elmah
              </LogoText>
            </LogoContainer>

            {/* Desktop Navigation */}
            {!isMobile && (
              <Flex justify="center" align="center" gap="lg">
                {renderNavigationItems()}
              </Flex>
            )}

            {/* Search Bar */}
            {showSearch && !isMobile && (
              <SearchContainer>
                <SearchInput
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={handleSearch}
                  size="small"
                  endIcon={
                    <IconButton size="small" onClick={handleSearch}>
                      <SearchIcon />
                    </IconButton>
                  }
                />
              </SearchContainer>
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
                    initial={{ rotate: -180, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 180, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.4, ease: "backOut" }}
                  >
                    {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                  </motion.div>
                </AnimatePresence>
              </ThemeToggleButton>

              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  {showNotifications && (
                    <NotificationButton
                      onClick={handleNotificationMenuOpen}
                      hasNotifications={unreadNotifications > 0}
                      aria-label="View notifications"
                    >
                      <Badge badgeContent={unreadNotifications} max={99}>
                        <NotificationsIcon />
                      </Badge>
                    </NotificationButton>
                  )}

                  {/* User Avatar */}
                  <UserAvatar
                    onClick={handleUserMenuOpen}
                    aria-label="User menu"
                    src={user?.avatar}
                    online={user?.isOnline}
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
                <IconButton
                  onClick={() => setMobileDrawerOpen(true)}
                  aria-label="Open navigation menu"
                  sx={{
                    borderRadius: BORDER_RADIUS.md,
                    '&:hover': {
                      backgroundColor: muiTheme.palette.action.hover,
                    }
                  }}
                >
                  <MenuIcon />
                </IconButton>
              )}
            </Flex>
          </Toolbar>
        </Container>
      </StyledAppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 320,
            backgroundColor: muiTheme.palette.background.paper,
            borderLeft: `1px solid ${muiTheme.palette.divider}`,
            padding: SEMANTIC_SPACING.layout.md,
          }
        }}
      >
        <Flex justify="space-between" align="center" sx={{ mb: 3 }}>
          <LogoContainer>
            <LogoText variant="h5">
              <LogoAccent>K</LogoAccent>elmah
            </LogoText>
          </LogoContainer>
          <IconButton onClick={() => setMobileDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Flex>
        
        {/* Mobile Search */}
        {showSearch && (
          <Box sx={{ mb: 3 }}>
            <SearchInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={handleSearch}
              fullWidth
            />
          </Box>
        )}
        
        {renderMobileNavigation()}
      </Drawer>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        TransitionComponent={Grow}
        PaperProps={{
          sx: {
            borderRadius: BORDER_RADIUS.xl,
            minWidth: 250,
            mt: 1,
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${muiTheme.palette.divider}` }}>
          <Typography variant="subtitle2" color="text.secondary">
            Signed in as
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {user?.name || user?.email}
          </Typography>
        </Box>
        
        <MenuItem onClick={() => { navigate('/dashboard'); handleUserMenuClose(); }}>
          <DashboardIcon sx={{ mr: 2 }} />
          Dashboard
        </MenuItem>
        
        <MenuItem onClick={() => { navigate('/profile'); handleUserMenuClose(); }}>
          <AccountCircleIcon sx={{ mr: 2 }} />
          Profile
        </MenuItem>
        
        <MenuItem onClick={() => { navigate('/settings'); handleUserMenuClose(); }}>
          <SettingsIcon sx={{ mr: 2 }} />
          Settings
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => { onLogout?.(); handleUserMenuClose(); }} sx={{ color: 'error.main' }}>
          <LogoutIcon sx={{ mr: 2 }} />
          Sign Out
        </MenuItem>
      </Menu>

      {/* Notification Menu */}
      <Menu
        anchorEl={notificationMenuAnchor}
        open={Boolean(notificationMenuAnchor)}
        onClose={handleNotificationMenuClose}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            borderRadius: BORDER_RADIUS.xl,
            minWidth: 300,
            maxHeight: 400,
            mt: 1,
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${muiTheme.palette.divider}` }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadNotifications > 0 && (
            <Typography variant="caption" color="text.secondary">
              {unreadNotifications} unread
            </Typography>
          )}
        </Box>
        
        {notifications.length === 0 ? (
          <MenuItem>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </MenuItem>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => {
                onNotificationClick?.(notification);
                handleNotificationMenuClose();
              }}
              sx={{
                borderLeft: !notification.read ? `3px solid ${muiTheme.palette.primary.main}` : 'none',
                backgroundColor: !notification.read ? muiTheme.palette.action.hover : 'transparent',
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={!notification.read ? 600 : 400}>
                  {notification.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {notification.message}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default EnhancedHeader; 