/**
 * MyBidsPage — Worker's bid dashboard
 *
 * DATA FLOW:
 *   MyBidsPage → bidApi.getWorkerBids(userId) → GET /api/bids/worker/:workerId → Gateway → Job Service
 *   MyBidsPage → bidApi.withdrawBid(bidId) → PATCH /api/bids/:id/withdraw → Gateway → Job Service
 *   MyBidsPage → bidApi.getWorkerBidStats(userId) → GET /api/bids/stats/worker/:workerId → Gateway → Job Service
 */

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { normalizeUser } from '../../../utils/userUtils';
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
  Tabs,
  Tab,
  Divider,
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
  useTheme,
  alpha,
  Paper,
  Skeleton,
} from '@mui/material';
import {
  Gavel as BidIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  LocationOn as LocationIcon,
  CheckCircle as AcceptedIcon,
  Cancel as RejectedIcon,
  HourglassEmpty as PendingIcon,
  Undo as WithdrawIcon,
  TimerOff as ExpiredIcon,
  TrendingUp as StatsIcon,
  Work as WorkIcon,
  ArrowForward as ArrowIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import bidApi from '../../jobs/services/bidService';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'warning', icon: <PendingIcon fontSize="small" /> },
  accepted: { label: 'Accepted', color: 'success', icon: <AcceptedIcon fontSize="small" /> },
  rejected: { label: 'Rejected', color: 'error', icon: <RejectedIcon fontSize="small" /> },
  withdrawn: { label: 'Withdrawn', color: 'default', icon: <WithdrawIcon fontSize="small" /> },
  expired: { label: 'Expired', color: 'default', icon: <ExpiredIcon fontSize="small" /> },
};

const BidCard = ({ bid, onWithdraw, onViewJob }) => {
  const theme = useTheme();
  const status = STATUS_CONFIG[bid.status] || STATUS_CONFIG.pending;
  const job = bid.job || {};

  const formatAmount = (amount) => {
    const num = Number(amount);
    return Number.isFinite(num) ? `GH₵${num.toLocaleString()}` : 'N/A';
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;
    return d.toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 2.5,
        border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.3),
          boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.08)}`,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        {/* Header: job title + bid status */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onViewJob(job._id || job.id)}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {job.title || 'Job Title'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {job.category || ''} · Bid placed {formatDate(bid.createdAt)}
            </Typography>
          </Box>
          <Chip
            icon={status.icon}
            label={status.label}
            color={status.color}
            size="small"
            variant="outlined"
          />
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        {/* Bid details row */}
        <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MoneyIcon fontSize="small" color="primary" />
            <Typography variant="body2" fontWeight={600}>
              {formatAmount(bid.bidAmount)}
            </Typography>
          </Box>
          {bid.estimatedDuration && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TimeIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {bid.estimatedDuration.value} {bid.estimatedDuration.unit}
                {bid.estimatedDuration.value !== 1 ? 's' : ''}
              </Typography>
            </Box>
          )}
          {(job.location?.address || job.location) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary" noWrap>
                {typeof job.location === 'string' ? job.location : job.location?.address || ''}
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Cover letter preview */}
        {bid.coverLetter && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontStyle: 'italic',
            }}
          >
            "{bid.coverLetter}"
          </Typography>
        )}

        {/* Actions */}
        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 1.5 }}>
          <Button
            size="small"
            variant="text"
            endIcon={<ArrowIcon />}
            onClick={() => onViewJob(job._id || job.id)}
            sx={{ textTransform: 'none' }}
          >
            View Job
          </Button>
          {bid.status === 'pending' && (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<WithdrawIcon />}
              onClick={() => onWithdraw(bid)}
              sx={{ textTransform: 'none' }}
            >
              Withdraw
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

const BidStatsSummary = ({ stats }) => {
  const theme = useTheme();
  if (!stats) return null;

  const items = [
    { label: 'Bids This Month', value: stats.count ?? 0, color: theme.palette.primary.main },
    { label: 'Monthly Quota', value: stats.quota ?? 5, color: theme.palette.info.main },
    { label: 'Remaining', value: stats.remaining ?? 5, color: theme.palette.success.main },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 2.5,
        bgcolor: alpha(theme.palette.primary.main, 0.04),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <StatsIcon color="primary" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={700}>Monthly Bid Stats</Typography>
      </Stack>
      <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
        {items.map((item) => (
          <Box key={item.label}>
            <Typography variant="h5" fontWeight={700} sx={{ color: item.color }}>
              {item.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.label}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};

const BidCardSkeleton = () => (
  <Card sx={{ mb: 2, borderRadius: 2.5 }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Box sx={{ flex: 1 }}>
          <Skeleton width="60%" height={24} />
          <Skeleton width="40%" height={16} />
        </Box>
        <Skeleton variant="rounded" width={80} height={24} />
      </Stack>
      <Skeleton width="100%" height={1} sx={{ my: 1 }} />
      <Stack direction="row" spacing={3}>
        <Skeleton width={80} height={20} />
        <Skeleton width={100} height={20} />
      </Stack>
    </CardContent>
  </Card>
);

const MyBidsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user: rawUser } = useSelector((state) => state.auth);
  const user = normalizeUser(rawUser);
  const userId = user?.id;

  const [bids, setBids] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [withdrawDialog, setWithdrawDialog] = useState({ open: false, bid: null });
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const TAB_STATUSES = ['all', 'pending', 'accepted', 'rejected', 'withdrawn', 'expired'];

  const fetchBids = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [bidsResult, statsResult] = await Promise.allSettled([
        bidApi.getWorkerBids(userId),
        bidApi.getWorkerBidStats(userId),
      ]);
      const bidsData = bidsResult.status === 'fulfilled'
        ? (Array.isArray(bidsResult.value) ? bidsResult.value : bidsResult.value?.bids || [])
        : [];
      setBids(bidsData);
      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
      }
    } catch (err) {
      setError('Failed to load your bids. Please try again.');
      console.error('MyBidsPage fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  const filteredBids = tabValue === 0
    ? bids
    : bids.filter((b) => b.status === TAB_STATUSES[tabValue]);

  const handleWithdrawOpen = (bid) => {
    setWithdrawDialog({ open: true, bid });
    setWithdrawReason('');
  };

  const handleWithdrawConfirm = async () => {
    const bid = withdrawDialog.bid;
    if (!bid) return;
    setWithdrawing(true);
    try {
      await bidApi.withdrawBid(bid._id || bid.id, { reason: withdrawReason });
      setBids((prev) =>
        prev.map((b) =>
          (b._id || b.id) === (bid._id || bid.id) ? { ...b, status: 'withdrawn' } : b,
        ),
      );
      setWithdrawDialog({ open: false, bid: null });
    } catch (err) {
      console.error('Failed to withdraw bid:', err);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleViewJob = (jobId) => {
    if (jobId) navigate(`/jobs/${jobId}`);
  };

  const bidCounts = {
    all: bids.length,
    pending: bids.filter((b) => b.status === 'pending').length,
    accepted: bids.filter((b) => b.status === 'accepted').length,
    rejected: bids.filter((b) => b.status === 'rejected').length,
    withdrawn: bids.filter((b) => b.status === 'withdrawn').length,
    expired: bids.filter((b) => b.status === 'expired').length,
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <Helmet>
        <title>My Bids | Kelmah</title>
      </Helmet>

      {/* Page header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            My Bids
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage your submitted bids
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchBids} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Stats summary */}
      <BidStatsSummary stats={stats} />

      {/* Filter tabs */}
      <Tabs
        value={tabValue}
        onChange={(_, v) => setTabValue(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2,
          '& .MuiTab-root': { textTransform: 'none', minHeight: 40, fontWeight: 600 },
        }}
      >
        {TAB_STATUSES.map((status, i) => (
          <Tab
            key={status}
            label={
              <Stack direction="row" spacing={0.5} alignItems="center">
                <span>{status === 'all' ? 'All' : STATUS_CONFIG[status]?.label || status}</span>
                <Chip
                  label={bidCounts[status]}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem', ml: 0.5 }}
                />
              </Stack>
            }
          />
        ))}
      </Tabs>

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading state */}
      {loading && (
        <Box>
          {[1, 2, 3].map((i) => (
            <BidCardSkeleton key={i} />
          ))}
        </Box>
      )}

      {/* Bids list */}
      {!loading && filteredBids.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2.5,
            bgcolor: alpha(theme.palette.background.default, 0.5),
            border: `1px dashed ${theme.palette.divider}`,
          }}
        >
          <BidIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {tabValue === 0 ? 'No bids yet' : `No ${TAB_STATUSES[tabValue]} bids`}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Browse available jobs and start bidding on projects that match your skills.
          </Typography>
          <Button
            variant="contained"
            startIcon={<WorkIcon />}
            onClick={() => navigate('/worker/find-work')}
            sx={{ textTransform: 'none' }}
          >
            Find Work
          </Button>
        </Paper>
      )}

      {!loading &&
        filteredBids.map((bid) => (
          <BidCard
            key={bid._id || bid.id}
            bid={bid}
            onWithdraw={handleWithdrawOpen}
            onViewJob={handleViewJob}
          />
        ))}

      {/* Withdraw confirmation dialog */}
      <Dialog
        open={withdrawDialog.open}
        onClose={() => setWithdrawDialog({ open: false, bid: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Withdraw Bid</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to withdraw your bid of{' '}
            <strong>GH₵{withdrawDialog.bid?.bidAmount?.toLocaleString()}</strong>? This action
            cannot be undone.
          </DialogContentText>
          <TextField
            label="Reason (optional)"
            value={withdrawReason}
            onChange={(e) => setWithdrawReason(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialog({ open: false, bid: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleWithdrawConfirm}
            disabled={withdrawing}
            startIcon={withdrawing ? <CircularProgress size={16} /> : <WithdrawIcon />}
          >
            {withdrawing ? 'Withdrawing...' : 'Withdraw Bid'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyBidsPage;
