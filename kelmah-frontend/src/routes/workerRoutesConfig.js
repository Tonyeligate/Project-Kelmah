import { lazy } from 'react';

const WorkerDashboardPage = lazy(
  () => import('../modules/worker/pages/WorkerDashboardPage'),
);
const SkillsAssessmentPage = lazy(
  () => import('../modules/worker/pages/SkillsAssessmentPage'),
);
const MyApplicationsPage = lazy(
  () => import('../modules/worker/pages/MyApplicationsPage'),
);
const SchedulingPage = lazy(
  () => import('../modules/scheduling/pages/SchedulingPage'),
);
const WorkerReviewsPage = lazy(
  () => import('../modules/reviews/pages/WorkerReviewsPage'),
);
const WorkerProfileEditPage = lazy(
  () => import('../modules/worker/pages/WorkerProfileEditPage'),
);
const WorkerProfile = lazy(
  () => import('../modules/worker/components/WorkerProfile'),
);
const PortfolioPage = lazy(
  () => import('../modules/worker/pages/PortfolioPage'),
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
const JobSearchPage = lazy(
  () => import('../modules/worker/pages/JobSearchPage'),
);
const ContractManagementPage = lazy(
  () => import('../modules/contracts/pages/ContractManagementPage'),
);
const PaymentCenterPage = lazy(
  () => import('../modules/payment/pages/PaymentCenterPage'),
);
const EscrowManager = lazy(
  () => import('../modules/payment/components/EscrowManager'),
);
const WalletPage = lazy(() => import('../modules/payment/pages/WalletPage'));
const SavedJobs = lazy(
  () => import('../modules/jobs/components/common/SavedJobs'),
);
const JobAlertsPage = lazy(() => import('../modules/jobs/pages/JobAlertsPage'));

export const workerRoutesConfig = [
  {
    path: '/worker/dashboard',
    component: WorkerDashboardPage,
    requiresAuth: true,
    withBoundary: true,
  },
  {
    path: '/worker/skills',
    component: SkillsAssessmentPage,
    requiresAuth: true,
    withBoundary: true,
  },
  {
    path: '/worker/skills/test/:testId',
    component: SkillsAssessmentPage,
    requiresAuth: true,
    withBoundary: true,
  },
  {
    path: '/worker/applications',
    component: MyApplicationsPage,
    requiresAuth: true,
  },
  {
    path: '/worker/schedule',
    component: SchedulingPage,
    requiresAuth: true,
  },
  {
    path: '/worker/reviews',
    component: WorkerReviewsPage,
    requiresAuth: true,
  },
  {
    path: '/worker/profile/edit',
    component: WorkerProfileEditPage,
    requiresAuth: true,
  },
  {
    path: '/worker/profile',
    component: WorkerProfile,
    requiresAuth: true,
  },
  {
    path: '/worker/portfolio',
    component: PortfolioPage,
    requiresAuth: true,
  },
  {
    path: '/worker/portfolio/manage',
    component: PortfolioManager,
    requiresAuth: true,
  },
  {
    path: '/worker/certificates',
    component: CertificateUploader,
    requiresAuth: true,
  },
  {
    path: '/worker/earnings',
    component: EarningsAnalytics,
    requiresAuth: true,
  },
  {
    path: '/worker/availability',
    component: AvailabilityCalendar,
    requiresAuth: true,
  },
  {
    path: '/worker/find-work',
    component: JobSearchPage,
    requiresAuth: true,
  },
  {
    path: '/worker/contracts',
    component: ContractManagementPage,
    requiresAuth: true,
  },
  {
    path: '/worker/payment',
    component: PaymentCenterPage,
    requiresAuth: true,
  },
  {
    path: '/worker/payment/escrows',
    component: EscrowManager,
    requiresAuth: true,
  },
  {
    path: '/worker/wallet',
    component: WalletPage,
    requiresAuth: true,
  },
  {
    path: '/worker/saved-jobs',
    component: SavedJobs,
    requiresAuth: true,
  },
  {
    path: '/worker/job-alerts',
    component: JobAlertsPage,
    requiresAuth: true,
  },
];

export default workerRoutesConfig;
