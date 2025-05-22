import React, { useState, useEffect } from 'react';
import { Alert, Collapse, Box, Button, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { checkApiHealth, isApiReachable } from '../../utils/apiUtils';
import { CloudOff, Refresh } from '@mui/icons-material';

const StyledAlert = styled(Alert)(({ theme }) => ({
  borderRadius: 0,
  backgroundColor: theme.palette.warning.dark,
  color: theme.palette.primary.main,
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(0.5, 2),
  '& .MuiAlert-icon': {
    color: theme.palette.primary.main,
  }
}));

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  const checkConnection = async () => {
    if (isChecking) return; // Prevent multiple simultaneous checks
    
    setIsChecking(true);
    const isReachable = await checkApiHealth(false);
    setIsOffline(!isReachable);
    setShowBanner(!isReachable);
    setIsChecking(false);
  };

  useEffect(() => {
    // Initial check
    checkConnection();
    
    // Set up periodic health checks - less frequent to reduce console noise
    const intervalId = setInterval(checkConnection, 60000); // Every minute
    
    // Clean up
    return () => clearInterval(intervalId);
  }, []);

  const handleRetry = () => {
    checkConnection();
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  return (
    <Collapse in={showBanner}>
      <StyledAlert 
        severity="warning"
        icon={<CloudOff />}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRetry}
              disabled={isChecking}
              startIcon={<Refresh />}
            >
              Retry
            </Button>
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleDismiss}
              sx={{ ml: 1 }}
            >
              Dismiss
            </Button>
          </Box>
        }
      >
        <Typography variant="body2">
          {isChecking 
            ? "Checking connection to server..." 
            : "You are currently offline. Some features may be unavailable."}
        </Typography>
      </StyledAlert>
    </Collapse>
  );
};

export default OfflineBanner; 