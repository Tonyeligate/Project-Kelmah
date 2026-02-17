/**
 * Kelmah Frontend Application - v2.0.0
 * Unified theme system with consistent branding
 * Last updated: January 2025
 */
import { useEffect, Suspense, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress, Alert, Snackbar, LinearProgress } from '@mui/material';
import { KelmahThemeProvider, useThemeMode } from './theme/ThemeProvider';
import { AppRoutes } from './routes/config';
import { verifyAuth } from './modules/auth/services/authSlice';
import { secureStorage } from './utils/secureStorage';
import { initializePWA } from './utils/pwaHelpers';
import GlobalErrorBoundary from './modules/common/components/GlobalErrorBoundary';
import { useApiHealth } from './hooks/useApiHealth';
import { warmUpServices } from './utils/serviceWarmUp';
import useWebSocketConnect from './hooks/useWebSocketConnect';
import OfflineBanner from './components/common/OfflineBanner';

// Main App Component
const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(
    (state) => state.auth,
  );
  const { isHealthy } = useApiHealth();
  const location = useLocation();
  const initialized = useRef(false);
  const [servicesWakingUp, setServicesWakingUp] = useState(false);
  const [authBootstrapLoading, setAuthBootstrapLoading] = useState(true);

  // Auto-connect/disconnect the global websocket singleton based on auth state
  useWebSocketConnect();

  // Initialize PWA
  useEffect(() => {
    initializePWA();
  }, []);

  // Warm up backend services on app load (prevents Render free tier sleep)
  useEffect(() => {
    const wakeUpBackend = async () => {
      setServicesWakingUp(true);
      try {
        const result = await warmUpServices();
        if (result.wakingUp > 0) {
          // Services are waking up, keep indicator for a bit
          setTimeout(() => setServicesWakingUp(false), 15000);
        } else {
          setServicesWakingUp(false);
        }
      } catch (e) {
        console.warn('Service warm-up check failed:', e);
        setServicesWakingUp(false);
      }
    };
    wakeUpBackend();
  }, []);

  // Verify authentication on mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const token = secureStorage.getAuthToken();
      if (!token) {
        setAuthBootstrapLoading(false);
        return;
      }

      Promise.resolve(dispatch(verifyAuth()))
        .catch(() => {
          // verifyAuth thunk already handles cleanup/state updates
        })
        .finally(() => {
          setAuthBootstrapLoading(false);
        });
    }
  }, [dispatch]);

  if (authBootstrapLoading) {
    return (
      <KelmahThemeProvider>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            bgcolor: 'background.default',
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      </KelmahThemeProvider>
    );
  }

  return (
    <KelmahThemeProvider>
      <GlobalErrorBoundary>
        {/* Service wake-up indicator */}
        {servicesWakingUp && (
          <Box sx={{ width: '100%', position: 'fixed', top: 0, left: 0, zIndex: 1300 }}>
            <LinearProgress color="warning" />
            <Alert severity="info" sx={{ borderRadius: 0 }}>
              ⏳ Waking up backend services... This may take up to 30 seconds on first load.
            </Alert>
          </Box>
        )}
        {!isHealthy && !servicesWakingUp && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Backend services are currently unreachable. Some features may be limited.
          </Alert>
        )}
        <AppRoutes />
        <OfflineBanner />
      </GlobalErrorBoundary>
    </KelmahThemeProvider>
  );
};

export default App;
