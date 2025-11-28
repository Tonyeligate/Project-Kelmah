import { useRoutes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from '../modules/layout/components/Layout';
import ProtectedRoute from '../modules/auth/components/common/ProtectedRoute';
import LoadingScreen from '../modules/common/components/loading/LoadingScreen';

// Public Pages
const LandingPage = lazy(() => import('../modules/home/pages/HomePage'));
const LoginPage = lazy(() => import('../modules/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('../modules/auth/pages/RegisterPage'));
const DashboardPage = lazy(
  () => import('../modules/dashboard/pages/DashboardPage'),
);
const JobsPage = lazy(() => import('../modules/jobs/pages/JobsPage'));
const JobDetailsPage = lazy(
  () => import('../modules/jobs/pages/JobDetailsPage'),
);
const WorkerProfilePage = lazy(
  () => import('../modules/worker/pages/WorkerProfilePage'),
);
const MessagesPage = lazy(
  () => import('../modules/messaging/pages/MessagingPage'),
);
const NotFoundPage = lazy(() => import('../modules/common/pages/NotFoundPage'));

// Hirer Pages
const HirerDashboardPage = lazy(
  () => import('../modules/hirer/pages/HirerDashboardPage'),
);
const JobPostingPage = lazy(
  () => import('../modules/hirer/pages/JobPostingPage'),
);
const JobManagementPage = lazy(
  () => import('../modules/hirer/pages/JobManagementPage'),
);
const ApplicationManagementPage = lazy(
  () => import('../modules/hirer/pages/ApplicationManagementPage'),
);
const WorkerSearchPage = lazy(
  () => import('../modules/hirer/pages/WorkerSearchPage'),
);
const HirerToolsPage = lazy(
  () => import('../modules/hirer/pages/HirerToolsPage'),
);

// Worker Pages
const WorkerDashboardPage = lazy(
  () => import('../modules/worker/pages/WorkerDashboardPage'),
);
const JobSearchPage = lazy(
  () => import('../modules/worker/pages/JobSearchPage'),
);
const MyApplicationsPage = lazy(
  () => import('../modules/worker/pages/MyApplicationsPage'),
);
const WorkerProfileEditPage = lazy(
  () => import('../modules/worker/pages/WorkerProfileEditPage'),
);
const PortfolioPage = lazy(
  () => import('../modules/worker/pages/PortfolioPage'),
);
const SkillsAssessmentPage = lazy(
  () => import('../modules/worker/pages/SkillsAssessmentPage'),
);

// Worker components used as pages
const WorkerProfile = lazy(
  () => import('../modules/worker/components/WorkerProfile'),
);
const PortfolioManager = lazy(
  () => import('../modules/worker/components/PortfolioManager'),
);
const CertificateUploader = lazy(
  () => import('../modules/worker/components/CertificateUploader'),
);
const EarningsAnalytics = lazy(
  () => import('../modules/worker/components/EarningsAnalytics'),
);
const AvailabilityCalendar = lazy(
  () => import('../modules/worker/components/AvailabilityCalendar'),
);

// Scheduling, Contracts, Payment pages
const SchedulingPage = lazy(
  () => import('../modules/scheduling/pages/SchedulingPage'),
);
const ContractManagementPage = lazy(
  () => import('../modules/contracts/pages/ContractManagementPage'),
);
const PaymentCenterPage = lazy(
  () => import('../modules/payment/pages/PaymentCenterPage'),
);
const WalletPage = lazy(
  () => import('../modules/payment/pages/WalletPage'),
);
const EscrowManager = lazy(
  () => import('../modules/payment/components/EscrowManager'),
);

// Reviews
const WorkerReviewsPage = lazy(
  () => import('../modules/reviews/pages/WorkerReviewsPage'),
);

// Jobs
const SavedJobs = lazy(
  () => import('../modules/jobs/components/common/SavedJobs'),
);
const JobAlertsPage = lazy(
  () => import('../modules/jobs/pages/JobAlertsPage'),
);

// Role-based route protection wrapper
const RoleProtectedRoute = ({ children, allowedRoles }) => (
  <ProtectedRoute allowedRoles={allowedRoles}>
    {children}
  </ProtectedRoute>
);

const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      // Public routes
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'jobs',
        children: [
          { index: true, element: <JobsPage /> },
          { path: ':id', element: <JobDetailsPage /> },
        ],
      },
      {
        path: 'workers/:id',
        element: <WorkerProfilePage />,
      },
      {
        path: 'messages',
        element: (
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        ),
      },

      // ==========================================
      // HIRER ROUTES
      // ==========================================
      {
        path: 'hirer',
        children: [
          {
            path: 'dashboard',
            element: (
              <ProtectedRoute>
                <HirerDashboardPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'jobs',
            children: [
              {
                index: true,
                element: (
                  <ProtectedRoute>
                    <JobManagementPage />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'post',
                element: (
                  <ProtectedRoute>
                    <JobPostingPage />
                  </ProtectedRoute>
                ),
              },
            ],
          },
          {
            path: 'applications',
            element: (
              <ProtectedRoute>
                <ApplicationManagementPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'find-talent',
            element: (
              <ProtectedRoute>
                <WorkerSearchPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'tools',
            element: (
              <ProtectedRoute>
                <HirerToolsPage />
              </ProtectedRoute>
            ),
          },
        ],
      },

      // ==========================================
      // WORKER ROUTES
      // ==========================================
      {
        path: 'worker',
        children: [
          {
            path: 'dashboard',
            element: (
              <ProtectedRoute>
                <WorkerDashboardPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'find-work',
            element: (
              <ProtectedRoute>
                <JobSearchPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'applications',
            element: (
              <ProtectedRoute>
                <MyApplicationsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'profile',
            children: [
              {
                index: true,
                element: (
                  <ProtectedRoute>
                    <WorkerProfile />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'edit',
                element: (
                  <ProtectedRoute>
                    <WorkerProfileEditPage />
                  </ProtectedRoute>
                ),
              },
            ],
          },
          {
            path: 'portfolio',
            children: [
              {
                index: true,
                element: (
                  <ProtectedRoute>
                    <PortfolioPage />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'manage',
                element: (
                  <ProtectedRoute>
                    <PortfolioManager />
                  </ProtectedRoute>
                ),
              },
            ],
          },
          {
            path: 'skills',
            children: [
              {
                index: true,
                element: (
                  <ProtectedRoute>
                    <SkillsAssessmentPage />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'test/:testId',
                element: (
                  <ProtectedRoute>
                    <SkillsAssessmentPage />
                  </ProtectedRoute>
                ),
              },
            ],
          },
          {
            path: 'certificates',
            element: (
              <ProtectedRoute>
                <CertificateUploader />
              </ProtectedRoute>
            ),
          },
          {
            path: 'earnings',
            element: (
              <ProtectedRoute>
                <EarningsAnalytics />
              </ProtectedRoute>
            ),
          },
          {
            path: 'availability',
            element: (
              <ProtectedRoute>
                <AvailabilityCalendar />
              </ProtectedRoute>
            ),
          },
          {
            path: 'schedule',
            element: (
              <ProtectedRoute>
                <SchedulingPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'contracts',
            element: (
              <ProtectedRoute>
                <ContractManagementPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'payment',
            children: [
              {
                index: true,
                element: (
                  <ProtectedRoute>
                    <PaymentCenterPage />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'escrows',
                element: (
                  <ProtectedRoute>
                    <EscrowManager />
                  </ProtectedRoute>
                ),
              },
            ],
          },
          {
            path: 'wallet',
            element: (
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'reviews',
            element: (
              <ProtectedRoute>
                <WorkerReviewsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'saved-jobs',
            element: (
              <ProtectedRoute>
                <SavedJobs />
              </ProtectedRoute>
            ),
          },
          {
            path: 'job-alerts',
            element: (
              <ProtectedRoute>
                <JobAlertsPage />
              </ProtectedRoute>
            ),
          },
        ],
      },

      // Catch-all 404
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const AppRoutes = () => {
  const element = useRoutes(routes);
  return <Suspense fallback={<LoadingScreen />}>{element}</Suspense>;
};
