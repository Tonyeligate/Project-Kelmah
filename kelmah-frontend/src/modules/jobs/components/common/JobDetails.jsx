import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  LocationOn,
  AttachMoney,
  Work,
  Schedule,
  Person,
  CalendarToday,
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import {
  fetchJobById,
  applyForJob,
  selectCurrentJob,
  selectJobsLoading,
  selectJobsError,
} from '../../../jobs/services/jobSlice';
import { selectCurrentUser } from '../../../auth/services/authSlice';

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const job = useSelector(selectCurrentJob);
  const loading = useSelector(selectJobsLoading);
  const error = useSelector(selectJobsError);
  const currentUser = useSelector(selectCurrentUser);

  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [application, setApplication] = useState({
    proposed_rate: '',
    cover_letter: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [applicationError, setApplicationError] = useState(null);

  useEffect(() => {
    dispatch(fetchJobById(id));
  }, [dispatch, id]);

  const handleApply = async () => {
    try {
      setSubmitting(true);
      setApplicationError(null);

      await dispatch(
        applyForJob({
          jobId: id,
          applicationData: application,
        }),
      ).unwrap();

      setApplyDialogOpen(false);
      // Show success message or redirect
    } catch (error) {
      setApplicationError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!job) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h4" component="h1" color="secondary">
                {job.title}
              </Typography>
              <Chip
                label={job.status}
                color={job.status === 'open' ? 'success' : 'default'}
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={1}>
                <Person color="action" />
                <Typography color="text.secondary">
                  Posted by {job.hirer_name || job.hirer?.firstName ? `${job.hirer.firstName} ${job.hirer.lastName}` : 'Unknown'}
                </Typography>
              </Box>

              {(job.location?.address || job.location?.city || job.location) && (
                <Box display="flex" alignItems="center" gap={1}>
                  <LocationOn color="action" />
                  <Typography color="text.secondary">
                    {job.location?.address || job.location?.city || job.location}
                  </Typography>
                </Box>
              )}

              <Box display="flex" alignItems="center" gap={1}>
                <AttachMoney color="action" />
                <Typography color="text.secondary">
                  {job.budget ? (
                    typeof job.budget === 'object' ? (
                      `${job.budget.currency || 'GHS'} ${job.budget.min || 0} - ${job.budget.max || 0}`
                    ) : (
                      `${job.currency || 'GHS'} ${job.budget.toLocaleString()}`
                    )
                  ) : (
                    'N/A'
                  )}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                <Work color="action" />
                <Typography color="text.secondary">{job.profession || job.category || 'N/A'}</Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                <Schedule color="action" />
                <Typography color="text.secondary">
                  Posted{' '}
                  {job.created_at ? formatDistanceToNow(new Date(job.created_at), {
                    addSuffix: true,
                  }) : 'Unknown'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="secondary">
              Description
            </Typography>
            <Typography paragraph>{job.description}</Typography>
          </Grid>

          {(job.skills_required || job.skills) && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="secondary">
                Required Skills
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {(job.skills_required ? job.skills_required.split(',') : job.skills || []).map((skill, index) => (
                  <Chip
                    key={index}
                    label={typeof skill === 'string' ? skill.trim() : skill}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Grid>
          )}

          {job.deadline && (
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={1}>
                <CalendarToday color="action" />
                <Typography color="text.secondary">
                  Application Deadline: {format(new Date(job.deadline), 'PPP')}
                </Typography>
              </Box>
            </Grid>
          )}

          {currentUser?.role === 'worker' && job.status === 'open' && (
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => setApplyDialogOpen(true)}
                >
                  Apply Now
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Application Dialog */}
      <Dialog
        open={applyDialogOpen}
        onClose={() => setApplyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Apply for {job.title}</DialogTitle>
        <DialogContent>
          {applicationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {applicationError}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Proposed Rate ($)"
            type="number"
            value={application.proposed_rate}
            onChange={(e) =>
              setApplication({
                ...application,
                proposed_rate: e.target.value,
              })
            }
            sx={{ mt: 2, mb: 2 }}
          />

          <TextField
            fullWidth
            label="Cover Letter"
            multiline
            rows={4}
            value={application.cover_letter}
            onChange={(e) =>
              setApplication({
                ...application,
                cover_letter: e.target.value,
              })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setApplyDialogOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            variant="contained"
            color="secondary"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default JobDetails;
