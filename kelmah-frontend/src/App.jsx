/**
 * Kelmah Frontend Application - v2.0.0
 * Unified theme system with consistent branding
 * Last updated: January 2025
 */
import { useEffect, Suspense, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, Alert, Snackbar, LinearProgress, Button, IconButton, Skeleton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { KelmahThemeProvider, useThemeMode } from './theme/ThemeProvider';
import { AppRoutes } from './routes/config';
import { verifyAuth } from './modules/auth/services/authSlice';
import { secureStorage } from './utils/secureStorage';
import { initializePWA, applyPwaUpdate } from './utils/pwaHelpers';
import GlobalErrorBoundary from './modules/common/components/GlobalErrorBoundary';
import { useApiHealth } from './hooks/useApiHealth';
import { warmUpServices } from './utils/serviceWarmUp';
import useWebSocketConnect from './hooks/useWebSocketConnect';
import OfflineBanner from './components/common/OfflineBanner';
import ScrollToTop from './components/common/ScrollToTop';
import { BOTTOM_NAV_HEIGHT, Z_INDEX } from './constants/layout';
import { telemetryEvents } from './services/errorTelemetry';
import { devWarn } from './modules/common/utils/devLogger';

const PWA_BANNER_DISMISS_KEY = 'pwa_banner_dismissed';
const PWA_BANNER_DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
let noticeSequence = 0;

const createNoticeId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  noticeSequence += 1;
  return `notice-${Date.now()}-${noticeSequence}`;
};

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

const formatRetryDelay = (retryAfterMs) => {
  if (!Number.isFinite(retryAfterMs) || retryAfterMs <= 0) {
    return null;
  }

  const seconds = Math.max(1, Math.round(retryAfterMs / 1000));
  return `Try again in about ${seconds}s.`;
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
  const [apiRecoveryNotice, setApiRecoveryNotice] = useState(null);

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

  const handleApplySwUpdate = async () => {
    setSwUpdateAvailable(false);
    await applyPwaUpdate();
  };

  const handleRecoverableNoticeRetry = async () => {
    setApiRecoveryNotice(null);

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }

    setServicesWakingUp(true);
    try {
      await warmUpServices({ force: true, maxRetries: 1 });
    } catch (error) {
      devWarn('Recoverable API retry warm-up failed:', error);
    } finally {
      setServicesWakingUp(false);
    }
  };

  useEffect(() => {
    const handleRecoverableApiError = (event) => {
      const detail = event?.detail || {};
      if (detail.suppressUi) {
        return;
      }

      setApiRecoveryNotice({
        id: createNoticeId(),
        message:
          detail.userMessage ||
          'We had trouble completing that request. You can try again.',
        retryable: Boolean(detail.retryable),
        isTimeout: Boolean(detail.isTimeout),
        retryAfterMs: Number.isFinite(detail.retryAfterMs) ? detail.retryAfterMs : null,
        retryHint: detail.retryHint || null,
      });
    };

    const handleContractMismatch = (event) => {
      const detail = event?.detail || {};
      setApiRecoveryNotice({
        id: createNoticeId(),
        message:
          detail.userMessage ||
          'A temporary service mismatch was detected. Please retry in a moment.',
        retryable: true,
        isTimeout: false,
        retryAfterMs: Number.isFinite(detail.retryAfterMs) ? detail.retryAfterMs : 3000,
        retryHint: detail.retryHint || null,
      });
    };

    window.addEventListener(
      telemetryEvents.RECOVERABLE_EVENT_NAME,
      handleRecoverableApiError,
    );
    window.addEventListener(
      telemetryEvents.CONTRACT_EVENT_NAME,
      handleContractMismatch,
    );

    return () => {
      window.removeEventListener(
        telemetryEvents.RECOVERABLE_EVENT_NAME,
        handleRecoverableApiError,
      );
      window.removeEventListener(
        telemetryEvents.CONTRACT_EVENT_NAME,
        handleContractMismatch,
      );
    };
  }, []);

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
        devWarn('Service warm-up check failed:', e);
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
            minHeight: '100dvh',
            bgcolor: 'background.default',
            px: { xs: 2, sm: 3 },
            py: { xs: 3, sm: 4 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 1120, mx: 'auto' }}>
            <Skeleton variant="rounded" height={56} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" height={72} sx={{ mb: 2 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              <Skeleton variant="rounded" height={160} />
              <Skeleton variant="rounded" height={160} />
              <Skeleton variant="rounded" height={160} />
            </Box>
          </Box>
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
                onClick={handleApplySwUpdate}
                sx={{ minHeight: 44 }}
              >
                Update Now
              </Button>
              <Button
                color="inherit"
                size="small"
                onClick={() => setSwUpdateAvailable(false)}
                sx={{ minHeight: 44 }}
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
                  sx={{ minHeight: 44, minWidth: 44 }}
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
        <Snackbar
          open={Boolean(apiRecoveryNotice)}
          autoHideDuration={7000}
          onClose={() => setApiRecoveryNotice(null)}
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
            severity={apiRecoveryNotice?.isTimeout ? 'warning' : 'info'}
            role="status"
            aria-live="polite"
            onClose={() => setApiRecoveryNotice(null)}
            action={
              apiRecoveryNotice?.retryable
                ? (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleRecoverableNoticeRetry}
                    sx={{ minHeight: 44 }}
                  >
                    Retry
                  </Button>
                )
                : null
            }
            sx={{ width: '100%' }}
          >
            {apiRecoveryNotice?.message}
            {apiRecoveryNotice?.isTimeout && (
              <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                Timeout detected. Slow connections can take longer on first request.
              </Box>
            )}
            {formatRetryDelay(apiRecoveryNotice?.retryAfterMs) && (
              <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                {formatRetryDelay(apiRecoveryNotice?.retryAfterMs)}
              </Box>
            )}
          </Alert>
        </Snackbar>
      </GlobalErrorBoundary>
    </KelmahThemeProvider>
  );
};

export default App;
