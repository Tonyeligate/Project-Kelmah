import { useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
// Removed AuthContext import to prevent dual state management conflicts
// import { useAuth } from '../modules/auth/contexts/AuthContext';
import { useSelector } from 'react-redux';

const useNavLinks = () => {
  // Use ONLY Redux auth state to prevent dual state management conflicts
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const isInitialized = true; // Redux auth is always initialized
  const hasRole = (role) => user?.role === role || user?.userType === role;
  const location = useLocation();

  const navLinks = useMemo(() => {
    if (!isInitialized) return [];
    const links = [
      { label: 'Home', to: '/' },
      { label: 'Jobs', to: '/jobs' },
    ];

    // Show public Find Talents when not authenticated; hirers get their dashboard view
    if (!isAuthenticated || hasRole('hirer')) {
      links.push({
        label: 'Find Talents',
        to:
          isAuthenticated && hasRole('hirer')
            ? '/hirer/find-talent'
            : '/find-talents',
      });
    }

    links.push({ label: 'Pricing', to: '/premium' });
    if (isAuthenticated) {
      links.push({ label: 'Messages', to: '/messages' });
    }
    return links;
  }, [isInitialized, isAuthenticated, hasRole]);

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
