import React from 'react';
import { Route } from 'react-router-dom';
import Home from '../modules/home/pages/HomePage';
import LoginPage from '../modules/auth/pages/LoginPage';
import RegisterPage from '../modules/auth/pages/RegisterPage';
import RoleSelectionPage from '../modules/auth/pages/RoleSelectionPage';
import JobsPage from '../modules/jobs/pages/JobsPage';
import JobDetailsPage from '../modules/jobs/pages/JobDetailsPage';
import JobApplicationForm from '../modules/worker/components/JobApplicationForm';
import UserProfilePage from '../modules/profiles/pages/UserProfilePage';
// import WorkerSearchPage from '../modules/hirer/pages/WorkerSearchPage'; // ✅ MOVED: Now only accessible via authenticated hirer routes
import PremiumPage from '../modules/premium/pages/PremiumPage';
import GeoLocationSearch from '../modules/search/pages/GeoLocationSearch';
import SearchPage from '../modules/search/pages/SearchPage';
import ProfessionalMapPage from '../modules/map/pages/ProfessionalMapPage';

const publicRoutes = [
  <Route key="/" path="/" element={<Home />} />,
  <Route key="/login" path="/login" element={<LoginPage />} />,
  <Route key="/register" path="/register" element={<RegisterPage />} />,
  <Route key="/role-selection" path="/role-selection" element={<RoleSelectionPage />} />,
  <Route key="/jobs" path="/jobs" element={<JobsPage />} />,
  <Route key="/jobs/:id/apply" path="/jobs/:id/apply" element={<JobApplicationForm />} />,
  <Route key="/jobs/:id" path="/jobs/:id" element={<JobDetailsPage />} />,
  <Route
    key="/profiles/user/:userId"
    path="/profiles/user/:userId"
    element={<UserProfilePage />}
  />,
  // ✅ REMOVED: /find-talents route - now only accessible via authenticated hirer routes
  // <Route
  //   key="/find-talents"
  //   path="/find-talents"
  //   element={<WorkerSearchPage />}
  // />,
  <Route key="/premium" path="/premium" element={<PremiumPage />} />,
  <Route
    key="/search/location"
    path="/search/location"
    element={<GeoLocationSearch />}
  />,
  <Route key="/search" path="/search" element={<SearchPage />} />,
  <Route key="/map" path="/map" element={<ProfessionalMapPage />} />,
];

export default publicRoutes;
