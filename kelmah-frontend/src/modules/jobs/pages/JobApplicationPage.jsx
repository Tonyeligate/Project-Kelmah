import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { applyForJob, fetchJobById } from '../services/jobSlice';
import bidApi from '../services/bidService';
import fileUploadService from '../../common/services/fileUploadService';
import { formatGhanaCurrency } from '@/utils/formatters';

const JobApplicationPage = () => {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const isAuthenticated = !!user;
  const { currentJob, loading: jobLoading } = useSelector((state) => state.jobs);

  const [coverLetter, setCoverLetter] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const getFileSignature = (file) => `${file.name}-${file.size}-${typeof file.lastModified === 'number' ? file.lastModified : 'na'}`;

  const isBiddingJob = currentJob?.bidding?.bidStatus === 'open';

  // Load job details
  useEffect(() => {
    if (jobId) {
      dispatch(fetchJobById(jobId));
    }
  }, [dispatch, jobId]);

  // Auth guard — redirect unauthenticated users immediately
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [isAuthenticated, navigate, location.pathname]);

  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => file.size <= 10 * 1024 * 1024);

    if (validFiles.length !== files.length) {
      setError('Some files were too large. Maximum size is 10MB per file.');
    }

    setAttachments((prev) => {
      const seen = new Set(prev.map((file) => getFileSignature(file)));
      const next = [...prev];

      validFiles.forEach((file) => {
        const signature = getFileSignature(file);
        if (!seen.has(signature)) {
          seen.add(signature);
          next.push(file);
        }
      });

      return next;
    });

    event.target.value = '';
  };

  const handleRemoveAttachment = (name) => {
    setAttachments((prev) => prev.filter((file, index) => `${file.name}-${index}` !== name));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting || success) {
      return;
    }

    setError(null);

    if (!coverLetter.trim()) {
      setError('Please write a short cover letter explaining why you are the right person for this job.');
      return;
    }

    if (isBiddingJob) {
      const amount = parseFloat(bidAmount);
      if (!bidAmount || isNaN(amount) || amount <= 0) {
        setError('Please enter a valid bid amount.');
        return;
      }
    }

    setSubmitting(true);

    try {
      if (isBiddingJob) {
        const amount = parseFloat(bidAmount);
        await bidApi.createBid({
          jobId,
          bidAmount: amount,
          estimatedDuration: currentJob?.duration || { value: 1, unit: 'week' },
          coverLetter: coverLetter.trim(),
          availability: {
            startDate: new Date().toISOString(),
            flexible: true,
          },
        });
      } else {
        let uploadedAttachments = [];
        if (attachments.length > 0) {
          const results = await fileUploadService.uploadFiles(
            attachments,
            'applications',
            'user',
          );
          const failedUpload = results.find((item) => item?.error);
          if (failedUpload) {
            throw new Error(failedUpload.error || 'Failed to upload an attachment');
          }
          uploadedAttachments = results.map((item, index) => ({
            name: attachments[index]?.name || item.name,
            fileUrl: item.fileUrl || item.url,
            fileType: attachments[index]?.type || item.type,
            fileSize: attachments[index]?.size || item.size || 0,
            publicId: item.publicId || null,
            resourceType: item.resourceType || null,
            thumbnailUrl: item.thumbnailUrl || null,
            width: item.width || null,
            height: item.height || null,
            duration: item.duration || null,
            format: item.format || null,
            uploadDate: new Date().toISOString(),
          }));
        }

        await dispatch(applyForJob({
          jobId,
          applicationData: {
            coverLetter: coverLetter.trim(),
            proposedRate: proposedRate ? parseFloat(proposedRate) : undefined,
            attachments: uploadedAttachments,
          },
        })).unwrap();
      }

      setSuccess(true);
    } catch (err) {
      const msg =
        err?.message ||
        err?.response?.data?.message ||
        err?.error ||
        (typeof err === 'string' ? err : null) ||
        (isBiddingJob
          ? 'Could not submit your bid. Please review the details and try again.'
          : 'Could not submit your application. Please try again.');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

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
                Budget: {formatGhanaCurrency(currentJob.budget?.min)} - {formatGhanaCurrency(currentJob.budget?.max)}
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

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                {isBiddingJob
                  ? `Your bid of ${formatGhanaCurrency(Number(bidAmount || 0))} was submitted successfully.`
                  : 'Your application was submitted successfully.'}
              </Alert>
              <Typography variant="body1" sx={{ mb: 1.5 }}>
                {isBiddingJob
                  ? 'Your bid is now saved. The next useful step is to track it from My Bids or return to the job details page.'
                  : 'Your application is now saved. You can review the job again or open your applications dashboard.'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {isBiddingJob
                  ? 'If the hirer shortlists or accepts your bid, the update will appear in your bid dashboard.'
                  : 'If the hirer responds, the update will appear in your applications dashboard.'}
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/jobs/${jobId}`)}
                >
                  View Job Details
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate(isBiddingJob ? '/worker/bids' : '/worker/applications')}
                  startIcon={isBiddingJob ? <BidIcon /> : <WorkIcon />}>
                  {isBiddingJob ? 'Go to My Bids' : 'View My Applications'}
                </Button>
              </Stack>
            </Box>
          ) : (
            <>

              {/* Cover letter */}
              <TextField
                label="Why are you the right person for this job?"
                multiline
                rows={5}
                fullWidth
                required
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Share your experience, why you are a good fit, and when you can start."
                inputProps={{ maxLength: 1000 }}
                helperText={`${coverLetter.length}/1000 characters. Keep it clear and short.`}
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
                      ? `Minimum bid: GH₵${Number(currentJob.bidding.minBidAmount).toLocaleString()}.`
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
                  helperText="Leave blank to accept the posted rate."
                  sx={{ mb: 3 }}
                />
              )}

              {!isBiddingJob && (
                <Box sx={{ mb: 3 }}>
                  <Button component="label" variant="outlined" startIcon={<AttachFileIcon />}>
                    Attach work samples or proof
                    <input hidden multiple type="file" aria-label="Attach work samples or proof" accept="image/*,video/*,.pdf,.doc,.docx,.txt" onChange={handleAttachmentChange} />
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                    Optional: add photos, certificates, or past work that help the hirer trust your application.
                  </Typography>
                  {attachments.length > 0 && (
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
                      {attachments.map((file, index) => (
                        <Chip
                          key={`${file.name}-${index}`}
                          label={file.name}
                          onDelete={() => handleRemoveAttachment(`${file.name}-${index}`)}
                          sx={{ mb: 1 }}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
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
                  sx={{ minWidth: 180 }}>
                  {submitting
                    ? isBiddingJob
                      ? 'Sending Bid…'
                      : 'Sending Application…'
                    : isBiddingJob
                      ? 'Send Bid'
                      : 'Send Application'}
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Container>
    </>
  );
};

export default JobApplicationPage;
