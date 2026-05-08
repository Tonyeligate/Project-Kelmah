import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api from '@/services/apiClient';

const ADMIN_TOKEN_KEY = 'kelmah_admin_token';
const ADMIN_USER_KEY = 'kelmah_admin_user';

const AdminAuthContext = createContext(null);

const parseJwt = (token) => {
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const isAdminUser = (user) => {
  const role = user?.role || user?.userType || user?.userRole;
  return role === 'admin' || role === 'super_admin';
};

export const AdminAuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    const savedUserRaw = localStorage.getItem(ADMIN_USER_KEY);

    if (savedToken) {
      setToken(savedToken);
      if (savedUserRaw) {
        try {
          setUser(JSON.parse(savedUserRaw));
        } catch {
          localStorage.removeItem(ADMIN_USER_KEY);
          setUser(parseJwt(savedToken));
        }
      } else {
        setUser(parseJwt(savedToken));
      }
    }

    setLoading(false);
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const payload = response?.data?.data || response?.data || {};
    const nextToken = payload.token || payload.accessToken;
    const nextUser = payload.user || parseJwt(nextToken);

    if (!nextToken || !nextUser) {
      throw new Error('Login response is missing token or user details.');
    }

    if (!isAdminUser(nextUser)) {
      throw new Error('Only admin accounts can access this portal.');
    }

    localStorage.setItem(ADMIN_TOKEN_KEY, nextToken);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(nextUser));

    setToken(nextToken);
    setUser(nextUser);

    return nextUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      isAuthenticated: Boolean(token),
      isAdmin: isAdminUser(user),
    }),
    [loading, login, logout, token, user],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};
