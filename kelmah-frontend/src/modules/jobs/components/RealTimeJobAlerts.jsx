import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Divider,
  Tooltip,
  Badge,
  Fade,
  Zoom,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Work as JobIcon,
  NotificationsActive as AlertIcon,
  NotificationsOff as AlertOffIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Schedule as TimeIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  Visibility as ViewIcon,
  Apply as ApplyIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import websocketService from '../../../services/websocketService';
import jobsService from '../services/jobsService';
import { addNotification } from '../../../store/slices/notificationSlice';
import {
  formatCurrency,
  formatRelativeTime,
  formatDate,
} from '../../../utils/formatters';

const RealTimeJobAlerts = ({
  showHeader = true,
  maxAlerts = 10,
  onJobClick = null,
  compact = false,
}) => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const dispatch = useDispatch();

  // State management
  const [alerts, setAlerts] = useState([]);
  const [alertSettings, setAlertSettings] = useState([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [newAlerts, setNewAlerts] = useState(new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createAlertOpen, setCreateAlertOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);

  // Alert form state
  const [alertForm, setAlertForm] = useState({
    name: '',
    keywords: '',
    location: '',
    category: '',
    minBudget: 0,
    maxBudget: 10000,
    urgency: '',
    jobType: '',
    enabled: true,
    emailNotification: true,
    pushNotification: true,
    smsNotification: false,
  });

  // Job categories for filtering
  const jobCategories = [
    'Plumbing',
    'Electrical',
    'Carpentry',
    'Masonry',
    'Painting',
    'Roofing',
    'Tiling',
    'Landscaping',
    'HVAC',
    'General Maintenance',
  ];

  // Load initial data
  useEffect(() => {
    loadJobAlerts();
    loadAlertSettings();

    // Setup WebSocket listeners
    const handleJobNotification = (data) => {
      if (isEnabled && shouldShowAlert(data)) {
        addJobAlert(data);
      }
    };

    websocketService.addEventListener(
      'job:notification',
      handleJobNotification,
    );

    return () => {
      websocketService.removeEventListener(
        'job:notification',
        handleJobNotification,
      );
    };
  }, [isEnabled]);

  // Load job alerts from storage/API
  const loadJobAlerts = async () => {
    try {
      const storedAlerts = localStorage.getItem('realtimeJobAlerts');
      if (storedAlerts) {
        setAlerts(JSON.parse(storedAlerts));
      }
    } catch (error) {
      console.error('Failed to load job alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load alert settings
  const loadAlertSettings = async () => {
    try {
      // Load from API or localStorage
      const response = await jobsService.getJobAlertSettings(user.id);
      setAlertSettings(response.data || []);

      // Check if alerts are enabled globally
      const globalSettings = localStorage.getItem('jobAlertsEnabled');
      setIsEnabled(globalSettings !== 'false');
    } catch (error) {
      console.error('Failed to load alert settings:', error);
      // Fallback to localStorage
      const localSettings = localStorage.getItem('jobAlertSettings');
      if (localSettings) {
        setAlertSettings(JSON.parse(localSettings));
      }
    }
  };

  // Add new job alert
  const addJobAlert = useCallback(
    (jobData) => {
      const alert = {
        id: `alert_${Date.now()}`,
        jobId: jobData.jobId,
        title: jobData.jobTitle || jobData.title,
        description: jobData.message || jobData.description,
        budget: jobData.budget,
        location: jobData.location,
        category: jobData.category,
        urgency: jobData.urgency || 'medium',
        clientName: jobData.clientName,
        timestamp: new Date().toISOString(),
        seen: false,
        applied: false,
        matchScore: jobData.matchScore || 0,
        tags: jobData.tags || [],
        type: jobData.type || 'new-job', // 'new-job', 'job-match', 'price-drop', etc.
      };

      setAlerts((prev) => {
        const updated = [alert, ...prev].slice(0, maxAlerts);
        localStorage.setItem('realtimeJobAlerts', JSON.stringify(updated));
        return updated;
      });

      // Mark as new for animation
      setNewAlerts((prev) => new Set(prev).add(alert.id));
      setTimeout(() => {
        setNewAlerts((prev) => {
          const updated = new Set(prev);
          updated.delete(alert.id);
          return updated;
        });
      }, 5000);

      // Show snackbar notification
      enqueueSnackbar(`New job alert: ${alert.title}`, {
        variant: getAlertVariant(alert.type),
        action: (
          <Button
            color="inherit"
            size="small"
            onClick={() => handleViewJob(alert)}
          >
            View
          </Button>
        ),
        autoHideDuration: 6000,
      });

      // Add to Redux notifications
      dispatch(
        addNotification({
          id: alert.id,
          type: 'job',
          title: getAlertTitle(alert.type),
          message: alert.title,
          severity: getAlertSeverity(alert.type),
          metadata: {
            jobId: alert.jobId,
            jobTitle: alert.title,
            clientName: alert.clientName,
          },
        }),
      );
    },
    [dispatch, enqueueSnackbar, maxAlerts],
  );

  // Check if alert should be shown based on user settings
  const shouldShowAlert = (jobData) => {
    // Check against saved alert settings
    return alertSettings.some((setting) => {
      if (!setting.enabled) return false;

      // Check keywords
      if (setting.keywords) {
        const keywords = setting.keywords
          .toLowerCase()
          .split(',')
          .map((k) => k.trim());
        const jobText =
          `${jobData.jobTitle} ${jobData.description}`.toLowerCase();
        if (!keywords.some((keyword) => jobText.includes(keyword))) {
          return false;
        }
      }

      // Check location
      if (
        setting.location &&
        !jobData.location
          ?.toLowerCase()
          .includes(setting.location.toLowerCase())
      ) {
        return false;
      }

      // Check category
      if (setting.category && jobData.category !== setting.category) {
        return false;
      }

      // Check budget range
      if (jobData.budget) {
        const budget =
          typeof jobData.budget === 'object'
            ? jobData.budget.max
            : jobData.budget;
        if (budget < setting.minBudget || budget > setting.maxBudget) {
          return false;
        }
      }

      return true;
    });
  };

  // Get alert variant for snackbar
  const getAlertVariant = (type) => {
    switch (type) {
      case 'job-match':
        return 'success';
      case 'urgent-job':
        return 'warning';
      case 'price-increase':
        return 'info';
      case 'deadline-reminder':
        return 'warning';
      default:
        return 'info';
    }
  };

  // Get alert severity for notifications
  const getAlertSeverity = (type) => {
    switch (type) {
      case 'job-match':
        return 'success';
      case 'urgent-job':
        return 'warning';
      case 'deadline-reminder':
        return 'warning';
      default:
        return 'info';
    }
  };

  // Get alert title
  const getAlertTitle = (type) => {
    switch (type) {
      case 'new-job':
        return 'New Job Available';
      case 'job-match':
        return 'Perfect Job Match!';
      case 'urgent-job':
        return 'Urgent Job Alert';
      case 'price-increase':
        return 'Budget Increased';
      case 'deadline-reminder':
        return 'Application Deadline';
      default:
        return 'Job Alert';
    }
  };

  // Get alert icon
  const getAlertIcon = (type, urgency) => {
    if (urgency === 'high' || type === 'urgent-job') {
      return <WarningIcon color="warning" />;
    }

    switch (type) {
      case 'job-match':
        return <StarIcon color="success" />;
      case 'price-increase':
        return <TrendingIcon color="info" />;
      case 'deadline-reminder':
        return <TimeIcon color="warning" />;
      default:
        return <JobIcon color="primary" />;
    }
  };

  // Handle view job
  const handleViewJob = (alert) => {
    // Mark as seen
    setAlerts((prev) =>
      prev.map((a) => (a.id === alert.id ? { ...a, seen: true } : a)),
    );

    if (onJobClick) {
      onJobClick(alert.jobId);
    } else {
      window.open(`/jobs/${alert.jobId}`, '_blank');
    }
  };

  // Handle apply to job
  const handleApplyToJob = async (alert) => {
    try {
      // Mark as applied
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alert.id ? { ...a, applied: true, seen: true } : a,
        ),
      );

      // Navigate to application page
      window.open(`/jobs/${alert.jobId}/apply`, '_blank');

      enqueueSnackbar('Redirecting to job application...', { variant: 'info' });
    } catch (error) {
      enqueueSnackbar('Failed to apply to job', { variant: 'error' });
    }
  };

  // Handle dismiss alert
  const handleDismissAlert = (alertId) => {
    setAlerts((prev) => {
      const updated = prev.filter((a) => a.id !== alertId);
      localStorage.setItem('realtimeJobAlerts', JSON.stringify(updated));
      return updated;
    });
  };

  // Handle create/update alert setting
  const handleSaveAlertSetting = async () => {
    try {
      const setting = {
        id: editingAlert?.id || `setting_${Date.now()}`,
        ...alertForm,
        userId: user.id,
        createdAt: editingAlert?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingAlert) {
        // Update existing
        setAlertSettings((prev) =>
          prev.map((s) => (s.id === setting.id ? setting : s)),
        );
      } else {
        // Create new
        setAlertSettings((prev) => [...prev, setting]);
      }

      // Save to API
      await jobsService.saveJobAlertSetting(setting);

      // Save to localStorage as backup
      localStorage.setItem('jobAlertSettings', JSON.stringify(alertSettings));

      enqueueSnackbar(
        editingAlert ? 'Alert setting updated' : 'Alert setting created',
        { variant: 'success' },
      );

      setCreateAlertOpen(false);
      setEditingAlert(null);
      resetAlertForm();
    } catch (error) {
      enqueueSnackbar('Failed to save alert setting', { variant: 'error' });
    }
  };

  // Handle delete alert setting
  const handleDeleteAlertSetting = async (settingId) => {
    try {
      setAlertSettings((prev) => prev.filter((s) => s.id !== settingId));
      await jobsService.deleteJobAlertSetting(settingId);
      enqueueSnackbar('Alert setting deleted', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to delete alert setting', { variant: 'error' });
    }
  };

  // Reset alert form
  const resetAlertForm = () => {
    setAlertForm({
      name: '',
      keywords: '',
      location: '',
      category: '',
      minBudget: 0,
      maxBudget: 10000,
      urgency: '',
      jobType: '',
      enabled: true,
      emailNotification: true,
      pushNotification: true,
      smsNotification: false,
    });
  };

  // Handle toggle alerts
  const handleToggleAlerts = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    localStorage.setItem('jobAlertsEnabled', newEnabled.toString());

    enqueueSnackbar(newEnabled ? 'Job alerts enabled' : 'Job alerts disabled', {
      variant: newEnabled ? 'success' : 'warning',
    });
  };

  // Render alert item
  const renderAlertItem = (alert) => {
    const isNew = newAlerts.has(alert.id);
    const priorityColor =
      alert.urgency === 'high'
        ? theme.palette.warning.main
        : theme.palette.primary.main;

    return (
      <Zoom in={true} key={alert.id}>
        <ListItem
          sx={{
            backgroundColor: isNew
              ? alpha(priorityColor, 0.1)
              : alert.seen
                ? 'transparent'
                : alpha(theme.palette.info.main, 0.05),
            border: isNew
              ? `2px solid ${priorityColor}`
              : '1px solid transparent',
            borderRadius: 2,
            mb: 1,
            transition: 'all 0.3s ease-in-out',
            animation: isNew
              ? 'glow 2s ease-in-out infinite alternate'
              : 'none',
            '@keyframes glow': {
              from: { boxShadow: `0 0 5px ${alpha(priorityColor, 0.5)}` },
              to: { boxShadow: `0 0 20px ${alpha(priorityColor, 0.8)}` },
            },
          }}
        >
          <ListItemAvatar>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              badgeContent={
                alert.matchScore > 80 ? (
                  <StarIcon sx={{ fontSize: 16, color: 'gold' }} />
                ) : null
              }
            >
              <Avatar
                sx={{
                  bgcolor: alpha(priorityColor, 0.1),
                  color: priorityColor,
                }}
              >
                {getAlertIcon(alert.type, alert.urgency)}
              </Avatar>
            </Badge>
          </ListItemAvatar>

          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {alert.title}
                </Typography>
                {alert.urgency === 'high' && (
                  <Chip label="Urgent" size="small" color="warning" />
                )}
                {alert.matchScore > 80 && (
                  <Chip
                    label={`${alert.matchScore}% Match`}
                    size="small"
                    color="success"
                  />
                )}
              </Box>
            }
            secondary={
              <Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {alert.description?.substring(0, 100)}
                  {alert.description?.length > 100 && '...'}
                </Typography>

                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  {alert.budget && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <MoneyIcon fontSize="small" />
                      <Typography variant="caption">
                        {typeof alert.budget === 'object'
                          ? `${formatCurrency(alert.budget.min)} - ${formatCurrency(alert.budget.max)}`
                          : formatCurrency(alert.budget)}
                      </Typography>
                    </Box>
                  )}

                  {alert.location && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <LocationIcon fontSize="small" />
                      <Typography variant="caption">
                        {alert.location}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography variant="caption" color="text.secondary">
                    {formatRelativeTime(alert.timestamp)}
                    {alert.clientName && ` • by ${alert.clientName}`}
                  </Typography>

                  <Box display="flex" gap={0.5}>
                    {alert.tags?.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            }
          />

          <ListItemSecondaryAction>
            <Box display="flex" flexDirection="column" gap={0.5}>
              {!alert.applied && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<ApplyIcon />}
                  onClick={() => handleApplyToJob(alert)}
                  sx={{ minWidth: 80 }}
                >
                  Apply
                </Button>
              )}

              <Button
                size="small"
                variant="outlined"
                startIcon={<ViewIcon />}
                onClick={() => handleViewJob(alert)}
                sx={{ minWidth: 80 }}
              >
                View
              </Button>

              <IconButton
                size="small"
                onClick={() => handleDismissAlert(alert.id)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </ListItemSecondaryAction>
        </ListItem>
      </Zoom>
    );
  };

  return (
    <Paper sx={{ p: compact ? 2 : 3 }}>
      {showHeader && (
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6" display="flex" alignItems="center" gap={1}>
            <AlertIcon color="primary" />
            Real-Time Job Alerts
            <Badge
              badgeContent={alerts.filter((a) => !a.seen).length}
              color="error"
            />
          </Typography>

          <Box display="flex" gap={1}>
            <Tooltip title={isEnabled ? 'Disable alerts' : 'Enable alerts'}>
              <IconButton onClick={handleToggleAlerts}>
                {isEnabled ? <AlertIcon /> : <AlertOffIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Alert settings">
              <IconButton onClick={() => setSettingsOpen(true)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setCreateAlertOpen(true)}
            >
              New Alert
            </Button>
          </Box>
        </Box>
      )}

      {!isEnabled && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Job alerts are currently disabled. Enable them to receive real-time
          notifications.
        </Alert>
      )}

      {alerts.length === 0 ? (
        <Box textAlign="center" py={4}>
          <AlertIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No job alerts yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Set up job alerts to get notified about relevant opportunities in
            real-time
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateAlertOpen(true)}
          >
            Create Your First Alert
          </Button>
        </Box>
      ) : (
        <List sx={{ maxHeight: compact ? 400 : 600, overflow: 'auto' }}>
          {alerts.map(renderAlertItem)}
        </List>
      )}

      {/* Create/Edit Alert Dialog */}
      <Dialog
        open={createAlertOpen || !!editingAlert}
        onClose={() => {
          setCreateAlertOpen(false);
          setEditingAlert(null);
          resetAlertForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingAlert ? 'Edit Job Alert' : 'Create Job Alert'}
        </DialogTitle>
        <DialogContent>
          {/* Alert form content would go here */}
          <TextField
            fullWidth
            label="Alert Name"
            value={alertForm.name}
            onChange={(e) =>
              setAlertForm({ ...alertForm, name: e.target.value })
            }
            margin="normal"
          />
          {/* Additional form fields... */}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCreateAlertOpen(false);
              setEditingAlert(null);
              resetAlertForm();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveAlertSetting} variant="contained">
            {editingAlert ? 'Update' : 'Create'} Alert
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default RealTimeJobAlerts;

