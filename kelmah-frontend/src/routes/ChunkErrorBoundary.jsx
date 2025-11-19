import React from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Typography, Stack } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const isChunkMismatchError = (error) => {
  if (!error) {
    return false;
  }

  const message = error.message || '';
  const name = error.name || '';

  return (
    /ChunkLoadError/i.test(name) ||
    /Loading chunk [\d]+ failed/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message)
  );
};

/**
 * Error boundary that surfaces friendly recovery UI when a lazy-loaded route chunk fails.
 * Complements lazyWithRetry by giving users a manual retry CTA instead of a blank screen.
 */
class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env?.DEV) {
      console.error('ChunkErrorBoundary caught error:', error, info);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null }, () => {
      if (typeof window !== 'undefined') {
        const { routeKey } = this.props;
        try {
          if (routeKey) {
            sessionStorage.removeItem(`lazy-retry-${routeKey}`);
          }
        } catch (storageError) {
          console.warn('Failed clearing chunk retry key:', storageError);
        }
        window.location.reload();
      }
    });
  };

  render() {
    if (!this.state.hasError || !isChunkMismatchError(this.state.error)) {
      return this.props.children;
    }

    return (
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
      >
        <Stack
          spacing={2}
          alignItems="center"
          maxWidth={480}
          textAlign="center"
        >
          <WarningAmberIcon color="warning" sx={{ fontSize: 48 }} />
          <Typography variant="h5" fontWeight={600}>
            We need to refresh this page
          </Typography>
          <Typography color="text.secondary">
            An outdated app bundle was cached on this device, so the latest Jobs
            experience could not load automatically. Refresh to pull the most
            recent update.
          </Typography>
          <Button variant="contained" onClick={this.handleRetry} size="large">
            Refresh and continue
          </Button>
        </Stack>
      </Box>
    );
  }
}

ChunkErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  routeKey: PropTypes.string,
};

export default ChunkErrorBoundary;
