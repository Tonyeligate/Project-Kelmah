import React from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  useTheme,
  Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import {
  Home as HomeIcon,
  Work as JobsIcon,
  ChatBubbleOutline as MessagesIcon,
  AccountCircle as ProfileIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { BRAND_COLORS } from '../../../theme';

// Styled Components - Updated to match the template design
const StyledPaper = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  borderTop: '1px solid #35332c',
  backgroundColor: '#24231e',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.8)',
}));

const StyledBottomNavigation = styled(BottomNavigation)(({ theme }) => ({
  backgroundColor: 'transparent',
  height: 70,
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(1),
}));

const StyledBottomNavigationAction = styled(BottomNavigationAction)(
  ({ theme }) => ({
    color: '#b2afa3',
    minWidth: 'auto',
    padding: theme.spacing(0.5, 1),
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&.Mui-selected': {
      color: 'white',
      '& .MuiBottomNavigationAction-label': {
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.015em',
      },
      '& .MuiSvgIcon-root': {
        transform: 'scale(1.1)',
      },
    },
    '& .MuiBottomNavigationAction-label': {
      fontSize: '0.75rem',
      fontWeight: 500,
      marginTop: theme.spacing(0.5),
      letterSpacing: '0.015em',
    },
    '& .MuiSvgIcon-root': {
      fontSize: '1.5rem',
      transition: 'transform 0.2s ease',
    },
  }),
);

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
  else if (
    path.startsWith('/search') ||
    path.startsWith('/hirer/find-talent') ||
    path.includes('/find-work') ||
    path.startsWith('/find-talents')
  )
    currentValue = 'jobs';
  else if (path.includes('/applications')) currentValue = 'jobs';
  else if (path.startsWith('/messages')) currentValue = 'messages';
  else if (path.includes('/profile')) currentValue = 'profile';
  else currentValue = 'dashboard';

  const [value, setValue] = React.useState(currentValue);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    switch (newValue) {
      case 'dashboard':
        navigate(isHirer ? '/hirer/dashboard' : '/worker/dashboard');
        break;
      case 'jobs':
        navigate(isHirer ? '/hirer/find-talent' : '/worker/find-work');
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
      label: 'Home',
      value: 'dashboard',
      icon: <HomeIcon />,
      badge: null,
    },
    {
      label: 'Jobs',
      value: 'jobs',
      icon: <JobsIcon />,
      badge: null,
    },
    {
      label: 'Messages',
      value: 'messages',
      icon: <MessagesIcon />,
      badge: null,
    },
    {
      label: 'Profile',
      value: 'profile',
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
      {/* Add bottom spacing like in the template */}
      <Box sx={{ height: '20px', backgroundColor: '#24231e' }} />
    </StyledPaper>
  );
};

export default MobileBottomNav;
