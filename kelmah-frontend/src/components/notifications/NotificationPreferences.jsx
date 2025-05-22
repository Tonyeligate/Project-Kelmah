import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
    Typography,
  Divider,
    Grid,
    FormControlLabel,
  Switch,
    FormGroup,
    List,
    ListItem,
  ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    IconButton,
  Collapse,
  Box,
  Radio,
  RadioGroup,
  CircularProgress,
  Alert,
  Checkbox,
  Paper,
    Tabs,
    Tab,
  Chip,
  FormControl,
  FormLabel,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  PhoneAndroid as MobileIcon,
  DeleteOutline as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  NotificationsActive as ActiveIcon,
  NotificationsOff as MutedIcon,
  AccessTime as ScheduleIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  WorkOutline as JobIcon,
  MessageOutlined as MessageIcon,
  PaymentOutlined as PaymentIcon,
  StarOutlined as ReviewIcon,
  Person as ProfileIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { 
  fetchNotificationPreferences, 
  updateNotificationPreferences 
} from '../../redux/actions/notificationActions';

// Styled components
const CategoryHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.background.default,
  cursor: 'pointer'
}));

const PreferenceItem = styled(ListItem)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5)
}));

const DeliveryMethodItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 0),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:last-child': {
    borderBottom: 'none'
                }
            }));
            
const ChannelChip = styled(Chip)(({ theme, selected }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: selected ? theme.palette.primary.main : theme.palette.background.default,
  color: selected ? theme.palette.primary.contrastText : theme.palette.text.primary,
  cursor: 'pointer',
  border: selected ? 'none' : `1px solid ${theme.palette.divider}`
}));

// Get notification type icon
const getNotificationTypeIcon = (type) => {
  switch (type) {
    case 'messages':
      return <MessageIcon />;
    case 'jobs':
      return <JobIcon />;
    case 'payments':
      return <PaymentIcon />;
    case 'reviews':
      return <ReviewIcon />;
    case 'profile':
      return <ProfileIcon />;
    case 'admin':
      return <AdminIcon />;
    case 'security':
      return <SecurityIcon />;
    default:
      return <NotificationsIcon />;
  }
};

// Main component
const NotificationPreferences = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const preferences = useSelector((state) => state.notifications.preferences);
  const loading = useSelector((state) => state.notifications.preferencesLoading);
  const error = useSelector((state) => state.notifications.preferencesError);
  const saving = useSelector((state) => state.notifications.preferencesSaving);
  const saveError = useSelector((state) => state.notifications.preferencesSaveError);

  // Local state
  const [localPreferences, setLocalPreferences] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    if (open) {
      dispatch(fetchNotificationPreferences());
    }
  }, [open, dispatch]);

  // Initialize local state when preferences are loaded
  useEffect(() => {
    if (preferences && Object.keys(preferences).length > 0) {
            setLocalPreferences(preferences);
      
      // Set all categories to expanded by default
      const expanded = {};
      Object.keys(preferences.categories || {}).forEach(category => {
        expanded[category] = true;
      });
      setExpandedCategories(expanded);
    }
  }, [preferences]);

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
            ...prev,
      [category]: !prev[category]
        }));
    };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle preference toggle
  const handleToggleNotificationType = (category, type) => {
    const updatedPreferences = { ...localPreferences };
    
    if (!updatedPreferences.categories[category]) {
      updatedPreferences.categories[category] = {};
    }
    
    if (!updatedPreferences.categories[category][type]) {
      updatedPreferences.categories[category][type] = { enabled: true, channels: ['in_app'] };
    } else {
      updatedPreferences.categories[category][type].enabled = !updatedPreferences.categories[category][type].enabled;
    }
    
    setLocalPreferences(updatedPreferences);
    setHasChanges(true);
  };

  // Handle channel toggle
  const handleToggleChannel = (category, type, channel) => {
    const updatedPreferences = { ...localPreferences };
    
    if (!updatedPreferences.categories[category][type].channels.includes(channel)) {
      updatedPreferences.categories[category][type].channels.push(channel);
    } else {
      updatedPreferences.categories[category][type].channels = 
        updatedPreferences.categories[category][type].channels.filter(c => c !== channel);
    }
    
    setLocalPreferences(updatedPreferences);
    setHasChanges(true);
  };

  // Handle global notification toggle
  const handleToggleGlobalNotifications = () => {
    const updatedPreferences = { 
      ...localPreferences,
      globalEnabled: !localPreferences.globalEnabled
    };
    
    setLocalPreferences(updatedPreferences);
    setHasChanges(true);
  };

  // Handle email settings toggle
  const handleToggleEmailDigest = () => {
    const updatedPreferences = { 
      ...localPreferences,
      emailSettings: {
        ...localPreferences.emailSettings,
        enableDigest: !localPreferences.emailSettings.enableDigest
      }
    };
    
    setLocalPreferences(updatedPreferences);
    setHasChanges(true);
  };

  // Handle email digest frequency change
  const handleChangeDigestFrequency = (event) => {
    const updatedPreferences = { 
      ...localPreferences,
      emailSettings: {
        ...localPreferences.emailSettings,
        digestFrequency: event.target.value
      }
    };
    
    setLocalPreferences(updatedPreferences);
    setHasChanges(true);
  };

  // Handle push notification settings
  const handleTogglePushSettings = (setting) => {
    const updatedPreferences = { 
      ...localPreferences,
      pushSettings: {
        ...localPreferences.pushSettings,
        [setting]: !localPreferences.pushSettings[setting]
      }
    };
    
    setLocalPreferences(updatedPreferences);
    setHasChanges(true);
  };

  // Handle quiet hours toggle
  const handleToggleQuietHours = () => {
    const updatedPreferences = { 
      ...localPreferences,
            quietHours: {
        ...localPreferences.quietHours,
        enabled: !localPreferences.quietHours.enabled
      }
    };
    
    setLocalPreferences(updatedPreferences);
    setHasChanges(true);
  };

  // Save preferences
  const handleSavePreferences = () => {
    dispatch(updateNotificationPreferences(localPreferences));
  };

  // Render notification type preferences
  const renderNotificationTypes = () => {
    if (!localPreferences.categories) return null;
    
    return Object.keys(localPreferences.categories).map(category => (
      <Box key={category} sx={{ mb: 2 }}>
        <CategoryHeader onClick={() => toggleCategory(category)}>
                            <ListItemIcon>
            {getNotificationTypeIcon(category)}
                            </ListItemIcon>
                            <ListItemText 
            primary={category.charAt(0).toUpperCase() + category.slice(1)} 
          />
          {expandedCategories[category] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </CategoryHeader>
        
        <Collapse in={expandedCategories[category]}>
          <List disablePadding>
            {Object.keys(localPreferences.categories[category]).map(type => {
              const notificationType = localPreferences.categories[category][type];
              return (
                <PreferenceItem key={type}>
                            <ListItemText 
                    primary={type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                          Delivery methods:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                          <ChannelChip
                            label="In-app"
                            size="small"
                            icon={<NotificationsIcon fontSize="small" />}
                            selected={notificationType.channels.includes('in_app')}
                            onClick={() => handleToggleChannel(category, type, 'in_app')}
                          />
                          <ChannelChip
                            label="Email"
                            size="small"
                            icon={<EmailIcon fontSize="small" />}
                            selected={notificationType.channels.includes('email')}
                            onClick={() => handleToggleChannel(category, type, 'email')}
                          />
                          <ChannelChip
                            label="Push"
                            size="small"
                            icon={<MobileIcon fontSize="small" />}
                            selected={notificationType.channels.includes('push')}
                            onClick={() => handleToggleChannel(category, type, 'push')}
                          />
                        </Box>
                      </Box>
                    }
                            />
                            <ListItemSecondaryAction>
                                <Switch
                                    edge="end"
                      checked={notificationType.enabled}
                      onChange={() => handleToggleNotificationType(category, type)}
                                />
                            </ListItemSecondaryAction>
                </PreferenceItem>
              );
            })}
                    </List>
        </Collapse>
                </Box>
    ));
  };

  // Render delivery methods settings
  const renderDeliverySettings = () => {
    if (!localPreferences.emailSettings || !localPreferences.pushSettings) return null;
    
    return (
                <Box>
        {/* Email Settings */}
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Email Settings
                    </Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={localPreferences.emailSettings.enableDigest}
                  onChange={handleToggleEmailDigest}
                />
              }
              label="Receive daily/weekly digest"
            />
            
            {localPreferences.emailSettings.enableDigest && (
              <FormControl component="fieldset" sx={{ mt: 2 }}>
                <FormLabel component="legend">Digest frequency</FormLabel>
                <RadioGroup
                  value={localPreferences.emailSettings.digestFrequency}
                  onChange={handleChangeDigestFrequency}
                >
                  <FormControlLabel value="daily" control={<Radio />} label="Daily" />
                  <FormControlLabel value="weekly" control={<Radio />} label="Weekly" />
                </RadioGroup>
              </FormControl>
            )}
          </FormGroup>
        </Paper>
        
        {/* Push Notification Settings */}
        <Typography variant="h6" gutterBottom>
          Push Notification Settings
                    </Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={localPreferences.pushSettings.enableSound}
                  onChange={() => handleTogglePushSettings('enableSound')}
                />
              }
              label="Play sound for new notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localPreferences.pushSettings.enableVibration}
                  onChange={() => handleTogglePushSettings('enableVibration')}
                />
              }
              label="Enable vibration"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localPreferences.pushSettings.showPreview}
                  onChange={() => handleTogglePushSettings('showPreview')}
                />
              }
              label="Show notification preview"
            />
          </FormGroup>
        </Paper>
        
        {/* Quiet Hours Settings */}
        <Typography variant="h6" gutterBottom>
                                    Quiet Hours
                                </Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <FormGroup>
            <FormControlLabel
              control={
                                <Switch
                                    checked={localPreferences.quietHours.enabled}
                  onChange={handleToggleQuietHours}
                />
              }
              label="Enable quiet hours"
            />
            
            {localPreferences.quietHours.enabled && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  During quiet hours, you will only receive in-app notifications. 
                  Push and email notifications will be delivered after quiet hours end.
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <FormControl fullWidth variant="outlined" size="small">
                      <FormLabel>Start Time</FormLabel>
                      <Box sx={{ mt: 1 }}>
                        {localPreferences.quietHours.startTime}
                      </Box>
                    </FormControl>
                                </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth variant="outlined" size="small">
                      <FormLabel>End Time</FormLabel>
                      <Box sx={{ mt: 1 }}>
                        {localPreferences.quietHours.endTime}
                                                </Box>
                                    </FormControl>
                        </Grid>
                    </Grid>
              </Box>
            )}
          </FormGroup>
        </Paper>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="notification-preferences-dialog"
    >
      <DialogTitle id="notification-preferences-dialog">
        Notification Preferences
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8
          }}
        >
          <DeleteIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={() => dispatch(fetchNotificationPreferences())}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        ) : Object.keys(localPreferences).length === 0 ? (
          <Typography>No preferences found.</Typography>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localPreferences.globalEnabled}
                    onChange={handleToggleGlobalNotifications}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ mr: 1 }}>
                      Enable All Notifications
                    </Typography>
                    <Tooltip title="This is a master switch. When disabled, you won't receive any notifications regardless of individual settings.">
                      <InfoIcon fontSize="small" color="action" />
                    </Tooltip>
                                </Box>
                }
                                />
                            </Box>
            
            {saveError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {saveError}
              </Alert>
            )}
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="notification preference tabs">
                <Tab label="Notification Types" />
                <Tab label="Delivery Methods" />
              </Tabs>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              {activeTab === 0 && renderNotificationTypes()}
              {activeTab === 1 && renderDeliverySettings()}
            </Box>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button
          onClick={handleSavePreferences} 
                    color="primary"
                    variant="contained"
          disabled={loading || saving || !hasChanges}
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
      </DialogActions>
    </Dialog>
    );
};

export default NotificationPreferences; 