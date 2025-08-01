/**
 * Service Status Component
 * 
 * Displays real-time status of backend services with visual indicators
 * and provides manual retry capabilities for failed services.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Button,
  Grid,
  LinearProgress,
  Tooltip,
  Alert,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  CheckCircle as HealthyIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CloudOff as OfflineIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { serviceManager } from '../services/EnhancedServiceManager';

const ServiceStatus = ({ showDetails = false, compact = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [servicesStatus, setServicesStatus] = useState({});
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    // Initial status fetch
    updateServicesStatus();

    // Listen for service status changes
    const handleServiceStatusChange = (event) => {
      const { serviceName, status } = event.detail;
      
      if (serviceName === 'NETWORK') {
        setNetworkStatus(status === 'ONLINE');
      }
      
      // Refresh all statuses
      updateServicesStatus();
    };

    window.addEventListener('serviceStatusChange', handleServiceStatusChange);

    // Periodic status updates
    const interval = setInterval(updateServicesStatus, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('serviceStatusChange', handleServiceStatusChange);
      clearInterval(interval);
    };
  }, []);

  const updateServicesStatus = () => {
    const allStatuses = serviceManager.getAllServicesStatus();
    setServicesStatus(allStatuses);
    setLastUpdate(Date.now());
  };

  const getStatusColor = (status) => {
    switch (status.circuitBreakerState) {
      case 'CLOSED':
        return status.health?.status === 'healthy' ? 'success' : 'warning';
      case 'HALF_OPEN':
        return 'warning';
      case 'OPEN':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.circuitBreakerState) {
      case 'CLOSED':
        return status.health?.status === 'healthy' ? 
          <HealthyIcon color="success" /> : 
          <WarningIcon color="warning" />;
      case 'HALF_OPEN':
        return <WarningIcon color="warning" />;
      case 'OPEN':
        return <ErrorIcon color="error" />;
      default:
        return <WarningIcon color="disabled" />;
    }
  };

  const getStatusText = (status) => {
    if (!networkStatus) return 'Offline';
    
    switch (status.circuitBreakerState) {
      case 'CLOSED':
        return status.health?.status === 'healthy' ? 'Healthy' : 'Degraded';
      case 'HALF_OPEN':
        return 'Recovering';
      case 'OPEN':
        return 'Unavailable';
      default:
        return 'Unknown';
    }
  };

  const handleRetryService = (serviceName) => {
    serviceManager.resetCircuitBreaker(serviceName);
    updateServicesStatus();
  };

  const handleRetryAll = () => {
    serviceManager.resetAllCircuitBreakers();
    updateServicesStatus();
  };

  const formatServiceName = (serviceName) => {
    return serviceName.replace('_SERVICE', '').toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getOverallHealth = () => {
    if (!networkStatus) return { status: 'offline', message: 'No network connection' };
    
    const statuses = Object.values(servicesStatus);
    const unhealthyCount = statuses.filter(s => s.circuitBreakerState === 'OPEN').length;
    const degradedCount = statuses.filter(s => s.circuitBreakerState === 'HALF_OPEN').length;
    
    if (unhealthyCount === 0 && degradedCount === 0) {
      return { status: 'healthy', message: 'All services operational' };
    } else if (unhealthyCount === 0) {
      return { status: 'degraded', message: `${degradedCount} service(s) recovering` };
    } else {
      return { status: 'unhealthy', message: `${unhealthyCount} service(s) unavailable` };
    }
  };

  if (compact) {
    const overall = getOverallHealth();
    return (
      <Tooltip title={`Services: ${overall.message} • Updated: ${formatTime(lastUpdate)}`}>
        <Chip
          icon={
            !networkStatus ? <OfflineIcon /> :
            overall.status === 'healthy' ? <HealthyIcon /> :
            overall.status === 'degraded' ? <WarningIcon /> :
            <ErrorIcon />
          }
          label={
            !networkStatus ? 'Offline' :
            overall.status === 'healthy' ? 'Healthy' :
            overall.status === 'degraded' ? 'Degraded' :
            'Issues'
          }
          color={
            !networkStatus ? 'default' :
            overall.status === 'healthy' ? 'success' :
            overall.status === 'degraded' ? 'warning' :
            'error'
          }
          size="small"
          onClick={() => setExpanded(!expanded)}
          clickable
        />
      </Tooltip>
    );
  }

  const overall = getOverallHealth();

  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <TimelineIcon color="primary" />
            <Typography variant="h6">
              Service Status
            </Typography>
            {!networkStatus && (
              <Chip
                icon={<OfflineIcon />}
                label="Offline"
                color="warning"
                size="small"
              />
            )}
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="caption" color="text.secondary">
              Updated: {formatTime(lastUpdate)}
            </Typography>
            <IconButton size="small" onClick={updateServicesStatus}>
              <RefreshIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        <Box mt={2}>
          <Alert 
            severity={
              !networkStatus ? 'error' :
              overall.status === 'healthy' ? 'success' :
              overall.status === 'degraded' ? 'warning' : 'error'
            }
            sx={{ mb: 2 }}
          >
            {overall.message}
          </Alert>

          <Grid container spacing={2}>
            {Object.entries(servicesStatus).map(([serviceName, status]) => (
              <Grid item xs={12} sm={6} md={4} key={serviceName}>
                <Card variant="outlined" size="small">
                  <CardContent sx={{ pb: 1 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center" gap={1}>
                        {getStatusIcon(status)}
                        <Typography variant="body2" fontWeight="medium">
                          {formatServiceName(serviceName)}
                        </Typography>
                      </Box>
                      
                      <Chip
                        label={getStatusText(status)}
                        color={getStatusColor(status)}
                        size="small"
                      />
                    </Box>
                    
                    {status.failures > 0 && (
                      <Typography variant="caption" color="error" display="block" mt={1}>
                        {status.failures} failure(s)
                      </Typography>
                    )}
                    
                    {status.circuitBreakerState === 'OPEN' && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleRetryService(serviceName)}
                        sx={{ mt: 1 }}
                        fullWidth
                      >
                        Retry
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Detailed Status
          </Typography>
          
          <Grid container spacing={2}>
            {Object.entries(servicesStatus).map(([serviceName, status]) => (
              <Grid item xs={12} key={serviceName}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" fontWeight="medium" gutterBottom>
                      {formatServiceName(serviceName)}
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          Circuit Breaker
                        </Typography>
                        <Typography variant="body2">
                          {status.circuitBreakerState}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          Health
                        </Typography>
                        <Typography variant="body2">
                          {status.health?.status || 'Unknown'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          Last Success
                        </Typography>
                        <Typography variant="body2">
                          {formatTime(status.lastSuccess)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          Failures
                        </Typography>
                        <Typography variant="body2">
                          {status.failures}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    {status.health?.responseTime && (
                      <Box mt={1}>
                        <Typography variant="caption" color="text.secondary">
                          Response Time: {status.health.responseTime}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Box mt={2} display="flex" justifyContent="center">
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRetryAll}
            >
              Reset All Circuit Breakers
            </Button>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ServiceStatus;