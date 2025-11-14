import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
        <DialogContent>
          {selectedProposal && (
            <Box>
              {(() => {
                const worker = selectedProposal.worker || {};
                const workerName = worker.name || 'Unknown worker';
                const workerLocation = formatLocationBadge(worker.location);
                const job = selectedProposal.job || {};
                const jobLocation = formatLocationBadge(
                  job.location || job.locationDetails || selectedProposal.jobLocation,
                );
                const coverLetter =
                  selectedProposal.coverLetterPreview ||
                  'No cover letter provided.';
                const durationLabel = formatDurationLabel(
                  selectedProposal.availability?.duration,
                );
                const startLabel = selectedProposal.availability?.startDate
                  ? formatDate(selectedProposal.availability.startDate)
                  : null;

                return (
                  <>
                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                      <Avatar src={worker.avatar} sx={{ width: 64, height: 64 }}>
                        {workerName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{workerName}</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <StarIcon sx={{ fontSize: 16, color: 'gold' }} />
                          <Typography variant="body2">
                            {Number(worker.rating || 0).toFixed(1)} ({worker.completedJobs || 0} jobs)
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {workerLocation}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {worker.experience || 'Experience not specified'}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={3} sx={{ mb: 3 }}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          Job: {job.title || selectedProposal.jobTitle || 'Untitled job'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Category: {job.category || 'Not specified'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Location: {jobLocation}
                        </Typography>
                        {typeof job.budget === 'number' && !Number.isNaN(job.budget) && (
                          <Typography variant="body2" color="text.secondary">
                            Budget: {formatCurrency(job.budget)}
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          color="primary.main"
                          gutterBottom
                        >
                          Proposed Rate: {formatCurrency(selectedProposal.proposedRate)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Duration: {durationLabel}
                        </Typography>
                        {startLabel && (
                          <Typography variant="body2" color="text.secondary">
                            Earliest Start: {startLabel}
                          </Typography>
                        )}
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
                      {coverLetter}
                    </Typography>
                  </>
                );
              })()}
            </Box>
          )}
        </DialogContent>
      requestControllerRef.current = null;
    }
    timedOutRequestRef.current = false;
  }, []);

  const fetchProposals = useCallback(
    async ({ status = statusFilter, page: requestedPage = page, useCache = true } = {}) => {
      const cacheKey = `${status}:${requestedPage}`;
      const cachedEntry = cacheRef.current.get(cacheKey);

      if (cachedEntry) {
        setProposals(cachedEntry.data.items);
        setMeta(cachedEntry.data.meta);
        setLastUpdated(
          cachedEntry.data.meta?.aggregates?.updatedAt || cachedEntry.timestamp,
        );
        setError(null);
      }

      const cacheIsFresh =
        cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS;

      if (useCache && cacheIsFresh) {
        setLoading(false);
        setIsRefreshing(false);
        setHasTimedOut(false);
        return;
      }

      const hadWarmData = Boolean(cachedEntry);
      setIsRefreshing(hadWarmData);
      setLoading(!hadWarmData);
      setHasTimedOut(false);

      let lastError = null;
      let completed = false;
      let aborted = false;

      for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt += 1) {
        clearInFlightRequest();
        const controller = new AbortController();
        requestControllerRef.current = controller;
        timeoutRef.current = setTimeout(() => {
          timedOutRequestRef.current = true;
          setHasTimedOut(true);
          controller.abort();
        }, REQUEST_TIMEOUT_MS);

        try {
          const response = await jobServiceClient.get('/jobs/proposals', {
            params: { status, page: requestedPage, limit: DEFAULT_PAGE_SIZE },
            signal: controller.signal,
          });

          const payload = response.data?.data || {};
          const items = Array.isArray(payload.items) ? payload.items : [];
          const pagination = payload.pagination || {
            page: requestedPage,
            totalPages: 1,
          };
          const aggregates = response.data?.meta?.aggregates || {};

          setProposals(items);
          setMeta({ pagination, aggregates });
          setError(null);
          setHasTimedOut(false);
          const resolvedUpdatedAt =
            aggregates.updatedAt || new Date().toISOString();
          setLastUpdated(resolvedUpdatedAt);

          cacheRef.current.set(cacheKey, {
            timestamp: Date.now(),
            data: {
              items,
              meta: { pagination, aggregates },
            },
          });

          completed = true;
          break;
        } catch (err) {
          lastError = err;
          if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
            aborted = true;
            if (timedOutRequestRef.current) {
              setError(
                'Loading proposals is taking longer than expected. Please retry.',
              );
            }
            break;
          }

          if (attempt < MAX_RETRY_ATTEMPTS) {
            await new Promise((resolve) =>
              setTimeout(resolve, 400 * 2 ** attempt),
            );
          }
        } finally {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          requestControllerRef.current = null;
          timedOutRequestRef.current = false;
        }
      }

      setLoading(false);
      setIsRefreshing(false);

      if (completed || aborted) {
        return;
      }

      if (lastError) {
        console.error('Unable to fetch proposals:', lastError);
        setError('Unable to fetch proposals. Please try again later.');
      }
    },
    [statusFilter, page, clearInFlightRequest],
  );

  useEffect(() => {
    fetchProposals();
    return () => clearInFlightRequest();
  }, [fetchProposals, clearInFlightRequest]);

  const handleStatusChange = useCallback(
    (nextStatus) => {
      if (nextStatus === statusFilter) {
        return;
      }
      setStatusFilter(nextStatus);
      setPage(1);
    },
    [statusFilter],
  );

  const handlePageChange = useCallback(
    (_event, value) => {
      if (value === page) {
        return;
      }
      setPage(value);
    },
    [page],
  );

  const handleRetry = useCallback(() => {
    fetchProposals({ status: statusFilter, page, useCache: false });
  }, [fetchProposals, statusFilter, page]);

  const pagination = meta?.pagination || { page: 1, totalPages: 1 };
  const statusCounts = meta?.aggregates?.statusCounts || {};

  const proposalStats = useMemo(() => {
    const fallbackAverage =
      proposals.length > 0
        ? proposals.reduce(
            (sum, proposal) => sum + (proposal.proposedRate || 0),
            0,
          ) / proposals.length
        : 0;

    return {
      total: meta?.aggregates?.total ?? proposals.length,
      pending: statusCounts.pending || 0,
      accepted: statusCounts.accepted || 0,
      rejected: statusCounts.rejected || 0,
      averageRate: meta?.aggregates?.averageRate ?? fallbackAverage,
    };
  }, [meta, proposals, statusCounts]);

  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) {
      return 'Never';
    }
    return new Date(lastUpdated).toLocaleString('en-GH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [lastUpdated]);

  const showInitialLoading = loading && proposals.length === 0;
  const isEmptyState = !loading && proposals.length === 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) {
      return 'Not specified';
    }
    return new Date(date).toLocaleDateString('en-GH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDurationLabel = (duration) => {
    if (!duration) {
      return 'Not specified';
    }
    if (typeof duration === 'string') {
      return duration;
    }
    const value = duration.value || duration.amount;
    const unit = duration.unit;
    if (!value || !unit) {
      return 'Not specified';
    }
    const normalizedUnit = value > 1 && !unit.endsWith('s') ? `${unit}s` : unit;
    return `${value} ${normalizedUnit}`;
  };

  const formatLocationBadge = (location) => {
    if (!location) {
      return 'Location not specified';
    }
    if (typeof location === 'string') {
      return location;
    }
    const { city, region, country, address } = location;
    const parts = [city, region, address, country]
      .map((part) => (typeof part === 'string' ? part.trim() : ''))
      .filter(Boolean);
    return parts.length ? parts.join(', ') : 'Location not specified';
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
      case 'withdrawn':
        return 'default';
      default:
        return 'default';
    }
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

  const handleMenuOpen = (event, proposal) => {
    setAnchorEl(event.currentTarget);
    setSelectedProposal(proposal);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProposal(null);
  };

  const handleDialogOpen = (type) => {
    setDialogType(type);
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogType(null);
    setSelectedProposal(null);
    setReviewForm({
      rating: 5,
      feedback: '',
      decision: '',
    });
  };

  const handleProposalAction = async (action) => {
    if (selectedProposal) {
      try {
        // Mock proposal action
        console.log(`${action} proposal ${selectedProposal.id}`);

        // Update local state
        setProposals((prev) =>
          prev.map((p) =>
            p.id === selectedProposal.id ? { ...p, status: action } : p,
          ),
        );

        handleDialogClose();
      } catch (error) {
        console.error(`Error ${action} proposal:`, error);
        setError(`Failed to ${action} proposal`);
      }
    }
  };

  // Summary Statistics derived from API metadata

  if (showInitialLoading) {
    return (
      <Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={120} animation="wave" />
            </Grid>
          ))}
        </Grid>
        <Card>
          <CardContent>
            <Skeleton variant="text" height={40} width="40%" sx={{ mb: 2 }} />
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} variant="text" height={60} sx={{ mb: 1 }} />
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      {(error || hasTimedOut) && (
        <Alert
          severity={error ? 'error' : 'warning'}
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
          onClose={() => {
            setError(null);
            setHasTimedOut(false);
          }}
        >
          {error ||
            'Loading proposals is taking longer than expected. Please try again.'}
        </Alert>
      )}

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap">
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
                  label={statusCounts[value] || 0}
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

      {/* Proposal Statistics */}
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
                <PersonIcon sx={{ fontSize: 40, opacity: 0.8 }} />
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
                <ScheduleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
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
                <MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
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
                <AcceptIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Proposals Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Job Proposals ({proposals.length})
          </Typography>

          {isEmptyState ? (
            <Box textAlign="center" py={4}>
              <PersonIcon
                sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary">
                No proposals found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Adjust your filters or check back later for new activity.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Worker & Job</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Proposed Rate</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Duration</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Rating</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Submitted</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {proposals.map((proposal) => {
                    const workerName = proposal.worker?.name || 'Unknown worker';
                    const workerAvatar = proposal.worker?.avatar || '';
                    const workerExperience = proposal.worker?.experience || 'Experience not specified';
                    const workerLocation = formatLocationBadge(
                      proposal.worker?.location,
                    );
                    const completedJobs = proposal.worker?.completedJobs || 0;
                    const jobTitle = proposal.job?.title || proposal.jobTitle || 'Untitled job';
                    const jobLocation = formatLocationBadge(
                      proposal.job?.location ||
                        proposal.job?.locationDetails ||
                        proposal.jobLocation,
                    );
                    const jobBudget = proposal.job?.budget;
                    const durationLabel = formatDurationLabel(
                      proposal.availability?.duration,
                    );
                    const startDateLabel = proposal.availability?.startDate
                      ? formatDate(proposal.availability.startDate)
                      : null;
                    const submittedLabel = formatDate(proposal.submittedAt);

                    return (
                      <TableRow key={proposal.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar src={workerAvatar} sx={{ width: 40, height: 40 }}>
                              {workerName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {workerName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {jobTitle}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {workerLocation} • {workerExperience}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {jobLocation}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                            {formatCurrency(proposal.proposedRate)}
                          </Typography>
                          {typeof jobBudget === 'number' && !Number.isNaN(jobBudget) && (
                            <Typography variant="caption" color="text.secondary">
                              Budget: {formatCurrency(jobBudget)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{durationLabel}</Typography>
                          {startDateLabel && (
                            <Typography variant="caption" color="text.secondary">
                              Starts {startDateLabel}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <StarIcon sx={{ fontSize: 16, color: 'gold' }} />
                            <Typography variant="body2">
                              {Number(proposal.worker?.rating || 0).toFixed(1)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ({completedJobs} jobs)
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatStatusLabel(proposal.status)}
                            color={getStatusColor(proposal.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{submittedLabel}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, proposal)}
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
          )}

          {pagination.totalPages > 1 && (
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Pagination
                count={pagination.totalPages}
                page={pagination.page}
                color="primary"
                shape="rounded"
                onChange={handlePageChange}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleDialogOpen('view')}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {selectedProposal?.status === 'pending' && [
          <MenuItem key="accept" onClick={() => handleDialogOpen('accept')}>
            <AcceptIcon sx={{ mr: 1, color: 'success.main' }} />
            Accept Proposal
          </MenuItem>,
          <MenuItem key="reject" onClick={() => handleDialogOpen('reject')}>
            <RejectIcon sx={{ mr: 1, color: 'error.main' }} />
            Reject Proposal
          </MenuItem>,
        ]}
      </Menu>

      {/* Proposal Details Dialog */}
      <Dialog
        open={dialogOpen && dialogType === 'view'}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Proposal Details</DialogTitle>
        <DialogContent>
          {selectedProposal && (
            <Box>
              {/* Worker Info */}
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar
                  src={selectedProposal.worker.avatar}
                  sx={{ width: 64, height: 64 }}
                >
                  {selectedProposal.worker.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedProposal.worker.name}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <StarIcon sx={{ fontSize: 16, color: 'gold' }} />
                    <Typography variant="body2">
                      {selectedProposal.worker.rating} (
                      {selectedProposal.worker.completedJobs} jobs)
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {selectedProposal.worker.location}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Job & Rate Info */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    Job: {selectedProposal.jobTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Budget: {formatCurrency(selectedProposal.jobBudget)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    color="primary.main"
                  >
                    Proposed Rate:{' '}
                    {formatCurrency(selectedProposal.proposedRate)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duration: {selectedProposal.estimatedDuration}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Proposal Text */}
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Proposal
              </Typography>
              <Typography variant="body2" paragraph>
                {selectedProposal.proposalText}
              </Typography>

              {/* Skills */}
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Skills
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                {selectedProposal.worker.skills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>

              {/* Timeline */}
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Proposed Timeline
              </Typography>
              <Box mb={2}>
                {selectedProposal.timeline.map((phase, index) => (
                  <Box
                    key={index}
                    display="flex"
                    justifyContent="space-between"
                    py={0.5}
                  >
                    <Typography variant="body2">{phase.phase}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {phase.duration}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Attachments */}
              {selectedProposal.attachments.length > 0 && (
                <>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    Attachments
                  </Typography>
                  <Box>
                    {selectedProposal.attachments.map((attachment, index) => (
                      <Box
                        key={index}
                        display="flex"
                        justifyContent="space-between"
                        py={0.5}
                      >
                        <Typography variant="body2">
                          {attachment.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {attachment.size}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Close</Button>
          {selectedProposal?.status === 'pending' && (
            <>
              <Button
                onClick={() => handleProposalAction('rejected')}
                color="error"
                variant="outlined"
              >
                Reject
              </Button>
              <Button
                onClick={() => handleProposalAction('accepted')}
                color="success"
                variant="contained"
              >
                Accept
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Accept/Reject Confirmation Dialogs */}
      <Dialog
        open={
          dialogOpen && (dialogType === 'accept' || dialogType === 'reject')
        }
        onClose={handleDialogClose}
      >
        <DialogTitle>
          {dialogType === 'accept' ? 'Accept Proposal' : 'Reject Proposal'}
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to {dialogType} this proposal from{' '}
            {selectedProposal?.worker?.name}?
          </Typography>
          {dialogType === 'reject' && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason for rejection (optional)"
              value={reviewForm.feedback}
              onChange={(e) =>
                setReviewForm({ ...reviewForm, feedback: e.target.value })
              }
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={() =>
              handleProposalAction(
                dialogType === 'accept' ? 'accepted' : 'rejected',
              )
            }
            color={dialogType === 'accept' ? 'success' : 'error'}
            variant="contained"
          >
            {dialogType === 'accept' ? 'Accept' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProposalReview;
