/**
 * Kelmah Frontend Application - v2.0.0
 * Unified theme system with consistent branding
 * Last updated: January 2025
 */
import { useEffect, Suspense, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
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
import ScrollToTop from './components/common/ScrollToTop';
import { Z_INDEX } from './constants/layout';

// Main App Component
const App = () => {
  const dispatch = useDispatch();
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
    let timerId;
    const wakeUpBackend = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }

      setServicesWakingUp(true);
      try {
        const result = await warmUpServices({ maxRetries: 1 });
        if (result?.skipped) {
          setServicesWakingUp(false);
          return;
        }

        if (result?.wakingUp > 0) {
          // Services are waking up, keep indicator for a bit
          timerId = setTimeout(() => setServicesWakingUp(false), 15000);
        } else {
          setServicesWakingUp(false);
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Service warm-up check failed:', e);
        setServicesWakingUp(false);
      }
    };
    wakeUpBackend();
    return () => { if (timerId) clearTimeout(timerId); };
  }, []);

  // Verify authentication on mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;

      const hasSessionHints = Boolean(
        secureStorage.getAuthToken() ||
        secureStorage.getRefreshToken() ||
        secureStorage.getUserData(),
      );

      if (!hasSessionHints) {
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
        <ScrollToTop />
        {/* Service wake-up indicator */}
        {servicesWakingUp && (
              <Box
                sx={{
                  width: '100%',
                  position: 'fixed',
                  top: 'env(safe-area-inset-top, 0px)',
                  left: 0,
                  zIndex: Z_INDEX.backdrop,
                }}
              >
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
