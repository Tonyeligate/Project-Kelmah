import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { normalizeUser } from '../../../utils/userUtils';
import {
  Box,
  Typography,
  useTheme,
  Avatar,
  Stack,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
} from '@mui/material';
import EnhancedWorkerDashboard from '../../dashboard/components/worker/EnhancedWorkerDashboard';
import workerImage from '../../../assets/cartoon-worker.jpeg';
import { logoutUser } from '../../auth/services/authSlice';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';

const WorkerDashboardPage = () => {
  const theme = useTheme();
  const isSm = false; // Disabled responsive behavior as per user requirement
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // FIXED: Use standardized user normalization for consistent user data access
  const { user: rawUser } = useSelector((state) => state.auth);
  const user = normalizeUser(rawUser);
  const defaultUser = {
    firstName: 'Demo',
    role: 'worker',
    profession: 'Professional Carpenter',
  };

  // Use either the Redux user or a default user if null
  const displayUser = user || defaultUser;
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const isProfileMenuOpen = Boolean(profileMenuAnchor);

  // Get user's professional title
  const getProfessionalTitle = () => {
    if (displayUser?.profession) return displayUser.profession;
    if (displayUser?.role === 'worker') return 'Professional Carpenter';
    return '';
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleProfileMenuNavigate = (path) => {
    handleProfileMenuClose();
    navigate(path);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await dispatch(logoutUser());
    navigate('/login');
  };

  // 🚨 CRITICAL FIX: Never bypass Layout component!
  // Layout component provides AutoShowHeader for logout access
  // Removed mobile bypass - all users need header access for logout

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            label={`${(displayUser?.role || 'worker').toUpperCase()} MODE`}
            sx={{
              backgroundColor: 'rgba(255, 215, 0, 0.12)',
              color: '#FFD700',
              fontWeight: 600,
            }}
          />
          <Tooltip title="Account menu" arrow>
            <Avatar
              onClick={handleProfileMenuOpen}
              sx={{
                width: 44,
                height: 44,
                bgcolor: theme.palette.secondary.main,
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              {displayUser?.firstName?.[0] || 'U'}
            </Avatar>
          </Tooltip>
        </Stack>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: isSm ? 'column' : 'row',
          alignItems: 'center',
          textAlign: isSm ? 'center' : 'left',
          mb: 4,
          pb: 2,
          backgroundColor: 'rgba(255,255,255,0.05)',
          color: theme.palette.common.white,
          borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: 2,
          p: 2,
        }}
      >
        <Box
          component="img"
          src={workerImage}
          alt="Worker Avatar"
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            mb: isSm ? 2 : 0,
            mr: isSm ? 0 : 2,
          }}
        />
        <Box>
          <Typography
            variant={isSm ? 'h5' : 'h3'}
            fontWeight={800}
            color={theme.palette.secondary.main}
            sx={{ mb: 1, letterSpacing: 0.5 }}
          >
            Welcome back,{' '}
            {displayUser?.firstName || displayUser?.name || 'Demo'}!
          </Typography>
          <Typography
            variant={isSm ? 'body2' : 'subtitle1'}
            color={theme.palette.secondary.main}
            fontWeight={500}
            sx={{ mb: 1, opacity: 0.8 }}
          >
            {getProfessionalTitle()}
          </Typography>
          <Typography
            variant={isSm ? 'body2' : 'h6'}
            color={theme.palette.primary.contrastText}
            sx={{ opacity: 0.9 }}
          >
            Ready to find your next job? Let&apos;s get to work.
          </Typography>
        </Box>
      </Box>
      <Menu
        anchorEl={profileMenuAnchor}
        open={isProfileMenuOpen}
        onClose={handleProfileMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem disabled sx={{ opacity: 1, cursor: 'default' }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {displayUser?.fullName ||
                `${displayUser?.firstName || ''} ${displayUser?.lastName || ''}`.trim() ||
                'Account'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {displayUser?.email || user?.email}
            </Typography>
          </Box>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => handleProfileMenuNavigate('/profile')}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          View Profile
        </MenuItem>
        <MenuItem
          onClick={() => handleProfileMenuNavigate('/worker/profile/edit')}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Manage Profile
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      <EnhancedWorkerDashboard user={displayUser} />
    </>
  );
};

export default WorkerDashboardPage;
