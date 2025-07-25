import React from 'react';
import { Route } from 'react-router-dom';
import Home from '../modules/home/pages/HomePage';
import LoginPage from '../modules/auth/pages/LoginPage';
import RegisterPage from '../modules/auth/pages/RegisterPage';
import JobsPage from '../modules/jobs/pages/JobsPage';
import JobDetailsPage from '../modules/jobs/pages/JobDetailsPage';
import UserProfilePage from '../modules/profiles/pages/UserProfilePage';
import WorkerSearchPage from '../modules/hirer/pages/WorkerSearchPage';
import PremiumPage from '../pages/PremiumPage';
import GeoLocationSearch from '../modules/search/pages/GeoLocationSearch';
import SearchPage from '../modules/search/pages/SearchPage';

const publicRoutes = [
  <Route key="/" path="/" element={<Home />} />,
  <Route key="/login" path="/login" element={<LoginPage />} />,
  <Route key="/register" path="/register" element={<RegisterPage />} />,
  <Route key="/jobs" path="/jobs" element={<JobsPage />} />,
  <Route key="/jobs/:id" path="/jobs/:id" element={<JobDetailsPage />} />,
  <Route
    key="/profiles/user/:userId"
    path="/profiles/user/:userId"
    element={<UserProfilePage />}
  />,
  <Route
    key="/find-talents"
    path="/find-talents"
    element={<WorkerSearchPage />}
  />,
  <Route key="/premium" path="/premium" element={<PremiumPage />} />,
  <Route
    key="/search/location"
    path="/search/location"
    element={<GeoLocationSearch />}
  />,
  <Route key="/search" path="/search" element={<SearchPage />} />,
];

export default publicRoutes;
