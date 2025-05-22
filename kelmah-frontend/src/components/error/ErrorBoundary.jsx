import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';

const ErrorContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
}));

const GlowingText = styled(Typography)(({ theme }) => ({
  color: theme.palette.secondary.main,
  textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
  marginBottom: theme.spacing(3),
}));

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
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to your error tracking service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GlowingText variant="h2" align="center">
              Oops! Something went wrong
            </GlowingText>
            
            <Typography variant="body1" color="text.secondary" align="center" gutterBottom>
              Don't worry, we're on it. Try refreshing the page or contact support if the problem persists.
            </Typography>

            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={() => window.location.reload()}
                sx={{
                  background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #FFA500, #FFD700)',
                  },
                }}
              >
                Refresh Page
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => window.history.back()}
                sx={{ borderColor: '#FFD700', color: '#FFD700' }}
              >
                Go Back
              </Button>
            </Box>
          </motion.div>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 