import { useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated } from '../modules/auth/services/authSlice';

const useNavLinks = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const userRole = user?.role || user?.userType || user?.userRole;
  const hasRole = (role) => userRole === role;
  const location = useLocation();

  const navLinks = useMemo(() => {
    const links = [
      { label: 'Home', to: '/' },
      { label: 'Jobs', to: '/jobs' }
    ];

    if (!isAuthenticated || hasRole('worker')) {
      links.push({
        label: 'Find Work',
        to: isAuthenticated && hasRole('worker') ? '/worker/find-work' : '/search/location'
      });
    }
    if (!isAuthenticated || hasRole('hirer')) {
      links.push({
        label: 'Find Talents',
        to: isAuthenticated && hasRole('hirer') ? '/hirer/find-talent' : '/find-talents'
      });
    }

    links.push({ label: 'Pricing', to: '/premium' });
    return links;
  }, [isAuthenticated, hasRole]);

  const isActive = useCallback((path) => {
    return path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  }, [location.pathname]);

  return { navLinks, isActive };
};

export default useNavLinks; 