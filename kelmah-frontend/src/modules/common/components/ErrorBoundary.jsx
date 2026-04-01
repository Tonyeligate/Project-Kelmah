/* eslint-disable react/prop-types */
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { devError } from '@/modules/common/utils/devLogger';

/**
 * Reusable Error Boundary component.
 * Wrap any page or section to gracefully catch render errors.
 *
 * Usage:
 *   <ErrorBoundary fallback={<CustomFallback />}>
 *     <MyPage />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_FRONTEND === 'true') {
      devError('[ErrorBoundary]', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Something went wrong
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
            An unexpected error occurred. Please try again.
          </Typography>
          <Button variant="contained" onClick={this.handleReset} sx={{ mr: 1 }}>
            Try Again
          </Button>
          <Button variant="outlined" onClick={this.handleReset}>
            Reset View
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
