import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Pagination,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import StarIcon from '@mui/icons-material/Star';
import { useSnackbar } from 'notistack';
import { api } from '../../../services/apiClient';
import {
  DEFAULT_PROPOSAL_PAGE_SIZE,
  useProposals,
} from '../../../hooks/useProposals';

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
];

const formatCurrency = (value) => {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) {
    return 'GHS\u00a00';
  }
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) {
    return 'Not specified';
  }
  try {
    return new Intl.DateTimeFormat('en-GH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value));
  } catch (err) {
    return 'Not specified';
  }
};

const formatDurationLabel = (duration) => {
  if (!duration) {
    return 'Not specified';
  }
  if (typeof duration === 'string') {
    return duration;
  }
  const amount = duration.value ?? duration.amount;
  const unit = duration.unit;
  if (!amount || !unit) {
    return 'Not specified';
  }
  const normalizedUnit = amount > 1 && !unit.endsWith('s') ? `${unit}s` : unit;
  return `${amount} ${normalizedUnit}`;
};

const formatLocationBadge = (location) => {
  if (!location) {
    return 'Location not specified';
  }
  if (typeof location === 'string') {
    return location;
  }
  const { city, region, address, country } = location;
  const parts = [city, region, address, country]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);
  return parts.length ? parts.join(', ') : 'Location not specified';
};

const formatStatusLabel = (status) => {
  if (!status) {
    return 'Unknown';
  }
  return status
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'under_review':
      return 'info';
    case 'accepted':
      return 'success';
    case 'rejected':
      return 'error';
    default:
      return 'default';
  }
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const ProposalReview = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [reviewForm, setReviewForm] = useState({ feedback: '' });
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { enqueueSnackbar } = useSnackbar();

  const {
    proposals,
    meta,
    loading,
    isRefreshing,
    error,
    hasTimedOut,
    lastUpdated,
    refresh,
    retry,
    invalidateCache,
  } = useProposals({
    status: statusFilter,
    page: currentPage,
    limit: DEFAULT_PROPOSAL_PAGE_SIZE,
  });

  const statusCounts = meta?.aggregates?.statusCounts ?? {};
  const paginationData = meta?.pagination ?? {
    page: currentPage,
    totalPages: 1,
  };
  const totalPages = paginationData.totalPages ?? 1;
  const totalItems =
    paginationData.totalItems ?? meta?.aggregates?.total ?? proposals.length;
  const pageSize = paginationData.limit ?? DEFAULT_PROPOSAL_PAGE_SIZE;
  const rangeStart =
    proposals.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd =
    proposals.length === 0 ? 0 : rangeStart + proposals.length - 1;
  const safePage = currentPage > 0 ? currentPage : 1;

  const proposalStats = useMemo(() => {
    const aggregates = meta?.aggregates ?? {};
    const total = aggregates.total ?? proposals.length;
    const pending = statusCounts.pending ?? 0;
    const accepted = statusCounts.accepted ?? 0;
    const rejected = statusCounts.rejected ?? 0;
    const averageRate =
      aggregates.averageRate ??
      (proposals.length
        ? proposals.reduce(
          (sum, proposal) => sum + Number(proposal.proposedRate || 0),
          0,
        ) / proposals.length
        : 0);

    return {
      total,
      pending,
      accepted,
      rejected,
      averageRate,
    };
  }, [meta, proposals, statusCounts]);

  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) {
      return 'Never';
    }
    try {
      return new Intl.DateTimeFormat('en-GH', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(lastUpdated));
    } catch (err) {
      return 'Never';
    }
  }, [lastUpdated]);

  const showInitialLoading = loading && proposals.length === 0;
  const isEmptyState = !loading && proposals.length === 0;
  const combinedError = actionError || error;

  const handleStatusChange = useCallback(
    (nextStatus) => {
      if (nextStatus === statusFilter) {
        return;
      }
      invalidateCache();
      setActionError(null);
      setStatusFilter(nextStatus);
      setCurrentPage(1);
    },
    [statusFilter, invalidateCache],
  );

  const handlePageChange = useCallback(
    (_, value) => {
      if (value !== currentPage) {
        setActionError(null);
        setCurrentPage(value);
      }
    },
    [currentPage],
  );

  const handleRetry = useCallback(() => {
    setActionError(null);
    retry();
  }, [retry]);

  const handleRefresh = useCallback(() => {
    setActionError(null);
    refresh();
  }, [refresh]);

  const handleMenuOpen = (event, proposal) => {
    setAnchorEl(event.currentTarget);
    setSelectedProposal(proposal);
  };

  const handleMenuClose = useCallback((resetSelection = false) => {
    setAnchorEl(null);
    if (resetSelection) {
      setSelectedProposal(null);
    }
  }, []);

  const handleDialogOpen = useCallback((type) => {
    setDialogType(type);
    setDialogOpen(true);
    setAnchorEl(null);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setDialogType(null);
    setSelectedProposal(null);
    setReviewForm({ feedback: '' });
  }, []);

  const handleProposalAction = useCallback(
    async (action, additionalData = {}) => {
      if (!selectedProposal) {
        return;
      }

      const proposalId =
        selectedProposal.id ??
        selectedProposal._id ??
        selectedProposal.proposalId ??
        selectedProposal.proposalID;

      if (!proposalId) {
        const message =
          'Missing proposal identifier. Please refresh and try again.';
        setActionError(message);
        enqueueSnackbar(message, { variant: 'error' });
        return;
      }

      const jobId =
        selectedProposal.job?.id ??
        selectedProposal.job?._id ??
        selectedProposal.jobId ??
        selectedProposal.job?._doc?._id;

      if (!jobId) {
        const message =
          'Missing job identifier for this proposal. Please refresh and try again.';
        setActionError(message);
        enqueueSnackbar(message, { variant: 'error' });
        return;
      }

      const requestId = `proposal_action_${proposalId}_${Date.now()}`;

      try {
        setActionInProgress(true);
        setActionError(null);

        await api.put(`/api/jobs/${jobId}/applications/${proposalId}`, {
          status: action,
          notes: additionalData.feedback || additionalData.notes,
        });

        enqueueSnackbar('Proposal updated successfully.', {
          variant: 'success',
        });
        handleDialogClose();
        await refresh();
      } catch (err) {
        console.error(`Failed to update proposal ${proposalId}`, {
          requestId,
          error: err,
        });
        const message = 'Failed to update proposal. Please try again.';
        setActionError(message);
        enqueueSnackbar(message, { variant: 'error' });
      } finally {
        setActionInProgress(false);
      }
    },
    [selectedProposal, enqueueSnackbar, handleDialogClose, refresh],
  );

  const handleReviewInputChange = useCallback((event) => {
    const { value } = event.target;
    setReviewForm((prev) => ({ ...prev, feedback: value }));
  }, []);

  const renderProposalDetails = () => {
    if (!selectedProposal) {
      return null;
    }

    const worker = selectedProposal.worker ?? {};
    const job = selectedProposal.job ?? {};
    const attachments = toArray(selectedProposal.attachments);
    const timeline = toArray(selectedProposal.timeline);
    const skills = toArray(worker.skills);

    return (
      <Box>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Avatar src={worker.avatar} sx={{ width: 64, height: 64 }}>
            {(worker.name ?? 'U').charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6">
              {worker.name ?? 'Unknown worker'}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <StarIcon sx={{ fontSize: 16, color: 'gold' }} />
              <Typography variant="body2">
                {Number(worker.rating ?? 0).toFixed(1)} (
                {worker.completedJobs ?? 0} jobs)
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {formatLocationBadge(worker.location)}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Job Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Title: {job.title ?? selectedProposal.jobTitle ?? 'Untitled job'}
            </Typography>
            {job.category && (
              <Typography variant="body2" color="text.secondary">
                Category: {job.category}
              </Typography>
            )}
            {typeof job.budget === 'number' && (
              <Typography variant="body2" color="text.secondary">
                Budget: {formatCurrency(job.budget)}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              Location:{' '}
              {formatLocationBadge(
                job.location ??
                job.locationDetails ??
                selectedProposal.jobLocation,
              )}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Proposal Summary
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Proposed Rate: {formatCurrency(selectedProposal.proposedRate)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Duration:{' '}
              {formatDurationLabel(selectedProposal.availability?.duration)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Earliest Start:{' '}
              {formatDate(selectedProposal.availability?.startDate)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Submitted: {formatDate(selectedProposal.submittedAt)}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Cover Letter
        </Typography>
        <Typography variant="body2" paragraph>
          {selectedProposal.coverLetterPreview ??
            selectedProposal.proposalText ??
            'No cover letter provided.'}
        </Typography>

        {skills.length > 0 && (
          <>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Skills
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              {skills.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </>
        )}

        {timeline.length > 0 && (
          <>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Proposed Timeline
            </Typography>
            <Box mb={2}>
              {timeline.map((phase, index) => (
                <Box
                  key={phase.id ?? index}
                  display="flex"
                  justifyContent="space-between"
                  py={0.5}
                >
                  <Typography variant="body2">
                    {phase.phase ?? `Phase ${index + 1}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {phase.duration ?? '-'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}

        {attachments.length > 0 && (
          <>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Attachments
            </Typography>
            <Box>
              {attachments.map((attachment, index) => (
                <Box
                  key={attachment.id ?? attachment.name ?? index}
                  display="flex"
                  justifyContent="space-between"
                  py={0.5}
                >
                  <Typography variant="body2">
                    {attachment.name ?? `Attachment ${index + 1}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {attachment.size ?? ''}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>
    );
  };

  const renderLoadingState = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Skeleton variant="rounded" height={120} animation="wave" />
          </Grid>
        ))}
      </Grid>
      <Card>
        <CardContent>
          <Skeleton variant="text" height={40} width="40%" sx={{ mb: 2 }} />
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} variant="text" height={60} sx={{ mb: 1 }} />
          ))}
        </CardContent>
      </Card>
    </Box>
  );

  const renderEmptyState = () => (
    <Card>
      <CardContent>
        <Box textAlign="center" py={6} px={2}>
          <Typography variant="h6" gutterBottom>
            No proposals match your filters
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Adjust the status filters or refresh to check for new submissions.
          </Typography>
          <Button
            variant="outlined"
            onClick={handleRetry}
            startIcon={<RefreshIcon />}
            sx={{ textTransform: 'none' }}
          >
            Refresh proposals
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderErrorState = () => (
    <Card>
      <CardContent>
        <Box textAlign="center" py={6} px={2}>
          <Typography variant="h6" gutterBottom color="error">
            {combinedError ?? 'Unable to load proposals right now.'}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {hasTimedOut
              ? 'The request is taking longer than expected. Retry or refresh to try again.'
              : 'Please retry the request or refresh the page. If the issue persists, contact support.'}
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            justifyContent="center"
            alignItems="center"
          >
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
              sx={{ textTransform: 'none', minWidth: 160 }}
              disabled={loading}
            >
              Retry loading
            </Button>
            <Button
              variant="outlined"
              onClick={handleRefresh}
              sx={{ textTransform: 'none', minWidth: 160 }}
              disabled={loading}
            >
              Force refresh
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );

  const renderTableSection = () => {
    if (combinedError && proposals.length === 0) {
      return renderErrorState();
    }
    if (isEmptyState) {
      return renderEmptyState();
    }
    return (
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Worker</TableCell>
                <TableCell>Job</TableCell>
                <TableCell>Rate & Duration</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: skeletonRowCount }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    <TableCell colSpan={6}>
                      <Skeleton height={48} />
                    </TableCell>
                  </TableRow>
                ))
                : proposals.map((proposal, index) => {
                  const proposalId =
                    proposal.id ??
                    proposal._id ??
                    proposal.proposalId ??
                    proposal.proposalID ??
                    `proposal-${index}`;
                  const workerName =
                    proposal.worker?.name ??
                    proposal.workerName ??
                    'Unknown worker';
                  const locationLabel = formatLocationBadge(
                    proposal.worker?.location ?? proposal.workerLocation,
                  );
                  const jobTitle =
                    proposal.job?.title ??
                    proposal.jobTitle ??
                    'Untitled job';
                  const jobCategory =
                    proposal.job?.category ??
                    proposal.jobCategory ??
                    'General';
                  const statusLabel = proposal.status ?? 'pending';

                  return (
                    <TableRow hover key={proposalId}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {workerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {locationLabel}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {jobTitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {jobCategory}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {formatCurrency(
                            proposal.proposedRate ?? proposal.rate,
                          )}
                        </Typography>
                        {proposal.availability?.duration && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {formatDurationLabel(
                              proposal.availability.duration,
                            )}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(
                            proposal.submittedAt ?? proposal.createdAt,
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatStatusLabel(statusLabel)}
                          color={getStatusColor(statusLabel)}
                          size="small"
                          variant={
                            statusLabel === 'accepted' ? 'filled' : 'outlined'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(event) => handleMenuOpen(event, proposal)}
                          aria-label="Proposal actions"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <Box
          display="flex"
          flexDirection={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          gap={1.5}
          px={2}
          py={2}
        >
          <Typography variant="body2" color="text.secondary">
            {totalItems === 0
              ? 'No proposals to display.'
              : `Showing ${rangeStart}-${rangeEnd} of ${totalItems} proposals`}
          </Typography>
          <Pagination
            count={Math.max(totalPages, 1)}
            page={safePage}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            size="small"
          />
        </Box>
      </Card>
    );
  };

  if (showInitialLoading) {
    return renderLoadingState();
  }

  const menuOpen = Boolean(anchorEl);
  const skeletonRowCount = Math.max(Math.min(pageSize, 5), 1);

  return (
    <Box>
      {(combinedError || hasTimedOut) && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
          sx={{ mb: 2 }}
        >
          {combinedError ||
            'Loading proposals is taking longer than expected. Please try again.'}
        </Alert>
      )}

      {combinedError && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ mb: 2 }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={handleRetry}
            startIcon={<RefreshIcon />}
          >
            Retry loading
          </Button>
          <Button
            variant="outlined"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
          >
            Force refresh
          </Button>
        </Stack>
      )}

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          flexWrap="wrap"
        >
          {STATUS_FILTERS.map(({ label, value }) => (
            <Button
              key={value}
              variant={statusFilter === value ? 'contained' : 'outlined'}
              size="small"
              color={statusFilter === value ? 'secondary' : 'inherit'}
              onClick={() => handleStatusChange(value)}
              sx={{ textTransform: 'none' }}
            >
              {label}
              {value !== 'all' && (
                <Chip
                  label={statusCounts[value] ?? 0}
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
            </Button>
          ))}
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Last updated: {formattedLastUpdated}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={
              isRefreshing ? <CircularProgress size={16} /> : <RefreshIcon />
            }
            onClick={handleRetry}
            disabled={loading && !isRefreshing}
            sx={{ textTransform: 'none' }}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {isRefreshing && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {proposalStats.total}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Proposals
                  </Typography>
                </Box>
                <PersonOutlinedIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {proposalStats.pending}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Pending Review
                  </Typography>
                </Box>
                <ScheduleOutlinedIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(proposalStats.averageRate)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Average Rate
                  </Typography>
                </Box>
                <MonetizationOnOutlinedIcon
                  sx={{ fontSize: 40, opacity: 0.8 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {proposalStats.accepted}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Accepted
                  </Typography>
                </Box>
                <CheckCircleOutlineIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {renderTableSection()}

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => handleMenuClose(true)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => handleDialogOpen('view')}>
          <VisibilityOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
          View details
        </MenuItem>
        <MenuItem
          onClick={() => handleDialogOpen('accept')}
          disabled={selectedProposal?.status === 'accepted'}
        >
          <CheckCircleOutlineIcon fontSize="small" sx={{ mr: 1 }} />
          Mark as accepted
        </MenuItem>
        <MenuItem
          onClick={() => handleDialogOpen('reject')}
          disabled={selectedProposal?.status === 'rejected'}
        >
          <HighlightOffIcon fontSize="small" sx={{ mr: 1 }} />
          Mark as rejected
        </MenuItem>
      </Menu>

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        fullWidth
        maxWidth={dialogType === 'view' ? 'md' : 'sm'}
      >
        <DialogTitle>
          {dialogType === 'view' && 'Proposal Details'}
          {dialogType === 'accept' && 'Confirm acceptance'}
          {dialogType === 'reject' && 'Reject proposal'}
        </DialogTitle>
        <DialogContent dividers>
          {dialogType === 'view' && renderProposalDetails()}
          {dialogType === 'accept' && (
            <Typography variant="body2">
              This will move the proposal to the accepted list and notify the
              worker. Do you want to continue?
            </Typography>
          )}
          {dialogType === 'reject' && (
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Typography variant="body2">
                Optionally share feedback to help the worker understand your
                decision.
              </Typography>
              <TextField
                label="Feedback (optional)"
                value={reviewForm.feedback}
                onChange={handleReviewInputChange}
                multiline
                minRows={3}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={actionInProgress}>
            Cancel
          </Button>
          {dialogType === 'view' && (
            <Button onClick={handleDialogClose}>Close</Button>
          )}
          {dialogType === 'accept' && (
            <Button
              onClick={() => handleProposalAction('accepted')}
              variant="contained"
              color="primary"
              disabled={actionInProgress}
            >
              {actionInProgress ? 'Processing...' : 'Accept proposal'}
            </Button>
          )}
          {dialogType === 'reject' && (
            <Button
              onClick={() =>
                handleProposalAction('rejected', {
                  feedback: reviewForm.feedback?.trim() || undefined,
                })
              }
              variant="contained"
              color="error"
              disabled={actionInProgress}
            >
              {actionInProgress ? 'Processing...' : 'Reject proposal'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProposalReview;
