import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';
import { QueryClientProvider } from '@tanstack/react-query';
// MED-27 FIX: Lazy-load ReactQueryDevtools only in development
const ReactQueryDevtools = import.meta.env.DEV
  ? React.lazy(() => import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools })))
  : () => null;
import { queryClient } from './config/queryClient';
import store from './store';
import App from './App.jsx';
import './index.css';
import { ErrorBoundary } from 'react-error-boundary';
import { HelmetProvider } from 'react-helmet-async';
import { NotificationProvider } from './modules/notifications/contexts/NotificationContext';
import { MessageProvider } from './modules/messaging/contexts/MessageContext';
import BidNotificationListener from './modules/notifications/components/BidNotificationListener';
import { checkStorageQuota } from './utils/storageQuota';

// ─── Production log suppressor ───
// Keep warnings/errors visible in production while suppressing verbose logs by default.
const enableVerboseProdLogs = import.meta.env.VITE_ENABLE_PROD_DEBUG_LOGS === 'true';
if (import.meta.env.PROD && !enableVerboseProdLogs) {
  const noop = () => {};
  console.log = noop;
  console.debug = noop;
  console.info = noop;
  console.group = noop;
  console.groupCollapsed = noop;
  console.groupEnd = noop;
  console.table = noop;
}

// LOW-19 FIX: Defer storage quota check to avoid blocking module initialization
if (typeof requestIdleCallback === 'function') {
  requestIdleCallback(() => checkStorageQuota());
} else {
  setTimeout(checkStorageQuota, 0);
}

const navigateToHome = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const targetPath = '/';
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentPath !== targetPath && window.history && typeof window.history.pushState === 'function') {
      window.history.pushState({}, '', targetPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
  } catch {
    // No-op: keep failure local and avoid forcing a hard navigation.
  }
};


// LOW-13 FIX: ErrorFallback now includes a retry button for user recovery
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div
    style={{
      padding: 24,
      backgroundColor: '#000000',
      color: '#FFD700',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif',
    }}
  >
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #FFD700 0%, #FFE55C 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        color: '#000000',
        fontSize: '24px',
        fontWeight: 'bold',
      }}
    >
      !
    </div>
    <h2
      style={{
        color: '#FFD700',
        marginBottom: 16,
        fontSize: '24px',
        fontWeight: 600,
        textAlign: 'center',
      }}
    >
      Oops! Something went wrong
    </h2>
    <p
      style={{
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: 24,
        textAlign: 'center',
        maxWidth: '600px',
      }}
    >
      We're sorry for the inconvenience. Please try again or contact
      support if the problem persists.
    </p>
    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
      <button
        onClick={resetErrorBoundary}
        style={{
          padding: '12px 24px',
          backgroundColor: '#FFD700',
          color: '#000000',
          border: 'none',
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Try Again
      </button>
      <button
        onClick={navigateToHome}
        style={{
          padding: '12px 24px',
          backgroundColor: 'transparent',
          color: '#FFD700',
          border: '2px solid #FFD700',
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Go Home
      </button>
    </div>
    {import.meta.env.DEV && (
      <details
        style={{
          color: '#FF5252',
          maxWidth: '800px',
          width: '100%',
          backgroundColor: 'rgba(255, 82, 82, 0.1)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 82, 82, 0.3)',
        }}
      >
        <summary
          style={{
            cursor: 'pointer',
            marginBottom: '12px',
            fontWeight: 600,
          }}
        >
          Technical Details
        </summary>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
            lineHeight: '1.4',
            margin: 0,
          }}
        >
          {error.message}
          {error.stack && '\n\nStack Trace:\n' + error.stack}
        </pre>
      </details>
    )}
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter
          future={{
            v7_relativeSplatPath: true,
          }}
        >
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            dense
          >
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <HelmetProvider>
                <NotificationProvider>
                  <MessageProvider>
                    <BidNotificationListener />
                    <App />
                  </MessageProvider>
                </NotificationProvider>
              </HelmetProvider>
            </ErrorBoundary>
          </SnackbarProvider>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);
