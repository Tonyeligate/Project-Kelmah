import { lazyWithRetry } from '../utils/lazyWithRetry';

const WorkerDashboardPage = lazyWithRetry(
  () => import('../modules/worker/pages/WorkerDashboardPage'),
  { retryKey: 'worker-dashboard-page' },
);
const SkillsAssessmentPage = lazyWithRetry(
  () => import('../modules/worker/pages/SkillsAssessmentPage'),
  { retryKey: 'skills-assessment-page' },
);
const MyApplicationsPage = lazyWithRetry(
  () => import('../modules/worker/pages/MyApplicationsPage'),
  { retryKey: 'worker-applications-page' },
);
const SchedulingPage = lazyWithRetry(
  () => import('../modules/scheduling/pages/SchedulingPage'),
  { retryKey: 'worker-scheduling-page' },
);
const WorkerReviewsPage = lazyWithRetry(
  () => import('../modules/reviews/pages/WorkerReviewsPage'),
  { retryKey: 'worker-reviews-page' },
);
const WorkerProfileEditPage = lazyWithRetry(
  () => import('../modules/worker/pages/WorkerProfileEditPage'),
  { retryKey: 'worker-profile-edit-page' },
);
const WorkerProfile = lazyWithRetry(
  () => import('../modules/worker/components/WorkerProfile'),
  { retryKey: 'worker-profile' },
);
const PortfolioPage = lazyWithRetry(
  () => import('../modules/worker/pages/PortfolioPage'),
  { retryKey: 'worker-portfolio-page' },
);
const PortfolioManager = lazyWithRetry(
  () => import('../modules/worker/components/PortfolioManager'),
  { retryKey: 'portfolio-manager' },
);
const CertificateUploader = lazyWithRetry(
  () => import('../modules/worker/components/CertificateUploader'),
  { retryKey: 'certificate-uploader' },
);
const EarningsAnalytics = lazyWithRetry(
  () => import('../modules/worker/components/EarningsAnalytics'),
  { retryKey: 'earnings-analytics' },
);
const AvailabilityCalendar = lazyWithRetry(
  () => import('../modules/worker/components/AvailabilityCalendar'),
  { retryKey: 'availability-calendar' },
);
const JobSearchPage = lazyWithRetry(
  () => import('../modules/worker/pages/JobSearchPage'),
  { retryKey: 'worker-job-search-page' },
);
const ContractManagementPage = lazyWithRetry(
  () => import('../modules/contracts/pages/ContractManagementPage'),
  { retryKey: 'worker-contracts-page' },
);
const PaymentCenterPage = lazyWithRetry(
  () => import('../modules/payment/pages/PaymentCenterPage'),
  { retryKey: 'worker-payment-center' },
);
const EscrowManager = lazyWithRetry(
  () => import('../modules/payment/components/EscrowManager'),
  { retryKey: 'escrow-manager' },
);
const WalletPage = lazyWithRetry(
  () => import('../modules/payment/pages/WalletPage'),
  { retryKey: 'worker-wallet-page' },
);
const SavedJobs = lazyWithRetry(
  () => import('../modules/jobs/components/common/SavedJobs'),
  { retryKey: 'worker-saved-jobs' },
);
const JobAlertsPage = lazyWithRetry(
  () => import('../modules/jobs/pages/JobAlertsPage'),
  { retryKey: 'worker-job-alerts' },
);

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
