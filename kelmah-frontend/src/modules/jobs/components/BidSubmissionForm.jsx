/**
 * BidSubmissionForm — Dialog for workers to place a bid on a job
 *
 * DATA FLOW:
 *   User fills bid form → handleSubmit() → bidApi.createBid()
 *   → POST /api/bids → Gateway → Job Service → Bid saved in DB
 *
 * Per spec: max 5 bidders/job, max 5 bids/worker/month, amount within min/max range
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, AppBar, Toolbar, Button, TextField, Box, Typography, Slider, Alert, CircularProgress, Chip, InputAdornment, IconButton, FormControl, InputLabel, Select, MenuItem, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Gavel as GavelIcon,
  Close as CloseIcon,
  AttachMoney,
  Schedule,
  Info,
} from '@mui/icons-material';
import bidApi from '../services/bidService';
import { useBreakpointDown } from '@/hooks/useResponsive';

const BidSubmissionForm = ({ open, onClose, job }) => {
  const theme = useTheme();
  const isMobile = useBreakpointDown('sm');
  const navigate = useNavigate();
  const minBid = job?.bidding?.minBidAmount || job?.budget?.min || 100;
  const maxBid = job?.bidding?.maxBidAmount || job?.budget?.max || 50000;
  const currentBidders = job?.bidding?.currentBidders || 0;
  const maxBidders = job?.bidding?.maxBidders || 5;

  const [bidAmount, setBidAmount] = useState(Math.round((minBid + maxBid) / 2));
  const [estimatedDuration, setEstimatedDuration] = useState({ value: 1, unit: 'week' });
  const [hoursPerWeek, setHoursPerWeek] = useState(40);
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Reset form only when dialog transitions from closed to open (not on every minBid/maxBid change)
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setBidAmount(Math.round((minBid + maxBid) / 2));
      setEstimatedDuration({ value: 1, unit: 'week' });
      setHoursPerWeek(40);
      setCoverLetter('');
      setError(null);
      setSuccess(false);
    }
    prevOpenRef.current = open;
  }, [open]); // minBid and maxBid intentionally excluded — reset only on open transition

  const handleSubmit = async () => {
    if (!coverLetter.trim()) {
      setError('Please write a brief message about why you are a good fit.');
      return;
    }
    if (bidAmount < minBid || bidAmount > maxBid) {
      setError(`Bid amount must be between GH₵ ${minBid} and GH₵ ${maxBid}.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await bidApi.createBid({
        jobId: job?._id || job?.id,
        bidAmount,
        estimatedDuration,
        coverLetter: coverLetter.trim(),
        availability: {
          startDate: new Date().toISOString(),
          hoursPerWeek,
          flexible: true,
        },
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
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile} aria-labelledby="bid-submitted-dialog-title">
        <DialogTitle id="bid-submitted-dialog-title" sx={{ bgcolor: 'background.paper', color: 'primary.main' }}>
          Bid Submitted Successfully
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: 3 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Your bid of <strong>GH₵ {bidAmount.toLocaleString()}</strong> has been
            submitted with your proposed timeline and availability.
          </Alert>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            The hirer can now review your offer. If you want to track the status, withdraw it, or check later responses, open your bid dashboard next.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            You can also stay on this job page if you want to keep reviewing the listing details.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2 }}>
          <Button onClick={onClose} color="inherit">
            Stay on Job
          </Button>
          <Button
            onClick={() => {
              onClose();
              navigate('/worker/bids');
            }}
            variant="contained"
            color="primary"
          >
            View My Bids
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile} aria-labelledby="place-bid-dialog-title">
      {isMobile ? (
        <AppBar sx={{ position: 'relative', bgcolor: 'background.paper', color: 'text.primary', boxShadow: 1 }}>
          <Toolbar>
            <IconButton
              edge="start"
              onClick={onClose}
              aria-label="Close bid form"
              sx={{
                color: 'text.secondary',
                width: 44,
                height: 44,
                '&:focus-visible': {
                  outline: '3px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: '2px',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography id="place-bid-dialog-title" sx={{ ml: 1, flex: 1, fontWeight: 600 }} variant="subtitle1">
              Place Your Bid
            </Typography>
            <Button
              color="primary"
              variant="contained"
              size="small"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={14} /> : <GavelIcon />}
            >
              {loading ? 'Submitting…' : `GH₵ ${bidAmount.toLocaleString()}`}
            </Button>
          </Toolbar>
        </AppBar>
      ) : (
        <DialogTitle
          id="place-bid-dialog-title"
          sx={{
            bgcolor: 'background.paper',
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GavelIcon />
            Place Your Bid
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              color: 'text.secondary',
              width: 44,
              height: 44,
              '&:focus-visible': {
                outline: '3px solid',
                outlineColor: 'primary.main',
                outlineOffset: '2px',
              },
            }}
            aria-label="Close bid dialog"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      )}

      <DialogContent sx={{ bgcolor: 'background.paper', pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Job info summary */}
        <Box sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.text.primary, 0.05), borderRadius: 1 }}>
          <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 0.5 }}>
            {job?.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              icon={<AttachMoney sx={{ fontSize: 14 }} />}
              label={`GH₵ ${minBid.toLocaleString()} – ${maxBid.toLocaleString()}`}
              sx={{ bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' }}
            />
            <Chip
              size="small"
              icon={<Info sx={{ fontSize: 14 }} />}
              label={`${currentBidders}/${maxBidders} bidders`}
              sx={{ bgcolor: alpha(theme.palette.text.primary, 0.1), color: 'text.primary' }}
            />
          </Box>
        </Box>

        {/* Bid amount slider */}
        <Typography variant="subtitle2" sx={{ color: 'primary.main', mb: 1 }}>
          Your Bid Amount (GH₵)
        </Typography>
        <Box sx={{ px: 1, mb: 1 }}>
          <Slider
            value={bidAmount}
            onChange={(_, val) => setBidAmount(val)}
            min={minBid}
            max={maxBid}
            step={50}
            valueLabelDisplay="on"
            valueLabelFormat={(v) => `GH₵ ${v.toLocaleString()}`}
            sx={{
              color: theme.palette.primary.main,
              '& .MuiSlider-valueLabel': { bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText },
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
            startAdornment: <InputAdornment position="start">GH₵</InputAdornment>,
          }}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              color: theme.palette.text.primary,
              '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.3) },
            },
          }}
        />

        {/* Estimated duration */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 140px' }, gap: 2, mb: 3 }}>
          <TextField
            label="Estimated Duration"
            type="number"
            value={estimatedDuration.value}
            onChange={(e) => {
              const nextValue = Number(e.target.value);
              setEstimatedDuration((prev) => ({
                ...prev,
                value: Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 1,
              }));
            }}
            fullWidth
            size="small"
            inputProps={{ min: 1 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: theme.palette.text.primary,
                '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.3) },
              },
              '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Schedule sx={{ color: alpha(theme.palette.primary.main, 0.5) }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" fullWidth>
            <InputLabel id="bid-duration-unit-label">Unit</InputLabel>
            <Select
              labelId="bid-duration-unit-label"
              value={estimatedDuration.unit}
              label="Unit"
              onChange={(e) => {
                const nextUnit = e.target.value;
                setEstimatedDuration((prev) => ({ ...prev, unit: nextUnit }));
              }}
            >
              <MenuItem value="hour">Hours</MenuItem>
              <MenuItem value="day">Days</MenuItem>
              <MenuItem value="week">Weeks</MenuItem>
              <MenuItem value="month">Months</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TextField
          label="Hours Per Week"
          type="number"
          value={hoursPerWeek}
          onChange={(e) => {
            const nextValue = Number(e.target.value);
            setHoursPerWeek(Number.isFinite(nextValue) && nextValue > 0 ? Math.min(nextValue, 168) : 40);
          }}
          fullWidth
          size="small"
          inputProps={{ min: 1, max: 168 }}
          helperText="Tell the client how much weekly time you can realistically commit."
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              color: theme.palette.text.primary,
              '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.3) },
            },
            '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
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
              color: theme.palette.text.primary,
              '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.3) },
            },
            '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
          }}
        />

        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          You can submit up to 5 bids per month. Review your price, timeline, and availability before sending.
        </Typography>
      </DialogContent>

      {!isMobile && (
        <DialogActions sx={{ bgcolor: 'background.paper', p: 2 }}>
          <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <GavelIcon />}
            color="primary"
          >
            {loading ? 'Submitting...' : `Submit Bid — GH₵ ${bidAmount.toLocaleString()}`}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default BidSubmissionForm;
