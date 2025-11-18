import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import RouteSkeleton from './RouteSkeleton';

const Home = lazy(() => import('../modules/home/pages/HomePage'));
const LoginPage = lazy(() => import('../modules/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('../modules/auth/pages/RegisterPage'));
const RoleSelectionPage = lazy(
  () => import('../modules/auth/pages/RoleSelectionPage'),
);
const JobsPage = lazy(() => import('../modules/jobs/pages/JobsPage'));
const JobDetailsPage = lazy(
  () => import('../modules/jobs/pages/JobDetailsPage'),
);
const JobApplicationForm = lazy(
  () => import('../modules/worker/components/JobApplicationForm'),
);
const ProfilePage = lazy(() => import('../modules/profile/pages/ProfilePage'));
const WorkerProfilePage = lazy(
  () => import('../modules/worker/pages/WorkerProfilePage'),
);
const PremiumPage = lazy(() => import('../modules/premium/pages/PremiumPage'));
const GeoLocationSearch = lazy(
  () => import('../modules/search/pages/GeoLocationSearch'),
);
const SearchPage = lazy(() => import('../modules/search/pages/SearchPage'));
const ProfessionalMapPage = lazy(
  () => import('../modules/map/pages/ProfessionalMapPage'),
);

const withSuspense = (Component) => (
  <Suspense fallback={<RouteSkeleton />}>
    <Component />
  </Suspense>
);

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
  <Route key="/jobs" path="/jobs" element={withSuspense(JobsPage)} />,
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
];

export default publicRoutes;
