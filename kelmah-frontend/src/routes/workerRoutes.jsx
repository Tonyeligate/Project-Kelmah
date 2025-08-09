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
import JobSearchPage from '../modules/worker/pages/JobApplicationPage';
import ContractManagementPage from '../modules/contracts/pages/ContractManagementPage';
import PaymentCenterPage from '../modules/payment/pages/PaymentCenterPage';
import WalletPage from '../modules/payment/pages/WalletPage';
import EscrowManager from '../modules/payment/components/EscrowManager';

const WorkerRoutes = () => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const hasRole = (user, role) =>
    user?.role === role || user?.userType === role || user?.userRole === role;

  return (
    <>
      <Route
        path="/worker/dashboard"
        element={
          <ProtectedRoute
            isAllowed={isAuthenticated && hasRole(user, 'worker')}
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
            isAllowed={isAuthenticated && hasRole(user, 'worker')}
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
            isAllowed={isAuthenticated && hasRole(user, 'worker')}
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
            isAllowed={isAuthenticated && hasRole(user, 'worker')}
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
            isAllowed={isAuthenticated && hasRole(user, 'worker')}
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
            isAllowed={isAuthenticated && hasRole(user, 'worker')}
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
            isAllowed={isAuthenticated && hasRole(user, 'worker')}
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
            isAllowed={isAuthenticated && hasRole(user, 'worker')}
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
            isAllowed={isAuthenticated && hasRole(user, 'worker')}
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
            isAllowed={isAuthenticated && hasRole(user, 'worker')}
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
            isAllowed={isAuthenticated && hasRole(user, 'worker')}
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
            isAllowed={isAuthenticated && hasRole(user, 'worker')}
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
            isAllowed={isAuthenticated && hasRole(user, 'worker')}
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
            isAllowed={isAuthenticated && hasRole(user, 'worker')}
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
            isAllowed={isAuthenticated && hasRole(user, 'worker')}
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
            isAllowed={isAuthenticated && hasRole(user, 'worker')}
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
            isAllowed={isAuthenticated && hasRole(user, 'worker')}
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
            isAllowed={isAuthenticated && hasRole(user, 'worker')}
            redirectPath="/login"
            loading={loading}
          >
            <WalletPage />
          </ProtectedRoute>
        }
      />
    </>
  );
};

export default WorkerRoutes;
