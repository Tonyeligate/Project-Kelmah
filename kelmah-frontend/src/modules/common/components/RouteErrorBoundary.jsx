/* eslint-disable react/prop-types */
import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';
import { devError } from '@/modules/common/utils/devLogger';

/**
 * Per-route React Error Boundary.
 * Catches render errors in child components and shows a recoverable UI
 * instead of crashing the entire application.
 */
class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_FRONTEND === 'true') {
      devError(
        `[RouteErrorBoundary] Error in ${this.props.label || 'route'}:`,
        error,
        errorInfo,
      );
    }
  }

  isChunkLoadFailure = () => {
    const message = String(this.state?.error?.message || '');
    const name = String(this.state?.error?.name || '');

    return (
      /Loading chunk [\d]+ failed/i.test(message) ||
      /ChunkLoadError/i.test(name) ||
      /Failed to fetch dynamically imported module/i.test(message)
    );
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  hardReload = () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.location.reload();
    } catch {
      window.location.assign(window.location.href);
    }
  };

  navigateToDashboard = () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const targetPath = '/dashboard';
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (currentPath === targetPath) {
        this.setState({ hasError: false, error: null });
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

  render() {
    if (this.state.hasError) {
      const chunkFailure = this.isChunkLoadFailure();

      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={300}
          p={3}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              maxWidth: 480,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <ErrorIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {chunkFailure ? 'Unable to load this screen' : 'Something went wrong'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {chunkFailure
                ? 'A temporary app loading issue occurred. Retry first. If it persists, reload the app to fetch the latest files.'
                : this.props.label
                  ? `The "${this.props.label}" section encountered an error.`
                  : 'This section encountered an unexpected error.'}{' '}
              You can try again or go back to the dashboard.
            </Typography>
            <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
              <Button
                variant="contained"
                onClick={this.handleReset}
                sx={{
                  minHeight: 44,
                  '&:focus-visible': {
                    outline: '3px solid currentColor',
                    outlineOffset: 2,
                  },
                }}
              >
                {chunkFailure ? 'Retry Route' : 'Try Again'}
              </Button>
              {chunkFailure && (
                <Button
                  variant="outlined"
                  onClick={this.hardReload}
                  sx={{
                    minHeight: 44,
                    '&:focus-visible': {
                      outline: '3px solid currentColor',
                      outlineOffset: 2,
                    },
                  }}
                >
                  Reload App
                </Button>
              )}
              <Button
                variant="text"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.assign('/help');
                  }
                }}
                sx={{
                  minHeight: 44,
                  '&:focus-visible': {
                    outline: '3px solid currentColor',
                    outlineOffset: 2,
                  },
                }}
              >
                Help
              </Button>
              <Button
                variant="outlined"
                onClick={this.navigateToDashboard}
                sx={{
                  minHeight: 44,
                  '&:focus-visible': {
                    outline: '3px solid currentColor',
                    outlineOffset: 2,
                  },
                }}
              >
                Go to Dashboard
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
