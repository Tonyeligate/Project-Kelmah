/**
 * Kelmah Frontend Application - v2.0.0
 * Unified theme system with consistent branding
 * Last updated: January 2025
 */
import { useEffect, Suspense, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress, Alert } from '@mui/material';
import { KelmahThemeProvider, useThemeMode } from './theme/ThemeProvider';
import { AppRoutes } from './routes/config';
import { verifyAuth } from './modules/auth/services/authSlice';
import { AUTH_CONFIG } from './config/environment';
import { secureStorage } from './utils/secureStorage';
import { initializePWA } from './utils/pwaHelpers';
import GlobalErrorBoundary from './modules/common/components/GlobalErrorBoundary';
import { useApiHealth } from './hooks/useApiHealth';

// Main App Component
const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading: authLoading } = useSelector(
    (state) => state.auth,
  );
  const { isHealthy } = useApiHealth();
  const location = useLocation();
  const initialized = useRef(false);

  // Initialize PWA
  useEffect(() => {
    initializePWA();
  }, []);

  // Verify authentication on mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const token = secureStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      if (token) {
        dispatch(verifyAuth());
      }
    }
  }, [dispatch]);

  if (authLoading) {
    return (
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
    );
  }

  return (
    <KelmahThemeProvider>
      <GlobalErrorBoundary>
        {!isHealthy && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Backend services are currently unreachable. Some features may be limited.
          </Alert>
        )}
        <AppRoutes />
      </GlobalErrorBoundary>
    </KelmahThemeProvider>
  );
};

export default App;
