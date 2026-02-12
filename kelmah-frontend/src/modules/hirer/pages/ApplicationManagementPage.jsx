import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Person,
  AttachMoney,
  Schedule,
  CheckCircle,
  Cancel,
  Message,
  Star,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { hirerService } from '../services/hirerService';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../auth/hooks/useAuth';
import { messagingService } from '../../messaging/services/messagingService';

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
    jobId: raw?.jobId || raw?.job || jobIdFallback,
    workerId: raw?.workerId || worker?.id || worker?._id,
    workerName,
    workerAvatar: raw?.workerAvatar || worker?.avatar || worker?.profileImage,
    workerRating: Number(raw?.workerRating ?? worker?.rating ?? 0),
    coverLetter: raw?.coverLetter || raw?.coverLetterPreview || '',
  };
};

const ApplicationCard = ({ application, isSelected, onSelect }) => {
  const theme = useTheme();
  return (
    <Card
      onClick={() => onSelect(application)}
      sx={{
        mb: 2,
        cursor: 'pointer',
        borderLeft: isSelected
          ? `4px solid ${theme.palette.primary.main}`
          : 'none',
        backgroundColor: isSelected
          ? theme.palette.action.selected
          : theme.palette.background.paper,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar src={application.workerAvatar} sx={{ mr: 2 }} />
          <Box>
            <Typography variant="h6">{application.workerName}</Typography>
            <Rating
              value={application.workerRating}
              precision={0.5}
              readOnly
              size="small"
            />
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" noWrap>
          {application.coverLetter}
        </Typography>
      </CardContent>
    </Card>
  );
};

function ApplicationManagementPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const jobsByStatus = useSelector((state) => state.hirer?.jobs);
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
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [updating, setUpdating] = useState(false);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    const fetchAllApplications = async () => {
      setLoading(true);
      if (
        jobsForApplications &&
        Array.isArray(jobsForApplications) &&
        jobsForApplications.length > 0
      ) {
        try {
          const allApplications = await Promise.all(
            jobsForApplications.map(async (job) => {
              const list = await hirerService.getJobApplications(
                job.id,
                activeTab,
              );
              return (Array.isArray(list) ? list : []).map((app) =>
                normalizeApplication(app, job.id),
              );
            }),
          );
          const flattenedApplications = allApplications.flat();
          setApplications(flattenedApplications);
          if (flattenedApplications.length > 0) {
            setSelectedApplication(flattenedApplications[0]);
          } else {
            setSelectedApplication(null);
          }
        } catch (err) {
          setError('Failed to fetch applications');
        }
      } else {
        setApplications([]);
        setSelectedApplication(null);
      }
      setLoading(false);
    };
    fetchAllApplications();
  }, [activeTab, jobsForApplications]);

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
      // Refresh the list
      const updatedApplications = applications.filter(
        (app) => app.id !== selectedApplication.id,
      );
      setApplications(updatedApplications);
      setSelectedApplication(
        updatedApplications.length > 0 ? updatedApplications[0] : null,
      );
    } catch (err) {
      setError('Failed to update application status.');
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
      console.error('Error creating direct conversation:', err);
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
          height: isMobile ? 'auto' : 'calc(100vh - 200px)',
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
              <Tab label="Pending" value="pending" />
              <Tab label="Accepted" value="accepted" />
              <Tab label="Rejected" value="rejected" />
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
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {!loading && applications.length === 0 && !error && (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No applications yet.
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Publish a detailed job post to start receiving proposals
                    from verified workers.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/hirer/jobs/post')}
                  >
                    Post a Job
                  </Button>
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
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={selectedApplication.workerAvatar}
                    sx={{ width: 60, height: 60, mr: 2 }}
                  />
                  <div>
                    <Typography variant="h5">
                      {selectedApplication.workerName}
                    </Typography>
                    <Rating value={selectedApplication.workerRating} readOnly />
                  </div>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6">Cover Letter</Typography>
                <Typography variant="body1" paragraph>
                  {selectedApplication.coverLetter}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-around', gap: 1 }}>
                  <Button startIcon={<Message />} onClick={handleMessage} sx={{ minHeight: 44 }}>
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
              <Paper
                sx={{ p: 4, textAlign: 'center', background: 'transparent' }}
                elevation={0}
              >
                <Typography variant="h6" color="text.secondary">
                  Select an application to view details.
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Dialog
        open={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle>Confirm Action</DialogTitle>
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
    </Container>
  );
}

export default ApplicationManagementPage;
