/**
 * Kelmah Frontend Application - v2.0.0
 * Unified theme system with consistent branding
 * Last updated: January 2025
 */
import { useEffect, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import Layout from './modules/layout/components/Layout';
import { KelmahThemeProvider, useThemeMode } from './theme/ThemeProvider';
import Dashboard from './modules/dashboard/pages/DashboardPage';
import ForgotPasswordPage from './modules/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './modules/auth/pages/ResetPasswordPage';
import VerifyEmailPage from './modules/auth/pages/VerifyEmailPage';
import MfaSetupPage from './modules/auth/pages/MfaSetupPage';
import NotificationsPage from './modules/notifications/pages/NotificationsPage';
import NotificationSettingsPage from './modules/notifications/pages/NotificationSettingsPage';
import PaymentCenterPage from './modules/payment/pages/PaymentCenterPage';
import PaymentsPage from './modules/payment/pages/PaymentsPage';
import PaymentMethodsPage from './modules/payment/pages/PaymentMethodsPage';
import WalletPage from './modules/payment/pages/WalletPage';
import BillPage from './modules/payment/pages/BillPage';
import EscrowDetailsPage from './modules/payment/pages/EscrowDetailsPage';
import SchedulingPage from './modules/scheduling/pages/SchedulingPage';
import SettingsPage from './modules/settings/pages/SettingsPage';
import WorkerSearchPage from './modules/hirer/pages/WorkerSearchPage';
import publicRoutes from './routes/publicRoutes';
import WorkerRoutes from './routes/workerRoutes';
import HirerRoutes from './routes/hirerRoutes';
import AdminRoutes from './routes/adminRoutes';
import ProtectedRoute from './modules/auth/components/common/ProtectedRoute';
import { verifyAuth } from './modules/auth/services/authSlice';
import { AUTH_CONFIG } from './config/environment';
import { secureStorage } from './utils/secureStorage';
import { initializePWA } from './utils/pwaHelpers';

const MessagingPage = lazy(
  () => import('./modules/messaging/pages/MessagingPage'),
);
const ProfilePage = lazy(() => import('./modules/profile/pages/ProfilePage'));
const ContractManagementPage = lazy(
  () => import('./modules/contracts/pages/ContractManagementPage'),
);
const CreateContractPage = lazy(
  () => import('./modules/contracts/pages/CreateContractPage'),
);
const ContractDetailsPage = lazy(
  () => import('./modules/contracts/pages/ContractDetailsPage'),
);

const resolveUserRole = (user) => {
  if (!user) {
    return null;
  }

  return (
    user.role ||
    user.userType ||
    user.userRole ||
    (Array.isArray(user.roles) ? user.roles[0] : null)
  );
};

const hasRole = (user, role) => {
  if (!user || !role) {
    return false;
  }

  const roles = new Set();

  if (user.role) {
    roles.add(user.role);
  }

  if (user.userType) {
    roles.add(user.userType);
  }

  if (user.userRole) {
    roles.add(user.userRole);
  }

  if (Array.isArray(user.roles)) {
    user.roles.filter(Boolean).forEach((value) => roles.add(value));
  }

  return roles.has(role);
};

const DashboardRedirect = ({ user, isAuthenticated, loading }) => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/dashboard') {
      console.log('Dashboard redirect triggered for:', location.pathname);
    }
  }, [location.pathname]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = resolveUserRole(user);

  if (userRole === 'worker') {
    return <Navigate to="/worker/dashboard" replace />;
  }

  if (userRole === 'hirer') {
    return <Navigate to="/hirer/dashboard" replace />;
  }

  if (userRole === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Dashboard />;
};

DashboardRedirect.propTypes = {
  user: PropTypes.shape({
    role: PropTypes.string,
    userType: PropTypes.string,
    userRole: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string),
  }),
  isAuthenticated: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
};

const SuspenseFallback = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      p: 4,
    }}
  >
    <CircularProgress />
  </Box>
);

const AppShell = () => {
  const { mode, toggleTheme } = useThemeMode();
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    initializePWA().catch((error) => {
      console.error('PWA initialization failed:', error);
    });
  }, []);

  useEffect(() => {
    const migrateLegacyAuth = () => {
      try {
        const legacyKeys = [
          'kelmah_auth_token',
          'authToken',
          AUTH_CONFIG.tokenKey,
          'refreshToken',
          'user',
        ];

        let migrated = false;

        legacyKeys.forEach((key) => {
          const value = localStorage.getItem(key);

          if (!value) {
            return;
          }

          if (key === 'user') {
            try {
              secureStorage.setUserData(JSON.parse(value));
            } catch (error) {
              console.warn('Failed to migrate legacy user payload:', error);
            }
          } else if (key === 'refreshToken') {
            secureStorage.setRefreshToken(value);
          } else {
            secureStorage.setAuthToken(value);
          }

          localStorage.removeItem(key);
          migrated = true;
        });

        if (migrated) {
          console.log('🔐 Migrated legacy auth data to secureStorage');
        }
      } catch (error) {
        console.warn('Legacy auth migration skipped:', error);
      }
    };

    migrateLegacyAuth();

    if (location.pathname === '/login' || location.pathname === '/register') {
      return;
    }

    if (loading) {
      return;
    }

    try {
      const token =
        secureStorage.getAuthToken() ||
        localStorage.getItem(AUTH_CONFIG.tokenKey);

      if (!isAuthenticated && token) {
        dispatch(verifyAuth());
      }
    } catch (error) {
      console.warn('Auth verification skipped due to storage error:', error);
    }
  }, [dispatch, isAuthenticated, loading, location.pathname]);

  return (
    <Layout toggleTheme={toggleTheme} mode={mode}>
      <Routes>
        {publicRoutes}

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

        <Route
          path="/mfa/setup"
          element={
            <ProtectedRoute
              isAllowed={isAuthenticated}
              redirectPath="/login"
              loading={loading}
            >
              <MfaSetupPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute
              isAllowed={isAuthenticated}
              redirectPath="/login"
              loading={loading}
            >
              <Suspense fallback={<SuspenseFallback />}>
                <ProfilePage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute
              isAllowed={isAuthenticated}
              redirectPath="/login"
              loading={loading}
            >
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <DashboardRedirect
              user={user}
              isAuthenticated={isAuthenticated}
              loading={loading}
            />
          }
        />

        {WorkerRoutes()}
        {HirerRoutes()}
        {AdminRoutes()}

        <Route
          path="/contracts"
          element={
            <ProtectedRoute
              isAllowed={isAuthenticated}
              redirectPath="/login"
              loading={loading}
            >
              <Suspense fallback={<SuspenseFallback />}>
                <ContractManagementPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route
          path="/contracts/create"
          element={
            <ProtectedRoute
              isAllowed={isAuthenticated}
              redirectPath="/login"
              loading={loading}
            >
              <Suspense fallback={<SuspenseFallback />}>
                <CreateContractPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route
          path="/contracts/:contractId"
          element={
            <ProtectedRoute
              isAllowed={isAuthenticated}
              redirectPath="/login"
              loading={loading}
            >
              <Suspense fallback={<SuspenseFallback />}>
                <ContractDetailsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute
              isAllowed={isAuthenticated}
              redirectPath="/login"
              loading={loading}
            >
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications/settings"
          element={
            <ProtectedRoute
              isAllowed={isAuthenticated}
              redirectPath="/login"
              loading={loading}
            >
              <NotificationSettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedRoute
              isAllowed={isAuthenticated}
              redirectPath="/login"
              loading={loading}
            >
              <Suspense fallback={<SuspenseFallback />}>
                <MessagingPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route
          path="/worker/payment"
          element={
            <ProtectedRoute
              isAllowed={isAuthenticated && hasRole(user, 'worker')}
              redirectPath="/login"
              loading={loading}
            >
              <PaymentCenterPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/worker/wallet"
          element={
            <ProtectedRoute
              isAllowed={isAuthenticated && hasRole(user, 'worker')}
              redirectPath="/login"
              loading={loading}
            >
              <WalletPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment/methods"
          element={
            <ProtectedRoute
              isAllowed={isAuthenticated}
              redirectPath="/login"
              loading={loading}
            >
              <PaymentMethodsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment/history"
          element={
            <ProtectedRoute
              isAllowed={isAuthenticated}
              redirectPath="/login"
              loading={loading}
            >
              <PaymentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment/bills"
          element={
            <ProtectedRoute
              isAllowed={isAuthenticated}
              redirectPath="/login"
              loading={loading}
            >
              <BillPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment/escrow/:id"
          element={
            <ProtectedRoute
              isAllowed={isAuthenticated}
              redirectPath="/login"
              loading={loading}
            >
              <EscrowDetailsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/schedule"
          element={
            <ProtectedRoute
              isAllowed={isAuthenticated}
              redirectPath="/login"
              loading={loading}
            >
              <SchedulingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hirer/workers/search"
          element={
            <ProtectedRoute
              isAllowed={isAuthenticated && hasRole(user, 'hirer')}
              redirectPath="/login"
              loading={loading}
            >
              <WorkerSearchPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

const App = () => (
  <KelmahThemeProvider>
    <AppShell />
  </KelmahThemeProvider>
);

export default App;
