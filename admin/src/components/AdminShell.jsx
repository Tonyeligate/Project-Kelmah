import { useMemo, useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/context/AdminAuthContext';

const DRAWER_WIDTH = 264;

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon fontSize="small" />,
  },
  {
    label: 'Skills Management',
    path: '/skills-management',
    icon: <SchoolIcon fontSize="small" />,
  },
  {
    label: 'Payout Queue',
    path: '/payouts',
    icon: <AccountBalanceWalletIcon fontSize="small" />,
  },
];

const AdminShell = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAdminAuth();

  const userDisplayName = useMemo(() => {
    if (user?.firstName || user?.lastName) {
      return [user?.firstName, user?.lastName].filter(Boolean).join(' ');
    }
    return user?.email || 'Admin';
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          px: 2.5,
          py: 3,
          borderBottom: '1px solid rgba(17, 24, 39, 0.08)',
          background:
            'linear-gradient(145deg, rgba(17,24,39,1) 0%, rgba(31,41,55,1) 65%, rgba(217,119,6,0.95) 100%)',
          color: '#ffffff',
        }}
      >
        <Typography variant="overline" sx={{ letterSpacing: 1.1, opacity: 0.85 }}>
          Kelmah Platform
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 700 }}>
          Admin Portal
        </Typography>
        <Chip
          label="Operator Console"
          size="small"
          sx={{ mt: 1.5, bgcolor: 'rgba(255,255,255,0.16)', color: '#ffffff' }}
        />
      </Box>

      <List sx={{ px: 1.25, py: 1.5, flexGrow: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(`${item.path}/`);

          return (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              selected={isActive}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 0.75,
                '&.Mui-selected': {
                  bgcolor: 'rgba(217, 119, 6, 0.16)',
                  color: 'secondary.dark',
                  '& .MuiListItemIcon-root': {
                    color: 'secondary.dark',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ px: 1.25, pb: 1.75 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            color: 'error.main',
            '&:hover': { bgcolor: 'rgba(185, 28, 28, 0.08)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sign Out" primaryTypographyProps={{ fontWeight: 600 }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: '1px solid rgba(17, 24, 39, 0.08)',
          ml: isDesktop ? `${DRAWER_WIDTH}px` : 0,
          width: isDesktop ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%',
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.86)',
        }}
      >
        <Toolbar>
          {!isDesktop && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open navigation"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 1.5 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Kelmah Admin Operations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor system health, skills workflows, and payouts.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main' }}>
              {userDisplayName[0]?.toUpperCase() || 'A'}
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
              {userDisplayName}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid rgba(17, 24, 39, 0.08)',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 1.25, sm: 2.5, md: 3 },
          pt: { xs: 10, sm: 11 },
          pb: 3,
          width: '100%',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminShell;
