import { Navigate, Outlet, Route, Routes, BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Alert, Box, CircularProgress } from '@mui/material';
import { AdminAuthProvider, useAdminAuth } from '@/context/AdminAuthContext';
import AdminShell from '@/components/AdminShell';
import LoginPage from '@/pages/LoginPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import SkillsAssessmentManagementPage from '@/pages/SkillsAssessmentManagementPage';
import PayoutQueuePage from '@/pages/PayoutQueuePage';

const RequireAdmin = ({ children }) => {
  const { loading, isAuthenticated, isAdmin } = useAdminAuth();

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">This account does not have admin access.</Alert>
      </Box>
    );
  }

  return children;
};

const LoginRoute = () => {
  const { isAuthenticated, isAdmin } = useAdminAuth();

  if (isAuthenticated && isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginRoute />} />

    <Route
      path="/"
      element={
        <RequireAdmin>
          <AdminShell />
        </RequireAdmin>
      }
    >
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<AdminDashboardPage />} />
      <Route path="skills-management" element={<SkillsAssessmentManagementPage />} />
      <Route path="payouts" element={<PayoutQueuePage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <HelmetProvider>
    <AdminAuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AdminAuthProvider>
  </HelmetProvider>
);

export default App;
