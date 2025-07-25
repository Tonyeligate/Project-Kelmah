import React from 'react';
import { useSelector } from 'react-redux';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../modules/auth/components/common/ProtectedRoute';
import HirerDashboardPage from '../modules/hirer/pages/HirerDashboardPage';
import ApplicationManagementPage from '../modules/hirer/pages/ApplicationManagementPage';
import JobPostingPage from '../modules/hirer/pages/JobPostingPage';
import JobManagementPage from '../modules/hirer/pages/JobManagementPage';
import WorkerSearchPage from '../modules/hirer/pages/WorkerSearchPage';

const HirerRoutes = () => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const hasRole = (user, role) =>
    user?.role === role || user?.userType === role || user?.userRole === role;

  return (
    <>
      <Route
        path="/hirer/dashboard"
        element={
          <ProtectedRoute
            isAllowed={isAuthenticated && hasRole(user, 'hirer')}
            redirectPath="/login"
            loading={loading}
          >
            <HirerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hirer/applications"
        element={
          <ProtectedRoute
            isAllowed={isAuthenticated && hasRole(user, 'hirer')}
            redirectPath="/login"
            loading={loading}
          >
            <ApplicationManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hirer/jobs/post"
        element={
          <ProtectedRoute
            isAllowed={isAuthenticated && hasRole(user, 'hirer')}
            redirectPath="/login"
            loading={loading}
          >
            <JobPostingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hirer/jobs"
        element={
          <ProtectedRoute
            isAllowed={isAuthenticated && hasRole(user, 'hirer')}
            redirectPath="/login"
            loading={loading}
          >
            <JobManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hirer/find-talent"
        element={
          <ProtectedRoute
            isAllowed={isAuthenticated && hasRole(user, 'hirer')}
            redirectPath="/find-talents"
            loading={loading}
          >
            <WorkerSearchPage />
          </ProtectedRoute>
        }
      />
    </>
  );
};

export default HirerRoutes;
