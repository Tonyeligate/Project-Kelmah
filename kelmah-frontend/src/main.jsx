import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
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
// Silence console.log and console.warn in production to prevent data leakage
// and reduce noise. console.error is preserved for actionable diagnostics.
if (import.meta.env.PROD) {
  const noop = () => {};
  console.log = noop;
  console.warn = noop;
  console.debug = noop;
  console.info = noop;
  console.group = noop;
  console.groupEnd = noop;
  console.table = noop;
}

// Version 1.0.5 - Force fresh bundle generation
if (import.meta.env.DEV) {
  console.log('🔧 Main.jsx v1.0.5 - Kelmah PWA with storage monitoring');
  console.log('🔧 Store initialized:', !!store);
  console.log('🔧 All imports successful');
}

// Check browser storage quota on startup (non-blocking)
checkStorageQuota();


const ErrorFallback = ({ error }) => (
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
      We're sorry for the inconvenience. Please refresh the page or contact
      support if the problem persists.
    </p>
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
        {import.meta.env.DEV && error.stack && '\n\nStack Trace:\n' + error.stack}
      </pre>
    </details>
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
