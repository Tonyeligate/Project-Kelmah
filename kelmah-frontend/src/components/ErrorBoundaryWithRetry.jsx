/**
 * Enhanced Error Boundary with Retry Functionality
 * 
 * Provides comprehensive error handling with retry capabilities,
 * offline detection, and user-friendly error messages.
 */

import React, { Component } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Chip,
  Collapse,
  IconButton,
  Stack
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BugReport as BugReportIcon,
  CloudOff as OfflineIcon
} from '@mui/icons-material';

class ErrorBoundaryWithRetry extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isOffline: !navigator.onLine,
      showDetails: false,
      errorId: null
    };

    this.maxRetries = props.maxRetries || 3;
    this.autoRetryDelay = props.autoRetryDelay || 5000;
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for monitoring
    this.logError(error, errorInfo);

    // Auto-retry for certain types of errors
    if (this.shouldAutoRetry(error) && this.state.retryCount < this.maxRetries) {
      setTimeout(() => {
        this.handleRetry(true);
      }, this.autoRetryDelay);
    }
  }

  componentDidMount() {
    // Monitor network status
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  handleOnline = () => {
    this.setState({ isOffline: false });
    // Auto-retry if error was network-related
    if (this.state.hasError && this.isNetworkError(this.state.error)) {
      this.handleRetry(true);
    }
  };

  handleOffline = () => {
    this.setState({ isOffline: true });
  };

  logError = (error, errorInfo) => {
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      isOffline: !navigator.onLine,
      retryCount: this.state.retryCount
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.log('Error Report:', errorReport);
      console.groupEnd();
    }

    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorReport(errorReport);
    }
  };

  sendErrorReport = async (errorReport) => {
    try {
      // Here you would send to your error reporting service
      // For now, we'll just store it locally for debugging
      const errors = JSON.parse(localStorage.getItem('kelmah_error_reports') || '[]');
      errors.push(errorReport);
      
      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.splice(0, errors.length - 10);
      }
      
      localStorage.setItem('kelmah_error_reports', JSON.stringify(errors));
    } catch (reportError) {
      console.error('Failed to send error report:', reportError);
    }
  };

  shouldAutoRetry = (error) => {
    return (
      this.isNetworkError(error) ||
      error.message.includes('ChunkLoadError') ||
      error.message.includes('Loading chunk')
    );
  };

  isNetworkError = (error) => {
    return (
      error.message.includes('Network Error') ||
      error.message.includes('fetch') ||
      error.name === 'NetworkError'
    );
  };

  handleRetry = (isAutoRetry = false) => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: isAutoRetry ? prevState.retryCount + 1 : 0,
      showDetails: false
    }));

    // Force component re-render
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReportBug = () => {
    const errorReport = {
      errorId: this.state.errorId,
      message: this.state.error.message,
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount
    };

    // Open bug report form or email
    const subject = encodeURIComponent(`Bug Report: ${errorReport.errorId}`);
    const body = encodeURIComponent(`
Error ID: ${errorReport.errorId}
Error Message: ${errorReport.message}
Timestamp: ${errorReport.timestamp}
Retry Count: ${errorReport.retryCount}

Please describe what you were doing when this error occurred:
[Your description here]
    `);

    window.open(`mailto:support@kelmah.com?subject=${subject}&body=${body}`);
  };

  getErrorMessage = () => {
    const { error, isOffline } = this.state;

    if (isOffline) {
      return "You're currently offline. Please check your internet connection.";
    }

    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'Failed to load application resources. This might be due to a recent update.';
    }

    if (this.isNetworkError(error)) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }

    if (error.message.includes('Permission denied')) {
      return "You don't have permission to access this resource.";
    }

    return 'An unexpected error occurred. Our team has been notified.';
  };

  getErrorSeverity = () => {
    const { error, isOffline } = this.state;

    if (isOffline || this.isNetworkError(error)) {
      return 'warning';
    }

    if (error.message.includes('ChunkLoadError')) {
      return 'info';
    }

    return 'error';
  };

  canRetry = () => {
    return this.state.retryCount < this.maxRetries;
  };

  render() {
    const { hasError, error, isOffline, showDetails, retryCount, errorId } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback component
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      return (
        <Box
          sx={{
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent>
              <Stack spacing={3}>
                <Box sx={{ textAlign: 'center' }}>
                  {isOffline ? <OfflineIcon sx={{ fontSize: 64, color: 'warning.main' }} /> : 
                   <ErrorIcon sx={{ fontSize: 64, color: 'error.main' }} />}
                  
                  <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
                    {isOffline ? 'You\'re Offline' : 'Something went wrong'}
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {this.getErrorMessage()}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                    <Chip
                      label={`Error ID: ${errorId?.substr(-8)}`}
                      size="small"
                      variant="outlined"
                    />
                    {retryCount > 0 && (
                      <Chip
                        label={`Retry ${retryCount}/${this.maxRetries}`}
                        size="small"
                        color="warning"
                      />
                    )}
                  </Box>
                </Box>

                <Alert severity={this.getErrorSeverity()}>
                  <Typography variant="body2">
                    {isOffline ? 
                      'Your data is safe. The app will reconnect automatically when you\'re back online.' :
                      'Don\'t worry, your data is safe. Try refreshing the page or come back later.'
                    }
                  </Typography>
                </Alert>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {this.canRetry() && (
                    <Button
                      variant="contained"
                      startIcon={<RefreshIcon />}
                      onClick={() => this.handleRetry(false)}
                      disabled={isOffline}
                    >
                      Try Again
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    onClick={() => window.location.reload()}
                  >
                    Refresh Page
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<BugReportIcon />}
                    onClick={this.handleReportBug}
                  >
                    Report Bug
                  </Button>
                </Box>

                {process.env.NODE_ENV === 'development' && (
                  <Box>
                    <Button
                      fullWidth
                      variant="text"
                      startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      onClick={() => this.setState({ showDetails: !showDetails })}
                    >
                      {showDetails ? 'Hide' : 'Show'} Error Details
                    </Button>

                    <Collapse in={showDetails}>
                      <Card variant="outlined" sx={{ mt: 2, bgcolor: 'grey.50' }}>
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            Error Details (Development Mode)
                          </Typography>
                          <Typography variant="body2" component="pre" sx={{ 
                            fontSize: '0.75rem',
                            overflow: 'auto',
                            maxHeight: 200,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}>
                            {error.stack}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Collapse>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return children;
  }
}

export default ErrorBoundaryWithRetry;