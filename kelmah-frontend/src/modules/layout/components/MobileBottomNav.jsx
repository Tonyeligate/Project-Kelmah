import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper, Badge, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  AssignmentTurnedIn as ApplicationsIcon,
  Chat as MessagesIcon,
  AccountCircle as ProfileIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { BRAND_COLORS } from '../../../theme';

// Styled Components
const StyledPaper = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  borderTop: theme.palette.mode === 'dark'
    ? `1px solid rgba(255, 215, 0, 0.2)`
    : `1px solid rgba(0, 0, 0, 0.1)`,
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(180deg, ${BRAND_COLORS.black} 0%, ${BRAND_COLORS.blackLight} 100%)`
    : `linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)`,
  backdropFilter: 'blur(20px)',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 -4px 20px rgba(0, 0, 0, 0.8)'
    : '0 -2px 15px rgba(0, 0, 0, 0.1)',
}));

const StyledBottomNavigation = styled(BottomNavigation)(({ theme }) => ({
  backgroundColor: 'transparent',
  height: 70,
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(1),
}));

const StyledBottomNavigationAction = styled(BottomNavigationAction)(({ theme }) => ({
  color: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.6)' 
    : 'rgba(0, 0, 0, 0.6)',
  minWidth: 'auto',
  padding: theme.spacing(0.5, 1),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&.Mui-selected': {
    color: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
    '& .MuiBottomNavigationAction-label': {
      fontSize: '0.75rem',
      fontWeight: 600,
    },
    '& .MuiSvgIcon-root': {
      transform: 'scale(1.1)',
    },
  },
  '& .MuiBottomNavigationAction-label': {
    fontSize: '0.7rem',
    fontWeight: 500,
    marginTop: theme.spacing(0.5),
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.4rem',
    transition: 'transform 0.2s ease',
  },
}));

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const path = location.pathname;
  // Determine user role from path for proper routing
  const isHirer = path.startsWith('/hirer');

  // Determine current tab based on path
  let currentValue;
  if (path.includes('/dashboard')) currentValue = 'dashboard';
  else if (path.startsWith('/search') || path.startsWith('/find-talents'))
    currentValue = 'search';
  else if (path.includes('/applications')) currentValue = 'applications';
  else if (path.startsWith('/messages')) currentValue = 'messages';
  else if (path.startsWith('/profile')) currentValue = 'profile';
  else currentValue = 'dashboard';

  const [value, setValue] = React.useState(currentValue);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    switch (newValue) {
      case 'dashboard':
        navigate(isHirer ? '/hirer/dashboard' : '/worker/dashboard');
        break;
      case 'search':
        navigate(isHirer ? '/find-talents' : '/search/location');
        break;
      case 'applications':
        navigate(isHirer ? '/hirer/applications' : '/worker/applications');
        break;
      case 'messages':
        navigate('/messages');
        break;
      case 'profile':
        navigate(isHirer ? '/profile' : '/worker/profile');
        break;
      default:
        navigate('/');
    }
  };

  const navigationItems = [
    {
      label: "Home",
      value: "dashboard",
      icon: <HomeIcon />,
      badge: null,
    },
    {
      label: "Search",
      value: "search",
      icon: <SearchIcon />,
      badge: null,
    },
    {
      label: "Apps",
      value: "applications", 
      icon: <ApplicationsIcon />,
      badge: null,
    },
    {
      label: "Messages",
      value: "messages",
      icon: <MessagesIcon />,
      badge: 2, // Mock unread count
    },
    {
      label: "Profile",
      value: "profile",
      icon: <ProfileIcon />,
      badge: null,
    },
  ];

  return (
    <StyledPaper elevation={8}>
      <StyledBottomNavigation value={value} onChange={handleChange} showLabels>
        {navigationItems.map((item, index) => (
          <motion.div
            key={item.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            style={{ flex: 1 }}
          >
            <StyledBottomNavigationAction
              label={item.label}
              value={item.value}
              icon={
                item.badge ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )
              }
            />
          </motion.div>
        ))}
      </StyledBottomNavigation>
    </StyledPaper>
  );
};

export default MobileBottomNav;
