// IconButton focus-visible styling is enforced globally via MuiIconButton theme overrides.

import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  WorkOutline as WorkOutlineIcon,
} from '@mui/icons-material';
import { useBreakpointDown } from '@/hooks/useResponsive';
import { createFeatureLogger } from '@/modules/common/utils/devLogger';
import { currencyFormatter } from '@/modules/common/utils/formatters';
import applicationsService from '@/modules/worker/services/applicationsService';
import PageCanvas from '@/modules/common/components/PageCanvas';



























const workerDebugError = createFeatureLogger({
  flagName: 'VITE_DEBUG_WORKER',
  level: 'error',
});
const workerDebugWarn = createFeatureLogger({
  flagName: 'VITE_DEBUG_WORKER',
  level: 'warn',
});

const MyApplicationsPage = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openMessageDialog, setOpenMessageDialog] = useState(false);
  const [message, setMessage] = useState('');
  const theme = useTheme();

  const getApplicationLocationLabel = useCallback((application) => {
    const location = application?.job?.location;
    if (typeof location === 'string' && location.trim()) {
      return location;
    }
    if (location?.address) {
      return location.address;
    }
    if (location?.city) {
      return location.city;
    }
    return 'Location not specified';
  }, []);

  const getApplicationDateLabel = useCallback((application) => {
    const rawDate = application?.createdAt || application?.appliedDate;
    if (!rawDate) {
      return 'Date not available';
    }
    return new Date(rawDate).toLocaleDateString();
  }, []);

  const getApplicationRateLabel = useCallback((application) => {
    if (application?.proposedRate) {
      return currencyFormatter.format(application.proposedRate);
    }

    if (application?.job?.budget) {
      return currencyFormatter.format(application.job.budget);
    }

    return '\u2014';
  }, []);

  const getErrorMessage = useCallback((requestError) => {
    const apiMessage = requestError?.response?.data?.error?.message
      || requestError?.response?.data?.message;

    if (apiMessage) {
      return apiMessage;
    }

    if (!requestError?.response) {
      return 'We could not reach the applications service. Check your connection and try again.';
    }

    return 'We could not load your applications right now. Please try again.';
  }, []);

  const loadApplications = useCallback(async (isCancelled = () => false) => {
    setLoading(true);
    setError(null);

    try {
      const data = await applicationsService.getMyApplications();
      if (isCancelled()) return;
      setApplications(Array.isArray(data) ? data : []);
    } catch (requestError) {
      if (isCancelled()) return;
      workerDebugError('Error loading applications:', requestError);
      setApplications([]);
      setError(getErrorMessage(requestError));
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, [getErrorMessage]);

  // Load applications from API
  useEffect(() => {
    let cancelled = false;
    loadApplications(() => cancelled);
    return () => { cancelled = true; };
  }, [loadApplications]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const blurTriggerFocus = (event) => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (event?.currentTarget && typeof event.currentTarget.blur === 'function') {
      event.currentTarget.blur();
    }
  };

  // Open application details dialog
  const handleOpenDetails = (application, event) => {
    blurTriggerFocus(event);
    setSelectedApplication(application);
    setOpenDetailsDialog(true);
  };

  // Open message dialog
  const handleOpenMessage = (application, event) => {
    blurTriggerFocus(event);
    setSelectedApplication(application);
    setOpenMessageDialog(true);
  };

  // AUD2-C01 FIX: Rename to clarify this opens the Messages page with the draft pre-loaded.
  // The message is NOT sent here — it is saved as a draft and the user picks the conversation
  // and confirms in the Messages page. Renamed function + updated dialog copy to prevent
  // user confusion (old label "Send Message" was misleading).
  const handleComposeMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    const draftPayload = {
      text: trimmedMessage,
      source: 'my-applications',
      applicationId: selectedApplication?.id || selectedApplication?._id || null,
      jobId:
        selectedApplication?.job?._id ||
        selectedApplication?.job?.id ||
        null,
      jobTitle:
        selectedApplication?.job?.title ||
        selectedApplication?.jobTitle ||
        'Job Application',
      createdAt: new Date().toISOString(),
    };

    try {
      sessionStorage.setItem(
        'kelmah_message_draft',
        JSON.stringify(draftPayload),
      );
    } catch (storageError) {
      workerDebugWarn('Failed to persist message draft:', storageError);
    }

    setMessage('');
    setOpenMessageDialog(false);
    navigate('/messages');
  };

  // Filter applications based on current tab
  // Backend Application model statuses: pending, under_review, accepted, rejected, withdrawn
  const filteredApplications = Array.isArray(applications)
    ? applications.filter((app) => {
      if (tabValue === 0) return true; // All applications
      if (tabValue === 1) return app.status === 'pending';
      if (tabValue === 2) return app.status === 'under_review';
      if (tabValue === 3) return app.status === 'accepted';
      if (tabValue === 4) return app.status === 'rejected';
      if (tabValue === 5) return app.status === 'withdrawn';
      return false;
    })
    : [];

    const tabLabels = ['All', 'Pending', 'Under Review', 'Accepted', 'Rejected', 'Withdrawn'];
    const activeTabLabel = tabLabels[tabValue] || 'All';

  const applicationCounts = [
    { label: 'Pending', value: applications.filter((app) => app.status === 'pending').length },
    { label: 'Review', value: applications.filter((app) => app.status === 'under_review').length },
    { label: 'Accepted', value: applications.filter((app) => app.status === 'accepted').length },
  ];

  // Status label and color mapping — matches Application model enum
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          color: 'info',
          icon: <AccessTimeIcon fontSize="small" />,
        };
      case 'under_review':
        return {
          label: 'Under Review',
          color: 'primary',
          icon: <PersonIcon fontSize="small" />,
        };
      case 'accepted':
        return {
          label: 'Accepted',
          color: 'success',
          icon: <CheckCircleIcon fontSize="small" />,
        };
      case 'rejected':
        return {
          label: 'Rejected',
          color: 'error',
          icon: <CancelIcon fontSize="small" />,
        };
      case 'withdrawn':
        return {
          label: 'Withdrawn',
          color: 'warning',
          icon: <CancelIcon fontSize="small" />,
        };
      default:
        return {
          label: status || 'Unknown',
          color: 'default',
          icon: <AccessTimeIcon fontSize="small" />,
        };
    }
  };

  // Mobile detection
  const isActualMobile = useBreakpointDown('md');

  // Mobile applications view — uses MUI theme for consistency with desktop
  if (isActualMobile) {
    return (
      <PageCanvas disableContainer sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}>
      <Box
        sx={{
          minHeight: '100dvh',
          color: 'text.primary',
          pb: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Mobile Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'background.paper',
            p: 2,
            pt: `max(12px, env(safe-area-inset-top, 0px))`,
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={() => navigate(-1)}
              aria-label="Go back"
              color="primary"
              sx={{ minWidth: 44, minHeight: 44 , '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: '2px' }}}
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Typography
              color="primary"
              sx={{ fontSize: '1.125rem', fontWeight: 'bold' }}
            >
              My Applications
            </Typography>
          </Box>
        </Box>

        {/* Status Tabs */}
        <Box sx={{ px: 1.25, pt: 1.25 }}>
          <Paper
            elevation={0}
            sx={{
              p: 1.1,
              mb: 1.25,
              borderRadius: 3,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              position: 'sticky',
              top: 72,
              zIndex: 9,
            }}
          >
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, mb: 1 }}>
              Application summary
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {applicationCounts.map((item) => (
                <Chip
                  key={item.label}
                  label={`${item.label}: ${item.value}`}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              ))}
            </Stack>
          </Paper>
          <Box sx={{ display: 'flex', gap: 0.75, overflowX: 'auto', pb: 1.25, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
            {['All', 'Pending', 'Under Review', 'Accepted', 'Rejected', 'Withdrawn'].map(
              (status, index) => (
                <Chip
                  key={status}
                  label={status}
                  onClick={() => setTabValue(index)}
                  color={tabValue === index ? 'primary' : 'default'}
                  variant={tabValue === index ? 'filled' : 'outlined'}
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    minWidth: 'fit-content',
                    whiteSpace: 'nowrap',
                    height: 30,
                  }}
                />
              ),
            )}
          </Box>
        </Box>

        {/* Applications List */}
        <Box sx={{ px: 1.25 }}>
          <Typography
            sx={{ fontSize: '0.92rem', fontWeight: 'bold', mb: 1.25, color: 'text.secondary' }}
          >
            {activeTabLabel}: {filteredApplications.length}
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
                {error}
              </Alert>
              <Button
                variant="contained"
                color="primary"
                onClick={() => loadApplications()}
                sx={{ minHeight: 44 }}
              >
                Try Again
              </Button>
            </Box>
          ) : filteredApplications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <WorkOutlineIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary" sx={{ fontSize: '1rem', mb: 1 }}>
                No applications yet
              </Typography>
              <Typography color="text.disabled" sx={{ fontSize: '0.875rem', mb: 2 }}>
                Apply to jobs to see them here
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate('/jobs')}
                sx={{ minHeight: 44 }}
              >
                Browse Jobs
              </Button>
            </Box>
          ) : (
            filteredApplications.map((application) => {
              const statusInfo = getStatusInfo(application.status);

              return (
                <Paper
                  key={application.id || application._id}
                  elevation={1}
                  sx={{
                    borderRadius: 3,
                    p: 1.25,
                    mb: 1.25,
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 1,
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          sx={{ fontSize: '0.93rem', fontWeight: 'bold', mb: 0.35, lineHeight: 1.3 }}
                        >
                          {application.job?.title || application.jobTitle || 'Untitled Job'}
                        </Typography>
                        <Typography
                          color="text.secondary"
                          sx={{ fontSize: '0.78rem', mb: 0.35 }}
                        >
                          {application.job?.hirer?.firstName ? `${application.job.hirer.firstName} ${application.job.hirer.lastName || ''}`.trim() : application.company || 'Unknown'}
                        </Typography>
                        <Typography
                          color="text.disabled"
                          sx={{ fontSize: '0.7rem', mb: 0.75 }}
                        >
                          Location: {getApplicationLocationLabel(application)} | Applied {getApplicationDateLabel(application)}
                        </Typography>
                      </Box>
                      <Chip
                        icon={statusInfo.icon}
                        label={statusInfo.label}
                        color={statusInfo.color}
                        size="small"
                        sx={{ fontSize: '0.65rem', fontWeight: 'bold', height: 22 }}
                      />
                    </Box>

                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
                      {application.proposedRate ? (
                        <Chip label={`Rate: ${currencyFormatter.format(application.proposedRate)}`} size="small" variant="outlined" sx={{ height: 24 }} />
                      ) : null}
                      <Chip
                        label={application.job?.category || application.job?.trade || 'General work'}
                        size="small"
                        variant="outlined"
                        sx={{ height: 24 }}
                      />
                    </Stack>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        sx={{
                          flex: 1,
                          fontSize: '0.75rem',
                          textTransform: 'none',
                          minHeight: 40,
                        }}
                        onClick={(event) => handleOpenDetails(application, event)}
                      >
                        Review
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        sx={{
                          flex: 1,
                          fontSize: '0.75rem',
                          textTransform: 'none',
                          minHeight: 40,
                        }}
                        onClick={(event) => handleOpenMessage(application, event)}
                      >
                        Message hirer
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              );
            })
          )}
        </Box>

        {/* Bottom spacing for nav + safe area */}
        <Box sx={{ height: `calc(84px + env(safe-area-inset-bottom, 0px))` }} />
      </Box>
      </PageCanvas>
    );
  }

  return (
    <PageCanvas disableContainer sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}>
      <Container sx={{ py: { xs: 2, md: 4 } }}>
        <Helmet><title>My Applications | Kelmah</title></Helmet>
        <Typography variant="h4" gutterBottom>
          My Applications
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Track each application status and open messages with hirers from one place.
        </Typography>

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="All Applications" />
          <Tab label="Pending" />
          <Tab label="Under Review" />
          <Tab label="Accepted" />
          <Tab label="Rejected" />
          <Tab label="Withdrawn" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 4 }}>
            <Alert
              severity="error"
              action={(
                <Button color="inherit" size="small" onClick={() => loadApplications()}>
                  Retry
                </Button>
              )}
            >
              {error}
            </Alert>
          </Box>
        ) : filteredApplications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <WorkOutlineIcon
              sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              No applications yet
            </Typography>
            <Typography color="textSecondary" paragraph>
              Apply to jobs to see them here
            </Typography>
            <Button variant="contained" color="primary" onClick={() => navigate('/worker/find-work')}>
              Browse Jobs
            </Button>
          </Box>
        ) : isActualMobile ? (
          /* AUD2-H04 FIX: Card-based list for mobile — table rows are unreadable on small screens */
          <Box sx={{ px: 2, pb: 2 }}>
            {filteredApplications.map((application) => {
              const statusInfo = getStatusInfo(application.status);
              return (
                <Card
                  key={application.id || application._id}
                  variant="outlined"
                  sx={{ mb: 2 }}
                >
                  <CardContent sx={{ pb: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ flex: 1, mr: 1, wordBreak: 'break-word' }}>
                        {application.job?.title || 'Untitled Job'}
                      </Typography>
                      <Chip
                        icon={statusInfo.icon}
                        label={statusInfo.label}
                        color={statusInfo.color}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {application.job?.category || '—'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {application.job?.location?.city || application.job?.location || 'Unknown location'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Applied {new Date(application.createdAt || application.appliedDate).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                    <IconButton
                      size="small"
                      onClick={(event) => handleOpenDetails(application, event)}
                      aria-label="View application details"
                      sx={{ minWidth: 44, minHeight: 44 , '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: '2px' }}}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(event) => handleOpenMessage(application, event)}
                      aria-label="Send message to employer"
                      sx={{ minWidth: 44, minHeight: 44 , '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: '2px' }}}
                    >
                      <MessageIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 760 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Job</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Applied Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredApplications.map((application) => {
                  const statusInfo = getStatusInfo(application.status);

                  return (
                    <TableRow key={application.id || application._id}>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ wordBreak: 'break-word' }}>
                          {application.job?.title || 'Untitled Job'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {application.job?.location?.city || application.job?.location || 'Unknown'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {application.job?.category || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(application.createdAt || application.appliedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={statusInfo.icon}
                          label={statusInfo.label}
                          color={statusInfo.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            flexWrap: 'nowrap',
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={(event) => handleOpenDetails(application, event)}
                            aria-label="View application details"
                            sx={{ minWidth: 44, minHeight: 44 , '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: '2px' }}}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(event) => handleOpenMessage(application, event)}
                            aria-label="Send message to employer"
                            sx={{ minWidth: 44, minHeight: 44 , '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: '2px' }}}
                          >
                            <MessageIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Application Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isActualMobile}
        aria-labelledby="application-details-dialog-title"
      >
        {selectedApplication && (
          <>
            <DialogTitle id="application-details-dialog-title">Application Details</DialogTitle>
            <DialogContent>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {selectedApplication.job?.title || selectedApplication.jobTitle || 'Untitled Job'}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BusinessIcon
                        fontSize="small"
                        sx={{ mr: 0.5, color: 'text.secondary' }}
                      />
                      <Typography variant="body2">
                        {selectedApplication.job?.category || '\u2014'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WorkOutlineIcon
                        fontSize="small"
                        sx={{ mr: 0.5, color: 'text.secondary' }}
                      />
                      <Typography variant="body2">
                        {getApplicationRateLabel(selectedApplication)}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Application Status
                      </Typography>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
                      >
                        <Chip
                          icon={getStatusInfo(selectedApplication.status).icon}
                          label={
                            getStatusInfo(selectedApplication.status).label
                          }
                          color={
                            getStatusInfo(selectedApplication.status).color
                          }
                          size="small"
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Applied On
                      </Typography>
                      <Typography variant="body1">
                        {new Date(
                          selectedApplication.createdAt,
                        ).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    {selectedApplication.interviewDate && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Interview Date
                        </Typography>
                        <Typography variant="body1">
                          {new Date(
                            selectedApplication.interviewDate,
                          ).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              {selectedApplication.status === 'accepted' && (
                <Card
                  variant="outlined"
                  sx={{ mb: 3, bgcolor: 'success.light' }}
                >
                  <CardContent>
                    <Typography variant="h6" color="success.main" gutterBottom>
                      <CheckCircleIcon
                        sx={{ mr: 1, verticalAlign: 'text-bottom' }}
                      />
                      Congratulations! Your application was accepted.
                    </Typography>
                    <Typography variant="body2">
                      Please check your messages for details. You can discuss
                      terms with the hirer.
                    </Typography>
                  </CardContent>
                </Card>
              )}

              <Typography variant="subtitle1" gutterBottom>
                Application Timeline
              </Typography>
              <Box
                sx={{
                  ml: 2,
                  borderLeft: `2px solid ${theme.palette.divider}`,
                  pl: 2,
                }}
              >
                <Box sx={{ mb: 2, position: 'relative' }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      bgcolor: 'primary.main',
                      borderRadius: '50%',
                      position: 'absolute',
                      left: -28,
                      top: 6,
                    }}
                  />
                  <Typography variant="subtitle2">
                    Application Submitted
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(
                      selectedApplication.createdAt,
                    ).toLocaleDateString()}
                  </Typography>
                </Box>

                {selectedApplication.status !== 'pending' && (
                  <Box sx={{ mb: 2, position: 'relative' }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        bgcolor: 'primary.main',
                        borderRadius: '50%',
                        position: 'absolute',
                        left: -28,
                        top: 6,
                      }}
                    />
                    <Typography variant="subtitle2">
                      Application Reviewed
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedApplication.reviewedAt
                        ? new Date(selectedApplication.reviewedAt).toLocaleDateString()
                        : new Date(selectedApplication.updatedAt || selectedApplication.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}

                {(selectedApplication.status === 'under_review' ||
                  selectedApplication.status === 'accepted' ||
                  selectedApplication.status === 'rejected') && (
                    <Box sx={{ mb: 2, position: 'relative' }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          bgcolor: 'primary.main',
                          borderRadius: '50%',
                          position: 'absolute',
                          left: -28,
                          top: 6,
                        }}
                      />
                      <Typography variant="subtitle2">
                        Under Review
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(
                          selectedApplication.updatedAt || selectedApplication.createdAt,
                        ).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}

                {selectedApplication.status === 'accepted' && (
                  <Box sx={{ mb: 2, position: 'relative' }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        bgcolor: 'success.main',
                        borderRadius: '50%',
                        position: 'absolute',
                        left: -28,
                        top: 6,
                      }}
                    />
                    <Typography variant="subtitle2">Accepted</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(
                        selectedApplication.updatedAt || selectedApplication.createdAt,
                      ).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}

                {selectedApplication.status === 'rejected' && (
                  <Box sx={{ mb: 2, position: 'relative' }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        bgcolor: 'error.main',
                        borderRadius: '50%',
                        position: 'absolute',
                        left: -28,
                        top: 6,
                      }}
                    />
                    <Typography variant="subtitle2">
                      Application Rejected
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(
                        selectedApplication.updatedAt || selectedApplication.createdAt,
                      ).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}

                {selectedApplication.status === 'withdrawn' && (
                  <Box sx={{ mb: 2, position: 'relative' }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        bgcolor: 'warning.main',
                        borderRadius: '50%',
                        position: 'absolute',
                        left: -28,
                        top: 6,
                      }}
                    />
                    <Typography variant="subtitle2">
                      Application Withdrawn
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(
                        selectedApplication.updatedAt || selectedApplication.createdAt,
                      ).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
              <Button
                onClick={() => {
                  setOpenDetailsDialog(false);
                  handleOpenMessage(selectedApplication);
                }}
                variant="outlined"
                startIcon={<MessageIcon />}
              >
                Contact Employer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Message Dialog */}
      <Dialog
        open={openMessageDialog}
        onClose={() => setOpenMessageDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isActualMobile}
        aria-labelledby="application-message-dialog-title"
      >
        {selectedApplication && (
          <>
            <DialogTitle id="application-message-dialog-title">Message about {selectedApplication.job?.title || 'Application'}</DialogTitle>
            <DialogContent>
              <Typography variant="subtitle2" gutterBottom>
                Regarding: {selectedApplication.job?.title || selectedApplication.jobTitle || 'Job Application'}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Write your message below. You'll be taken to the Messages page to select the conversation and confirm before it's sent.
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="Message Draft"
                fullWidth
                variant="outlined"
                multiline
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenMessageDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleComposeMessage}
                variant="contained"
                disabled={!message.trim()}
              >
                Continue to Messages
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      </Container>
    </PageCanvas>
  );
};

export default MyApplicationsPage;

