import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  TextField,
  Typography,
  Alert,
  InputAdornment,
  Stack,
  Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Work as WorkIcon,
  Send as SendIcon,
  Gavel as BidIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { applyForJob, fetchJobById } from '../services/jobSlice';
import bidApi from '../services/bidService';

const JobApplicationPage = () => {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const redirectTimerRef = useRef(null);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { currentJob, loading: jobLoading } = useSelector((state) => state.jobs);

  const [coverLetter, setCoverLetter] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const isBiddingJob = currentJob?.bidding?.bidStatus === 'open';

  // Load job details
  useEffect(() => {
    if (jobId) {
      dispatch(fetchJobById(jobId));
    }
  }, [dispatch, jobId]);

  // Cleanup redirect timer on unmount
  useEffect(() => {
    return () => clearTimeout(redirectTimerRef.current);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!coverLetter.trim()) {
      setError('Please write a short cover letter explaining why you are the right person for this job.');
      return;
    }

    setSubmitting(true);

    try {
      if (isBiddingJob) {
        const amount = parseFloat(bidAmount);
        if (!bidAmount || isNaN(amount) || amount <= 0) {
          setError('Please enter a valid bid amount.');
          setSubmitting(false);
          return;
        }
        await bidApi.createBid({
          job: jobId,
          bidAmount: amount,
          coverLetter: coverLetter.trim(),
          estimatedDuration: '',
        });
      } else {
        await dispatch(applyForJob({
          jobId,
          applicationData: {
            coverLetter: coverLetter.trim(),
            proposedRate: proposedRate ? parseFloat(proposedRate) : undefined,
          },
        })).unwrap();
      }

      setSuccess(true);
      // Navigate back to the job after a short delay
      redirectTimerRef.current = setTimeout(() => navigate(`/jobs/${jobId}`, { replace: true }), 2000);
    } catch (err) {
      const msg =
        err?.message ||
        err?.response?.data?.message ||
        err?.error ||
        (typeof err === 'string' ? err : null) ||
        'Could not submit your application. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (jobLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>{currentJob?.title ? `Apply — ${currentJob.title}` : 'Apply for Job'} | Kelmah</title>
      </Helmet>

      <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
        {/* Back link */}
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(`/jobs/${jobId}`)}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back to Job
        </Button>

        {/* Job summary header */}
        {currentJob && (
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <WorkIcon color="primary" />
              <Typography variant="h5" fontWeight={700}>
                {currentJob.title}
              </Typography>
              {isBiddingJob && (
                <Chip label="Bidding" color="warning" size="small" icon={<BidIcon />} />
              )}
            </Stack>
            {currentJob.budget && (
              <Typography variant="body2" color="text.secondary">
                Budget: GH₵{currentJob.budget?.min?.toLocaleString()} – GH₵{currentJob.budget?.max?.toLocaleString()}
              </Typography>
            )}
          </Box>
        )}

        <Paper
          elevation={0}
          sx={(theme) => ({
            p: { xs: 2, md: 4 },
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
          })}
          component="form"
          onSubmit={handleSubmit}
        >
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {isBiddingJob ? 'Place Your Bid' : 'Your Application'}
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {isBiddingJob
                ? 'Your bid was submitted! You will be notified when the hirer responds.'
                : 'Application sent! You will be notified when the hirer responds.'}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Cover letter */}
          <TextField
            label="Why are you the right person for this job?"
            multiline
            rows={5}
            fullWidth
            required
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Tell the hirer about your experience, why you are a good fit, and how you will approach this work…"
            inputProps={{ maxLength: 1000 }}
            helperText={`${coverLetter.length}/1000 characters`}
            disabled={submitting || success}
            sx={{ mb: 3 }}
          />

          {/* Bid amount — only for bidding jobs */}
          {isBiddingJob && (
            <TextField
              label="Your Bid Amount"
              type="number"
              fullWidth
              required
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">GH₵</InputAdornment>,
              }}
              inputProps={{ min: 1, step: 0.01 }}
              disabled={submitting || success}
              helperText={
                currentJob?.bidding?.minBidAmount
                  ? `Minimum bid: GH₵${Number(currentJob.bidding.minBidAmount).toLocaleString()}`
                  : undefined
              }
              sx={{ mb: 3 }}
            />
          )}

          {/* Proposed rate — only for regular application jobs */}
          {!isBiddingJob && (
            <TextField
              label="Your Proposed Rate (optional)"
              type="number"
              fullWidth
              value={proposedRate}
              onChange={(e) => setProposedRate(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">GH₵</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 0.01 }}
              disabled={submitting || success}
              helperText="Leave blank to accept the posted rate"
              sx={{ mb: 3 }}
            />
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/jobs/${jobId}`)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
              disabled={submitting || success}
              sx={{ minWidth: 140 }}
            >
              {submitting
                ? 'Sending…'
                : isBiddingJob
                  ? 'Place Bid'
                  : 'Submit Application'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default JobApplicationPage;
