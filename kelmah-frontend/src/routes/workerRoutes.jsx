import React from 'react';
import { useSelector } from 'react-redux';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../modules/auth/components/common/ProtectedRoute';
import WorkerDashboardPage from '../modules/worker/pages/WorkerDashboardPage';
import PortfolioPage from '../modules/worker/pages/PortfolioPage';
import PortfolioManager from '../modules/worker/components/PortfolioManager';
import CertificateUploader from '../modules/worker/components/CertificateUploader';
import EarningsAnalytics from '../modules/worker/components/EarningsAnalytics';
import AvailabilityCalendar from '../modules/worker/components/AvailabilityCalendar';
import SkillsAssessmentPage from '../modules/worker/pages/SkillsAssessmentPage';
import MyApplicationsPage from '../modules/worker/pages/MyApplicationsPage';
import SchedulingPage from '../modules/scheduling/pages/SchedulingPage';
import WorkerReviewsPage from '../modules/reviews/pages/WorkerReviewsPage';
import WorkerProfileEditPage from '../modules/worker/pages/WorkerProfileEditPage';
import WorkerProfile from '../modules/worker/components/WorkerProfile';
import JobSearchPage from '../modules/worker/pages/JobSearchPage';
import ContractManagementPage from '../modules/contracts/pages/ContractManagementPage';
import PaymentCenterPage from '../modules/payment/pages/PaymentCenterPage';
import WalletPage from '../modules/payment/pages/WalletPage';
import EscrowManager from '../modules/payment/components/EscrowManager';
import SavedJobs from '../modules/jobs/components/common/SavedJobs';
import JobAlertsPage from '../modules/jobs/pages/JobAlertsPage';

const WorkerRoutes = () => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const hasRole = (user, role) =>
    user?.role === role || user?.userType === role || user?.userRole === role;
  
  // Enhanced role checking that handles race conditions
  const isWorkerAllowed = () => {
    console.log('Worker route protection check:', {
      isAuthenticated,
      hasUser: !!user,
      userRole: user?.role,
      loading,
      userId: user?.id
    });
    
    // If loading, allow access to prevent redirect loops
    if (loading) {
      console.log('Worker route: Allowing access due to loading state');
      return true;
    }
    // If authenticated and user exists, check role
    if (isAuthenticated && user) {
      const allowed = hasRole(user, 'worker');
      console.log('Worker route: Role check result:', allowed);
      return allowed;
    }
    // If authenticated but no user (race condition), allow access temporarily
    if (isAuthenticated && !user) {
      console.log('Worker route: Allowing access due to race condition (authenticated but no user)');
      return true;
    }
    // Otherwise, not allowed
    console.log('Worker route: Access denied - not authenticated');
    return false;
  };

  return (
    <>
      <Route
        path="/worker/dashboard"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <WorkerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/skills"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <SkillsAssessmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/skills/test/:testId"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <SkillsAssessmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/applications"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <MyApplicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/schedule"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <SchedulingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/reviews"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <WorkerReviewsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/profile/edit"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <WorkerProfileEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/profile"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <WorkerProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/portfolio"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <PortfolioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/portfolio/manage"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <PortfolioManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/certificates"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <CertificateUploader />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/earnings"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <EarningsAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/availability"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <AvailabilityCalendar />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/find-work"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <JobSearchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/contracts"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <ContractManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/payment"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <PaymentCenterPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/payment/escrows"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <EscrowManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/wallet"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <WalletPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/saved-jobs"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <SavedJobs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/job-alerts"
        element={
          <ProtectedRoute
            isAllowed={isWorkerAllowed()}
            redirectPath="/login"
            loading={loading}
          >
            <JobAlertsPage />
          </ProtectedRoute>
        }
      />
    </>
  );
};

export default WorkerRoutes;
