import { useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../modules/auth/contexts/AuthContext';

const useNavLinks = () => {
  const { user, isAuthenticated: isAuthFn, hasRole, isInitialized } = useAuth();
  const isAuthenticated = isAuthFn();
  const location = useLocation();

  const navLinks = useMemo(() => {
    if (!isInitialized) return [];
    const links = [
      { label: 'Home', to: '/' },
      { label: 'Jobs', to: '/jobs' },
    ];

    if (!isAuthenticated || hasRole('worker')) {
      links.push({
        label: 'Find Work',
        to:
          isAuthenticated && hasRole('worker')
            ? '/worker/find-work'
            : '/search/location',
      });
    }
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
