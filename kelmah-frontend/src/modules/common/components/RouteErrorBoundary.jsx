/* eslint-disable react/prop-types */
import React from 'react';
import { Box, Typography, Button, Paper, Chip, Stack } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';
import { devError } from '@/modules/common/utils/devLogger';

const createIncidentId = () =>
  `KEL-RT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

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

/**
 * Per-route React Error Boundary.
 * Catches render errors in child components and shows a recoverable UI
 * instead of crashing the entire application.
 */
class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      incidentId: null,
      capturedAt: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState((prevState) => {
      if (prevState.incidentId) return null;

      return {
        incidentId: createIncidentId(),
        capturedAt: new Date().toISOString(),
      };
    });

    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_FRONTEND === 'true') {
      devError(
        `[RouteErrorBoundary] Error in ${this.props.label || 'route'}:`,
        error,
        errorInfo,
      );
    }
  }

  isChunkLoadFailure = () => {
    const message = String(this.state?.error?.message || '');
    const name = String(this.state?.error?.name || '');

    return (
      /Loading chunk [\d]+ failed/i.test(message) ||
      /ChunkLoadError/i.test(name) ||
      /Failed to fetch dynamically imported module/i.test(message)
    );
  };

  shouldEscalateToGlobalBoundary = () => {
    const name = String(this.state?.error?.name || '');
    const message = String(this.state?.error?.message || '');

    return (
      name === 'KelmahProfileGlobalFallbackSimulationError' ||
      /\[kelmah-global-fallback\]/i.test(message)
    );
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      incidentId: null,
      capturedAt: null,
    });
  };

  hardReload = () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.location.reload();
    } catch {
      window.location.assign(window.location.href);
    }
  };

  navigateToHome = () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const targetPath = '/';
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (currentPath === targetPath) {
        this.handleReset();
        return;
      }

      if (window.history && typeof window.history.pushState === 'function') {
        window.history.pushState({}, '', targetPath);
        window.dispatchEvent(new PopStateEvent('popstate'));
        return;
      }
    } catch {
      // No-op: avoid forcing a hard navigation when router state is recoverable.
    }
  };

  openHelpCenter = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const { incidentId } = this.state;
    const helpPath = incidentId
      ? `/help?incident=${encodeURIComponent(incidentId)}`
      : '/help';

    try {
      window.location.assign(helpPath);
    } catch {
      window.location.href = helpPath;
    }
  };

  openSupportReport = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const { incidentId } = this.state;
    const areaKey = String(this.props.label || 'route')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');

    const query = new URLSearchParams({
      source: areaKey,
      ...(incidentId ? { incident: incidentId } : {}),
    });

    const supportPath = `/support?${query.toString()}`;

    try {
      window.location.assign(supportPath);
    } catch {
      window.location.href = supportPath;
    }
  };

  navigateToProfileSummary = () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const targetPath = '/worker/profile';
      if (window.history && typeof window.history.pushState === 'function') {
        window.history.pushState({}, '', targetPath);
        window.dispatchEvent(new PopStateEvent('popstate'));
        return;
      }

      window.location.assign(targetPath);
    } catch {
      window.location.href = '/worker/profile';
    }
  };

  render() {
    if (this.state.hasError && this.shouldEscalateToGlobalBoundary()) {
      throw this.state.error;
    }

    if (this.state.hasError) {
      const chunkFailure = this.isChunkLoadFailure();
      const { incidentId, capturedAt, error } = this.state;
      const sectionLabel = this.props.label || 'This section';
      const isProfileEditorArea = /profile\s*editor/i.test(sectionLabel);
      const supportPath = incidentId
        ? `/support?incident=${encodeURIComponent(incidentId)}`
        : '/support';

      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={isProfileEditorArea ? '100dvh' : 320}
          p={{ xs: 2, sm: 3 }}
          sx={
            isProfileEditorArea
              ? {
                  position: 'fixed',
                  inset: 0,
                  zIndex: 1800,
                  bgcolor: 'background.default',
                }
              : undefined
          }
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.75, sm: 4 },
              textAlign: 'center',
              maxWidth: 620,
              width: '100%',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
            role="alert"
          >
            <ErrorIcon color="error" sx={{ fontSize: 46, mb: 1.5 }} />
            <Typography variant="h6" component="h1" gutterBottom>
              {chunkFailure
                ? 'Unable to load this screen'
                : isProfileEditorArea
                  ? 'Profile editor is temporarily unavailable'
                  : `${sectionLabel} is temporarily unavailable`}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              {chunkFailure
                ? 'A temporary app loading issue occurred. Retry first. If it persists, reload the app to fetch the latest files.'
                : isProfileEditorArea
                  ? 'Your profile details are still safe. This edit screen failed while loading, so use the recovery options below to continue without losing progress context.'
                  : 'This area ran into an unexpected issue while rendering.'}{' '}
              You can retry immediately, or go to a safe page while we recover
              the state.
            </Typography>

            {isProfileEditorArea && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2.25 }}
              >
                If retry still fails, open your profile summary and continue
                from a stable screen while support investigates the incident.
              </Typography>
            )}

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              justifyContent="center"
              sx={{ mb: 2 }}
            >
              <Chip
                size="small"
                variant="outlined"
                label={`Area: ${sectionLabel}`}
              />
              <Chip
                size="small"
                label={chunkFailure ? 'Chunk load issue' : 'Route render error'}
                color={chunkFailure ? 'warning' : 'default'}
                variant={chunkFailure ? 'filled' : 'outlined'}
              />
              {incidentId && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Incident ${incidentId}`}
                />
              )}
            </Stack>

            {incidentId && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 2.5 }}
              >
                Incident {incidentId} recorded at {formatCapturedAt(capturedAt)}
              </Typography>
            )}

            <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
              <Button
                variant="contained"
                onClick={this.handleReset}
                sx={{
                  minHeight: 44,
                  '&:focus-visible': {
                    outline: '3px solid currentColor',
                    outlineOffset: 2,
                  },
                }}
              >
                {chunkFailure ? 'Retry Route' : 'Try Again'}
              </Button>
              {isProfileEditorArea && (
                <Button
                  variant="outlined"
                  onClick={this.navigateToProfileSummary}
                  sx={{
                    minHeight: 44,
                    '&:focus-visible': {
                      outline: '3px solid currentColor',
                      outlineOffset: 2,
                    },
                  }}
                >
                  Open Profile Summary
                </Button>
              )}
              {chunkFailure && (
                <Button
                  variant="outlined"
                  onClick={this.hardReload}
                  sx={{
                    minHeight: 44,
                    '&:focus-visible': {
                      outline: '3px solid currentColor',
                      outlineOffset: 2,
                    },
                  }}
                >
                  Reload App
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={this.openHelpCenter}
                sx={{
                  minHeight: 44,
                  '&:focus-visible': {
                    outline: '3px solid currentColor',
                    outlineOffset: 2,
                  },
                }}
              >
                Help
              </Button>
              <Button
                variant="text"
                onClick={this.openSupportReport}
                sx={{
                  minHeight: 44,
                  '&:focus-visible': {
                    outline: '3px solid currentColor',
                    outlineOffset: 2,
                  },
                }}
              >
                Report Issue
              </Button>
              <Button
                variant="outlined"
                onClick={this.navigateToHome}
                sx={{
                  minHeight: 44,
                  '&:focus-visible': {
                    outline: '3px solid currentColor',
                    outlineOffset: 2,
                  },
                }}
              >
                Go Home
              </Button>
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1.75, display: 'block' }}
            >
              Need direct help? Use{' '}
              <Box
                component="a"
                href={supportPath}
                sx={{ color: 'inherit', fontWeight: 700 }}
              >
                Support
              </Box>{' '}
              and include your incident ID.
            </Typography>

            {error?.message && import.meta.env.DEV && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 2, display: 'block' }}
              >
                Debug: {error.message}
              </Typography>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
