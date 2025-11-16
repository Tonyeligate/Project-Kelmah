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
import { selectHirerJobs } from '../services/hirerSlice';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../auth/hooks/useAuth';
import { messagingService } from '../../messaging/services/messagingService';

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
  const activeJobs = useSelector((state) => state.hirer.jobs.active);
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
      if (activeJobs && Array.isArray(activeJobs) && activeJobs.length > 0) {
        try {
          const allApplications = await Promise.all(
            activeJobs.map((job) =>
              hirerService.getJobApplications(job.id, activeTab),
            ),
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
  }, [activeTab, activeJobs]);

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
    messagingService.initialize(user.id, token);
    try {
      const conv = await messagingService.createDirectConversation(
        selectedApplication.workerId,
      );
      navigate(`/messages/${conv.id}`);
    } catch (err) {
      console.error('Error creating direct conversation:', err);
      setError('Unable to start chat. Please try again later.');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Helmet>
        <title>Applications | Kelmah</title>
      </Helmet>
      <Typography variant="h4" gutterBottom>
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
                  minWidth: 120,
                  px: 2,
                },
              }}
              centered
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
                <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                  <Button startIcon={<Message />} onClick={handleMessage}>
                    Message
                  </Button>
                  <Button
                    color="success"
                    variant="contained"
                    startIcon={<CheckCircle />}
                    onClick={() => handleOpenReviewDialog('accepted')}
                  >
                    Accept
                  </Button>
                  <Button
                    color="error"
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={() => handleOpenReviewDialog('rejected')}
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
          <Button onClick={() => setShowReviewDialog(false)}>Cancel</Button>
          <Button
            onClick={handleStatusUpdate}
            color={actionType === 'accepted' ? 'success' : 'error'}
            variant="contained"
            disabled={updating}
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
