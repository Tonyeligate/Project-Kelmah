import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/layout/Layout';
import theme from './theme';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import WorkerDashboardPage from './pages/worker/WorkerDashboardPage';
import HirerDashboardPage from './pages/hirer/HirerDashboardPage';
import SkillsAssessmentPage from './pages/worker/SkillsAssessmentPage';
import MyApplicationsPage from './pages/worker/MyApplicationsPage';
import SkillsAssessmentManagement from './pages/admin/SkillsAssessmentManagement';
import GeoLocationSearch from './pages/search/GeoLocationSearch';
import SearchPage from './pages/search/SearchPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import MessagingPage from './pages/messaging/MessagingPage';
import JobDetailsPage from './pages/jobs/JobDetailsPage';
import UserProfilePage from './pages/profiles/UserProfilePage';
import ApplicationManagementPage from './pages/hirer/ApplicationManagementPage';
import ContractManagementPage from './pages/contracts/ContractManagementPage';
import ContractDetailsPage from './pages/contracts/ContractDetailsPage';
import CreateContractPage from './pages/contracts/CreateContractPage';
import JobPostingPage from './pages/hirer/JobPostingPage';
import { verifyAuth } from './store/slices/authSlice';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Box, CircularProgress } from '@mui/material';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  
  useEffect(() => {
    // Check authentication status when the app loads
    dispatch(verifyAuth());
  }, [dispatch]);

  // Determine which dashboard to render based on user role
  const getDashboardRoute = () => {
    console.log('Dashboard route check - User:', user);
    console.log('Dashboard route check - Auth state:', isAuthenticated, loading);
    
    // Also check directly from localStorage for debugging
    const storedUserData = localStorage.getItem('user');
    if (storedUserData) {
      const storedUser = JSON.parse(storedUserData);
      console.log('User data from localStorage:', storedUser);
    }
    
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      return <Navigate to="/login" />;
    }
    
    // Enhanced role detection - try both common patterns
    const userRole = user?.role || user?.userType || user?.userRole;
    console.log('Detected user role:', userRole);
    
    if (userRole === 'worker') {
      console.log('Worker role detected, redirecting to worker dashboard');
      return <Navigate to="/worker/dashboard" />;
    } else if (userRole === 'hirer') {
      console.log('Hirer role detected, redirecting to hirer dashboard');
      return <Navigate to="/hirer/dashboard" />;
    } else if (userRole === 'admin') {
      console.log('Admin role detected, redirecting to admin dashboard');
      return <Navigate to="/admin/dashboard" />;
    } else {
      console.log('No specific role detected, showing generic dashboard. Role:', userRole);
      
      // Check if there are any role-related properties on the user object
      if (user) {
        console.log('Available user properties:', Object.keys(user));
      }
      
      return <Dashboard />;
    }
  };
  
  // First, create a helper function to check roles
  const hasRole = (user, role) => {
    return (user?.role === role || user?.userType === role || user?.userRole === role);
  };

    return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
          <Layout>
                <Routes>
              {/* Public routes */}
                    <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/jobs/:id" element={<JobDetailsPage />} />
              <Route path="/profiles/user/:userId" element={<UserProfilePage />} />
              
              {/* Dashboard routes */}
              <Route path="/dashboard" element={getDashboardRoute()} />
              
              {/* Worker routes */}
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
              
              {/* Hirer routes */}
              <Route 
                path="/hirer/dashboard" 
                element={
                  <ProtectedRoute 
                    isAllowed={isAuthenticated && hasRole(user, 'hirer')} 
                    redirectPath="/login" 
                    loading={loading}
                  >
                    <HirerDashboardPage />
                        </ProtectedRoute>
                } 
              />

              <Route 
                path="/hirer/applications" 
                element={
                  <ProtectedRoute 
                    isAllowed={isAuthenticated && hasRole(user, 'hirer')} 
                    redirectPath="/login" 
                    loading={loading}
                  >
                    <ApplicationManagementPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/jobs/post" 
                element={
                  <ProtectedRoute 
                    isAllowed={isAuthenticated && hasRole(user, 'hirer')} 
                    redirectPath="/login" 
                    loading={loading}
                  >
                    <JobPostingPage />
                        </ProtectedRoute>
                } 
              />
              
              {/* Admin routes */}
              <Route 
                path="/admin/skills" 
                element={
                  <ProtectedRoute 
                    isAllowed={isAuthenticated && hasRole(user, 'admin')} 
                    redirectPath="/login" 
                    loading={loading}
                  >
                    <SkillsAssessmentManagement />
                        </ProtectedRoute>
                } 
              />
          
          {/* Contract routes */}
          <Route 
            path="/contracts" 
            element={
              <ProtectedRoute 
                isAllowed={isAuthenticated} 
                redirectPath="/login" 
                loading={loading}
              >
                <ContractManagementPage />
                        </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/contracts/create" 
            element={
              <ProtectedRoute 
                isAllowed={isAuthenticated} 
                redirectPath="/login" 
                loading={loading}
              >
                <CreateContractPage />
                        </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/contracts/:contractId" 
            element={
              <ProtectedRoute 
                isAllowed={isAuthenticated} 
                redirectPath="/login" 
                loading={loading}
              >
                <ContractDetailsPage />
                        </ProtectedRoute>
            } 
          />
              
              {/* Common protected routes */}
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute 
                    isAllowed={isAuthenticated} 
                    redirectPath="/login" 
                    loading={loading}
                  >
                    <NotificationsPage />
                        </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/messages" 
                element={
                  <ProtectedRoute 
                    isAllowed={isAuthenticated} 
                    redirectPath="/login" 
                    loading={loading}
                  >
                            <MessagingPage />
                        </ProtectedRoute>
                } 
              />
              
              {/* Search routes */}
              <Route path="/search/location" element={<GeoLocationSearch />} />
              <Route path="/search" element={<SearchPage />} />
                    
                    {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
          </Layout>
                                </ThemeProvider>
    );
}

export default App;