import { Box, styled } from '@mui/material';
import { NavLink } from 'react-router-dom';
import {
  Home as HomeIcon,
  Work as WorkIcon,
  Engineering as EngineeringIcon,
  PostAdd as PostAddIcon,
  Star as StarIcon,
  Message as MessageIcon,
} from '@mui/icons-material';
import useNavLinks from '../../../hooks/useNavLinks';
import { useAuthCheck } from '../../../hooks/useAuthCheck';

// Enhanced Styled components with active state highlighting
const StyledNavLink = styled(NavLink)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  margin: '0 4px',
  padding: '6px 12px',
  borderRadius: '24px',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.9rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-2px)',
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 215, 0, 0.15)'
        : 'rgba(0, 0, 0, 0.1)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 4px 12px rgba(255, 215, 0, 0.2)'
        : '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  '&.active': {
    color:
      theme.palette.mode === 'dark'
        ? '#FFD700' // Gold for dark mode
        : '#000000', // Black for light mode
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 215, 0, 0.2)'
        : 'rgba(0, 0, 0, 0.15)',
    fontWeight: 700,
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 2px 8px rgba(255, 215, 0, 0.3)'
        : '0 2px 8px rgba(0, 0, 0, 0.2)',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '60%',
      height: '3px',
      borderRadius: '3px 3px 0 0',
      backgroundColor:
        theme.palette.mode === 'dark'
          ? '#FFD700' // Gold for dark mode
          : '#000000', // Black for light mode
    },
  },
  '&:not(.active)': {
    color:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.85)'
        : 'rgba(0, 0, 0, 0.85)',
  },
  '& svg': {
    fontSize: '1rem',
    opacity: 0.85,
  },
  '@media (max-width: 1100px)': {
    '& svg': {
      display: 'none',
    },
  },
}));

const DesktopNav = () => {
  const authState = useAuthCheck();
  const { isReady, isLoading } = authState;
  const { navLinks } = useNavLinks();

  // Icon mapping for navigation items
  const getNavIcon = (label) => {
    const iconMap = {
      Home: <HomeIcon />,
      Jobs: <WorkIcon />,
      'Find Workers': <EngineeringIcon />,
      'Post a Job': <PostAddIcon />,
      Pricing: <StarIcon />,
      Messages: <MessageIcon />,
    };
    return iconMap[label] || null;
  };

  // Show loading state during initialization
  if (!isReady || isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: 200, height: 40 }} /> {/* Placeholder */}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {/* 🎯 ENHANCED NAVIGATION LINKS with icons and active state highlighting */}
      {navLinks.map(({ label, to }) => (
        <StyledNavLink key={to} to={to}>
          {getNavIcon(label)}
          {label}
        </StyledNavLink>
      ))}

      {/* 🚨 REMOVED: All duplicate elements (messages, notifications, user avatar, auth buttons)
          These are now handled exclusively by Header component to prevent duplication */}
    </Box>
  );
};

export default DesktopNav;
