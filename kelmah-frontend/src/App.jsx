/**
 * Kelmah Frontend Application - v2.0.0
 * Unified theme system with consistent branding
 * Last updated: January 2025
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import Layout from './modules/layout/components/Layout';
import { KelmahThemeProvider, useThemeMode } from './theme/ThemeProvider';
import Home from './modules/home/pages/HomePage';
import Dashboard from './modules/dashboard/pages/DashboardPage';
import WorkerDashboardPage from './modules/worker/pages/WorkerDashboardPage';
import HirerDashboardPage from './modules/hirer/pages/HirerDashboardPage';
import SkillsAssessmentPage from './modules/worker/pages/SkillsAssessmentPage';
import MyApplicationsPage from './modules/worker/pages/MyApplicationsPage';
import WorkerProfileEditPage from './modules/worker/pages/WorkerProfileEditPage';
import JobSearchPage from './modules/worker/pages/JobApplicationPage';
import GeoLocationSearch from './modules/search/pages/GeoLocationSearch';
import SearchPage from './modules/search/pages/SearchPage';
import ProfessionalMapPage from './modules/map/pages/ProfessionalMapPage';
import NotificationsPage from './modules/notifications/pages/NotificationsPage';
import LoginPage from './modules/auth/pages/LoginPage';
import RegisterPage from './modules/auth/pages/RegisterPage';
import MessagingPage from './modules/messaging/pages/MessagingPage';
import JobDetailsPage from './modules/jobs/pages/JobDetailsPage';
import UserProfilePage from './modules/profiles/pages/UserProfilePage';
import ProfilePage from './modules/profile/pages/ProfilePage';
import ApplicationManagementPage from './modules/hirer/pages/ApplicationManagementPage';
import ContractManagementPage from './modules/contracts/pages/ContractManagementPage';
import ContractDetailsPage from './modules/contracts/pages/ContractDetailsPage';
import CreateContractPage from './modules/contracts/pages/CreateContractPage';
import JobPostingPage from './modules/hirer/pages/JobPostingPage';
import JobManagementPage from './modules/hirer/pages/JobManagementPage';
import { verifyAuth } from './modules/auth/services/authSlice';
import ProtectedRoute from './modules/auth/components/common/ProtectedRoute';
import { TOKEN_KEY } from './config/constants';
import PaymentCenterPage from './modules/payment/pages/PaymentCenterPage';
import PaymentsPage from './modules/payment/pages/PaymentsPage';
import PaymentMethodsPage from './modules/payment/pages/PaymentMethodsPage';
import WalletPage from './modules/payment/pages/WalletPage';
import BillPage from './modules/payment/pages/BillPage';
import SchedulingPage from './modules/scheduling/pages/SchedulingPage';
import SettingsPage from './modules/settings/pages/SettingsPage';
import WorkerReviewsPage from './modules/reviews/pages/WorkerReviewsPage';
import DisputesPage from './modules/disputes/pages/DisputesPage';
import PremiumPage from './pages/PremiumPage';
import EscrowDetailsPage from './modules/payment/pages/EscrowDetailsPage';
import WorkerSearchPage from './modules/hirer/pages/WorkerSearchPage';
import JobsPage from './modules/jobs/pages/JobsPage';
import WorkerProfile from './modules/worker/components/WorkerProfile';
import publicRoutes from './routes/publicRoutes';
import { ContractProvider } from './modules/contracts/contexts/ContractContext';
import WorkerRoutes from './routes/workerRoutes';
import HirerRoutes from './routes/hirerRoutes';
import ForgotPasswordPage from './modules/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './modules/auth/pages/ResetPasswordPage';
import VerifyEmailPage from './modules/auth/pages/VerifyEmailPage';
import MfaSetupPage from './modules/auth/pages/MfaSetupPage';

// App content component that has access to theme context
const AppContent = () => {
  const { mode, toggleTheme } = useThemeMode();
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  // Verify auth on component mount and location change
  useEffect(() => {
    // Skip auto-auth when on login or register to respect explicit logout
    if (location.pathname === '/login' || location.pathname === '/register') {
      console.log('Auth check skipped on auth pages');
      return;
    }

    const checkAuth = () => {
      // Force disable development mock authentication to use real auth
      const isDevelopment = false; // Disabled to use real authentication

      if (isDevelopment) {
        // Skip mock auth after manual logout
        if (sessionStorage.getItem('dev-logout') === 'true') {
          console.log('Dev-mode mock auth skipped due to manual logout');
          return;
        }
        console.log('Development mode: Setting up mock authentication');

        // Set up mock user if none exists
        if (!localStorage.getItem('user') || !localStorage.getItem(TOKEN_KEY)) {
          const mockUser = {
            id: 'dev-user-123',
            email: 'dev@example.com',
            firstName: 'Development',
            lastName: 'User',
            name: 'Development User',
            role: 'worker',
            skills: ['Carpentry', 'Plumbing', 'Electrical'],
            rating: 4.8,
            profileImage: null,
          };

          localStorage.setItem('user', JSON.stringify(mockUser));
          localStorage.setItem(TOKEN_KEY, 'dev-mode-fake-token-12345');
        }

        // Dispatch login action with mock user data
        const storedUser = JSON.parse(localStorage.getItem('user'));
        dispatch({
          type: 'auth/login/fulfilled',
          payload: {
            user: storedUser,
            token: 'dev-mode-fake-token-12345',
          },
        });

        return;
      }

      // Production mode: Check if token exists before dispatching verification
      const token = localStorage.getItem(TOKEN_KEY);

      // Only verify auth if Redux state is currently unauthenticated.
      if (!isAuthenticated) {
        if (token) {
          console.log('Token found and no authenticated user – verifying auth state...');
          dispatch(verifyAuth());
        } else {
          console.log('No token found in storage');
        }
      } else {
        // Already authenticated; skip verification to avoid redundant network calls
        console.log('User already authenticated – skipping verifyAuth');
      }
    };

    // Check auth when component mounts or location changes
    checkAuth();
  }, [dispatch, location.pathname, isAuthenticated]);

  // Enhanced user role detection that works with different API response formats
  const getUserRole = () => {
    if (!user) return null;

    // Check all common role property names
    return (
      user.role ||
      user.userType ||
      user.userRole ||
      (user.roles && user.roles[0])
    );
  };

  // Determine which dashboard to render based on user role
  const getDashboardRoute = () => {
    console.log('Dashboard route check - User:', user);
    console.log('Dashboard route check - Auth state:', isAuthenticated, loading);

    // Also check directly from localStorage for debugging
    const storedUserData = localStorage.getItem('user');
    if (storedUserData) {
      const storedUser = JSON.parse(storedUserData);
      console.log('User data from localStorage:', storedUser);
    }

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
      console.log('User not authenticated, redirecting to login');
      return <Navigate to="/login" />;
    }

    // Get user role using enhanced detection
    const userRole = getUserRole();
    console.log('Detected user role:', userRole);

    if (userRole === 'worker') {
      console.log('Worker role detected, redirecting to worker dashboard');
      return <Navigate to="/worker/dashboard" />;
    } else if (userRole === 'hirer') {
      console.log('Hirer role detected, redirecting to hirer dashboard');
      return <Navigate to="/hirer/dashboard" />;
    } else if (userRole === 'admin') {
      console.log('Admin role detected, redirecting to admin dashboard');
      return <Navigate to="/admin/dashboard" />;
    } else {
      console.log('No specific role detected, showing generic dashboard. Role:', userRole);

      // Check if there are any role-related properties on the user object
      if (user) {
        console.log('Available user properties:', Object.keys(user));
      }

      // In development mode, default to worker dashboard even if no role is detected
      if (import.meta.env.DEV && import.meta.env.VITE_BYPASS_AUTH === 'true') {
        console.log('Development mode: Defaulting to worker dashboard');
        return <Navigate to="/worker/dashboard" />;
      }

      return <Dashboard />;
    }
  };

  // Helper function to check roles
  const hasRole = (user, role) => {
    return (
      user?.role === role || user?.userType === role || user?.userRole === role
    );
  };

  return (
    <ContractProvider>
      <Layout toggleTheme={toggleTheme} mode={mode}>
        <Routes>
          {/* Public routes */}
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
                <ProfilePage />
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

          {/* Dashboard routes */}
          <Route path="/dashboard" element={getDashboardRoute()} />

          {/* Worker and Hirer routes */}
          <>
            {WorkerRoutes()}
            {HirerRoutes()}
          </>

          {/* Admin routes */}
          <Route
            path="/admin/skills"
            element={
              <ProtectedRoute
                isAllowed={isAuthenticated && hasRole(user, 'admin')}
                redirectPath="/login"
                loading={loading}
              >
                <SkillsAssessmentPage />
              </ProtectedRoute>
            }
          />

          {/* Contract routes */}
          <Route
            path="/contracts"
            element={
              <ProtectedRoute
                isAllowed={isAuthenticated}
                redirectPath="/login"
                loading={loading}
              >
                <ContractManagementPage />
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
                <CreateContractPage />
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
                <ContractDetailsPage />
              </ProtectedRoute>
            }
          />

          {/* Common protected routes */}
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
            path="/messages"
            element={
              <ProtectedRoute
                isAllowed={isAuthenticated}
                redirectPath="/login"
                loading={loading}
              >
                <MessagingPage />
              </ProtectedRoute>
            }
          />

          {/* Worker payment routes */}
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
            path="/escrows/:escrowId"
            element={
              <ProtectedRoute
                isAllowed={isAuthenticated && hasRole(user, 'worker')}
                redirectPath="/login"
                loading={loading}
              >
                <EscrowDetailsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/payment/bill"
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

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ContractProvider>
  );
};

// Main App component with theme provider
function App() {
  return (
    <KelmahThemeProvider>
      <AppContent />
    </KelmahThemeProvider>
  );
}

export default App;
