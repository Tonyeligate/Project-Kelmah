/**
 * Global Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree and displays a fallback UI
 */

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  Container
} from '@mui/material';
import { ErrorOutline as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Report to error tracking service if available
    if (window.reportError) {
      window.reportError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <ErrorIcon sx={{ fontSize: 64, color: '#ff6b6b', mb: 2 }} />
              
              <Typography variant="h4" gutterBottom sx={{ color: '#D4AF37' }}>
                Oops! Something went wrong
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255,255,255,0.8)' }}>
                We encountered an unexpected error. Don't worry, this has been logged and our team will investigate.
              </Typography>
              
              <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(255,0,0,0.1)' }}>
                <Typography variant="body2">
                  {this.state.error && this.state.error.toString()}
                </Typography>
              </Alert>
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                  sx={{
                    bgcolor: '#D4AF37',
                    color: '#000',
                    '&:hover': { bgcolor: '#B8941F' }
                  }}
                >
                  Try Again
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={this.handleReload}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: 'white',
                    '&:hover': { 
                      borderColor: '#D4AF37',
                      bgcolor: 'rgba(212,175,55,0.1)'
                    }
                  }}
                >
                  Reload Page
                </Button>
              </Box>
              
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <Box sx={{ mt: 3, textAlign: 'left' }}>
                  <Typography variant="h6" gutterBottom>
                    Debug Information:
                  </Typography>
                  <Box 
                    component="pre" 
                    sx={{ 
                      bgcolor: 'rgba(0,0,0,0.3)', 
                      p: 2, 
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      overflow: 'auto',
                      maxHeight: 200
                    }}
                  >
                    {this.state.error && this.state.error.stack}
                    {this.state.errorInfo.componentStack}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;