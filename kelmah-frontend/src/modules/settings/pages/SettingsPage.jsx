import { useState } from 'react';
import {
  Container, Box, Typography, Paper, Tabs, Tab, Grid, List, ListItemButton, ListItemIcon, ListItemText, IconButton, alpha, useTheme, Avatar, Stack, Chip } from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  ChevronRight,
  ArrowBack,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import NotificationSettings from '../components/common/NotificationSettings';
import AccountSettings from '../components/common/AccountSettings';
import SecuritySettings from '../components/common/SecuritySettings';
import PrivacySettings from '../components/common/PrivacySettings';
import { useSettings } from '../hooks/useSettings';
import { Helmet } from 'react-helmet-async';
import { useBreakpointUp } from '@/hooks/useResponsive';
import PageCanvas from '../../common/components/PageCanvas';

const SettingsPage = () => {
  const {
    settings,
    loading,
    error,
    updateNotificationPreferences,
    updatePrivacySettings,
  } =
    useSettings();
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
      description: 'Choose how you receive app, SMS, push, and email alerts.',
      icon: <NotificationsIcon />,
    },
    {
      component: <AccountSettings />,
      label: 'Account',
      description: 'Update your name, contact details, and profile information.',
      icon: <AccountCircleIcon />,
    },
    {
      component: <SecuritySettings />,
      label: 'Security & Password',
      description: 'Change password and strengthen sign-in protection.',
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
      description: 'Control who can find your profile and see your activity.',
      icon: <ShieldIcon />,
    },
  ];

  // Persist tab state to URL hash for deep linking
  const initialTab = (() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      const idx = settingsPanels.findIndex((p) => p.label.toLowerCase() === hash.toLowerCase());
      return idx >= 0 ? idx : 0;
    }
    return 0;
  })();
  const [tabValue, setTabValue] = useState(initialTab);
  const theme = useTheme();
  const isMdUp = useBreakpointUp('md');
  const { user } = useSelector((state) => state.auth);

  const userDisplayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || 'Kelmah User';
  const userInitials = ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() || user?.email?.[0]?.toUpperCase() || 'K';

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (typeof window !== 'undefined') {
      window.location.hash = settingsPanels[newValue].label.toLowerCase();
    }
  };

  // Mobile: drill-down state (-1 = show list, 0+ = show section)
  const [mobileSection, setMobileSection] = useState(-1);
  const isMobile = !isMdUp;

  // ── Mobile: List → drill-down pattern (Binance style) ──
  if (isMobile) {
    // Showing a specific section
    if (mobileSection >= 0) {
      const panel = settingsPanels[mobileSection];
      return (
        <PageCanvas disableContainer sx={{ pt: { xs: 1, md: 4 }, pb: { xs: 10, md: 4 }, overflowX: 'clip' }}>
          <Container maxWidth="lg" sx={{ py: 1, px: 1.25, color: 'text.primary', width: '100%', minWidth: 0 }}>
            <Helmet><title>Settings | Kelmah</title></Helmet>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 0.5, position: 'sticky', top: 56, zIndex: 10, py: 0.5, backgroundColor: 'background.default', minWidth: 0 }}>
              <IconButton
                onClick={() => setMobileSection(-1)}
                sx={{
                  mr: 0.5,
                  '&:focus-visible': {
                    outline: `3px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2,
                  },
                }}
                aria-label="Go back"
              >
                <ArrowBack />
              </IconButton>
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  {panel.icon}
                  <Typography variant="h6" fontWeight="bold">
                    {panel.label}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {panel.description}
                </Typography>
              </Box>
            </Box>
            <Paper sx={{ p: { xs: 1, sm: 2 }, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
              {panel.component}
            </Paper>

            <Paper
              elevation={8}
              sx={(theme) => ({
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: theme.zIndex.appBar + 2,
                px: 1,
                py: 1,
                borderTop: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
              })}
            >
              <Button fullWidth variant="contained" onClick={() => setMobileSection(-1)} sx={{ minHeight: 42 }}>
                Back To All Settings
              </Button>
            </Paper>
          </Container>
        </PageCanvas>
      );
    }

    // Showing the settings list
    return (
      <PageCanvas disableContainer sx={{ pt: 1, pb: { xs: 2, md: 4 } }}>
        <Container maxWidth="lg" sx={{ py: 1.5, px: 1.25, color: 'text.primary' }}>
          <Helmet><title>Settings | Kelmah</title></Helmet>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, position: 'sticky', top: 56, zIndex: 10, py: 0.5, backgroundColor: 'background.default' }}>
            <SettingsIcon sx={{ fontSize: 28, mr: 1.5, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight="bold">
              Settings
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.8rem' }}>
            Open one section at a time to update your account quickly.
          </Typography>
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              mb: 1.5,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              background: (currentTheme) =>
                `linear-gradient(135deg, ${alpha(currentTheme.palette.primary.main, 0.12)} 0%, ${alpha(currentTheme.palette.background.paper, 1)} 100%)`,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }}>
                {userInitials}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={700} noWrap>
                  {userDisplayName}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {user?.email || 'Account settings'}
                </Typography>
                <Chip label="Update profile, alerts, privacy, and security" size="small" sx={{ mt: 1, fontWeight: 600 }} />
              </Box>
            </Stack>
          </Paper>
          <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <List disablePadding>
              {settingsPanels.map((panel, index) => (
                <ListItemButton
                  key={panel.label}
                  onClick={() => setMobileSection(index)}
                  sx={{
                    py: 1.25,
                    borderBottom: index < settingsPanels.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    '&:focus-visible': {
                      outline: `3px solid ${theme.palette.primary.main}`,
                      outlineOffset: -2,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                    {panel.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={panel.label}
                    secondary={panel.description}
                    primaryTypographyProps={{ fontWeight: 600 }}
                    secondaryTypographyProps={{ color: 'text.secondary', sx: { mt: 0.25 } }}
                  />
                  <ChevronRight sx={{ color: 'text.secondary' }} />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Container>
      </PageCanvas>
    );
  }

  // ── Desktop: Sidebar tabs + content (unchanged) ──
  return (
    <PageCanvas disableContainer sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 2, md: 4 } }}>
        <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1.5, sm: 3 }, color: 'text.primary', width: '100%', minWidth: 0 }}>
        <Helmet><title>Settings | Kelmah</title></Helmet>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 4 }, minWidth: 0 }}>
          <SettingsIcon sx={{ fontSize: { xs: 28, md: 36 }, mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Settings
          </Typography>
        </Box>

      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: (currentTheme) =>
            `linear-gradient(135deg, ${alpha(currentTheme.palette.primary.main, 0.08)} 0%, ${alpha(currentTheme.palette.background.paper, 1)} 100%)`,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }}>
            {userInitials}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {userDisplayName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email || 'Keep your account secure and up to date.'}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Grid container spacing={{ xs: 2.5, md: 4 }} sx={{ minWidth: 0, width: '100%' }}>
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
              maxHeight: isMdUp ? 'calc(100dvh - 140px)' : 'none',
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
                '& .MuiTabs-flexContainer': {
                  gap: 0.25,
                },
                '& .MuiTab-root': {
                  justifyContent: 'flex-start',
                  fontWeight: '600',
                  textTransform: 'none',
                  minHeight: isMdUp ? 64 : 52,
                  minWidth: isMdUp ? 'auto' : 44,
                  '&:focus-visible': {
                    outline: `3px solid ${theme.palette.primary.main}`,
                    outlineOffset: -2,
                  },
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
                  sx={{ minHeight: 44 }}
                />
              ))}
            </Tabs>
          </Paper>
        </Grid>
        <Grid item xs={12} md={9} sx={{ minWidth: 0 }}>
          <Box sx={{ minWidth: 0, width: '100%' }}>{settingsPanels[tabValue].component}</Box>
        </Grid>
      </Grid>
      </Container>
    </PageCanvas>
  );
};

export default SettingsPage;

