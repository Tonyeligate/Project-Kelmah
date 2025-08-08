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
import { ErrorBoundary } from 'react-error-boundary';
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
import { secureStorage } from './utils/secureStorage';
import PaymentCenterPage from './modules/payment/pages/PaymentCenterPage';
import PaymentsPage from './modules/payment/pages/PaymentsPage';
import PaymentMethodsPage from './modules/payment/pages/PaymentMethodsPage';
import WalletPage from './modules/payment/pages/WalletPage';
import BillPage from './modules/payment/pages/BillPage';
import SchedulingPage from './modules/scheduling/pages/SchedulingPage';
import SettingsPage from './modules/settings/pages/SettingsPage';
import WorkerReviewsPage from './modules/reviews/pages/WorkerReviewsPage';
import DisputesPage from './modules/disputes/pages/DisputesPage';
import PremiumPage from './modules/premium/pages/PremiumPage';
import EscrowDetailsPage from './modules/payment/pages/EscrowDetailsPage';
import OfflineManager from './components/pwa/OfflineManager';
import { initializePWA } from './utils/pwaHelpers';
import WorkerSearchPage from './modules/hirer/pages/WorkerSearchPage';
import JobsPage from './modules/jobs/pages/JobsPage';
import WorkerProfile from './modules/worker/components/WorkerProfile';
import publicRoutes from './routes/publicRoutes';
import { ContractProvider } from './modules/contracts/contexts/ContractContext';
import WorkerRoutes from './routes/workerRoutes';
import HirerRoutes from './routes/hirerRoutes';
import AdminRoutes from './routes/adminRoutes';
import ForgotPasswordPage from './modules/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './modules/auth/pages/ResetPasswordPage';
import VerifyEmailPage from './modules/auth/pages/VerifyEmailPage';
import MfaSetupPage from './modules/auth/pages/MfaSetupPage';

// Dashboard redirect component that only redirects when necessary
const DashboardRedirect = ({ user, isAuthenticated, loading }) => {
  const location = useLocation();
  
  // Only log once when component mounts, not on every render
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

  // Determine user role
  const getUserRole = () => {
    if (!user) return null;
    return (
      user.role ||
      user.userType ||
      user.userRole ||
      (user.roles && user.roles[0])
    );
  };

  const userRole = getUserRole();

  // Redirect to appropriate dashboard
  if (userRole === 'worker') {
    return <Navigate to="/worker/dashboard" replace />;
  } else if (userRole === 'hirer') {
    return <Navigate to="/hirer/dashboard" replace />;
  } else if (userRole === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  } else {
    // Default fallback dashboard
    return <Dashboard />;
  }
};

// App content component that has access to theme context
const AppContent = () => {
  const { mode, toggleTheme } = useThemeMode();
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  // Initialize PWA features on component mount
  useEffect(() => {
    // Initialize PWA features for Ghana's mobile market
    initializePWA().catch(error => {
      console.error('PWA initialization failed:', error);
    });
  }, []);

  // Verify auth on component mount and location change
  useEffect(() => {
    // Skip auto-auth when on login or register to respect explicit logout
    if (location.pathname === '/login' || location.pathname === '/register') {
      console.log('Auth check skipped on auth pages');
      return;
    }

      const checkAuth = () => {
        // Always use real authentication
      const token = secureStorage.getAuthToken() || localStorage.getItem(TOKEN_KEY);

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



  // Helper function to check roles
  const hasRole = (user, role) => {
    return (
      user?.role === role || user?.userType === role || user?.userRole === role
    );
  };

  return (
    <ContractProvider>
      {/* PWA Offline Manager for Ghana's network conditions */}
      <OfflineManager />
      
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

          {/* Dashboard redirect - only when accessing /dashboard directly */}
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

          {/* Worker, Hirer, and Admin routes */}
          <>
            {WorkerRoutes()}
            {HirerRoutes()}
            {AdminRoutes()}
          </>

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
// Simple error fallback component
const AppErrorFallback = ({ error }) => (
  <div style={{ 
    padding: '20px', 
    textAlign: 'center', 
    background: '#1a1a1a', 
    color: 'white', 
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    <h2>⚠️ Something went wrong</h2>
    <p>We're sorry, but an error occurred while loading the application.</p>
    <details style={{ marginTop: '20px', padding: '10px', background: '#333', borderRadius: '5px' }}>
      <summary>Error Details</summary>
      <pre style={{ marginTop: '10px', fontSize: '12px' }}>{error.message}</pre>
    </details>
    <button 
      onClick={() => window.location.reload()} 
      style={{ 
        marginTop: '20px', 
        padding: '10px 20px', 
        background: '#007bff', 
        color: 'white', 
        border: 'none', 
        borderRadius: '5px',
        cursor: 'pointer'
      }}
    >
      Reload Application
    </button>
  </div>
);

function App() {
  return (
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <KelmahThemeProvider>
          <AppContent />
      </KelmahThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
