import { useState } from 'react';
import {
  Button,
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  alpha,
  useTheme,
  Avatar,
  Stack,
  TextField,
  InputAdornment,
  Chip,
  Alert,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  ChevronRight,
  ArrowBack,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import NotificationSettings from '../components/common/NotificationSettings';
import AccountSettings from '../components/common/AccountSettings';
import SecuritySettings from '../components/common/SecuritySettings';
import PrivacySettings from '../components/common/PrivacySettings';
import { useSettings } from '../hooks/useSettings';
import { Helmet } from 'react-helmet-async';
import { useBreakpointUp } from '@/hooks/useResponsive';
import { HEADER_HEIGHT_MOBILE, Z_INDEX } from '@/constants/layout';
import {
  withBottomNavSafeArea,
  withSafeAreaBottom,
  withSafeAreaTop,
} from '@/utils/safeArea';
import PageCanvas from '../../common/components/PageCanvas';

const SettingsPage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const {
    settings,
    loading,
    error,
    updateNotificationPreferences,
    updatePrivacySettings,
  } = useSettings();
  const settingsPanels = [
    {
      id: 'notifications',
      component: (
        <NotificationSettings
          settings={settings}
          loading={loading}
          error={error}
          updateNotificationPreferences={updateNotificationPreferences}
        />
      ),
      label: 'Notifications',
      summary: 'Manage app, SMS, push, and email alerts.',
      description: 'Choose how you receive app, SMS, push, and email alerts.',
      icon: <NotificationsIcon />,
      keywords: ['alerts', 'sms', 'email', 'push', 'in-app'],
    },
    {
      id: 'account',
      component: <AccountSettings />,
      label: 'Account',
      summary: 'Update your profile and contact details.',
      description:
        'Update your name, contact details, and profile information.',
      icon: <AccountCircleIcon />,
      keywords: ['profile', 'name', 'email', 'contact'],
    },
    {
      id: 'security-password',
      component: <SecuritySettings />,
      label: 'Security & Password',
      summary: 'Change password and sign-in protection.',
      description: 'Change password and strengthen sign-in protection.',
      icon: <SecurityIcon />,
      keywords: ['password', '2fa', 'sign-in', 'login', 'auth'],
    },
    {
      id: 'privacy',
      component: (
        <PrivacySettings
          settings={settings}
          loading={loading}
          updatePrivacySettings={updatePrivacySettings}
        />
      ),
      label: 'Privacy',
      summary: 'Control profile visibility and activity settings.',
      description: 'Control who can find your profile and see your activity.',
      icon: <ShieldIcon />,
      keywords: ['visibility', 'profile', 'discoverability', 'activity'],
    },
  ];

  // Persist tab state to URL hash for deep linking
  const initialTab = (() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      const idx = settingsPanels.findIndex(
        (p) => p.label.toLowerCase() === hash.toLowerCase(),
      );
      return idx >= 0 ? idx : 0;
    }
    return 0;
  })();
  const [tabValue, setTabValue] = useState(initialTab);
  const navigate = useNavigate();
  const isMdUp = useBreakpointUp('md');
  const { user } = useSelector((state) => state.auth);
  const mobileStickyTop = `calc(${withSafeAreaTop(HEADER_HEIGHT_MOBILE)} + var(--kelmah-network-banner-offset, 0px))`;

  const userDisplayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.name ||
    'Kelmah User';
  const userInitials =
    (
      (user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')
    ).toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    'K';
  const completedProfileFields = [
    user?.firstName,
    user?.lastName,
    user?.email,
    user?.phone,
    user?.location,
  ].filter((value) => Boolean(String(value || '').trim())).length;
  const profileCompleteness = Math.min(
    100,
    Math.round((completedProfileFields / 5) * 100),
  );

  const notificationsState =
    settings?.notifications || settings?.notificationPreferences || {};
  const enabledNotificationChannels = [];
  if (
    notificationsState.email ||
    notificationsState.emailEnabled ||
    notificationsState.emailNotifications
  ) {
    enabledNotificationChannels.push('Email');
  }
  if (
    notificationsState.push ||
    notificationsState.pushEnabled ||
    notificationsState.pushNotifications
  ) {
    enabledNotificationChannels.push('Push');
  }
  if (
    notificationsState.sms ||
    notificationsState.smsEnabled ||
    notificationsState.smsNotifications
  ) {
    enabledNotificationChannels.push('SMS');
  }
  const notificationsPreview = enabledNotificationChannels.length
    ? enabledNotificationChannels.join(', ')
    : 'No channels enabled yet';

  const privacyState = settings?.privacy || settings?.privacySettings || {};
  const rawVisibilityValue =
    privacyState.profileVisibility || privacyState.visibility || '';
  const visibilityLabel = rawVisibilityValue
    ? String(rawVisibilityValue)
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (part) => part.toUpperCase())
    : 'Not set';
  const privacyPreview = `Visibility: ${visibilityLabel}`;

  const panelStatusText = {
    notifications: notificationsPreview,
    account: `Profile ${profileCompleteness}% complete`,
    'security-password': 'Password and sign-in controls',
    privacy: privacyPreview,
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (typeof window !== 'undefined') {
      window.location.hash = settingsPanels[newValue].label.toLowerCase();
    }
  };

  // Mobile: drill-down state (-1 = show list, 0+ = show section)
  const [mobileSection, setMobileSection] = useState(-1);
  const [settingsSearch, setSettingsSearch] = useState('');
  const isMobile = !isMdUp;
  const normalizedSettingsSearch = settingsSearch.trim().toLowerCase();
  const matchedSettingsPanels = normalizedSettingsSearch
    ? settingsPanels.filter((panel) =>
        [
          panel.label,
          panel.summary,
          panel.description,
          ...(panel.keywords || []),
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSettingsSearch),
      )
    : settingsPanels;

  const openPanelById = (panelId, useMobile = false) => {
    const panelIndex = settingsPanels.findIndex(
      (panel) => panel.id === panelId,
    );
    if (panelIndex < 0) return;

    if (useMobile) {
      setMobileSection(panelIndex);
      return;
    }

    setTabValue(panelIndex);
    if (typeof window !== 'undefined') {
      window.location.hash = settingsPanels[panelIndex].label.toLowerCase();
    }
  };

  // ── Mobile: List → drill-down pattern (Binance style) ──
  if (isMobile) {
    // Showing a specific section
    if (mobileSection >= 0) {
      const panel = settingsPanels[mobileSection];
      return (
        <PageCanvas
          disableContainer
          sx={{
            pt: { xs: 1, md: 4 },
            pb: { xs: withBottomNavSafeArea(96), md: 6 },
            overflowX: 'clip',
          }}
        >
          <Container
            maxWidth="lg"
            sx={{
              py: 1,
              pb: { xs: 12, sm: 10 },
              px: 1.25,
              color: 'text.primary',
              width: '100%',
              minWidth: 0,
            }}
          >
            <Helmet>
              <title>Settings | Kelmah</title>
            </Helmet>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 1.5,
                gap: 0.5,
                position: 'sticky',
                top: mobileStickyTop,
                zIndex: Z_INDEX.sticky,
                py: 0.5,
                backgroundColor: 'background.default',
                minWidth: 0,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
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
                  <Typography variant="h6" component="h1" fontWeight="bold">
                    {panel.label}
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {panel.description}
                </Typography>
              </Box>
            </Box>
            <Paper
              sx={{
                p: { xs: 1.25, sm: 2 },
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {panel.component}
            </Paper>

            <Paper
              elevation={8}
              sx={(theme) => ({
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: withBottomNavSafeArea(0),
                zIndex: Z_INDEX.stickyCta,
                px: 1.25,
                py: 1,
                pb: withSafeAreaBottom(8),
                borderTop: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
              })}
            >
              <Button
                fullWidth
                variant="contained"
                onClick={() => setMobileSection(-1)}
                sx={{ minHeight: 44 }}
              >
                Back To All Settings
              </Button>
            </Paper>
          </Container>
        </PageCanvas>
      );
    }

    // Showing the settings list
    return (
      <PageCanvas
        disableContainer
        sx={{
          pt: 1,
          pb: { xs: withBottomNavSafeArea(40), md: 6 },
          overflowX: 'clip',
        }}
      >
        <Container
          maxWidth="lg"
          sx={{ py: 1.25, px: 1.25, color: 'text.primary' }}
        >
          <Helmet>
            <title>Settings | Kelmah</title>
          </Helmet>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 1.2,
              py: 0.25,
              minHeight: 44,
              minWidth: 0,
              flexWrap: 'wrap',
            }}
          >
            <SettingsIcon
              sx={{ fontSize: 24, mr: 1.25, color: 'primary.main' }}
            />
            <Typography variant="h6" component="h1" fontWeight={800}>
              Account Snapshot
            </Typography>
          </Box>
          <Paper
            elevation={1}
            sx={{
              p: 1.65,
              mb: 1.5,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              background: (currentTheme) =>
                `linear-gradient(135deg, ${alpha(currentTheme.palette.primary.main, 0.12)} 0%, ${alpha(currentTheme.palette.background.paper, 1)} 100%)`,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 700,
                }}
              >
                {userInitials}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  sx={{ lineHeight: 1.3, overflowWrap: 'anywhere' }}
                >
                  {userDisplayName}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ overflowWrap: 'anywhere' }}
                >
                  {user?.email || 'Account settings'}
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.75}
                  useFlexGap
                  flexWrap="wrap"
                  sx={{ mt: 1 }}
                >
                  <Chip
                    size="small"
                    sx={{ fontWeight: 700 }}
                    label={`Profile ${profileCompleteness}% complete`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    sx={{ fontWeight: 700 }}
                    label="Security and privacy"
                    variant="outlined"
                  />
                </Stack>
              </Box>
            </Stack>
          </Paper>
          <Paper
            elevation={1}
            sx={{
              p: 1.25,
              mb: 1.5,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <TextField
              fullWidth
              value={settingsSearch}
              onChange={(event) => setSettingsSearch(event.target.value)}
              placeholder="Search settings"
              size="small"
              inputProps={{ 'aria-label': 'Search settings options' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputBase-root': { minHeight: 44 },
                '& .MuiInputBase-input': { minHeight: 44, py: 1.2 },
              }}
            />
            <Stack
              direction="row"
              spacing={0.8}
              useFlexGap
              flexWrap="wrap"
              sx={{ mt: 1.2 }}
            >
              <Chip
                size="small"
                variant="outlined"
                label={`${settingsPanels.length} sections`}
              />
              {normalizedSettingsSearch && (
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={`${matchedSettingsPanels.length} matches`}
                />
              )}
            </Stack>
          </Paper>

          <Paper
            elevation={1}
            sx={{
              p: 1.25,
              mb: 1.5,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="overline"
              sx={{
                color: 'text.secondary',
                fontWeight: 800,
                letterSpacing: 0.6,
              }}
            >
              Quick Access
            </Typography>
            <Stack
              direction="row"
              spacing={0.8}
              useFlexGap
              flexWrap="wrap"
              sx={{ mt: 1 }}
            >
              <Chip
                clickable
                color="primary"
                variant="outlined"
                label="Help & Support"
                onClick={() => navigate('/support')}
                sx={{ minHeight: 44 }}
              />
              <Chip
                clickable
                variant="outlined"
                label="Privacy Guide"
                onClick={() => navigate('/docs')}
                sx={{ minHeight: 44 }}
              />
              <Chip
                clickable
                variant="outlined"
                label="Accessibility Tips"
                onClick={() => navigate('/support#accessibility')}
                sx={{ minHeight: 44 }}
              />
            </Stack>
          </Paper>

          {matchedSettingsPanels.length === 0 ? (
            <Alert
              severity="info"
              sx={{ borderRadius: 2.5 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setSettingsSearch('')}
                >
                  Clear
                </Button>
              }
            >
              No setting matched &quot;{settingsSearch}&quot;. Try a different
              keyword.
            </Alert>
          ) : (
            <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <List disablePadding>
                {matchedSettingsPanels.map((panel, index) => {
                  const panelStatus = panelStatusText[panel.id];

                  return (
                    <ListItemButton
                      key={panel.id}
                      onClick={() => openPanelById(panel.id, true)}
                      sx={{
                        py: 1.35,
                        minHeight: 86,
                        alignItems: 'flex-start',
                        borderBottom:
                          index < matchedSettingsPanels.length - 1
                            ? '1px solid'
                            : 'none',
                        borderColor: 'divider',
                        bgcolor:
                          index % 2 === 0
                            ? alpha(theme.palette.primary.main, 0.03)
                            : 'background.paper',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.07),
                        },
                        '&:focus-visible': {
                          outline: `3px solid ${theme.palette.primary.main}`,
                          outlineOffset: -2,
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{ minWidth: 42, color: 'primary.main', mt: 0.2 }}
                      >
                        {panel.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={panel.label}
                        secondary={
                          panelStatus
                            ? `${panel.summary} Current: ${panelStatus}.`
                            : panel.summary || panel.description
                        }
                        primaryTypographyProps={{ fontWeight: 700 }}
                        secondaryTypographyProps={{
                          color: 'text.secondary',
                          sx: { mt: 0.35, lineHeight: 1.45 },
                        }}
                      />
                      <ChevronRight sx={{ color: 'primary.main', mt: 1.1 }} />
                    </ListItemButton>
                  );
                })}
              </List>
            </Paper>
          )}
        </Container>
      </PageCanvas>
    );
  }

  // ── Desktop: Sidebar tabs + content (unchanged) ──
  return (
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}
    >
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 2, md: 4 },
          px: { xs: 1.5, sm: 3 },
          color: 'text.primary',
          width: '100%',
          minWidth: 0,
        }}
      >
        <Helmet>
          <title>Settings | Kelmah</title>
        </Helmet>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: { xs: 2, md: 4 },
            minWidth: 0,
          }}
        >
          <SettingsIcon
            sx={{
              fontSize: { xs: 28, md: 36 },
              mr: 1.5,
              color: 'primary.main',
            }}
          />
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}
          >
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
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontWeight: 700,
              }}
            >
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

          <Box
            sx={{
              mt: 2,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
              gap: 1.25,
              alignItems: 'center',
            }}
          >
            <TextField
              fullWidth
              value={settingsSearch}
              onChange={(event) => setSettingsSearch(event.target.value)}
              placeholder="Search for notification, password, privacy..."
              size="small"
              inputProps={{ 'aria-label': 'Search settings sections' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputBase-root': { minHeight: 44 },
                '& .MuiInputBase-input': { minHeight: 44, py: 1.2 },
              }}
            />
            <Stack
              direction="row"
              spacing={0.8}
              useFlexGap
              flexWrap="wrap"
              justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
            >
              <Chip
                size="small"
                variant="outlined"
                label={`${settingsPanels.length} sections`}
              />
              {normalizedSettingsSearch && (
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={`${matchedSettingsPanels.length} matches`}
                />
              )}
            </Stack>
          </Box>

          {normalizedSettingsSearch &&
            (matchedSettingsPanels.length > 0 ? (
              <Stack
                direction="row"
                spacing={0.9}
                useFlexGap
                flexWrap="wrap"
                sx={{ mt: 1.4 }}
              >
                {matchedSettingsPanels.map((panel) => (
                  <Chip
                    key={panel.id}
                    clickable
                    label={panel.label}
                    onClick={() => openPanelById(panel.id)}
                    variant="outlined"
                    color="primary"
                    sx={{ fontWeight: 700, minHeight: 32 }}
                  />
                ))}
              </Stack>
            ) : (
              <Alert severity="info" sx={{ mt: 1.4, borderRadius: 2 }}>
                No setting matched &quot;{settingsSearch}&quot;.
              </Alert>
            ))}
        </Paper>

        <Grid
          container
          spacing={{ xs: 2.5, md: 4 }}
          sx={{ minWidth: 0, width: '100%' }}
        >
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
            <Box sx={{ minWidth: 0, width: '100%' }}>
              {settingsPanels[tabValue].component}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </PageCanvas>
  );
};

export default SettingsPage;
