/**
 * Service Status Component
 * 
 * Displays real-time service availability with retry functionality
 * and graceful degradation for better user experience.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  Button,
  Chip,
  Typography,
  Collapse,
  IconButton,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const ServiceStatus = ({ 
  error, 
  onRetry, 
  serviceName = 'Service',
  showDetails = false,
  autoRetry = true,
  retryInterval = 30000,
  severity = 'error'
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [autoRetryEnabled, setAutoRetryEnabled] = useState(autoRetry);
  const [nextRetryIn, setNextRetryIn] = useState(null);

  // Auto-retry functionality
  useEffect(() => {
    if (!autoRetryEnabled || !error || isRetrying) return;

    const timer = setTimeout(() => {
      handleRetry(true);
    }, retryInterval);

    // Countdown timer
    setNextRetryIn(retryInterval / 1000);
    const countdownTimer = setInterval(() => {
      setNextRetryIn(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownTimer);
    };
  }, [error, autoRetryEnabled, retryInterval, isRetrying]);

  const handleRetry = async (isAutoRetry = false) => {
    setIsRetrying(true);
    setNextRetryIn(null);
    
    try {
      await onRetry();
      setRetryCount(0);
    } catch (error) {
      setRetryCount(prev => prev + 1);
      
      // Disable auto-retry after 3 failed attempts
      if (isAutoRetry && retryCount >= 2) {
        setAutoRetryEnabled(false);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusColor = () => {
    if (error) {
      switch (severity) {
        case 'warning': return 'warning';
        case 'info': return 'info';
        default: return 'error';
      }
    }
    return 'success';
  };

  const getStatusIcon = () => {
    if (isRetrying) return <ScheduleIcon />;
    if (error) {
      switch (severity) {
        case 'warning': return <WarningIcon />;
        case 'info': return <ErrorIcon />;
        default: return <ErrorIcon />;
      }
    }
    return <CheckCircleIcon />;
  };

  const getStatusMessage = () => {
    if (isRetrying) return `Reconnecting to ${serviceName}...`;
    if (error) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return `${serviceName} is responding slowly`;
      }
      if (error.response?.status === 401) {
        return `Authentication required for ${serviceName}`;
      }
      if (error.response?.status === 404) {
        return `${serviceName} endpoint not found`;
      }
      if (error.response?.status >= 500) {
        return `${serviceName} is temporarily unavailable`;
      }
      return `${serviceName} connection failed`;
    }
    return `${serviceName} is operational`;
  };

  const getActionMessage = () => {
    if (isRetrying) return 'Retrying...';
    if (nextRetryIn) return `Auto-retry in ${nextRetryIn}s`;
    if (error) return 'Retry now';
    return '';
  };

  if (!error && !showDetails) return null;

  return (
    <Alert
      severity={getStatusColor()}
      icon={getStatusIcon()}
      sx={{
        mb: 2,
        '& .MuiAlert-message': {
          width: '100%'
        }
      }}
      action={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {error && (
            <>
              <Chip
                size="small"
                label={getActionMessage()}
                color={isRetrying ? 'primary' : 'default'}
                sx={{ mr: 1 }}
              />
              <Button
                color="inherit"
                size="small"
                onClick={() => handleRetry(false)}
                disabled={isRetrying}
                startIcon={<RefreshIcon />}
              >
                Retry
              </Button>
            </>
          )}
          {showDetails && (
            <IconButton
              color="inherit"
              size="small"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>
      }
    >
      <Typography variant="body2" fontWeight="medium">
        {getStatusMessage()}
      </Typography>
      
      {isRetrying && (
        <LinearProgress 
          sx={{ mt: 1, borderRadius: 1 }}
          color="inherit"
        />
      )}

      <Collapse in={expanded && showDetails}>
        <Card sx={{ mt: 2, bgcolor: 'background.paper' }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Service Details
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Service:</strong> {serviceName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Status:</strong> {error ? 'Unavailable' : 'Available'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Retry Count:</strong> {retryCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Auto-retry:</strong> {autoRetryEnabled ? 'Enabled' : 'Disabled'}
              </Typography>
            </Box>

            {error && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Error Details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Type:</strong> {error.name || 'Unknown Error'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Code:</strong> {error.code || error.response?.status || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                  <strong>Message:</strong> {error.message || 'No details available'}
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setAutoRetryEnabled(!autoRetryEnabled)}
              >
                {autoRetryEnabled ? 'Disable' : 'Enable'} Auto-retry
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Collapse>
    </Alert>
  );
};

export default ServiceStatus;