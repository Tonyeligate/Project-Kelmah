import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Removed AuthContext import to prevent dual state management conflicts
// import { useAuth } from '../modules/auth/contexts/AuthContext';
import { useSelector } from 'react-redux';
import { lazyWithRetry } from '../utils/lazyWithRetry';

// Real-time Components
const RealTimeChat = lazyWithRetry(
  () => import('../modules/messaging/components/RealTimeChat'),
  { retryKey: 'real-time-chat' },
);
const NotificationCenter = lazyWithRetry(
  () => import('../components/common/NotificationCenter'),
  { retryKey: 'notification-center' },
);
const RealTimeJobAlerts = lazyWithRetry(
  () => import('../modules/jobs/components/RealTimeJobAlerts'),
  { retryKey: 'real-time-job-alerts' },
);

// Pages that use real-time features
const MessagingPage = lazyWithRetry(
  () => import('../modules/messaging/pages/MessagingPage'),
  { retryKey: 'real-time-messaging-page' },
);
const NotificationsPage = lazyWithRetry(
  () => import('../pages/NotificationsPage'),
  { retryKey: 'notifications-page' },
);
const JobAlertsPage = lazyWithRetry(
  () => import('../modules/jobs/pages/JobAlertsPage'),
  { retryKey: 'alerts-job-page' },
);

/**
 * Real-time feature routes configuration
 * These routes handle real-time messaging, notifications, and live updates
 */
const RealTimeRoutes = () => {
  // Use ONLY Redux auth state to prevent dual state management conflicts
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      {/* Real-time Messaging Routes */}
      <Route path="/messages" element={<MessagingPage />} />
      <Route path="/messages/:conversationId" element={<MessagingPage />} />
      <Route path="/chat/:conversationId" element={<RealTimeChat />} />

      {/* Notification Routes */}
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route
        path="/notifications/center"
        element={<NotificationCenter showTabs={true} showHeader={true} />}
      />

      {/* Job Alert Routes */}
      <Route path="/job-alerts" element={<JobAlertsPage />} />
      <Route
        path="/alerts/jobs"
        element={<RealTimeJobAlerts showHeader={true} />}
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/messages" replace />} />
    </Routes>
  );
};

export default RealTimeRoutes;
