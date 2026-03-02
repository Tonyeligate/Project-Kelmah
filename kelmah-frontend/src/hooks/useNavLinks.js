import { useMemo, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { useLocation } from 'react-router-dom';
// Removed AuthContext import to prevent dual state management conflicts
// import { useAuth } from '../modules/auth/hooks/useAuth';
import { useSelector } from 'react-redux';

const useNavLinks = () => {
  // Use ONLY Redux auth state to prevent dual state management conflicts
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const userRole = user?.role || user?.userType;
  const location = useLocation();

  const navLinks = useMemo(() => {
    const links = [
      { label: 'Home', to: '/' },
      { label: 'Jobs', to: '/jobs' },
      { label: 'Find Workers', to: '/find-talents' },
    ];

    // Add "Post a Job" for authenticated hirers
    if (isAuthenticated && userRole === 'hirer') {
      links.push({ label: 'Post a Job', to: '/hirer/jobs/post' });
    }

    // Add pricing for all users
    links.push({ label: 'Pricing', to: '/premium' });

    // Add Messages for authenticated users
    if (isAuthenticated) {
      links.push({ label: 'Messages', to: '/messages' });
    }

    return links;
  }, [isAuthenticated, userRole]);

  const isActive = useCallback(
    (path) => {
      return path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(path);
    },
    [location.pathname],
  );

  return { navLinks, isActive };
};

export default useNavLinks;
