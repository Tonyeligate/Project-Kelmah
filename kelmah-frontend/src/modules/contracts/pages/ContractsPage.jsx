import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Box, Button, Card, CardActions, CardContent, Chip, Skeleton, Divider, Grid, IconButton, Paper, Stack, TextField, Typography, Alert } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import BlockIcon from '@mui/icons-material/Block';
import DraftsIcon from '@mui/icons-material/Drafts';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { formatDistanceToNow, isValid } from 'date-fns';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { contractService } from '../services/contractService';
import MobileFilterSheet from '../../../components/common/MobileFilterSheet';
import EmptyState from '../../../components/common/EmptyState';
import { useBreakpointDown } from '@/hooks/useResponsive';
import { toUserMessage } from '@/services/responseNormalizer';
import { devError } from '@/modules/common/utils/devLogger';
import PageCanvas from '@/modules/common/components/PageCanvas';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All contracts' },
  { value: 'draft', label: 'Drafts' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Closed' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'value-high', label: 'Value high to low' },
  { value: 'value-low', label: 'Value low to high' },
];

const statusIconMap = {
  draft: <DraftsIcon color="info" fontSize="small" />,
  active: <CheckCircleIcon color="success" fontSize="small" />,
  completed: <CheckCircleIcon color="primary" fontSize="small" />,
  pending: <WatchLaterIcon color="warning" fontSize="small" />,
  'pending-signature': <WatchLaterIcon color="warning" fontSize="small" />,
  terminated: <BlockIcon color="error" fontSize="small" />,
  cancelled: <ErrorOutlineIcon color="error" fontSize="small" />,
};

const statusChipColor = {
  draft: 'info',
  active: 'success',
  completed: 'primary',
  pending: 'warning',
  'pending-signature': 'warning',
  terminated: 'error',
  cancelled: 'error',
};

const ContractsPage = () => {
  const { user } = useAuth();
  const canCreateContract = ['hirer', 'admin'].includes(user?.role);
  const navigate = useNavigate();
  const isMobile = useBreakpointDown('md');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoadingHint, setShowLoadingHint] = useState(false);

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await contractService.getContracts();
      const data = result?.contracts || result?.data || (Array.isArray(result) ? result : []);
      setContracts(data);
    } catch (err) {
      devError('Failed to load contracts:', err);
      setError(toUserMessage(err, { fallback: 'Unable to load contracts. Please try again.' }));
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      setShowLoadingHint(false);
      return undefined;
    }

    const timer = setTimeout(() => {
      setShowLoadingHint(true);
    }, 12000);

    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const filteredContracts = useMemo(() => {
    const list = [...contracts];

    const matchesSearch = (contract) => {
      if (!searchQuery.trim()) return true;
      const needle = searchQuery.toLowerCase();
      return (
        (contract.title || '').toLowerCase().includes(needle) ||
        (contract.client?.name || '').toLowerCase().includes(needle) ||
        (contract.client?.company || '').toLowerCase().includes(needle)
      );
    };

    const matchesStatus = (contract) => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'closed') {
        return (
          contract.status === 'terminated' ||
          contract.status === 'cancelled'
        );
      }
      if (statusFilter === 'pending') {
        return (
          contract.status === 'pending' ||
          contract.status === 'pending-signature'
        );
      }
      return contract.status === statusFilter;
    };

    const filtered = list.filter(
      (contract) => matchesSearch(contract) && matchesStatus(contract),
    );

    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'oldest':
          return new Date(a.lastUpdated) - new Date(b.lastUpdated);
        case 'value-high':
          return b.budget - a.budget;
        case 'value-low':
          return a.budget - b.budget;
        default:
          return new Date(b.lastUpdated) - new Date(a.lastUpdated);
      }
    });
  }, [searchQuery, statusFilter, sortOption, contracts]);

  const refreshContracts = async () => {
    setIsRefreshing(true);
    await fetchContracts();
    setIsRefreshing(false);
  };

  const renderMilestones = (milestones) => (
    <Stack spacing={1} sx={{ mt: 2 }}>
      {(milestones || []).map((milestone) => (
        <Stack
          key={milestone.id}
          direction="row"
          spacing={1}
          alignItems="center"
        >
          {statusIconMap[milestone.status] || (
            <WatchLaterIcon fontSize="small" />
          )}
          <Typography variant="body2">{milestone.title}</Typography>
        </Stack>
      ))}
    </Stack>
  );

  return (
    <PageCanvas disableContainer sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}>
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Helmet><title>Contracts | Kelmah</title></Helmet>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {canCreateContract ? 'Contracts Overview' : 'My Contracts'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {canCreateContract
              ? 'Manage and track all your contracts in one place'
              : 'Track every contract that has been sent to you and monitor delivery progress'}
            {user?.profile?.name ? `, ${user.profile.name}` : ''}.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={refreshContracts}
            disabled={isRefreshing}
            aria-label="Refresh contracts list"
            fullWidth={isMobile}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          {canCreateContract ? (
            <Button
              variant="contained"
              color="secondary"
              component={RouterLink}
              to="/contracts/create"
              fullWidth={isMobile}
            >
              New Contract
            </Button>
          ) : null}
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
          Use search, status, and sort to quickly find the right contract.
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search contracts"
            aria-label="Search contracts"
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
                  <SearchIcon fontSize="small" />
                </Box>
              ),
            }}
          />
          <MobileFilterSheet
            title="Filters & Sort"
            activeCount={(statusFilter !== 'all' ? 1 : 0) + (sortOption !== 'newest' ? 1 : 0)}
            onReset={() => { setStatusFilter('all'); setSortOption('newest'); }}
          >
            <Stack spacing={2} sx={{ minWidth: isMobile ? 'auto' : 300 }}>
              <TextField
                select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                fullWidth
                size="small"
                label="Status"
                inputProps={{ 'aria-label': 'Filter contracts by status' }}
                SelectProps={{ native: true }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
              <TextField
                select
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value)}
                fullWidth
                size="small"
                label="Sort"
                inputProps={{ 'aria-label': 'Sort contracts list' }}
                SelectProps={{ native: true }}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            </Stack>
          </MobileFilterSheet>
        </Stack>
      </Paper>

      {loading && (
        <Box sx={{ py: 2 }}>
          {showLoadingHint && (
            <Alert severity="info" sx={{ mb: 2 }}>
              This is taking longer than usual. If your network is slow, wait a few seconds or retry.
            </Alert>
          )}
          {[1,2,3].map(i => (
            <Skeleton key={`contracts-skeleton-${i}`} variant="rounded" height={100} sx={{ borderRadius: 2, mb: 2 }} />
          ))}
        </Box>
      )}

      {error && !loading && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
          action={(
            <Button color="inherit" size="small" onClick={refreshContracts}>
              Retry
            </Button>
          )}
        >
          {error}
        </Alert>
      )}

      {!loading && <Grid container spacing={3}>
        {filteredContracts.map((contract) => (
          <Grid item key={contract.id || contract._id} xs={12} md={6} lg={4}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                border: `1px solid ${alpha('#000', 0.06)}`,
                // MOBILE-AUDIT P4: removed deep boxShadow, let theme handle
              }}
            >
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  spacing={1}
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {contract.title || 'Untitled Contract'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {contract.client?.name || 'Client'}{contract.client?.company ? ` - ${contract.client.company}` : ''}
                    </Typography>
                  </Box>
                  <Chip
                    label={(contract.status || 'pending').replace(/[-_]/g, ' ')}
                    color={statusChipColor[contract.status] || 'default'}
                    icon={
                      statusIconMap[contract.status] || (
                        <WatchLaterIcon fontSize="small" />
                      )
                    }
                    sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                  />
                </Stack>

                <Typography variant="h5" sx={{ mt: 2, fontWeight: 700 }}>
                  {'GHS '}
                  {(contract.budget ?? 0).toLocaleString()}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Updated{' '}
                  {contract.lastUpdated && isValid(new Date(contract.lastUpdated))
                    ? formatDistanceToNow(new Date(contract.lastUpdated), { addSuffix: true })
                    : 'recently'}
                </Typography>

                {Array.isArray(contract.milestones) && contract.milestones.length > 0 && renderMilestones(contract.milestones)}
              </CardContent>

              <Divider sx={{ mt: 'auto' }} />

              <CardActions
                sx={{ justifyContent: 'space-between', px: 3, py: 2, gap: 1, flexWrap: 'wrap' }}
              >
                <Button
                  startIcon={<VisibilityIcon />}
                  size="small"
                  variant="outlined"
                  aria-label={`Open contract ${contract.title || 'details'}`}
                  component={RouterLink}
                  to={`/contracts/${contract.id || contract._id}`}
                >
                  Open Contract
                </Button>
                <IconButton
                  size="small"
                  aria-label={`Open ${contract.title || 'contract'} details`}
                  component={RouterLink}
                  to={`/contracts/${contract.id || contract._id}`}
                  sx={{ minWidth: 44, minHeight: 44 , '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: '2px' }}}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {filteredContracts.length === 0 && (
          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 3,
              }}
            >
              <EmptyState
                variant="contracts"
                title="No contracts match your filters yet"
                subtitle={canCreateContract
                  ? 'Try adjusting your search or create a new contract to get started.'
                  : 'Try adjusting your search or refresh this page. Contracts for accepted jobs will appear here once hirers send them.'}
                actionLabel={canCreateContract ? 'Create Contract' : 'Refresh'}
                onAction={canCreateContract
                  ? () => navigate('/contracts/create')
                  : refreshContracts}
              />
            </Box>
          </Grid>
        )}
      </Grid>}
    </Box>
    </PageCanvas>
  );
};

export default ContractsPage;

