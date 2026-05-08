import { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  Divider,
  Alert,
  useTheme,
} from '@mui/material';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Link as RouterLink } from 'react-router-dom';
import {
  checkServiceHealth,
  getServiceStatusMessage,
} from '../../../utils/serviceHealthCheck';
import { BRAND_COLORS } from '../../../theme';
import { devError, devWarn } from '@/modules/common/utils/devLogger';

const createIncidentId = () =>
  `KEL-GE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const formatCapturedAt = (isoValue) => {
  if (!isoValue) return 'Unknown time';

  try {
    return new Date(isoValue).toLocaleString('en-GH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown time';
  }
};

const detectFailureCategory = (error) => {
  const message = String(error?.message || '').toLowerCase();
  const name = String(error?.name || '').toLowerCase();

  if (name.includes('chunk') || message.includes('chunk')) {
    return 'App update required';
  }

  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout')
  ) {
    return 'Network interruption';
  }

  if (message.includes('unauthorized') || message.includes('forbidden')) {
    return 'Session authorization';
  }

  return 'Unexpected runtime error';
};

class GlobalErrorBoundaryInner extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      incidentId: null,
      capturedAt: null,
      failureCategory: 'Unexpected runtime error',
      status: getServiceStatusMessage('aggregate'),
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState((prevState) => {
      if (prevState.incidentId) {
        return null;
      }

      return {
        incidentId: createIncidentId(),
        capturedAt: new Date().toISOString(),
        failureCategory: detectFailureCategory(error),
      };
    });

    devError('GlobalErrorBoundary caught an error:', error, info);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.resetBoundary();
    }

    if (this.state.hasError && !prevState.hasError) {
      this.updateStatus();
    }
  }

  updateStatus = async () => {
    try {
      await checkServiceHealth('aggregate', 10000);
      this.setState({ status: getServiceStatusMessage('aggregate') });
    } catch (error) {
      devWarn('GlobalErrorBoundary status check failed:', error);
    }
  };

  resetBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      incidentId: null,
      capturedAt: null,
      failureCategory: 'Unexpected runtime error',
    });
    this.props.onReset?.();
  };

  handleRetry = () => {
    this.resetBoundary();
  };

  handleHardReload = () => {
    if (typeof window === 'undefined') {
      this.resetBoundary();
      return;
    }

    try {
      window.location.reload();
    } catch {
      window.location.assign(window.location.href);
    }
  };

  renderFallback(theme) {
    const { status, error, incidentId, capturedAt, failureCategory } =
      this.state;
    const currentPath =
      typeof window !== 'undefined' ? window.location.pathname || '/' : '/';
    const isProfileEditContext =
      currentPath.startsWith('/worker/profile/edit') ||
      currentPath.startsWith('/profile/upload-cv');
    const screenContextLabel = isProfileEditContext
      ? 'Profile editing'
      : 'Current screen';
    const statusChipPalette = {
      healthy: {
        label: 'Platform Operational',
        color: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : '#2e7d32',
        bg:
          theme.palette.mode === 'dark'
            ? 'rgba(255,215,0,0.12)'
            : 'rgba(46,125,50,0.12)',
      },
      cold: {
        label: 'Services Warming Up',
        color: '#ef6c00',
        bg: 'rgba(255,152,0,0.15)',
      },
      error: {
        label: 'Service Disruption',
        color: '#c62828',
        bg: 'rgba(244,67,54,0.12)',
      },
      checking: {
        label: 'Checking Status...',
        color: '#0288d1',
        bg: 'rgba(3,169,244,0.12)',
      },
      unknown: {
        label: 'Status Unknown',
        color: theme.palette.text.primary,
        bg: 'rgba(158,158,158,0.2)',
      },
    };

    const chipConfig =
      statusChipPalette[status.status] || statusChipPalette.unknown;
    const helpPath = incidentId
      ? `/help?incident=${encodeURIComponent(incidentId)}`
      : '/help';
    const supportPath = incidentId
      ? `/support?incident=${encodeURIComponent(incidentId)}`
      : '/support';

    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 6,
          backgroundColor:
            theme.palette.mode === 'dark'
              ? BRAND_COLORS.blackDark
              : theme.palette.grey[50],
        }}
      >
        <Box
          sx={{
            maxWidth: 640,
            width: '100%',
            backgroundColor:
              theme.palette.mode === 'dark'
                ? BRAND_COLORS.blackMedium
                : theme.palette.common.white,
            borderRadius: 4,
            p: { xs: 3, md: 5 },
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 25px 60px rgba(0,0,0,0.8)'
                : '0 25px 60px rgba(0,0,0,0.12)',
            border:
              theme.palette.mode === 'dark'
                ? '1px solid rgba(255,215,0,0.25)'
                : '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <WarningAmberIcon
                sx={{
                  fontSize: 40,
                  color:
                    theme.palette.mode === 'dark'
                      ? BRAND_COLORS.gold
                      : BRAND_COLORS.black,
                }}
              />
              <Box>
                <Typography
                  variant="h4"
                  component="h1"
                  fontWeight={800}
                  gutterBottom
                >
                  Something went wrong
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  The app hit an unexpected problem and stopped this view. Your
                  account and job data are still safe.
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              alignItems="center"
            >
              <Chip
                icon={<SupportAgentIcon />}
                label={`${chipConfig.label} - ${status.message}`}
                sx={{
                  width: 'fit-content',
                  backgroundColor: chipConfig.bg,
                  color: chipConfig.color,
                  fontWeight: 600,
                }}
              />
              <Chip
                variant="outlined"
                label={failureCategory}
                sx={{ fontWeight: 600 }}
              />
              <Chip
                variant="outlined"
                label={`${screenContextLabel} interrupted`}
                sx={{ fontWeight: 600 }}
              />
              {incidentId && (
                <Chip
                  variant="outlined"
                  label={`Incident ${incidentId}`}
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Stack>

            {incidentId && (
              <Alert severity="info" sx={{ alignItems: 'center' }}>
                Share incident ID <strong>{incidentId}</strong> with support.
                Captured at {formatCapturedAt(capturedAt)}.
              </Alert>
            )}

            {isProfileEditContext && (
              <Alert severity="warning" sx={{ alignItems: 'center' }}>
                Your profile data is safe. Unsaved edits on this screen may need
                to be re-entered after recovery.
              </Alert>
            )}

            {error && import.meta.env.DEV && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(0,0,0,0.4)'
                      : theme.palette.grey[100],
                  fontFamily: 'JetBrains Mono, SFMono-Regular, monospace',
                  fontSize: '0.85rem',
                }}
              >
                {error.message || 'Unknown runtime error'}
              </Box>
            )}

            <Divider />

            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Next steps
              </Typography>
              <Typography variant="body2" color="text.secondary">
                1. Retry this screen now.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                2. If the issue persists, open Help with the incident ID.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                3. Reload the app after updates or network recovery.
              </Typography>
              {isProfileEditContext && (
                <Typography variant="body2" color="text.secondary">
                  4. Continue from profile summary while this edit view
                  recovers.
                </Typography>
              )}
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ReplayRoundedIcon />}
                onClick={this.handleRetry}
                fullWidth
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                size="large"
                component={RouterLink}
                to="/"
                startIcon={<HomeRoundedIcon />}
                fullWidth
              >
                Go Home
              </Button>
            </Stack>

            {isProfileEditContext && (
              <Button
                variant="outlined"
                size="large"
                component={RouterLink}
                to="/worker/profile"
                startIcon={<HomeRoundedIcon />}
                fullWidth
              >
                Open Profile Summary
              </Button>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
              <Button
                variant="text"
                size="large"
                component={RouterLink}
                to={helpPath}
                startIcon={<SupportAgentIcon />}
              >
                Open Help Center
              </Button>
              <Button
                variant="text"
                size="large"
                onClick={this.handleHardReload}
                startIcon={<RefreshRoundedIcon />}
              >
                Reload App
              </Button>
              <Button
                variant="text"
                size="large"
                component={RouterLink}
                to={supportPath}
                startIcon={<SupportAgentIcon />}
              >
                Report Issue
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>
    );
  }

  render() {
    const { hasError } = this.state;
    const theme = this.props.theme;

    if (hasError) {
      return this.renderFallback(theme);
    }

    return this.props.children;
  }
}

GlobalErrorBoundaryInner.propTypes = {
  children: PropTypes.node.isRequired,
  resetKey: PropTypes.string,
  onReset: PropTypes.func,
  theme: PropTypes.object.isRequired,
};

const GlobalErrorBoundary = (props) => {
  const theme = useTheme();
  return <GlobalErrorBoundaryInner {...props} theme={theme} />;
};

GlobalErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  resetKey: PropTypes.string,
  onReset: PropTypes.func,
};

export default GlobalErrorBoundary;
