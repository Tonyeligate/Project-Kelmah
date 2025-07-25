import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  alpha,
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
  const { settings, loading, error, updateNotificationPreferences } =
    useSettings();
  const [tabValue, setTabValue] = useState(0);

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
    { component: <PrivacySettings />, label: 'Privacy', icon: <ShieldIcon /> },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4, color: 'text.primary' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <SettingsIcon sx={{ fontSize: 36, mr: 1.5, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight="bold">
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
            }}
          >
            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={tabValue}
              onChange={handleTabChange}
              aria-label="Vertical settings tabs"
              sx={{
                borderRight: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  justifyContent: 'flex-start',
                  fontWeight: '600',
                  textTransform: 'none',
                },
                '& .Mui-selected': {
                  color: 'primary.main',
                },
              }}
            >
              {settingsPanels.map((panel, index) => (
                <Tab
                  key={panel.label}
                  label={panel.label}
                  icon={panel.icon}
                  iconPosition="start"
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
