import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';
import store from './store';
import { AuthProvider } from './modules/auth/contexts/AuthContext';
import { NotificationProvider } from './modules/notifications/contexts/NotificationContext';
import { PaymentProvider } from './modules/payment/contexts/PaymentContext';
import { MessageProvider } from './modules/messaging/contexts/MessageContext';
import { ContractProvider } from './modules/contracts/contexts/ContractContext';
import App from './App.jsx';
import './index.css';
import { ErrorBoundary } from 'react-error-boundary';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Add debugging for module loading
console.log('🔧 Main.jsx loading - React version:', React.version);
console.log('🔧 Store initialized:', !!store);
console.log('🔧 All imports successful');

const ErrorFallback = ({ error }) => (
  <div
    style={{
      padding: 24,
      backgroundColor: '#1A1A1A',
      color: '#FFD700',
      minHeight: '100vh',
    }}
  >
    <h2 style={{ color: '#FFD700', marginBottom: 16 }}>
      Something went wrong.
    </h2>
    <pre style={{ color: '#FF5252', whiteSpace: 'pre-wrap' }}>
      {error.message}
    </pre>
  </div>
);

const muiTheme = createTheme({
  palette: { mode: 'dark' },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Provider store={store}>
        <BrowserRouter>
          <SnackbarProvider maxSnack={3}>
            <AuthProvider>
              <NotificationProvider>
                <MessageProvider>
                  <PaymentProvider>
                    <ContractProvider>
                      <ErrorBoundary FallbackComponent={ErrorFallback}>
                        <App />
                      </ErrorBoundary>
                    </ContractProvider>
                  </PaymentProvider>
                </MessageProvider>
              </NotificationProvider>
            </AuthProvider>
          </SnackbarProvider>
        </BrowserRouter>
      </Provider>
    </ThemeProvider>
  </React.StrictMode>,
);
