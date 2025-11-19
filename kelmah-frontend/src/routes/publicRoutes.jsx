import { Suspense } from 'react';
import { Route } from 'react-router-dom';
import RouteSkeleton from './RouteSkeleton';
import ChunkErrorBoundary from './ChunkErrorBoundary';
import { lazyWithRetry } from '../utils/lazyWithRetry';

const Home = lazyWithRetry(() => import('../modules/home/pages/HomePage'), {
  retryKey: 'home-page',
});
const LoginPage = lazyWithRetry(
  () => import('../modules/auth/pages/LoginPage'),
  {
    retryKey: 'login-page',
  },
);
const RegisterPage = lazyWithRetry(
  () => import('../modules/auth/pages/RegisterPage'),
  {
    retryKey: 'register-page',
  },
);
const RoleSelectionPage = lazyWithRetry(
  () => import('../modules/auth/pages/RoleSelectionPage'),
  {
    retryKey: 'role-selection',
  },
);
const JobsPage = lazyWithRetry(() => import('../modules/jobs/pages/JobsPage'), {
  retryKey: 'jobs-page',
});
const JobDetailsPage = lazyWithRetry(
  () => import('../modules/jobs/pages/JobDetailsPage'),
  {
    retryKey: 'job-details-page',
  },
);
const JobApplicationForm = lazyWithRetry(
  () => import('../modules/worker/components/JobApplicationForm'),
  {
    retryKey: 'job-application-form',
  },
);
const ProfilePage = lazyWithRetry(
  () => import('../modules/profile/pages/ProfilePage'),
  {
    retryKey: 'public-profile-page',
  },
);
const WorkerProfilePage = lazyWithRetry(
  () => import('../modules/worker/pages/WorkerProfilePage'),
  {
    retryKey: 'worker-profile-page',
  },
);
const PremiumPage = lazyWithRetry(
  () => import('../modules/premium/pages/PremiumPage'),
  {
    retryKey: 'premium-page',
  },
);
const GeoLocationSearch = lazyWithRetry(
  () => import('../modules/search/pages/GeoLocationSearch'),
  {
    retryKey: 'geolocation-search',
  },
);
const SearchPage = lazyWithRetry(
  () => import('../modules/search/pages/SearchPage'),
  {
    retryKey: 'search-page',
  },
);
const ProfessionalMapPage = lazyWithRetry(
  () => import('../modules/map/pages/ProfessionalMapPage'),
  {
    retryKey: 'professional-map',
  },
);
const HelpCenterPage = lazyWithRetry(
  () => import('../modules/support/pages/HelpCenterPage'),
  {
    retryKey: 'help-center-page',
  },
);

const withSuspense = (Component, options = {}) => {
  const content = (
    <Suspense fallback={<RouteSkeleton />}>
      <Component />
    </Suspense>
  );

  if (options.enableChunkBoundary) {
    return (
      <ChunkErrorBoundary routeKey={options.retryKey}>
        {content}
      </ChunkErrorBoundary>
    );
  }

  return content;
};

const publicRoutes = [
  <Route key="/" path="/" element={withSuspense(Home)} />,
  <Route key="/login" path="/login" element={withSuspense(LoginPage)} />,
  <Route
    key="/register"
    path="/register"
    element={withSuspense(RegisterPage)}
  />,
  <Route
    key="/role-selection"
    path="/role-selection"
    element={withSuspense(RoleSelectionPage)}
  />,
  <Route
    key="/jobs"
    path="/jobs"
    element={withSuspense(JobsPage, {
      enableChunkBoundary: true,
      retryKey: 'jobs-page',
    })}
  />,
  <Route
    key="/jobs/:id/apply"
    path="/jobs/:id/apply"
    element={withSuspense(JobApplicationForm)}
  />,
  <Route
    key="/jobs/:id"
    path="/jobs/:id"
    element={withSuspense(JobDetailsPage)}
  />,
  <Route
    key="/profiles/user/:userId"
    path="/profiles/user/:userId"
    element={withSuspense(ProfilePage)}
  />,
  // ✅ ADDED: Public worker profile route for viewing worker details
  <Route
    key="/worker-profile/:workerId"
    path="/worker-profile/:workerId"
    element={withSuspense(WorkerProfilePage)}
  />,
  // ✅ ADDED: Public /find-talents route that shows workers
  <Route
    key="/find-talents"
    path="/find-talents"
    element={withSuspense(SearchPage)}
  />,
  <Route key="/premium" path="/premium" element={withSuspense(PremiumPage)} />,
  <Route
    key="/search/location"
    path="/search/location"
    element={withSuspense(GeoLocationSearch)}
  />,
  <Route key="/search" path="/search" element={withSuspense(SearchPage)} />,
  <Route key="/map" path="/map" element={withSuspense(ProfessionalMapPage)} />,
  <Route
    key="/support"
    path="/support"
    element={withSuspense(HelpCenterPage)}
  />,
  <Route
    key="/support/help-center"
    path="/support/help-center"
    element={withSuspense(HelpCenterPage)}
  />,
];

export default publicRoutes;
