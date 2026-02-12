import { useRoutes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from '../modules/layout/components/Layout';
import ProtectedRoute from '../modules/auth/components/common/ProtectedRoute';
import LoadingScreen from '../modules/common/components/loading/LoadingScreen';
import { PaymentProvider } from '../modules/payment/contexts/PaymentContext';
import { ContractProvider } from '../modules/contracts/contexts/ContractContext';
import RouteErrorBoundary from '../modules/common/components/RouteErrorBoundary';

// Public Pages
const LandingPage = lazy(() => import('../pages/HomeLanding'));
const LoginPage = lazy(() => import('../modules/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('../modules/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(
  () => import('../modules/auth/pages/ForgotPasswordPage'),
);
// NOTE: Use non-module page to avoid importing broken legacy module ResetPasswordPage
const ResetPasswordPage = lazy(() => import('../pages/ResetPassword'));
const VerifyEmailPage = lazy(
  () => import('../modules/auth/pages/VerifyEmailPage'),
);
const RoleSelectionPage = lazy(
  () => import('../modules/auth/pages/RoleSelectionPage'),
);
const MfaSetupPage = lazy(() => import('../modules/auth/pages/MfaSetupPage'));
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
// Find Workers / Find Talents page (public worker search)
const FindWorkersPage = lazy(
  () => import('../modules/search/pages/SearchPage'),
);

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
const PaymentsPage = lazy(() => import('../modules/payment/pages/PaymentsPage'));
const BillPage = lazy(() => import('../modules/payment/pages/BillPage'));
const WalletPage = lazy(
  () => import('../modules/payment/pages/WalletPage'),
);
const PaymentMethodsPage = lazy(
  () => import('../modules/payment/pages/PaymentMethodsPage'),
);
const EscrowManager = lazy(
  () => import('../modules/payment/components/EscrowManager'),
);

// Reviews
const WorkerReviewsPage = lazy(
  () => import('../modules/reviews/pages/WorkerReviewsPage'),
);

// Notifications
const NotificationsPage = lazy(
  () => import('../modules/notifications/pages/NotificationsPage'),
);
const NotificationSettingsPage = lazy(
  () => import('../modules/notifications/pages/NotificationSettingsPage'),
);

// Settings
const SettingsPage = lazy(
  () => import('../modules/settings/pages/SettingsPage'),
);

// Profile
const ProfilePage = lazy(
  () => import('../modules/profile/pages/ProfilePage'),
);

// Support
const HelpCenterPage = lazy(
  () => import('../modules/support/pages/HelpCenterPage'),
);

// Jobs
const SavedJobs = lazy(
  () => import('../modules/jobs/components/common/SavedJobs'),
);
const JobAlertsPage = lazy(
  () => import('../modules/jobs/pages/JobAlertsPage'),
);

// Quick Jobs (Protected Quick-Hire System)
const QuickJobRequestPage = lazy(
  () => import('../modules/quickjobs/pages/QuickJobRequestPage'),
);
const NearbyJobsPage = lazy(
  () => import('../modules/quickjobs/pages/NearbyJobsPage'),
);
const QuickJobTrackingPage = lazy(
  () => import('../modules/quickjobs/pages/QuickJobTrackingPage'),
);

// Contract Pages (full CRUD)
const ContractsPage = lazy(
  () => import('../modules/contracts/pages/ContractsPage'),
);
const ContractDetailsPage = lazy(
  () => import('../modules/contracts/pages/ContractDetailsPage'),
);
const CreateContractPage = lazy(
  () => import('../modules/contracts/pages/CreateContractPage'),
);
const EditContractPage = lazy(
  () => import('../modules/contracts/pages/EditContractPage'),
);

// Map (Professional Uber/Bolt-style)
const ProfessionalMapPage = lazy(
  () => import('../modules/map/pages/ProfessionalMapPage'),
);

// Premium
const PremiumPage = lazy(
  () => import('../modules/premium/pages/PremiumPage'),
);

// Reviews (Enhanced)
const ReviewsPage = lazy(
  () => import('../modules/reviews/pages/ReviewsPage'),
);

// Payment extra pages
const PaymentSettingsPage = lazy(
  () => import('../modules/payment/pages/PaymentSettingsPage'),
);
const EscrowDetailsPage = lazy(
  () => import('../modules/payment/pages/EscrowDetailsPage'),
);

// Scheduling
const TempSchedulingPage = lazy(
  () => import('../modules/scheduling/pages/TempSchedulingPage'),
);

// Admin Pages
const SkillsAssessmentManagement = lazy(
  () => import('../modules/admin/pages/SkillsAssessmentManagement'),
);
const PayoutQueuePage = lazy(
  () => import('../modules/admin/pages/PayoutQueuePage'),
);

// Role-based route protection wrapper
const RoleProtectedRoute = ({ children, allowedRoles }) => (
  <ProtectedRoute roles={allowedRoles}>
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
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      // Support /reset-password/:token and /reset-password?token=...
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'reset-password/:token', element: <ResetPasswordPage /> },
      { path: 'verify-email/:token', element: <VerifyEmailPage /> },
      { path: 'role-selection', element: <RoleSelectionPage /> },
      {
        path: 'mfa/setup',
        element: (
          <ProtectedRoute>
            <MfaSetupPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary label="Dashboard">
              <DashboardPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },
      {
        path: 'jobs',
        children: [
          { index: true, element: <JobsPage /> },
          {
            path: ':id',
            element: (
              <ProtectedRoute>
                <JobDetailsPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: 'workers/:workerId',
        element: <WorkerProfilePage />,
      },
      // Alternative worker profile route (used by worker cards)
      {
        path: 'worker-profile/:workerId',
        element: <WorkerProfilePage />,
      },
      // Public Find Workers / Find Talents route
      {
        path: 'find-talents',
        element: <FindWorkersPage />,
      },
      // Alias: /search → same SearchPage (HomeLanding CTAs navigate here)
      {
        path: 'search',
        element: <FindWorkersPage />,
      },
      // Professional Map – Uber/Bolt-style live map for jobs & workers
      {
        path: 'map',
        element: <ProfessionalMapPage />,
      },
      {
        path: 'messages',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary label="Messages">
              <MessagesPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },

      // Payments (shared)
      {
        path: 'payments',
        element: (
          <ProtectedRoute roles={['worker', 'hirer', 'admin']}>
            <RouteErrorBoundary label="Payments">
              <PaymentProvider>
                <PaymentsPage />
              </PaymentProvider>
            </RouteErrorBoundary>
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
              <ProtectedRoute roles={['hirer', 'admin']}>
                <RouteErrorBoundary label="Hirer Dashboard">
                  <HirerDashboardPage />
                </RouteErrorBoundary>
              </ProtectedRoute>
            ),
          },
          {
            path: 'jobs',
            children: [
              {
                index: true,
                element: (
                  <ProtectedRoute roles={['hirer', 'admin']}>
                    <JobManagementPage />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'post',
                element: (
                  <ProtectedRoute roles={['hirer', 'admin']}>
                    <JobPostingPage />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'edit/:jobId',
                element: (
                  <ProtectedRoute roles={['hirer', 'admin']}>
                    <JobPostingPage />
                  </ProtectedRoute>
                ),
              },
            ],
          },
          {
            path: 'applications',
            element: (
              <ProtectedRoute roles={['hirer', 'admin']}>
                <ApplicationManagementPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'find-talent',
            element: (
              <ProtectedRoute roles={['hirer', 'admin']}>
                <WorkerSearchPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'tools',
            element: (
              <ProtectedRoute roles={['hirer', 'admin']}>
                <HirerToolsPage />
              </ProtectedRoute>
            ),
          },

          // Payments (linked from Hirer dashboard)
          {
            path: 'payments',
            element: (
              <ProtectedRoute roles={['hirer', 'admin']}>
                <RouteErrorBoundary label="Hirer Payments">
                  <PaymentProvider>
                    <PaymentsPage />
                  </PaymentProvider>
                </RouteErrorBoundary>
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
              <ProtectedRoute roles={['worker', 'admin']}>
                <RouteErrorBoundary label="Worker Dashboard">
                  <WorkerDashboardPage />
                </RouteErrorBoundary>
              </ProtectedRoute>
            ),
          },
          {
            path: 'find-work',
            element: (
              <ProtectedRoute roles={['worker', 'admin']}>
                <JobSearchPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'applications',
            element: (
              <ProtectedRoute roles={['worker', 'admin']}>
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
                  <ProtectedRoute roles={['worker', 'admin']}>
                    <WorkerProfile />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'edit',
                element: (
                  <ProtectedRoute roles={['worker', 'admin']}>
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
                  <ProtectedRoute roles={['worker', 'admin']}>
                    <PortfolioPage />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'manage',
                element: (
                  <ProtectedRoute roles={['worker', 'admin']}>
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
                  <ProtectedRoute roles={['worker', 'admin']}>
                    <SkillsAssessmentPage />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'test/:testId',
                element: (
                  <ProtectedRoute roles={['worker', 'admin']}>
                    <SkillsAssessmentPage />
                  </ProtectedRoute>
                ),
              },
            ],
          },
          {
            path: 'certificates',
            element: (
              <ProtectedRoute roles={['worker', 'admin']}>
                <CertificateUploader />
              </ProtectedRoute>
            ),
          },
          {
            path: 'earnings',
            element: (
              <ProtectedRoute roles={['worker', 'admin']}>
                <RouteErrorBoundary label="Earnings">
                  <EarningsAnalytics />
                </RouteErrorBoundary>
              </ProtectedRoute>
            ),
          },
          {
            path: 'availability',
            element: (
              <ProtectedRoute roles={['worker', 'admin']}>
                <AvailabilityCalendar />
              </ProtectedRoute>
            ),
          },
          {
            path: 'schedule',
            element: (
              <ProtectedRoute roles={['worker', 'admin']}>
                <SchedulingPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'contracts',
            element: (
              <ProtectedRoute roles={['worker', 'admin']}>
                <RouteErrorBoundary label="Contracts">
                  <ContractProvider>
                    <ContractManagementPage />
                  </ContractProvider>
                </RouteErrorBoundary>
              </ProtectedRoute>
            ),
          },
          {
            path: 'payment',
            children: [
              {
                index: true,
                element: (
                  <ProtectedRoute roles={['worker', 'admin']}>
                    <PaymentProvider>
                      <PaymentCenterPage />
                    </PaymentProvider>
                  </ProtectedRoute>
                ),
              },
              {
                path: 'escrows',
                element: (
                  <ProtectedRoute roles={['worker', 'admin']}>
                    <PaymentProvider>
                      <EscrowManager />
                    </PaymentProvider>
                  </ProtectedRoute>
                ),
              },
            ],
          },
          {
            path: 'wallet',
            element: (
              <ProtectedRoute roles={['worker', 'admin']}>
                <RouteErrorBoundary label="Wallet">
                  <PaymentProvider>
                    <WalletPage />
                  </PaymentProvider>
                </RouteErrorBoundary>
              </ProtectedRoute>
            ),
          },
          {
            path: 'reviews',
            element: (
              <ProtectedRoute roles={['worker', 'admin']}>
                <WorkerReviewsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'saved-jobs',
            element: (
              <ProtectedRoute roles={['worker', 'admin']}>
                <SavedJobs />
              </ProtectedRoute>
            ),
          },
          {
            path: 'job-alerts',
            element: (
              <ProtectedRoute roles={['worker', 'admin']}>
                <JobAlertsPage />
              </ProtectedRoute>
            ),
          },
        ],
      },

      // ==========================================
      // QUICK JOBS ROUTES (Protected Quick-Hire)
      // ==========================================
      {
        path: 'quick-hire',
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute roles={['worker', 'admin']}>
                <QuickJobRequestPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'request',
            element: (
              <ProtectedRoute roles={['worker', 'admin']}>
                <QuickJobRequestPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'request/:category',
            element: (
              <ProtectedRoute roles={['worker', 'admin']}>
                <QuickJobRequestPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'nearby',
            element: (
              <ProtectedRoute roles={['worker', 'admin']}>
                <NearbyJobsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'track/:jobId',
            element: (
              <ProtectedRoute roles={['worker', 'admin']}>
                <QuickJobTrackingPage />
              </ProtectedRoute>
            ),
          },
          {
            // Payment callback route for Paystack redirects
            path: 'payment/:jobId',
            element: (
              <ProtectedRoute roles={['worker', 'admin']}>
                <QuickJobTrackingPage />
              </ProtectedRoute>
            ),
          },
        ],
      },

      // Compatibility aliases for existing QuickJobs module navigation
      // (module currently navigates to /quick-job/:jobId and /worker/quick-jobs)
      {
        path: 'quick-job/:jobId',
        element: (
          <ProtectedRoute roles={['worker', 'admin']}>
            <QuickJobTrackingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'worker/quick-jobs',
        element: (
          <ProtectedRoute roles={['worker', 'admin']}>
            <NearbyJobsPage />
          </ProtectedRoute>
        ),
      },

      // ==========================================
      // SHARED ROUTES (ALL AUTHENTICATED USERS)
      // ==========================================
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications/settings',
        element: (
          <ProtectedRoute>
            <NotificationSettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'support',
        element: <HelpCenterPage />,
      },
      {
        path: 'support/help-center',
        element: <HelpCenterPage />,
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'wallet',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary label="Wallet">
              <PaymentProvider>
                <WalletPage />
              </PaymentProvider>
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },

      // Payment methods (linked from PaymentCenter)
      {
        path: 'payment/methods',
        element: (
          <ProtectedRoute roles={['worker', 'admin']}>
            <RouteErrorBoundary label="Payment Methods">
              <PaymentProvider>
                <PaymentMethodsPage />
              </PaymentProvider>
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },

      // Bills (linked from PaymentsPage menu)
      {
        path: 'payment/bill',
        element: (
          <ProtectedRoute roles={['worker', 'hirer', 'admin']}>
            <RouteErrorBoundary label="Bills">
              <PaymentProvider>
                <BillPage />
              </PaymentProvider>
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },

      // Payment settings (admin/worker)
      {
        path: 'payment/settings',
        element: (
          <ProtectedRoute roles={['admin']}>
            <RouteErrorBoundary label="Payment Settings">
              <PaymentProvider>
                <PaymentSettingsPage />
              </PaymentProvider>
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },

      // Escrow details (linked from PaymentCenter escrow items)
      {
        path: 'payment/escrow/:escrowId',
        element: (
          <ProtectedRoute roles={['worker', 'hirer', 'admin']}>
            <RouteErrorBoundary label="Escrow Details">
              <PaymentProvider>
                <EscrowDetailsPage />
              </PaymentProvider>
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },

      // ==========================================
      // CONTRACTS – TOP-LEVEL ALIASES
      // (ContractManagementPage, PaymentCenter, etc. link here)
      // ==========================================
      {
        path: 'contracts',
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute roles={['worker', 'hirer', 'admin']}>
                <RouteErrorBoundary label="Contracts">
                  <ContractProvider>
                    <ContractsPage />
                  </ContractProvider>
                </RouteErrorBoundary>
              </ProtectedRoute>
            ),
          },
          {
            path: 'create',
            element: (
              <ProtectedRoute roles={['hirer', 'admin']}>
                <RouteErrorBoundary label="Create Contract">
                  <ContractProvider>
                    <CreateContractPage />
                  </ContractProvider>
                </RouteErrorBoundary>
              </ProtectedRoute>
            ),
          },
          {
            path: ':id',
            element: (
              <ProtectedRoute roles={['worker', 'hirer', 'admin']}>
                <RouteErrorBoundary label="Contract Details">
                  <ContractProvider>
                    <ContractDetailsPage />
                  </ContractProvider>
                </RouteErrorBoundary>
              </ProtectedRoute>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <ProtectedRoute roles={['hirer', 'admin']}>
                <RouteErrorBoundary label="Edit Contract">
                  <ContractProvider>
                    <EditContractPage />
                  </ContractProvider>
                </RouteErrorBoundary>
              </ProtectedRoute>
            ),
          },
        ],
      },

      // ==========================================
      // REVIEWS – TOP-LEVEL
      // ==========================================
      {
        path: 'reviews',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary label="Reviews">
              <ReviewsPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },

      // ==========================================
      // PREMIUM
      // ==========================================
      {
        path: 'premium',
        element: (
          <ProtectedRoute>
            <RouteErrorBoundary label="Premium">
              <PremiumPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        ),
      },

      // ==========================================
      // PROFILE ALIASES
      // ==========================================
      // /profile/upload-cv → redirect to worker profile edit (JobsPage CTA)
      {
        path: 'profile/upload-cv',
        element: (
          <ProtectedRoute roles={['worker', 'admin']}>
            <WorkerProfileEditPage />
          </ProtectedRoute>
        ),
      },

      // ==========================================
      // SUPPORT ALIASES (docs / community)
      // ==========================================
      {
        path: 'docs',
        element: <HelpCenterPage />,
      },
      {
        path: 'community',
        element: <HelpCenterPage />,
      },

      // ==========================================
      // SCHEDULING ALIASES
      // ==========================================
      {
        path: 'schedule',
        element: (
          <ProtectedRoute>
            <SchedulingPage />
          </ProtectedRoute>
        ),
      },

      // ==========================================
      // ADMIN ROUTES
      // ==========================================
      {
        path: 'admin',
        children: [
          {
            path: 'skills-management',
            element: (
              <ProtectedRoute roles={['admin']}>
                <RouteErrorBoundary label="Skills Management">
                  <SkillsAssessmentManagement />
                </RouteErrorBoundary>
              </ProtectedRoute>
            ),
          },
          {
            path: 'payouts',
            element: (
              <ProtectedRoute roles={['admin']}>
                <RouteErrorBoundary label="Payout Queue">
                  <PayoutQueuePage />
                </RouteErrorBoundary>
              </ProtectedRoute>
            ),
          },
        ],
      },

      // Auth aliases (some external links use /auth/login)
      {
        path: 'auth/login',
        element: <LoginPage />,
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
