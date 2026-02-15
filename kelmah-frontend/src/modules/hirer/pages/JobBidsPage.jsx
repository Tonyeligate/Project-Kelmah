/**
 * JobBidsPanel — Hirer's bid review panel for a specific job
 *
 * DATA FLOW:
 *   JobBidsPanel → bidApi.getJobBids(jobId) → GET /api/bids/job/:jobId → Gateway → Job Service
 *   Accept bid → bidApi.acceptBid(bidId) → PATCH /api/bids/:id/accept → Gateway → Job Service
 *   Reject bid → bidApi.rejectBid(bidId) → PATCH /api/bids/:id/reject → Gateway → Job Service
 *
 * Usage: Embedded in JobManagementPage or standalone at /hirer/jobs/:jobId/bids
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Button,
  IconButton,
  Avatar,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Tooltip,
  Divider,
  useTheme,
  alpha,
  Paper,
  Skeleton,
  Rating,
  LinearProgress,
} from '@mui/material';
import {
  Gavel as BidIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
  HourglassEmpty as PendingIcon,
  Person as PersonIcon,
  ArrowBack as BackIcon,
  Star as StarIcon,
  TrendingUp as ScoreIcon,
  Refresh as RefreshIcon,
  Description as LetterIcon,
  TimerOff as ExpiredIcon,
} from '@mui/icons-material';
import bidApi from '../../jobs/services/bidService';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'warning', icon: <PendingIcon fontSize="small" /> },
  accepted: { label: 'Accepted', color: 'success', icon: <AcceptIcon fontSize="small" /> },
  rejected: { label: 'Rejected', color: 'error', icon: <RejectIcon fontSize="small" /> },
  withdrawn: { label: 'Withdrawn', color: 'default', icon: null },
  expired: { label: 'Expired', color: 'default', icon: <ExpiredIcon fontSize="small" /> },
};

const BidReviewCard = ({ bid, onAccept, onReject, isProcessing }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const status = STATUS_CONFIG[bid.status] || STATUS_CONFIG.pending;
  const worker = bid.worker || {};

  const formatAmount = (amount) => {
    const num = Number(amount);
    return Number.isFinite(num) ? `GH₵${num.toLocaleString()}` : 'N/A';
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 2.5,
        border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
        ...(bid.status === 'accepted' && {
          borderColor: alpha(theme.palette.success.main, 0.4),
          bgcolor: alpha(theme.palette.success.main, 0.02),
        }),
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        {/* Worker info + status */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Avatar
              src={worker.avatar || worker.profileImage}
              alt={worker.name}
              sx={{ width: 44, height: 44, cursor: 'pointer' }}
              onClick={() => worker._id && navigate(`/workers/${worker._id}`)}
            >
              {(worker.name || 'W').charAt(0)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                noWrap
                sx={{ cursor: 'pointer' }}
                onClick={() => worker._id && navigate(`/workers/${worker._id}`)}
              >
                {worker.name || 'Worker'}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                {worker.rating != null && (
                  <Stack direction="row" spacing={0.25} alignItems="center">
                    <StarIcon sx={{ fontSize: 14, color: theme.palette.warning.main }} />
                    <Typography variant="caption" fontWeight={600}>
                      {Number(worker.rating).toFixed(1)}
                    </Typography>
                  </Stack>
                )}
                <Typography variant="caption" color="text.secondary">
                  Bid placed {formatDate(bid.createdAt)}
                </Typography>
              </Stack>
            </Box>
          </Stack>
          <Chip
            icon={status.icon}
            label={status.label}
            color={status.color}
            size="small"
            variant="outlined"
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Bid details */}
        <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Bid Amount</Typography>
            <Typography variant="h6" fontWeight={700} color="primary.main">
              {formatAmount(bid.bidAmount)}
            </Typography>
          </Box>
          {bid.estimatedDuration && (
            <Box>
              <Typography variant="caption" color="text.secondary">Est. Duration</Typography>
              <Typography variant="body1" fontWeight={600}>
                {bid.estimatedDuration.value} {bid.estimatedDuration.unit}
                {bid.estimatedDuration.value !== 1 ? 's' : ''}
              </Typography>
            </Box>
          )}
          {bid.score != null && (
            <Box>
              <Typography variant="caption" color="text.secondary">Match Score</Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <ScoreIcon fontSize="small" color="primary" />
                <Typography variant="body1" fontWeight={600}>
                  {Math.round(bid.score)}%
                </Typography>
              </Stack>
            </Box>
          )}
        </Stack>

        {/* Cover letter */}
        {bid.coverLetter && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.background.default, 0.6),
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
              <LetterIcon fontSize="small" color="action" />
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                Cover Letter
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {bid.coverLetter}
            </Typography>
          </Paper>
        )}

        {/* Availability info */}
        {bid.availability && (
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            {bid.availability.startDate && (
              <Typography variant="caption" color="text.secondary">
                Available from: {new Date(bid.availability.startDate).toLocaleDateString('en-GH')}
              </Typography>
            )}
            {bid.availability.hoursPerWeek && (
              <Typography variant="caption" color="text.secondary">
                {bid.availability.hoursPerWeek} hrs/week
              </Typography>
            )}
            {bid.availability.flexible && (
              <Chip label="Flexible" size="small" color="info" variant="outlined" />
            )}
          </Stack>
        )}

        {/* Action buttons — only for pending bids */}
        {bid.status === 'pending' && (
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<RejectIcon />}
              onClick={() => onReject(bid)}
              disabled={isProcessing}
              sx={{ textTransform: 'none' }}
            >
              Reject
            </Button>
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<AcceptIcon />}
              onClick={() => onAccept(bid)}
              disabled={isProcessing}
              sx={{ textTransform: 'none' }}
            >
              Accept Bid
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

const BidCardSkeleton = () => (
  <Card sx={{ mb: 2, borderRadius: 2.5 }}>
    <CardContent>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
        <Skeleton variant="circular" width={44} height={44} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="50%" height={24} />
          <Skeleton width="30%" height={16} />
        </Box>
        <Skeleton variant="rounded" width={80} height={24} />
      </Stack>
      <Skeleton width="100%" height={1} sx={{ my: 1 }} />
      <Stack direction="row" spacing={4}>
        <Skeleton width={80} height={40} />
        <Skeleton width={100} height={40} />
      </Stack>
      <Skeleton width="100%" height={60} sx={{ mt: 1 }} />
    </CardContent>
  </Card>
);

const JobBidsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { jobId } = useParams();

  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Action dialogs
  const [acceptDialog, setAcceptDialog] = useState({ open: false, bid: null });
  const [rejectDialog, setRejectDialog] = useState({ open: false, bid: null });
  const [rejectReason, setRejectReason] = useState('');

  const fetchBids = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await bidApi.getJobBids(jobId);
      const bidsData = Array.isArray(result) ? result : result?.bids || [];
      // Sort: pending first, then by score desc, then by date desc
      bidsData.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        if (a.status === 'accepted') return -1;
        if (b.status === 'accepted') return 1;
        if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setBids(bidsData);
    } catch (err) {
      setError('Failed to load bids. The job may not exist or you may not have permission.');
      console.error('JobBidsPage fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  const handleAcceptConfirm = async () => {
    const bid = acceptDialog.bid;
    if (!bid) return;
    setProcessing(true);
    try {
      await bidApi.acceptBid(bid._id || bid.id);
      // Update local state: accepted bid + reject all other pending bids
      setBids((prev) =>
        prev.map((b) => {
          const id = b._id || b.id;
          if (id === (bid._id || bid.id)) return { ...b, status: 'accepted' };
          if (b.status === 'pending') return { ...b, status: 'rejected' };
          return b;
        }),
      );
      setSuccessMsg('Bid accepted! The worker has been notified.');
      setAcceptDialog({ open: false, bid: null });
    } catch (err) {
      setError('Failed to accept bid. Please try again.');
      console.error('Accept bid error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectConfirm = async () => {
    const bid = rejectDialog.bid;
    if (!bid) return;
    setProcessing(true);
    try {
      await bidApi.rejectBid(bid._id || bid.id, { reason: rejectReason });
      setBids((prev) =>
        prev.map((b) =>
          (b._id || b.id) === (bid._id || bid.id) ? { ...b, status: 'rejected' } : b,
        ),
      );
      setSuccessMsg('Bid rejected.');
      setRejectDialog({ open: false, bid: null });
      setRejectReason('');
    } catch (err) {
      setError('Failed to reject bid. Please try again.');
      console.error('Reject bid error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const pendingCount = bids.filter((b) => b.status === 'pending').length;
  const acceptedBid = bids.find((b) => b.status === 'accepted');

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <Helmet>
        <title>Review Bids | Kelmah</title>
      </Helmet>

      {/* Navigation back + header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <IconButton onClick={() => navigate(-1)} size="small">
          <BackIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          Back to job
        </Typography>
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Review Bids
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {bids.length} bid{bids.length !== 1 ? 's' : ''} received
            {pendingCount > 0 && ` · ${pendingCount} pending review`}
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchBids} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Accepted bid highlight */}
      {acceptedBid && (
        <Alert severity="success" icon={<AcceptIcon />} sx={{ mb: 2 }}>
          You accepted <strong>{acceptedBid.worker?.name || 'a worker'}</strong>'s bid of{' '}
          <strong>GH₵{acceptedBid.bidAmount?.toLocaleString()}</strong>.
        </Alert>
      )}

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box>
          {[1, 2, 3].map((i) => (<BidCardSkeleton key={i} />))}
        </Box>
      )}

      {/* Empty state */}
      {!loading && bids.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2.5,
            border: `1px dashed ${theme.palette.divider}`,
          }}
        >
          <BidIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No bids yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Workers haven't placed any bids on this job yet. Check back soon.
          </Typography>
        </Paper>
      )}

      {/* Bids list */}
      {!loading &&
        bids.map((bid) => (
          <BidReviewCard
            key={bid._id || bid.id}
            bid={bid}
            onAccept={(b) => setAcceptDialog({ open: true, bid: b })}
            onReject={(b) => setRejectDialog({ open: true, bid: b })}
            isProcessing={processing}
          />
        ))}

      {/* Accept confirmation dialog */}
      <Dialog
        open={acceptDialog.open}
        onClose={() => !processing && setAcceptDialog({ open: false, bid: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Accept This Bid?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Accepting <strong>{acceptDialog.bid?.worker?.name || 'this worker'}</strong>'s bid of{' '}
            <strong>GH₵{acceptDialog.bid?.bidAmount?.toLocaleString()}</strong> will automatically
            reject all other pending bids for this job. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAcceptDialog({ open: false, bid: null })} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleAcceptConfirm}
            disabled={processing}
            startIcon={processing ? <CircularProgress size={16} /> : <AcceptIcon />}
          >
            {processing ? 'Accepting...' : 'Accept Bid'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject confirmation dialog */}
      <Dialog
        open={rejectDialog.open}
        onClose={() => !processing && setRejectDialog({ open: false, bid: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject This Bid?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            The worker will be notified that their bid was not accepted.
          </DialogContentText>
          <TextField
            label="Reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            multiline
            rows={2}
            fullWidth
            helperText="A brief reason helps workers improve future bids"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, bid: null })} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRejectConfirm}
            disabled={processing}
            startIcon={processing ? <CircularProgress size={16} /> : <RejectIcon />}
          >
            {processing ? 'Rejecting...' : 'Reject Bid'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default JobBidsPage;
