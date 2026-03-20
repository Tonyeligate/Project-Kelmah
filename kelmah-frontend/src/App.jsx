/**
 * Kelmah Frontend Application - v2.0.0
 * Unified theme system with consistent branding
 * Last updated: January 2025
 */
import { useEffect, Suspense, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, CircularProgress, Alert, Snackbar, LinearProgress, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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
import { BOTTOM_NAV_HEIGHT, Z_INDEX } from './constants/layout';

const PWA_BANNER_DISMISS_KEY = 'pwa_banner_dismissed';
const PWA_BANNER_DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const shouldShowInstallPrompt = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const dismissedAt = Number(window.localStorage.getItem(PWA_BANNER_DISMISS_KEY) || 0);
  if (!dismissedAt) {
    return true;
  }

  return Date.now() - dismissedAt > PWA_BANNER_DISMISS_TTL_MS;
};

// Main App Component
const App = () => {
  const dispatch = useDispatch();
  const { isHealthy } = useApiHealth();
  const location = useLocation();
  const initialized = useRef(false);
  const [servicesWakingUp, setServicesWakingUp] = useState(false);
  const [authBootstrapLoading, setAuthBootstrapLoading] = useState(true);
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);
  const [pwaInstallAvailable, setPwaInstallAvailable] = useState(false);

  // Auto-connect/disconnect the global websocket singleton based on auth state
  useWebSocketConnect();

  // Listen for service worker update events (dispatched from index.html)
  useEffect(() => {
    const handleSwUpdate = () => setSwUpdateAvailable(true);
    const handleInstallAvailable = () => {
      if (shouldShowInstallPrompt()) {
        setPwaInstallAvailable(true);
      }
    };
    const handleInstallComplete = () => setPwaInstallAvailable(false);

    window.addEventListener('sw:updateAvailable', handleSwUpdate);
    window.addEventListener('pwa:installAvailable', handleInstallAvailable);
    window.addEventListener('pwa:installComplete', handleInstallComplete);

    return () => {
      window.removeEventListener('sw:updateAvailable', handleSwUpdate);
      window.removeEventListener('pwa:installAvailable', handleInstallAvailable);
      window.removeEventListener('pwa:installComplete', handleInstallComplete);
    };
  }, []);

  const handleDismissInstallPrompt = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PWA_BANNER_DISMISS_KEY, String(Date.now()));
    }
    setPwaInstallAvailable(false);
  };

  const handleInstallPrompt = async () => {
    try {
      if (typeof window.installApp === 'function') {
        await window.installApp();
      }
    } finally {
      setPwaInstallAvailable(false);
    }
  };

  // Initialize PWA
  useEffect(() => {
    initializePWA();
  }, []);

  // Warm up backend services on app load (prevents Render free tier sleep)
  // Defer work until after first render/idle to avoid delaying first paint.
  useEffect(() => {
    let timerId;
    let idleId;

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
          timerId = window.setTimeout(() => setServicesWakingUp(false), 15000);
        } else {
          setServicesWakingUp(false);
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Service warm-up check failed:', e);
        setServicesWakingUp(false);
      }
    };

    const scheduleWakeUp = () => {
      if (typeof requestIdleCallback === 'function') {
        idleId = requestIdleCallback(wakeUpBackend, { timeout: 5000 });
      } else {
        timerId = window.setTimeout(wakeUpBackend, 2500);
      }
    };

    scheduleWakeUp();

    return () => {
      if (timerId) clearTimeout(timerId);
      if (typeof cancelIdleCallback === 'function' && idleId) {
        cancelIdleCallback(idleId);
      }
    };
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
        {/* Skip-to-content link for keyboard/screen reader users (WCAG 2.4.1) */}
        <Box
          component="a"
          href="#main-content"
          sx={{
            position: 'absolute',
            left: '-9999px',
            top: 'auto',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            zIndex: 9999,
            '&:focus': {
              position: 'fixed',
              top: 8,
              left: 8,
              width: 'auto',
              height: 'auto',
              overflow: 'visible',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              px: 2,
              py: 1,
              borderRadius: 1,
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
              boxShadow: 3,
            },
          }}
        >
          Skip to main content
        </Box>
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
              Waking up backend services... This may take up to 30 seconds on first load.
            </Alert>
          </Box>
        )}
        {!isHealthy && !servicesWakingUp && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Backend services are currently unreachable. Some features may be limited.
          </Alert>
        )}
        {servicesWakingUp && (
          <Box
            aria-hidden="true"
            sx={{
              height: {
                xs: 'calc(56px + env(safe-area-inset-top, 0px))',
                md: '56px',
              },
            }}
          />
        )}
        <Box component="main" id="main-content" tabIndex={-1} sx={{ outline: 'none' }}>
          <AppRoutes />
        </Box>
        <OfflineBanner />
        {/* SW update notification — replaces native confirm() dialog */}
        <Snackbar
          open={swUpdateAvailable}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{
            bottom: {
              xs: `calc(${BOTTOM_NAV_HEIGHT + 12}px + env(safe-area-inset-bottom, 0px)) !important`,
              md: '24px !important',
            },
            zIndex: Z_INDEX.snackbar,
          }}
          message="A new version of Kelmah is available"
          action={
            <>
              <Button
                color="primary"
                size="small"
                onClick={() => window.location.reload()}
              >
                Update Now
              </Button>
              <Button
                color="inherit"
                size="small"
                onClick={() => setSwUpdateAvailable(false)}
              >
                Later
              </Button>
            </>
          }
        />
        <Snackbar
          open={pwaInstallAvailable}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{
            bottom: {
              xs: `calc(${BOTTOM_NAV_HEIGHT + 12}px + env(safe-area-inset-bottom, 0px)) !important`,
              md: '24px !important',
            },
            zIndex: Z_INDEX.snackbar,
          }}
        >
          <Alert
            role="complementary"
            aria-label="Install app"
            severity="info"
            action={(
              <>
                <Button color="inherit" size="small" onClick={handleInstallPrompt}>
                  Install
                </Button>
                <IconButton
                  aria-label="Dismiss install banner"
                  color="inherit"
                  size="small"
                  onClick={handleDismissInstallPrompt}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </>
            )}
            sx={{ width: '100%' }}
          >
            Install Kelmah for faster access and better offline support.
          </Alert>
        </Snackbar>
      </GlobalErrorBoundary>
    </KelmahThemeProvider>
  );
};

export default App;
