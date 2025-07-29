/**
 * Kelmah Frontend Application - v2.0.0
 * Unified theme system with consistent branding
 * Last updated: January 2025
 */
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Box, CssBaseline } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';

// Design System
import KelmahThemeProvider from './theme/ThemeProvider';
import { ToastContainer, useToast } from './design-system/components/Feedback/Alert';

// Layout Components
import { PageLayout } from './design-system/components/Layout';
import EnhancedHeader from './design-system/components/Navigation/Header';

// Auth
import { checkAuthStatus, logout } from './modules/auth/services/authSlice';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';

// Pages
import HomePage from './modules/home/pages/HomePage';
import LoginPage from './modules/auth/pages/LoginPage';
import RegisterPage from './modules/auth/pages/RegisterPage';
import ForgotPasswordPage from './modules/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './modules/auth/pages/ResetPasswordPage';
import EmailVerificationPage from './modules/auth/pages/EmailVerificationPage';

// Dashboard Pages
import WorkerDashboard from './modules/worker/pages/WorkerDashboard';
import HirerDashboard from './modules/hirer/pages/HirerDashboard';
import AdminDashboard from './modules/admin/pages/AdminDashboard';

// Feature Pages
import JobsPage from './modules/jobs/pages/JobsPage';
import JobDetailsPage from './modules/jobs/pages/JobDetailsPage';
import CreateJobPage from './modules/jobs/pages/CreateJobPage';
import WorkerSearchPage from './modules/hirer/pages/WorkerSearchPage';
import WorkerProfilePage from './modules/worker/pages/WorkerProfilePage';
import JobSearchPage from './modules/worker/pages/JobSearchPage';

// Profile and Settings
import ProfilePage from './modules/profile/pages/ProfilePage';
import SettingsPage from './modules/settings/pages/SettingsPage';
import NotificationsPage from './modules/notifications/pages/NotificationsPage';

// Other Pages
import AboutPage from './modules/home/pages/AboutPage';
import ContactPage from './modules/home/pages/ContactPage';
import PricingPage from './modules/home/pages/PricingPage';
import HelpPage from './modules/help/pages/HelpPage';
import NotFoundPage from './modules/common/pages/NotFoundPage';

// Configuration
import { USE_MOCK_DATA } from './config';

/**
 * Main App Component with Enhanced Design System Integration
 * 
 * Features:
 * - Comprehensive routing with protected routes
 * - Global toast notification system
 * - Theme provider integration
 * - Animation transitions between pages
 * - Responsive header with user management
 * - Mock data toggle for development
 */

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -20,
  },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4,
};

// Animated route wrapper
const AnimatedRoute = ({ children }) => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        style={{ width: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Main App content component
const AppContent = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const { toasts, removeToast, showSuccess, showError, showInfo } = useToast();

  // Mock notifications for demo
  useEffect(() => {
    if (isAuthenticated) {
      setNotifications([
        {
          id: 1,
          title: 'New Job Application',
          message: 'You have received a new application for your construction project.',
          read: false,
          timestamp: new Date().toISOString(),
        },
        {
          id: 2,
          title: 'Profile Verified',
          message: 'Your professional profile has been successfully verified.',
          read: true,
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    }
  }, [isAuthenticated]);

  // Check authentication status on app load
  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  // Mock auth setup for development
  useEffect(() => {
    if (USE_MOCK_DATA && !isAuthenticated && !loading) {
      const isDevelopment = false; // Set to false to disable mock auth
      
      if (isDevelopment) {
        console.log('Development mode: Setting up mock authentication');
        // Mock authentication would go here
      }
    }
  }, [isAuthenticated, loading]);

  const handleLogout = () => {
    dispatch(logout());
    showSuccess('Successfully logged out');
  };

  const handleNotificationClick = (notification) => {
    // Mark notification as read
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      )
    );
    
    // Handle notification action based on type
    switch (notification.type) {
      case 'job_application':
        // Navigate to job applications
        break;
      case 'profile_update':
        // Navigate to profile
        break;
      default:
        showInfo(notification.message);
    }
  };

  const handleSearch = (searchTerm) => {
    if (searchTerm.trim()) {
      // Navigate to search results or perform search action
      showInfo(`Searching for: ${searchTerm}`);
    }
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { id: 'home', path: '/', label: 'Home', icon: '🏠' },
      { id: 'jobs', path: '/jobs', label: 'Jobs', icon: '💼' },
    ];

    if (user?.role === 'worker') {
      return [
        ...baseItems,
        { id: 'find-work', path: '/worker/jobs', label: 'Find Work', icon: '🔍' },
        { id: 'my-applications', path: '/worker/applications', label: 'Applications', icon: '📋' },
      ];
    } else if (user?.role === 'hirer') {
      return [
        ...baseItems,
        { id: 'find-talent', path: '/workers', label: 'Find Talent', icon: '👥' },
        { id: 'post-job', path: '/jobs/create', label: 'Post Job', icon: '➕' },
      ];
    }

    return [
      ...baseItems,
      { id: 'workers', path: '/workers', label: 'Find Talent', icon: '👥' },
    ];
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CssBaseline />
      
      {/* Enhanced Header */}
      <EnhancedHeader
        user={user}
        isAuthenticated={isAuthenticated}
        notifications={notifications}
        onLogout={handleLogout}
        onNotificationClick={handleNotificationClick}
        onSearchSubmit={handleSearch}
        navigationItems={getNavigationItems()}
        showSearch={true}
        showNotifications={isAuthenticated}
        sticky={true}
      />

      {/* Main Content */}
      <Box component="main" sx={{ flex: 1 }}>
        <AnimatedRoute>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/help" element={<HelpPage />} />

            {/* Auth Routes */}
            <Route 
              path="/auth/login" 
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/auth/register" 
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/auth/forgot-password" 
              element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/auth/reset-password" 
              element={
                <PublicRoute>
                  <ResetPasswordPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/auth/verify-email" 
              element={<EmailVerificationPage />} 
            />

            {/* Job Routes */}
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/:id" element={<JobDetailsPage />} />
            <Route 
              path="/jobs/create" 
              element={
                <ProtectedRoute requiredRole="hirer">
                  <CreateJobPage />
                </ProtectedRoute>
              } 
            />

            {/* Worker Routes */}
            <Route path="/workers" element={<WorkerSearchPage />} />
            <Route path="/workers/:id" element={<WorkerProfilePage />} />
            <Route 
              path="/worker/jobs" 
              element={
                <ProtectedRoute requiredRole="worker">
                  <JobSearchPage />
                </ProtectedRoute>
              } 
            />

            {/* Dashboard Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/worker/dashboard" 
              element={
                <ProtectedRoute requiredRole="worker">
                  <WorkerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hirer/dashboard" 
              element={
                <ProtectedRoute requiredRole="hirer">
                  <HirerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Profile and Settings */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              } 
            />

            {/* 404 Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatedRoute>
      </Box>

      {/* Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
        position={{ vertical: 'top', horizontal: 'right' }}
      />
    </Box>
  );
};

// Dashboard redirect component
const DashboardRedirect = () => {
  const { user } = useSelector((state) => state.auth);
  
  if (!user) return <Navigate to="/auth/login" replace />;
  
  const dashboardMap = {
    worker: '/worker/dashboard',
    hirer: '/hirer/dashboard',
    admin: '/admin/dashboard',
  };
  
  const redirectPath = dashboardMap[user.role] || '/worker/dashboard';
  return <Navigate to={redirectPath} replace />;
};

// Main App component with theme provider
const App = () => {
  return (
    <KelmahThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </KelmahThemeProvider>
  );
};

export default App;
