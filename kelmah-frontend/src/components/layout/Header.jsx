import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  styled,
  Container,
  InputBase,
  alpha,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  AccountCircle,
  Search as SearchIcon,
  Notifications,
  Home as HomeIcon,
  Work as WorkIcon,
  PersonSearch as PersonSearchIcon,
  Paid as PaidIcon,
  Whatshot as WhatshotIcon,
  Login as LoginIcon,
  AppRegistration as AppRegistrationIcon,
  Dashboard as DashboardIcon,
  Message as MessageIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Description as ContractIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice';
import { useNotifications } from '../../contexts/NotificationContext';

// Enhanced AppBar with gradient and shadow
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(90deg, #1a1a1a 0%, #272727 100%)',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.12)',
  borderBottom: `1px solid rgba(255, 215, 0, 0.3)`,
  position: 'sticky',
  top: 0,
  zIndex: theme.zIndex.drawer + 1,
}));

// Enhanced logo container
const LogoContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  marginRight: '20px',
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  },
});

// Enhanced logo text
const LogoText = styled(Typography)(({ theme }) => ({
  color: '#FFD700',
  fontWeight: 800,
  fontSize: '1.8rem',
  letterSpacing: '0.5px',
  textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
}));

// Enhanced search box
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '12px',
  backgroundColor: alpha('#1a1a1a', 0.3),
  border: '1px solid rgba(255, 215, 0, 0.15)',
  '&:hover': {
    backgroundColor: alpha('#1a1a1a', 0.5),
    border: '1px solid rgba(255, 215, 0, 0.25)',
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  maxWidth: '400px',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
  transition: 'all 0.3s ease',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#FFD700',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: '#ffffff',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.2, 1, 1.2, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '25ch',
      '&:focus': {
        width: '35ch',
      },
    },
    '&::placeholder': {
      color: alpha('#ffffff', 0.7),
      opacity: 0.7,
    },
  },
}));

// Enhanced nav buttons
const StyledButton = styled(Button)(({ theme, active }) => ({
  color: active ? '#FFD700' : '#ffffff',
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
  fontWeight: active ? 600 : 500,
  padding: theme.spacing(1, 2),
  borderRadius: '10px',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    color: '#FFD700',
    transform: 'translateY(-2px)',
  },
  '&::after': active ? {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: '25%',
    width: '50%',
    height: '2px',
    backgroundColor: '#FFD700',
    borderRadius: '2px 2px 0 0',
  } : {},
  transition: 'all 0.3s ease',
}));

// Enhanced icon buttons
const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: '#ffffff',
  margin: theme.spacing(0, 0.5),
  transition: 'all 0.3s ease',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  '&:hover': {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    color: '#FFD700',
    transform: 'translateY(-2px)',
  },
}));

// Enhanced user menu
const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    backgroundColor: '#1a1a1a',
    border: `1px solid rgba(255, 215, 0, 0.2)`,
    borderRadius: '12px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
    marginTop: '10px',
    overflow: 'hidden',
  },
}));

// Enhanced menu items
const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  color: '#ffffff',
  minWidth: '200px',
  padding: theme.spacing(1.5, 2),
  '&:hover': {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  '& .MuiListItemIcon-root': {
    color: '#FFD700',
    minWidth: '40px',
  },
}));

// Auth buttons
const AuthButton = styled(Button)(({ theme, variant }) => ({
  fontWeight: 600,
  padding: theme.spacing(0.8, 2.5),
  borderRadius: '10px',
  textTransform: 'none',
  transition: 'all 0.3s ease',
  ...(variant === 'contained' ? {
    background: 'linear-gradient(45deg, #FFD700, #DAA520)',
    color: '#1a1a1a',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
    '&:hover': {
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
      transform: 'translateY(-2px)',
      background: 'linear-gradient(45deg, #DAA520, #FFD700)',
    },
  } : {
    color: '#FFD700',
    border: '2px solid #FFD700',
    '&:hover': {
      border: '2px solid #FFD700',
      backgroundColor: 'rgba(255, 215, 0, 0.1)',
      transform: 'translateY(-2px)',
    },
  }),
}));

function Header() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { unreadCount = 0 } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Navigation items with conditional display based on authentication
  const navItems = [
    { path: '/', label: 'Home', showAlways: true },
    { path: '/jobs', label: 'Jobs', showAlways: true },
    { path: '/find-work', label: 'Find Work', showAlways: true },
    { path: '/find-talents', label: 'Find Talents', showAlways: true },
    { path: '/pricing', label: 'Pricing', showAlways: true },
    { path: '/whats-new', label: "What's New", showAlways: true },
    { path: '/contracts', label: 'Contracts', requiresAuth: true },
  ];

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleClose();
    navigate('/');
  };

  // Check if the current path should show profile menu
  const shouldShowProfileMenu = () => {
    // If user is authenticated, always show profile menu
    if (isAuthenticated) {
      return true;
    }
    
    // As a fallback, check if current path is a user-specific page
    const userPages = [
      '/dashboard', 
      '/profile', 
      '/settings', 
      '/messages',
      '/find-work',
      '/find-talents',
      '/notifications',
      '/my-applications',
      '/contracts',
      '/hirer',
      '/worker'
    ];
    
    // Check if current path starts with any of the userPages
    return userPages.some(page => location.pathname.startsWith(page));
  };

  return (
    <StyledAppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {isMobile && (
            <IconButton 
              color="inherit" 
              aria-label="open drawer"
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 1, color: '#FFD700' }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <LogoContainer component={RouterLink} to="/">
            <LogoText>
              Kelmah
            </LogoText>
          </LogoContainer>

          {!isMobile && (
            <Search>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search everything..."
                inputProps={{ 'aria-label': 'search' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearch}
              />
            </Search>
          )}

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {navItems
                .filter(item => item.showAlways || (!item.requiresAuth || (item.requiresAuth && isAuthenticated)))
                .map((item) => (
                  <StyledButton
                    key={item.path}
                    component={RouterLink}
                    to={item.path}
                    active={location.pathname === item.path ? 1 : 0}
                  >
                    {item.label}
                  </StyledButton>
                ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {shouldShowProfileMenu() ? (
              <>
                <Tooltip title="Notifications">
                  <StyledIconButton
                    aria-label="show new notifications"
                    component={RouterLink}
                    to="/notifications"
                  >
                    <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontWeight: 'bold', top: 3, right: 3 } }}>
                      <Notifications />
                    </Badge>
                  </StyledIconButton>
                </Tooltip>
                
                <Box sx={{ ml: 2 }}>
                  <Tooltip title={user?.firstName || "Account"}>
                    <StyledIconButton
                      onClick={handleMenu}
                      edge="end"
                      aria-label="account of current user"
                      aria-controls={anchorEl ? 'account-menu' : undefined}
                      aria-haspopup="true"
                    >
                      {user?.profileImage ? (
                        <Avatar 
                          src={user.profileImage} 
                          alt={user?.firstName || "User"}
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            border: '2px solid #FFD700',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)' 
                          }} 
                        />
                      ) : (
                        <Avatar 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            bgcolor: '#FFD700', 
                            color: '#1a1a1a',
                            border: '2px solid #FFD700',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                          }}
                        >
                          {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                        </Avatar>
                      )}
                    </StyledIconButton>
                  </Tooltip>
                  <StyledMenu
                    id="account-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <Box sx={{ px: 3, py: 1.5, borderBottom: '1px solid rgba(255,215,0,0.2)' }}>
                      <Typography variant="subtitle1" sx={{ color: '#FFD700', fontWeight: 600 }}>
                        {user?.firstName} {user?.lastName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#aaa' }}>
                        {user?.email}
                      </Typography>
                    </Box>
                    <StyledMenuItem onClick={() => { handleClose(); navigate('/dashboard'); }}>
                      <ListItemIcon>
                        <DashboardIcon />
                      </ListItemIcon>
                      Dashboard
                    </StyledMenuItem>
                    <StyledMenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                      <ListItemIcon>
                        <AccountCircle />
                      </ListItemIcon>
                      Profile
                    </StyledMenuItem>
                    <StyledMenuItem onClick={() => { handleClose(); navigate('/messages'); }}>
                      <ListItemIcon>
                        <MessageIcon />
                      </ListItemIcon>
                      Messages
                    </StyledMenuItem>
                    <StyledMenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
                      <ListItemIcon>
                        <SettingsIcon />
                      </ListItemIcon>
                      Settings
                    </StyledMenuItem>
                    <Divider sx={{ my: 1, borderColor: 'rgba(255,215,0,0.1)' }} />
                    <StyledMenuItem onClick={handleLogout}>
                      <ListItemIcon>
                        <LogoutIcon />
                      </ListItemIcon>
                      Logout
                    </StyledMenuItem>
                  </StyledMenu>
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', ml: 2 }}>
                <AuthButton
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  sx={{ mr: 2 }}
                >
                  Log In
                </AuthButton>
                <AuthButton
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                >
                  Register
                </AuthButton>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: '#1a1a1a',
            borderRight: '2px solid #FFD700',
          }
        }}
      >
        <Box
          sx={{ width: '100%' }}
          role="presentation"
        >
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogoText sx={{ fontSize: '1.5rem' }}>Kelmah</LogoText>
          </Box>
          
          {isAuthenticated && (
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center' }}>
              <Avatar 
                src={user?.profileImage} 
                alt={user?.firstName || "User"}
                sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: user?.profileImage ? 'transparent' : '#FFD700',
                  color: '#1a1a1a',
                  border: '2px solid #FFD700',
                  mr: 2
                }}
              >
                {!user?.profileImage && (user?.firstName?.[0] || user?.email?.[0] || 'U')}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ color: '#FFD700', fontWeight: 600 }}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="body2" sx={{ color: '#aaa' }}>
                  {user?.role || 'User'}
                </Typography>
              </Box>
            </Box>
          )}
          
          <List sx={{ p: 1 }}>
            {navItems.map((item) => (
              (item.showAlways || (!item.requiresAuth || (item.requiresAuth && isAuthenticated))) && (
                <ListItem 
                  button 
                  key={item.path}
                  component={RouterLink} 
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    backgroundColor: location.pathname === item.path ? 'rgba(255,215,0,0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255,215,0,0.05)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: location.pathname === item.path ? '#FFD700' : '#fff', minWidth: 40 }}>
                    {item.path === '/' && <HomeIcon />}
                    {item.path === '/jobs' && <WorkIcon />}
                    {item.path === '/find-work' && <SearchIcon />}
                    {item.path === '/find-talents' && <PersonSearchIcon />}
                    {item.path === '/pricing' && <PaidIcon />}
                    {item.path === '/whats-new' && <WhatshotIcon />}
                    {item.path === '/contracts' && <ContractIcon />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ 
                      sx: { 
                        color: location.pathname === item.path ? '#FFD700' : '#fff',
                        fontWeight: location.pathname === item.path ? 600 : 400,
                      }
                    }}
                  />
                </ListItem>
              )
            ))}
          </List>
          
          <Divider sx={{ borderColor: 'rgba(255,215,0,0.2)', my: 1 }} />
          
          {isAuthenticated ? (
            <List sx={{ p: 1 }}>
              <ListItem 
                button 
                component={RouterLink} 
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon sx={{ color: '#FFD700', minWidth: 40 }}>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItem>
              <ListItem 
                button 
                component={RouterLink} 
                to="/messages"
                onClick={() => setMobileOpen(false)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon sx={{ color: '#FFD700', minWidth: 40 }}>
                  <MessageIcon />
                </ListItemIcon>
                <ListItemText primary="Messages" />
              </ListItem>
              <ListItem 
                button 
                component={RouterLink} 
                to="/profile"
                onClick={() => setMobileOpen(false)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon sx={{ color: '#FFD700', minWidth: 40 }}>
                  <AccountCircle />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </ListItem>
              <ListItem 
                button 
                component={RouterLink} 
                to="/settings"
                onClick={() => setMobileOpen(false)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon sx={{ color: '#FFD700', minWidth: 40 }}>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItem>
              <Divider sx={{ borderColor: 'rgba(255,215,0,0.2)', my: 1 }} />
              <ListItem 
                button 
                onClick={() => {
                  handleLogout();
                  setMobileOpen(false);
                }}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ color: '#FFD700', minWidth: 40 }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItem>
            </List>
          ) : (
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                fullWidth
                component={RouterLink}
                to="/login"
                variant="outlined"
                startIcon={<LoginIcon />}
                onClick={() => setMobileOpen(false)}
                sx={{ 
                  color: '#FFD700', 
                  borderColor: '#FFD700', 
                  borderRadius: 2,
                  p: 1,
                  justifyContent: 'flex-start',
                  '&:hover': {
                    borderColor: '#FFD700',
                    backgroundColor: 'rgba(255,215,0,0.1)',
                  }
                }}
              >
                Log In
              </Button>
              <Button
                fullWidth
                component={RouterLink}
                to="/register"
                variant="contained"
                startIcon={<AppRegistrationIcon />}
                onClick={() => setMobileOpen(false)}
                sx={{ 
                  background: 'linear-gradient(45deg, #FFD700, #DAA520)',
                  color: '#1a1a1a',
                  borderRadius: 2,
                  p: 1,
                  justifyContent: 'flex-start',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #DAA520, #FFD700)',
                  }
                }}
              >
                Register
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>
    </StyledAppBar>
  );
}

export default Header;