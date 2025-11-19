import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../modules/auth/components/common/ProtectedRoute';
import { hasRole as userHasRole } from '../utils/userUtils';
import HirerDashboardPage from '../modules/hirer/pages/HirerDashboardPage';
import ApplicationManagementPage from '../modules/hirer/pages/ApplicationManagementPage';
import JobPostingPage from '../modules/hirer/pages/JobPostingPage';
import JobManagementPage from '../modules/hirer/pages/JobManagementPage';
import WorkerSearchPage from '../modules/hirer/pages/WorkerSearchPage';
import HirerToolsPage from '../modules/hirer/pages/HirerToolsPage';

const HirerRoutes = () => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const canAccessHirerRoutes = useMemo(
    () => userHasRole(user, 'hirer'),
    [user],
  );

  return (
    <>
      <Route
        path="/hirer/dashboard"
        element={
          <ProtectedRoute
            isAllowed={isAuthenticated && canAccessHirerRoutes}
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
            isAllowed={isAuthenticated && canAccessHirerRoutes}
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
            isAllowed={isAuthenticated && canAccessHirerRoutes}
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
            isAllowed={isAuthenticated && canAccessHirerRoutes}
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
            isAllowed={isAuthenticated && canAccessHirerRoutes}
            redirectPath="/login"
            loading={loading}
          >
            <WorkerSearchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hirer/tools"
        element={
          <ProtectedRoute
            isAllowed={isAuthenticated && canAccessHirerRoutes}
            redirectPath="/login"
            loading={loading}
          >
            <HirerToolsPage />
          </ProtectedRoute>
        }
      />
    </>
  );
};

export default HirerRoutes;
