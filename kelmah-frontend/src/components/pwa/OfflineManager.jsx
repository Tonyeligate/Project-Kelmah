import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Snackbar,
  Alert,
  IconButton,
  Typography,
  Paper,
  Stack,
  Button,
  LinearProgress,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CloudOff as OfflineIcon,
  CloudQueue as SyncIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  CheckCircle as OnlineIcon,
  Warning as WarningIcon,
  Sync as SyncingIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import backgroundSyncService from '../../services/backgroundSyncService';

/**
 * Enhanced Offline Manager for Ghana's Mobile Network Conditions
 * Provides intelligent caching, sync queue, and user feedback for intermittent connectivity
 */
const OfflineManager = () => {
  const theme = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [pendingActions, setPendingActions] = useState([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [networkQuality, setNetworkQuality] = useState('good'); // poor, fair, good, excellent
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Network quality detection based on connection speed
  useEffect(() => {
    const detectNetworkQuality = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection;
        const effectiveType = connection.effectiveType;
        
        switch (effectiveType) {
          case 'slow-2g':
          case '2g':
            setNetworkQuality('poor');
            break;
          case '3g':
            setNetworkQuality('fair');
            break;
          case '4g':
            setNetworkQuality('good');
            break;
          default:
            setNetworkQuality('excellent');
        }
      }
    };

    detectNetworkQuality();
    
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', detectNetworkQuality);
      return () => navigator.connection.removeEventListener('change', detectNetworkQuality);
    }
  }, []);

  // Monitor online/offline status and integrate with background sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
      // Update sync status
      updateSyncStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for background sync events
  useEffect(() => {
    const handleSyncComplete = (event) => {
      const { results } = event.detail;
      console.log('🎉 Background sync completed:', results);
      
      // Update UI based on sync results
      setIsSyncing(false);
      setSyncProgress(100);
      setLastSyncTime(new Date());
      
      // Update pending actions list
      updateSyncStatus();
      
      // Reset progress after delay
      setTimeout(() => setSyncProgress(0), 2000);
    };

    const handleSyncFailed = (event) => {
      const { action, error } = event.detail;
      console.error('❌ Background sync failed:', action, error);
      setIsSyncing(false);
      // You could show error notifications here
    };

    window.addEventListener('backgroundSyncComplete', handleSyncComplete);
    window.addEventListener('backgroundSyncFailed', handleSyncFailed);

    return () => {
      window.removeEventListener('backgroundSyncComplete', handleSyncComplete);
      window.removeEventListener('backgroundSyncFailed', handleSyncFailed);
    };
  }, []);

  // Initialize and update sync status
  useEffect(() => {
    updateSyncStatus();
    
    // Set up periodic status updates
    const interval = setInterval(updateSyncStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Update sync status from background sync service
  const updateSyncStatus = useCallback(async () => {
    try {
      const status = backgroundSyncService.getSyncStatus();
      
      setIsOnline(status.isOnline);
      setIsSyncing(status.isSyncing);
      setNetworkQuality(getNetworkQualityFromType(status.networkType));
      
      // Convert background sync queue to display format
      const displayActions = [];
      if (status.pending > 0) {
        displayActions.push({
          id: 'pending',
          type: 'Pending Sync',
          count: status.pending,
          status: 'pending'
        });
      }
      if (status.syncing > 0) {
        displayActions.push({
          id: 'syncing',
          type: 'Currently Syncing',
          count: status.syncing,
          status: 'syncing'
        });
      }
      if (status.failed > 0) {
        displayActions.push({
          id: 'failed',
          type: 'Failed to Sync',
          count: status.failed,
          status: 'failed'
        });
      }
      
      setPendingActions(displayActions);
      
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }, []);

  // Helper to convert network type to quality
  const getNetworkQualityFromType = (networkType) => {
    switch (networkType) {
      case '2g': return 'poor';
      case '3g': return 'fair';
      case '4g': return 'good';
      case 'wifi': return 'excellent';
      default: return 'good';
    }
  };

  // Add action to background sync queue
  const addPendingAction = useCallback(async (actionType, data, options = {}) => {
    try {
      // Queue action with background sync service
      const actionId = await backgroundSyncService.queueAction(actionType, data, options);
      console.log(`📝 Action queued for background sync: ${actionType} (ID: ${actionId})`);
      
      // Update UI to reflect new pending action
      updateSyncStatus();
      
      return actionId;
    } catch (error) {
      console.error('Failed to queue action for background sync:', error);
      throw error;
    }
  }, [updateSyncStatus]);

  // Handle manual sync trigger
  const handleSync = async () => {
    if (!isOnline || isSyncing) return;

    try {
      setIsSyncing(true);
      console.log('🔄 Manually triggering background sync...');
      
      // Trigger background sync service
      await backgroundSyncService.forceSyncAll();
      
      setLastSyncTime(new Date());
      localStorage.setItem('kelmah_last_sync', new Date().toISOString());
      
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Simulate API sync action
  const syncAction = async (action) => {
    // Simulate network delay based on connection quality
    const delays = {
      poor: 3000,
      fair: 1500,
      good: 800,
      excellent: 300
    };
    
    await new Promise(resolve => setTimeout(resolve, delays[networkQuality] || 800));
    
    // Simulate random failures for poor connections
    if (networkQuality === 'poor' && Math.random() < 0.3) {
      throw new Error('Network timeout');
    }
    
    console.log('Synced action:', action);
  };

  // Get network quality color and label
  const getNetworkQualityDisplay = () => {
    const displays = {
      poor: { color: '#F44336', label: 'Poor Connection', icon: WarningIcon },
      fair: { color: '#FF9800', label: 'Fair Connection', icon: SyncIcon },
      good: { color: '#4CAF50', label: 'Good Connection', icon: OnlineIcon },
      excellent: { color: '#2196F3', label: 'Excellent Connection', icon: OnlineIcon }
    };
    return displays[networkQuality] || displays.good;
  };

  const networkDisplay = getNetworkQualityDisplay();
  const NetworkIcon = networkDisplay.icon;

  // Offline Tips for Ghana Context
  const offlineTips = [
    'Find jobs cached on your device',
    'Update your profile information',
    'Save jobs for later viewing',
    'View your earnings history',
    'Check cached messages',
    'Review completed jobs'
  ];

  return (
    <>
      {/* Offline Alert Banner */}
      <AnimatePresence>
        {showOfflineAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}
          >
            <Paper
              elevation={4}
              sx={{
                background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
                color: 'white',
                p: 2,
                borderRadius: 0
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={2}>
                  <OfflineIcon />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      You're offline
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Don't worry! You can still browse cached content and queue actions.
                    </Typography>
                  </Box>
                </Stack>
                
                {pendingActions.length > 0 && (
                  <Chip
                    label={`${pendingActions.length} pending`}
                    size="small"
                    sx={{
                      backgroundColor: alpha('#fff', 0.2),
                      color: 'white',
                      fontWeight: 600
                    }}
                  />
                )}
                
                <IconButton
                  size="small"
                  onClick={() => setShowOfflineAlert(false)}
                  sx={{ color: 'white' }}
                >
                  <CloseIcon />
                </IconButton>
              </Stack>
              
              {/* Offline Tips */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 1 }}>
                  What you can do offline:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {offlineTips.slice(0, 3).map((tip, index) => (
                    <Chip
                      key={index}
                      label={tip}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: alpha('#fff', 0.3),
                        color: 'white',
                        fontSize: '0.7rem'
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Network Quality Indicator */}
      {isOnline && (
        <Box
          sx={{
            position: 'fixed',
            top: showOfflineAlert ? 120 : 16,
            right: 16,
            zIndex: 1300,
            transition: 'top 0.3s ease'
          }}
        >
          <Paper
            elevation={2}
            sx={{
              p: 1,
              background: alpha(networkDisplay.color, 0.1),
              border: `1px solid ${alpha(networkDisplay.color, 0.3)}`,
              borderRadius: 2
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <NetworkIcon sx={{ fontSize: 16, color: networkDisplay.color }} />
              <Typography variant="caption" sx={{ color: networkDisplay.color, fontWeight: 600 }}>
                {networkDisplay.label}
              </Typography>
            </Stack>
          </Paper>
        </Box>
      )}

      {/* Sync Progress Indicator */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1300
            }}
          >
            <Paper
              elevation={8}
              sx={{
                p: 3,
                background: 'linear-gradient(135deg, rgba(30,30,30,0.98) 0%, rgba(40,40,40,0.98) 100%)',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: 3,
                minWidth: 280
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <SyncingIcon sx={{ color: '#FFD700', animation: 'spin 1s linear infinite' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                      Syncing your data...
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Uploading {pendingActions.length} pending actions
                    </Typography>
                  </Box>
                </Stack>
                
                <LinearProgress
                  variant="determinate"
                  value={syncProgress}
                  sx={{
                    backgroundColor: 'rgba(255,215,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#FFD700'
                    }
                  }}
                />
                
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                  {Math.round(syncProgress)}% complete
                </Typography>
              </Stack>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Actions Indicator */}
      {pendingActions.length > 0 && !isSyncing && isOnline && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1300
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="contained"
              onClick={handleSync}
              startIcon={<SyncIcon />}
              sx={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                color: '#000',
                fontWeight: 700,
                borderRadius: 3,
                px: 3,
                py: 1.5,
                boxShadow: '0 4px 20px rgba(255,215,0,0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #FFC000 0%, #FFB300 100%)',
                  boxShadow: '0 6px 25px rgba(255,215,0,0.4)',
                }
              }}
            >
              Sync {pendingActions.length} pending
            </Button>
          </motion.div>
        </Box>
      )}

      {/* Last Sync Time */}
      {lastSyncTime && isOnline && (
        <Typography
          variant="caption"
          sx={{
            position: 'fixed',
            bottom: 8,
            left: 16,
            color: 'rgba(255,255,255,0.5)',
            zIndex: 1200
          }}
        >
          Last synced: {lastSyncTime.toLocaleTimeString()}
        </Typography>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

// Expose global function to add pending actions
window.addPendingAction = (action) => {
  window.dispatchEvent(new CustomEvent('addPendingAction', { detail: action }));
};

export default OfflineManager;