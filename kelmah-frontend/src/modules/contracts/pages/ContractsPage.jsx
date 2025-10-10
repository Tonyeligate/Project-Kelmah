import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { formatDistanceToNow } from 'date-fns';
import { alpha } from '@mui/material/styles';
import { useAuth } from '@/modules/auth/contexts/AuthContext';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All contracts' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending signature' },
  { value: 'overdue', label: 'Overdue' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'value-high', label: 'Value high → low' },
  { value: 'value-low', label: 'Value low → high' },
];

const MOCK_CONTRACTS = [
  {
    id: '1',
    title: 'Premium Plumbing Installation',
    status: 'active',
    budget: 1200,
    currency: 'GH₵',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 6),
    client: {
      name: 'Ama Mensah',
      company: 'Crystal Clear Properties',
    },
    milestones: [
      { id: 'm1', title: 'Pipe Installation', status: 'completed' },
      { id: 'm2', title: 'Quality Assurance', status: 'in-progress' },
      { id: 'm3', title: 'Final Sign-off', status: 'pending' },
    ],
  },
  {
    id: '2',
    title: 'Electrical Safety Upgrade',
    status: 'pending',
    budget: 850,
    currency: 'GH₵',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    client: {
      name: 'Kwesi Ofori',
      company: 'SafeHome Living',
    },
    milestones: [
      { id: 'm1', title: 'Site Audit', status: 'completed' },
      { id: 'm2', title: 'Wiring Upgrade', status: 'pending' },
      { id: 'm3', title: 'Certification', status: 'pending' },
    ],
  },
  {
    id: '3',
    title: 'Carpentry Finishing Package',
    status: 'completed',
    budget: 2100,
    currency: 'GH₵',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    client: {
      name: 'Kofi Boateng',
      company: 'Primed Interiors',
    },
    milestones: [
      { id: 'm1', title: 'Cabinet Installation', status: 'completed' },
      { id: 'm2', title: 'Polishing & Finishes', status: 'completed' },
      { id: 'm3', title: 'Client Handover', status: 'completed' },
    ],
  },
];

const statusIconMap = {
  active: <CheckCircleIcon color="success" fontSize="small" />,
  completed: <CheckCircleIcon color="primary" fontSize="small" />,
  pending: <WatchLaterIcon color="warning" fontSize="small" />,
  'pending-signature': <WatchLaterIcon color="warning" fontSize="small" />,
  overdue: <ErrorOutlineIcon color="error" fontSize="small" />,
};

const statusChipColor = {
  active: 'success',
  completed: 'primary',
  pending: 'warning',
  'pending-signature': 'warning',
  overdue: 'error',
};

const ContractsPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredContracts = useMemo(() => {
    const list = [...MOCK_CONTRACTS];

    const matchesSearch = (contract) => {
      if (!searchQuery.trim()) return true;
      const needle = searchQuery.toLowerCase();
      return (
        contract.title.toLowerCase().includes(needle) ||
        contract.client.name.toLowerCase().includes(needle) ||
        (contract.client.company || '').toLowerCase().includes(needle)
      );
    };

    const matchesStatus = (contract) => {
      if (statusFilter === 'all') return true;
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
          return a.lastUpdated - b.lastUpdated;
        case 'value-high':
          return b.budget - a.budget;
        case 'value-low':
          return a.budget - b.budget;
        default:
          return b.lastUpdated - a.lastUpdated;
      }
    });
  }, [searchQuery, statusFilter, sortOption]);

  const refreshContracts = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const renderMilestones = (milestones) => (
    <Stack spacing={1} sx={{ mt: 2 }}>
      {milestones.map((milestone) => (
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
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Contracts Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and track all your contracts in one place
            {user?.profile?.name ? `, ${user.profile.name}` : ''}.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={refreshContracts}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
          <Button variant="contained" color="secondary">
            New Contract
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search contracts"
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
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              fullWidth
              size="small"
              label="Status"
              SelectProps={{ native: true }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value)}
              fullWidth
              size="small"
              label="Sort"
              SelectProps={{ native: true }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {filteredContracts.map((contract) => (
          <Grid item key={contract.id} xs={12} md={6} lg={4}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                border: `1px solid ${alpha('#000', 0.06)}`,
                boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
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
                      {contract.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {contract.client.name} • {contract.client.company}
                    </Typography>
                  </Box>
                  <Chip
                    label={contract.status.replace('-', ' ')}
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
                  {contract.currency}
                  {contract.budget.toLocaleString()}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Updated{' '}
                  {formatDistanceToNow(contract.lastUpdated, {
                    addSuffix: true,
                  })}
                </Typography>

                {renderMilestones(contract.milestones)}
              </CardContent>

              <Divider sx={{ mt: 'auto' }} />

              <CardActions
                sx={{ justifyContent: 'space-between', px: 3, py: 2 }}
              >
                <Button startIcon={<VisibilityIcon />} size="small">
                  View Details
                </Button>
                <IconButton size="small">
                  <DownloadIcon fontSize="small" />
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
              <Typography variant="h6" sx={{ mb: 1 }}>
                No contracts match your filters yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or create a new contract to get
                started.
              </Typography>
              <Button variant="contained" sx={{ mt: 3 }}>
                Create Contract
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ContractsPage;
