import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../modules/auth/contexts/AuthContext';

// Real-time Components
const RealTimeChat = React.lazy(() => import('../modules/messaging/components/RealTimeChat'));
const NotificationCenter = React.lazy(() => import('../components/common/NotificationCenter'));
const RealTimeJobAlerts = React.lazy(() => import('../modules/jobs/components/RealTimeJobAlerts'));

// Pages that use real-time features
const MessagingPage = React.lazy(() => import('../modules/messaging/pages/MessagingPage'));
const NotificationsPage = React.lazy(() => import('../pages/NotificationsPage'));
const JobAlertsPage = React.lazy(() => import('../modules/jobs/pages/JobAlertsPage'));

/**
 * Real-time feature routes configuration
 * These routes handle real-time messaging, notifications, and live updates
 */
const RealTimeRoutes = () => {
  const { user, isAuthenticated } = useAuth();

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
      <Route path="/notifications/center" element={<NotificationCenter showTabs={true} showHeader={true} />} />
      
      {/* Job Alert Routes */}
      <Route path="/job-alerts" element={<JobAlertsPage />} />
      <Route path="/alerts/jobs" element={<RealTimeJobAlerts showHeader={true} />} />
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/messages" replace />} />
    </Routes>
  );
};

export default RealTimeRoutes;