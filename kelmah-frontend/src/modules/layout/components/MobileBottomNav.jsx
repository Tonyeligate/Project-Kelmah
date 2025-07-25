import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  AssignmentTurnedIn as ApplicationsIcon,
  Chat as MessagesIcon,
  AccountCircle as ProfileIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  return (
    <Paper
      sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
      elevation={3}
    >
      <BottomNavigation value={value} onChange={handleChange} showLabels>
        <BottomNavigationAction
          label="Home"
          value="dashboard"
          icon={<HomeIcon />}
        />
        <BottomNavigationAction
          label="Search"
          value="search"
          icon={<SearchIcon />}
        />
        <BottomNavigationAction
          label="Apps"
          value="applications"
          icon={<ApplicationsIcon />}
        />
        <BottomNavigationAction
          label="Messages"
          value="messages"
          icon={<MessagesIcon />}
        />
        <BottomNavigationAction
          label="Profile"
          value="profile"
          icon={<ProfileIcon />}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNav;
