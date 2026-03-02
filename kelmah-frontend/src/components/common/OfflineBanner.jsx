import React from 'react';
import { Slide, Snackbar, Alert, useMediaQuery, useTheme } from '@mui/material';
import { WifiOff as WifiOffIcon, Wifi as WifiIcon } from '@mui/icons-material';
import useOnlineStatus from '../../hooks/useOnlineStatus';

/**
 * OfflineBanner — global banner shown when the browser loses connectivity.
 * Shows a persistent offline alert, and a brief "Back online" message on
 * reconnection. Mount once at the app root (e.g. in App.jsx).
 */
export default function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [showReconnected, setShowReconnected] = React.useState(false);

  React.useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  return (
    <>
      {/* Persistent offline banner — role="alert" via Alert + aria-live for AT */}
      <Snackbar
        open={!isOnline}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
        sx={{ top: isMobile ? '56px !important' : '64px !important' }}
      >
        <Alert
          severity="error"
          role="alert"
          aria-live="assertive"
          icon={<WifiOffIcon aria-hidden="true" />}
          sx={{
            width: '100%',
            maxWidth: 500,
            fontWeight: 600,
            fontSize: '0.95rem',
            boxShadow: theme.shadows[4],
          }}
        >
          You're offline — some features may be unavailable
        </Alert>
      </Snackbar>

      {/* Brief "back online" toast */}
      <Snackbar
        open={showReconnected}
        autoHideDuration={3000}
        onClose={() => setShowReconnected(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
        sx={{ top: isMobile ? '56px !important' : '64px !important' }}
      >
        <Alert
          severity="success"
          role="status"
          aria-live="polite"
          icon={<WifiIcon aria-hidden="true" />}
          sx={{ width: '100%', maxWidth: 500, fontWeight: 600, fontSize: '0.95rem' }}
        >
          Back online
        </Alert>
      </Snackbar>
    </>
  );
}
