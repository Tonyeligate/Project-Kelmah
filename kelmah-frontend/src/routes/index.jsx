import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Authentication Pages
import SignInPage from '../pages/SignInPage';
import SignUpPage from '../pages/SignUpPage';

// Betting Pages
import BettingCodeSubmissionPage from '../pages/BettingCodeSubmissionPage';
import BettingCodeTrackingPage from '../pages/BettingCodeTrackingPage';

// Dashboard and Profile
import DashboardPage from '../pages/DashboardPage';
import ProfilePage from '../pages/ProfilePage';
import HirerDashboardPage from '../pages/hirer/HirerDashboardPage';

// Notifications
import NotificationsPage from '../pages/NotificationsPage';

// Layout
import ProtectedLayout from '../components/layout/ProtectedLayout';
import PublicLayout from '../components/layout/PublicLayout';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return isAuthenticated ? (
    <ProtectedLayout>{children}</ProtectedLayout>
  ) : (
    <Navigate to="/signin" replace />
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Route>

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      
      <Route 
        path="/hirer/dashboard" 
        element={
          <ProtectedRoute>
            <HirerDashboardPage />
          </ProtectedRoute>
        } 
      />
      
      <Route path="/betting">
        <Route 
          path="submit" 
          element={
            <ProtectedRoute>
              <BettingCodeSubmissionPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="tracking" 
          element={
            <ProtectedRoute>
              <BettingCodeTrackingPage />
            </ProtectedRoute>
          } 
        />
      </Route>

      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfilePage />
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

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
