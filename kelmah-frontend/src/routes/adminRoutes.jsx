import React from 'react';
import { Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProtectedRoute from '../modules/auth/components/common/ProtectedRoute';

// Admin pages
import SkillsAssessmentManagement from '../modules/admin/pages/SkillsAssessmentManagement';

// Admin components
import UserManagement from '../modules/admin/components/common/UserManagement';
import AnalyticsDashboard from '../modules/admin/components/common/AnalyticsDashboard';
import SystemSettings from '../modules/admin/components/common/SystemSettings';
import ReviewModeration from '../modules/admin/components/common/ReviewModeration';
import PaymentOverview from '../modules/admin/components/common/PaymentOverview';
import PayoutQueuePage from '../modules/admin/pages/PayoutQueuePage';
import DisputeManagement from '../modules/admin/components/common/DisputeManagement';
import GhanaJobCategoriesManagement from '../modules/admin/components/common/GhanaJobCategoriesManagement';

const AdminRoutes = () => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const hasRole = (user, role) =>
    user?.role === role || user?.userType === role || user?.userRole === role;

  return (
    <>
      {/* Admin Dashboard - Main admin landing page */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute
            isAllowed={isAuthenticated && hasRole(user, 'admin')}
            redirectPath="/login"
            loading={loading}
          >
            <AnalyticsDashboard />
          </ProtectedRoute>
        }
      />

      {/* User Management */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute
            isAllowed={isAuthenticated && hasRole(user, 'admin')}
            redirectPath="/login"
            loading={loading}
          >
            <UserManagement />
          </ProtectedRoute>
        }
      />

      {/* Skills Assessment Management */}
      <Route
        path="/admin/skills"
        element={
          <ProtectedRoute
            isAllowed={isAuthenticated && hasRole(user, 'admin')}
            redirectPath="/login"
            loading={loading}
          >
            <SkillsAssessmentManagement />
          </ProtectedRoute>
        }
      />

      {/* Ghana Job Categories Management */}
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute
            isAllowed={isAuthenticated && hasRole(user, 'admin')}
            redirectPath="/login"
            loading={loading}
          >
            <GhanaJobCategoriesManagement />
          </ProtectedRoute>
        }
      />

      {/* Review Moderation */}
      <Route
        path="/admin/reviews"
        element={
          <ProtectedRoute
            isAllowed={isAuthenticated && hasRole(user, 'admin')}
            redirectPath="/login"
            loading={loading}
          >
            <ReviewModeration />
          </ProtectedRoute>
        }
      />

      {/* Payment Overview */}
      <Route
        path="/admin/payments"
        element={
          <ProtectedRoute
            isAllowed={isAuthenticated && hasRole(user, 'admin')}
            redirectPath="/login"
            loading={loading}
          >
            <PaymentOverview />
          </ProtectedRoute>
        }
      />

      {/* Payout Queue */}
      <Route
        path="/admin/payouts"
        element={
          <ProtectedRoute
            isAllowed={isAuthenticated && hasRole(user, 'admin')}
            redirectPath="/login"
            loading={loading}
          >
            <PayoutQueuePage />
          </ProtectedRoute>
        }
      />

      {/* Dispute Management */}
      <Route
        path="/admin/disputes"
        element={
          <ProtectedRoute
            isAllowed={isAuthenticated && hasRole(user, 'admin')}
            redirectPath="/login"
            loading={loading}
          >
            <DisputeManagement />
          </ProtectedRoute>
        }
      />

      {/* System Settings */}
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute
            isAllowed={isAuthenticated && hasRole(user, 'admin')}
            redirectPath="/login"
            loading={loading}
          >
            <SystemSettings />
          </ProtectedRoute>
        }
      />
    </>
  );
};

export default AdminRoutes;
