import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import NotificationSettings from '../components/common/NotificationSettings';
import AccountSettings from '../components/common/AccountSettings';
import SecuritySettings from '../components/common/SecuritySettings';
import PrivacySettings from '../components/common/PrivacySettings';
import { useSettings } from '../hooks/useSettings';

const SettingsPage = () => {
  const {
    settings,
    loading,
    error,
    updateNotificationPreferences,
    updatePrivacySettings,
  } =
    useSettings();
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const settingsPanels = [
    {
      component: (
        <NotificationSettings
          settings={settings}
          loading={loading}
          error={error}
          updateNotificationPreferences={updateNotificationPreferences}
        />
      ),
      label: 'Notifications',
      icon: <NotificationsIcon />,
    },
    {
      component: <AccountSettings />,
      label: 'Account',
      icon: <AccountCircleIcon />,
    },
    {
      component: <SecuritySettings />,
      label: 'Security & Password',
      icon: <SecurityIcon />,
    },
    {
      component: (
        <PrivacySettings
          settings={settings}
          loading={loading}
          updatePrivacySettings={updatePrivacySettings}
        />
      ),
      label: 'Privacy',
      icon: <ShieldIcon />,
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1.5, sm: 3 }, color: 'text.primary' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 4 } }}>
        <SettingsIcon sx={{ fontSize: { xs: 28, md: 36 }, mr: 1.5, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
          Settings
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 1,
              backgroundColor: (theme) =>
                alpha(theme.palette.background.paper, 0.7),
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              position: isMdUp ? 'sticky' : 'relative',
              top: isMdUp ? theme.spacing(2) : 'auto',
              maxHeight: isMdUp ? 'calc(100vh - 140px)' : 'none',
              overflow: isMdUp ? 'auto' : 'visible',
            }}
          >
            <Tabs
              orientation={isMdUp ? 'vertical' : 'horizontal'}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              value={tabValue}
              onChange={handleTabChange}
              aria-label={
                isMdUp ? 'Vertical settings tabs' : 'Horizontal settings tabs'
              }
              sx={{
                borderRight: isMdUp ? 1 : 0,
                borderBottom: isMdUp ? 0 : 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  justifyContent: 'flex-start',
                  fontWeight: '600',
                  textTransform: 'none',
                  minHeight: isMdUp ? 64 : 48,
                  minWidth: isMdUp ? 'auto' : 44,
                },
                '& .Mui-selected': {
                  color: 'primary.main',
                },
              }}
            >
              {settingsPanels.map((panel) => (
                <Tab
                  key={panel.label}
                  label={panel.label}
                  icon={panel.icon}
                  iconPosition={isMdUp ? 'start' : 'top'}
                />
              ))}
            </Tabs>
          </Paper>
        </Grid>
        <Grid item xs={12} md={9}>
          <Box>{settingsPanels[tabValue].component}</Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SettingsPage;
