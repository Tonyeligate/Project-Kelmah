/**
 * BidSubmissionForm — Dialog for workers to place a bid on a job
 *
 * DATA FLOW:
 *   User fills bid form → handleSubmit() → bidApi.createBid()
 *   → POST /api/bids → Gateway → Job Service → Bid saved in DB
 *
 * Per spec: max 5 bidders/job, max 5 bids/worker/month, amount within min/max range
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Slider,
  Alert,
  CircularProgress,
  Chip,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Close as CloseIcon,
  AttachMoney,
  Schedule,
  Info,
} from '@mui/icons-material';
import bidApi from '../services/bidService';

const BidSubmissionForm = ({ open, onClose, job }) => {
  const minBid = job?.bidding?.minBidAmount || job?.budget?.min || 100;
  const maxBid = job?.bidding?.maxBidAmount || job?.budget?.max || 50000;
  const currentBidders = job?.bidding?.currentBidders || 0;
  const maxBidders = job?.bidding?.maxBidders || 5;

  const [bidAmount, setBidAmount] = useState(Math.round((minBid + maxBid) / 2));
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [bidStats, setBidStats] = useState(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setBidAmount(Math.round((minBid + maxBid) / 2));
      setEstimatedDuration('');
      setCoverLetter('');
      setError(null);
      setSuccess(false);
    }
  }, [open, minBid, maxBid]);

  const handleSubmit = async () => {
    if (!coverLetter.trim()) {
      setError('Please write a brief message about why you are a good fit.');
      return;
    }
    if (bidAmount < minBid || bidAmount > maxBid) {
      setError(`Bid amount must be between GHS ${minBid} and GHS ${maxBid}.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await bidApi.createBid({
        job: job?._id || job?.id,
        bidAmount,
        estimatedDuration: estimatedDuration || undefined,
        coverLetter: coverLetter.trim(),
      });
      setSuccess(true);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to submit bid. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1a1a1a', color: '#FFD700' }}>
          Bid Submitted!
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1a1a1a', pt: 3 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Your bid of <strong>GHS {bidAmount.toLocaleString()}</strong> has been
            submitted. The hirer will review all bids and select a worker.
          </Alert>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            You can view and manage your bids from your dashboard.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1a1a1a', p: 2 }}>
          <Button onClick={onClose} variant="contained" sx={{ bgcolor: '#FFD700', color: '#000' }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: '#1a1a1a',
          color: '#FFD700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GavelIcon />
          Place Your Bid
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: '#1a1a1a', pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Job info summary */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
          <Typography variant="subtitle1" sx={{ color: '#FFD700', fontWeight: 'bold', mb: 0.5 }}>
            {job?.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              icon={<AttachMoney sx={{ fontSize: 14 }} />}
              label={`GHS ${minBid.toLocaleString()} – ${maxBid.toLocaleString()}`}
              sx={{ bgcolor: 'rgba(255,215,0,0.15)', color: '#FFD700' }}
            />
            <Chip
              size="small"
              icon={<Info sx={{ fontSize: 14 }} />}
              label={`${currentBidders}/${maxBidders} bidders`}
              sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' }}
            />
          </Box>
        </Box>

        {/* Bid amount slider */}
        <Typography variant="subtitle2" sx={{ color: '#FFD700', mb: 1 }}>
          Your Bid Amount (GHS)
        </Typography>
        <Box sx={{ px: 1, mb: 1 }}>
          <Slider
            value={bidAmount}
            onChange={(_, val) => setBidAmount(val)}
            min={minBid}
            max={maxBid}
            step={50}
            valueLabelDisplay="on"
            valueLabelFormat={(v) => `GHS ${v.toLocaleString()}`}
            sx={{
              color: '#FFD700',
              '& .MuiSlider-valueLabel': { bgcolor: '#FFD700', color: '#000' },
            }}
          />
        </Box>
        <TextField
          type="number"
          value={bidAmount}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (val >= 0) setBidAmount(val);
          }}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: <InputAdornment position="start">GHS</InputAdornment>,
          }}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              '& fieldset': { borderColor: 'rgba(255,215,0,0.3)' },
            },
          }}
        />

        {/* Estimated duration */}
        <TextField
          label="Estimated Duration (e.g. 5 days, 2 weeks)"
          value={estimatedDuration}
          onChange={(e) => setEstimatedDuration(e.target.value)}
          fullWidth
          size="small"
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              '& fieldset': { borderColor: 'rgba(255,215,0,0.3)' },
            },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Schedule sx={{ color: 'rgba(255,215,0,0.5)' }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Cover letter */}
        <TextField
          label="Why are you a good fit for this job?"
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          fullWidth
          multiline
          rows={4}
          required
          placeholder="Describe your relevant experience, availability, and why you should be selected..."
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              '& fieldset': { borderColor: 'rgba(255,215,0,0.3)' },
            },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
          }}
        />

        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          You can submit up to 5 bids per month. Bids can be modified before the deadline.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ bgcolor: '#1a1a1a', p: 2 }}>
        <Button onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <GavelIcon />}
          sx={{
            bgcolor: '#FFD700',
            color: '#000',
            '&:hover': { bgcolor: '#FFA500' },
          }}
        >
          {loading ? 'Submitting...' : `Submit Bid — GHS ${bidAmount.toLocaleString()}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BidSubmissionForm;
