import React from 'react';
import { Box, Typography, Button, Alert, AlertTitle } from '@mui/material';
import {
  Refresh as RefreshIcon,
  Home as HomeIcon,
  ErrorOutline as ErrorOutlineIcon,
} from '@mui/icons-material';
import { createDevLogger } from '../../modules/common/utils/devLogger';

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const boundaryError = createDevLogger(isDev, 'error');

/**
 * ErrorBoundary — catches React render errors and shows a friendly fallback.
 *
 * Accessibility:
 * - role="alert" + aria-live="assertive" so screen readers announce the error
 * - Large icon-driven buttons (54px min-height) for low-literacy / touch users
 * - Visible focus rings on all interactive elements
 * - "Go Home" button as an additional escape hatch
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    boundaryError('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const targetPath = '/';
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (currentPath === targetPath) {
        this.setState({ hasError: false, error: null, errorInfo: null });
        return;
      }

      if (window.history && typeof window.history.pushState === 'function') {
        window.history.pushState({}, '', targetPath);
        window.dispatchEvent(new PopStateEvent('popstate'));
        return;
      }
    } catch {
      // No-op: avoid forcing a hard navigation when router state is recoverable.
    }
  };

  handleContactSupport = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const path = encodeURIComponent(window.location.pathname || '/');
    const supportPath = `/support?source=error-boundary&path=${path}`;

    try {
      if (window.history && typeof window.history.pushState === 'function') {
        window.history.pushState({}, '', supportPath);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } catch {
      // No-op: keep fallback view visible if in-app navigation fails.
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          role="alert"
          aria-live="assertive"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            p: 4,
            textAlign: 'center',
          }}
        >
          {/* Large visual error icon for quick recognition */}
          <Box
            aria-hidden="true"
            sx={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              bgcolor: 'rgba(244,67,54,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main' }} />
          </Box>

          <Alert
            severity="error"
            sx={{ mb: 3, maxWidth: 600, textAlign: 'left' }}
          >
            <AlertTitle>Something went wrong</AlertTitle>
            <Typography variant="body2" sx={{ mt: 1 }}>
              We're sorry, but something unexpected happened. This usually means
              the page needs to be refreshed.
            </Typography>
          </Alert>

          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={this.handleRetry}
            sx={{
              mb: 2,
              minHeight: 54,
              minWidth: 180,
              fontSize: '1rem',
              fontWeight: 700,
              bgcolor: '#D4AF37',
              color: '#000',
              '&:hover': { bgcolor: '#B8941F' },
              '&:focus-visible': {
                outline: '3px solid #D4AF37',
                outlineOffset: '3px',
              },
            }}
          >
            Try Again
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
            sx={{
              mb: 2,
              minHeight: 54,
              minWidth: 180,
              fontSize: '1rem',
              fontWeight: 600,
              borderColor: 'rgba(212,175,55,0.5)',
              color: '#D4AF37',
              '&:hover': { borderColor: '#D4AF37', bgcolor: 'rgba(212,175,55,0.08)' },
              '&:focus-visible': {
                outline: '3px solid #D4AF37',
                outlineOffset: '3px',
              },
            }}
          >
            Refresh Page
          </Button>

          <Button
            variant="text"
            startIcon={<HomeIcon />}
            onClick={this.handleGoHome}
            sx={{
              minHeight: 48,
              fontSize: '0.95rem',
              color: 'text.secondary',
              '&:hover': { color: '#D4AF37' },
              '&:focus-visible': {
                outline: '3px solid #D4AF37',
                outlineOffset: '3px',
              },
            }}
          >
            Go Home
          </Button>

          <Alert severity="info" sx={{ mb: 2.5, maxWidth: 600, textAlign: 'left' }}>
            <Typography variant="body2">
              Recovery steps: 1) tap Try Again, 2) if it fails, tap Refresh Page, 3) contact support if the problem continues.
            </Typography>
          </Alert>

          <Button
            variant="text"
            onClick={this.handleContactSupport}
            sx={{
              minHeight: 44,
              fontSize: '0.92rem',
              color: 'text.secondary',
              '&:hover': { color: '#D4AF37' },
              '&:focus-visible': {
                outline: '3px solid #D4AF37',
                outlineOffset: '3px',
              },
            }}
          >
            Contact Support
          </Button>

          {isDev && this.state.error && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 1,
                maxWidth: 800,
                textAlign: 'left',
              }}
            >
              <Typography variant="h6" gutterBottom>
                Error Details (Development Only):
              </Typography>
              <Typography
                variant="body2"
                component="pre"
                sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}
              >
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo?.componentStack}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
