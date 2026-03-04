import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Rating,
  Divider,
  useTheme,
  useMediaQuery,
  Skeleton,
  Snackbar,
} from '@mui/material';
import {
  Person,
  AttachMoney,
  Schedule,
  CheckCircle,
  Cancel,
  Message,
  Star,
  InboxOutlined,
  WorkOutline,
  TipsAndUpdates,
  ArrowForward,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { hirerService } from '../services/hirerService';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { messagingService } from '../../messaging/services/messagingService';
import { fetchHirerJobs } from '../services/hirerSlice';
import { useSnackbar } from 'notistack';

const normalizeApplication = (raw, jobIdFallback) => {
  const worker = raw?.worker || {};
  const workerName =
    raw?.workerName ||
    worker?.name ||
    [worker?.firstName, worker?.lastName].filter(Boolean).join(' ').trim() ||
    'Worker';

  return {
    ...raw,
    id: raw?.id || raw?._id,
    // AUD2-M02 FIX: Extract ID string when raw.job is a populated object, not just an ID
    jobId: raw?.jobId || raw?.job?._id || raw?.job?.id || (typeof raw?.job === 'string' ? raw?.job : undefined) || jobIdFallback,
    workerId: raw?.workerId || worker?.id || worker?._id,
    workerName,
    workerAvatar: raw?.workerAvatar || worker?.avatar || worker?.profileImage,
    // AUD2-M12 FIX: Use null (not 0) for unreviewed workers so Rating shows empty vs bad
    workerRating: (raw?.workerRating != null || worker?.rating != null)
      ? Number(raw?.workerRating ?? worker?.rating)
      : null,
    coverLetter: raw?.coverLetter || raw?.coverLetterPreview || '',
  };
};

const ApplicationCard = ({ application, isSelected, onSelect }) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        mb: 2,
        borderLeft: isSelected
          ? `4px solid ${theme.palette.primary.main}`
          : 'none',
        backgroundColor: isSelected
          ? theme.palette.action.selected
          : theme.palette.background.paper,
      }}
    >
      <CardActionArea
        onClick={() => onSelect(application)}
        aria-label={`Application from ${application.workerName}`}
        sx={{
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }}
      >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar src={application.workerAvatar} alt={application.workerName || 'Applicant avatar'} sx={{ mr: 2 }} />
          <Box>
            <Typography variant="h6">{application.workerName}</Typography>
            {/* AUD2-M12 FIX: Distinguish "no reviews yet" (null) from low rating (0) */}
            {application.workerRating !== null ? (
              <Rating
                value={application.workerRating}
                precision={0.5}
                readOnly
                size="small"
              />
            ) : (
              <Typography variant="caption" color="text.disabled">
                No reviews yet
              </Typography>
            )}
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" noWrap>
          {application.coverLetter}
        </Typography>
      </CardContent>
      </CardActionArea>
    </Card>
  );
};

function ApplicationManagementPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const jobsByStatus = useSelector((state) => state.hirer?.jobs);

  // Ensure hirer jobs are loaded (needed for direct navigation)
  useEffect(() => {
    if (!jobsByStatus || Object.keys(jobsByStatus).length === 0) {
      dispatch(fetchHirerJobs('all'));
    }
  }, [dispatch, jobsByStatus]);

  const jobsForApplications = React.useMemo(() => {
    const all = Object.values(jobsByStatus || {}).flatMap((v) =>
      Array.isArray(v) ? v : [],
    );
    const filtered = all.filter((j) =>
      ['open', 'in-progress', 'active'].includes(String(j?.status || '')),
    );
    return filtered.length ? filtered : all;
  }, [jobsByStatus]);
  const [activeTab, setActiveTab] = useState('pending');
  const [allApplications, setAllApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [updating, setUpdating] = useState(false);
  const [actionType, setActionType] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchAllApplications = async () => {
      setLoading(true);
      if (
        jobsForApplications &&
        Array.isArray(jobsForApplications) &&
        jobsForApplications.length > 0
      ) {
        try {
          const results = await Promise.allSettled(
            jobsForApplications.map(async (job) => {
              const jobId = job.id || job._id;
              const list = await hirerService.getJobApplications(jobId);
              return (Array.isArray(list) ? list : []).map((app) =>
                normalizeApplication(app, jobId),
              );
            }),
          );
          if (cancelled) return;
          const allApps = results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value);
          const flattenedApplications = allApps.flat();
          setAllApplications(flattenedApplications);
        } catch (err) {
          if (cancelled) return;
          setError('Failed to fetch applications');
        }
      } else {
        if (!cancelled) setAllApplications([]);
      }
      if (!cancelled) setLoading(false);
    };
    fetchAllApplications();
    return () => { cancelled = true; };
  }, [jobsForApplications]);

  // Client-side filter by active tab — avoids re-fetching on tab switch
  const applications = useMemo(
    () => allApplications.filter((app) => app.status === activeTab),
    [allApplications, activeTab],
  );

  // Tab counts for badges
  const tabCounts = useMemo(() => ({
    pending: allApplications.filter((a) => a.status === 'pending').length,
    accepted: allApplications.filter((a) => a.status === 'accepted').length,
    rejected: allApplications.filter((a) => a.status === 'rejected').length,
  }), [allApplications]);

  // Auto-select first application when filtered list changes
  useEffect(() => {
    if (!loading) {
      setSelectedApplication(applications.length > 0 ? applications[0] : null);
    }
  }, [applications, loading]);

  const handleStatusUpdate = async () => {
    if (!selectedApplication) return;
    setUpdating(true);
    try {
      await hirerService.updateApplicationStatus(
        selectedApplication.jobId,
        selectedApplication.id,
        actionType,
        feedback,
      );
      setShowReviewDialog(false);
      setFeedback('');
      // Remove from allApplications so it disappears from current tab
      const updatedApplications = allApplications.filter(
        (app) => app.id !== selectedApplication.id,
      );
      setAllApplications(updatedApplications);
      // Clear any previous error and show success
      setError(null);
      setSuccessMsg(
        actionType === 'accepted'
          ? 'Application accepted successfully!'
          : actionType === 'rejected'
            ? 'Application rejected.'
            : 'Application updated.',
      );
      enqueueSnackbar(`Application ${actionType === 'accepted' ? 'accepted' : 'rejected'} successfully`, { variant: 'success' });
    } catch (err) {
      setError('Failed to update application status.');
      enqueueSnackbar('Failed to update application status', { variant: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenReviewDialog = (type) => {
    setActionType(type);
    setShowReviewDialog(true);
  };

  // Handler to start or navigate to direct chat with selected applicant
  const handleMessage = async () => {
    if (!selectedApplication) return;
    if (!selectedApplication.workerId) {
      setError('Worker contact information is unavailable.');
      return;
    }
    try {
      const conv = await messagingService.createDirectConversation(
        selectedApplication.workerId,
      );
      const conversationId =
        conv?.id ||
        conv?._id ||
        conv?.data?.id ||
        conv?.data?._id ||
        conv?.conversation?.id ||
        conv?.conversation?._id;

      if (conversationId) {
        navigate(`/messages?conversation=${conversationId}`);
        return;
      }

      setError('Unable to start chat. Please try again later.');
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error creating direct conversation:', err);
      setError('Unable to start chat. Please try again later.');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 } }}>
      <Helmet>
        <title>Applications | Kelmah</title>
      </Helmet>
      <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom>
        Job Applications
      </Typography>
      <Paper
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          height: isMobile ? 'auto' : 'calc(100dvh - 200px)',
          overflow: 'hidden',
        }}
      >
        <Grid container>
          <Grid
            item
            xs={12}
            md={4}
            sx={{
              borderRight: isMobile
                ? 'none'
                : `1px solid ${theme.palette.divider}`,
              borderBottom: isMobile
                ? `1px solid ${theme.palette.divider}`
                : 'none',
              display: 'flex',
              flexDirection: 'column',
              flex: '0 0 auto',
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{
                borderBottom: `1px solid ${theme.palette.divider}`,
                '& .MuiTab-root': {
                  minWidth: { xs: 80, sm: 120 },
                  px: { xs: 1, sm: 2 },
                },
              }}
              variant={isMobile ? 'scrollable' : 'standard'}
              scrollButtons="auto"
              allowScrollButtonsMobile
              centered={!isMobile}
            >
              <Tab
                label={tabCounts.pending ? `Pending (${tabCounts.pending})` : 'Pending'}
                value="pending"
              />
              <Tab
                label={tabCounts.accepted ? `Accepted (${tabCounts.accepted})` : 'Accepted'}
                value="accepted"
              />
              <Tab
                label={tabCounts.rejected ? `Rejected (${tabCounts.rejected})` : 'Rejected'}
                value="rejected"
              />
            </Tabs>
            <Box sx={{ flex: '1 1 auto', overflowY: 'auto', p: 2 }}>
              {loading &&
                Array.from(new Array(4)).map((_, idx) => (
                  <Skeleton
                    key={idx}
                    variant="rectangular"
                    height={80}
                    sx={{ mb: 2, borderRadius: 2 }}
                  />
                ))}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              {!loading && applications.length === 0 && !error && (
                <Box sx={{ textAlign: 'center', mt: 2, py: 4, px: 2 }}>
                  {/* Icon badge */}
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: (t) => `linear-gradient(135deg, ${t.palette.primary.light}22, ${t.palette.primary.main}18)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2.5,
                    }}
                  >
                    <InboxOutlined sx={{ fontSize: 40, color: 'primary.main' }} />
                  </Box>

                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {allApplications.length === 0
                      ? 'No applications yet'
                      : `No ${activeTab} applications`}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3, maxWidth: 280, mx: 'auto' }}
                  >
                    {allApplications.length === 0
                      ? 'Once you publish a job and workers apply, their proposals will appear here.'
                      : `Switch tabs to view your other applications.`}
                  </Typography>

                  {/* Tips section */}
                  {allApplications.length === 0 && (
                    <Box
                      sx={{
                        bgcolor: 'action.hover',
                        borderRadius: 2,
                        p: 2,
                        mb: 3,
                        textAlign: 'left',
                        maxWidth: 320,
                        mx: 'auto',
                      }}
                    >
                      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <TipsAndUpdates sx={{ fontSize: 16 }} /> Quick tips
                      </Typography>
                      {[
                        'Post a detailed job with clear requirements',
                        'Set a competitive budget range',
                        'Browse Find Talent to invite workers',
                      ].map((tip) => (
                        <Typography key={tip} variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, pl: 1 }}>
                          • {tip}
                        </Typography>
                      ))}
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/hirer/jobs/post')}
                      sx={{ minHeight: 44, minWidth: 180 }}
                    >
                      Post a Job
                    </Button>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => navigate('/hirer/find-talent')}
                      sx={{ minHeight: 36, textTransform: 'none' }}
                    >
                      Or browse available talent
                    </Button>
                  </Box>
                </Box>
              )}
              {!loading &&
                applications.length > 0 &&
                applications.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    isSelected={selectedApplication?.id === app.id}
                    onSelect={setSelectedApplication}
                  />
                ))}
            </Box>
          </Grid>
          <Grid
            item
            xs={12}
            md={8}
            sx={{ p: 3, overflowY: 'auto', flex: '1 1 auto' }}
          >
            {selectedApplication ? (
              <>
                {/* Applicant header card */}
                <Paper
                  variant="outlined"
                  sx={{ p: 2.5, mb: 3, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}
                >
                  <Avatar
                    src={selectedApplication.workerAvatar}
                    alt={selectedApplication.workerName || 'Applicant avatar'}
                    sx={{ width: 64, height: 64 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight={600}>
                      {selectedApplication.workerName}
                    </Typography>
                    {selectedApplication.workerRating !== null ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Rating value={selectedApplication.workerRating} readOnly size="small" aria-label={`${selectedApplication.workerName || 'Worker'} rating: ${selectedApplication.workerRating} out of 5`} />
                        <Typography variant="caption" color="text.secondary">
                          ({selectedApplication.workerRating?.toFixed(1)})
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.disabled">No reviews yet</Typography>
                    )}
                    {selectedApplication.status && (
                      <Chip
                        size="small"
                        label={selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                        color={selectedApplication.status === 'accepted' ? 'success' : selectedApplication.status === 'rejected' ? 'error' : 'warning'}
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </Box>
                </Paper>

                {/* Cover letter */}
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Cover Letter
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'action.hover', minHeight: 120 }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedApplication.coverLetter || 'No cover letter provided.'}
                  </Typography>
                </Paper>

                {/* Action buttons */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, justifyContent: 'flex-start' }}>
                  <Button variant="outlined" startIcon={<Message />} onClick={handleMessage} sx={{ minHeight: 44 }}>
                    Message
                  </Button>
                  <Button
                    color="success"
                    variant="contained"
                    startIcon={<CheckCircle />}
                    onClick={() => handleOpenReviewDialog('accepted')}
                    sx={{ minHeight: 44 }}
                  >
                    Accept
                  </Button>
                  <Button
                    color="error"
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={() => handleOpenReviewDialog('rejected')}
                    sx={{ minHeight: 44 }}
                  >
                    Reject
                  </Button>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  minHeight: 300,
                  textAlign: 'center',
                  p: 4,
                }}
              >
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <BadgeIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
                </Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No application selected
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  {applications.length > 0
                    ? 'Choose an application from the list to review the details.'
                    : 'Applications from workers will appear in the panel on the left.'}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Dialog
        open={showReviewDialog}
        onClose={() => !updating && setShowReviewDialog(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
        aria-labelledby="confirm-action-dialog-title"
      >
        <DialogTitle id="confirm-action-dialog-title">Confirm Action</DialogTitle>
        <DialogContent>
          <Typography>
            You are about to {actionType} this application.
          </Typography>
          {actionType === 'rejected' && (
            <TextField
              label="Feedback (Optional)"
              multiline
              rows={4}
              fullWidth
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReviewDialog(false)} sx={{ minHeight: 44 }}>Cancel</Button>
          <Button
            onClick={handleStatusUpdate}
            color={actionType === 'accepted' ? 'success' : 'error'}
            variant="contained"
            disabled={updating}
            sx={{ minHeight: 44 }}
          >
            {updating ? (
              <CircularProgress size={24} />
            ) : (
              `Confirm ${actionType}`
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={4000}
        onClose={() => setSuccessMsg('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMsg('')} severity="success" sx={{ width: '100%' }}>
          {successMsg}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ApplicationManagementPage;
