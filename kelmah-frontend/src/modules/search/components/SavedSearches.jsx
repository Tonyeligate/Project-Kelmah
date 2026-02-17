import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import smartSearchService from '../services/smartSearchService';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress,
  Badge,
  Tooltip,
  Stack,
  useTheme,
  alpha,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  PlayArrow as RunIcon,
  Schedule as ScheduleIcon,
  Bookmark as BookmarkIcon,
  MoreVert as MoreIcon,
  TrendingUp as TrendingIcon,
  LocationOn as LocationIcon,
  Work as CategoryIcon,
  AttachMoney as BudgetIcon,
  Star as StarIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  formatDate,
  formatRelativeTime,
  formatCurrency,
} from '../../../utils/formatters';

const SavedSearches = ({
  showHeader = true,
  compact = false,
  onSearchSelect = null,
}) => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // State management
  const [savedSearches, setSavedSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSearch, setSelectedSearch] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [runningSearchId, setRunningSearchId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    query: '',
    filters: {},
    alertsEnabled: false,
    frequency: 'daily', // 'immediate', 'daily', 'weekly'
  });

  // Load saved searches
  const loadSavedSearches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await smartSearchService.getSavedSearches(user?.id);
      setSavedSearches(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load saved searches');
      enqueueSnackbar('Failed to load saved searches', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [user?.id, enqueueSnackbar]);

  useEffect(() => {
    if (user?.id) {
      loadSavedSearches();
    }
  }, [loadSavedSearches, user]);

  // Handle create/update saved search
  const handleSubmit = async () => {
    try {
      const searchData = {
        ...formData,
        userId: user?.id,
      };

      if (isEditing && selectedSearch) {
        await smartSearchService.updateSavedSearch(
          selectedSearch.id,
          searchData,
        );
        enqueueSnackbar('Saved search updated successfully', {
          variant: 'success',
        });
      } else {
        await smartSearchService.createSavedSearch(user?.id, searchData);
        enqueueSnackbar('Search saved successfully', { variant: 'success' });
      }

      handleCloseDialog();
      loadSavedSearches();
    } catch (error) {
      enqueueSnackbar('Failed to save search', { variant: 'error' });
    }
  };

  // Handle delete saved search
  const handleDelete = async (searchId) => {
    if (window.confirm('Are you sure you want to delete this saved search?')) {
      try {
        await smartSearchService.deleteSavedSearch(searchId);
        enqueueSnackbar('Saved search deleted successfully', {
          variant: 'success',
        });
        loadSavedSearches();
      } catch (error) {
        enqueueSnackbar('Failed to delete saved search', { variant: 'error' });
      }
    }
  };

  // Handle run saved search
  const handleRunSearch = async (search) => {
    try {
      setRunningSearchId(search.id);

      // Update last run timestamp
      await smartSearchService.updateSavedSearch(search.id, {
        lastRun: new Date().toISOString(),
      });

      if (onSearchSelect) {
        onSearchSelect(search);
      } else {
        // Navigate to search results
        const queryString = new URLSearchParams({
          q: search.query,
          ...search.filters,
        }).toString();

        window.location.href = `/search/jobs?${queryString}`;
      }

      loadSavedSearches(); // Refresh to update last run time
    } catch (error) {
      enqueueSnackbar('Failed to run search', { variant: 'error' });
    } finally {
      setRunningSearchId(null);
    }
  };

  // Handle toggle alerts
  const handleToggleAlerts = async (searchId, currentState) => {
    try {
      await smartSearchService.updateSavedSearch(searchId, {
        alertsEnabled: !currentState,
      });

      enqueueSnackbar(
        !currentState
          ? 'Alerts enabled for this search'
          : 'Alerts disabled for this search',
        { variant: 'success' },
      );

      loadSavedSearches();
    } catch (error) {
      enqueueSnackbar('Failed to update alert settings', { variant: 'error' });
    }
  };

  // Dialog handlers
  const handleOpenDialog = (search = null) => {
    if (search) {
      setSelectedSearch(search);
      setFormData({
        name: search.name || '',
        query: search.query || '',
        filters: search.filters || {},
        alertsEnabled: search.alertsEnabled || false,
        frequency: search.frequency || 'daily',
      });
      setIsEditing(true);
    } else {
      setSelectedSearch(null);
      setFormData({
        name: '',
        query: '',
        filters: {},
        alertsEnabled: false,
        frequency: 'daily',
      });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedSearch(null);
    setIsEditing(false);
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Get filter summary text
  const getFilterSummary = (filters) => {
    const parts = [];

    if (filters.location) parts.push(`📍 ${filters.location}`);
    if (filters.category) parts.push(`🔧 ${filters.category}`);
    if (filters.minBudget || filters.maxBudget) {
      const min = filters.minBudget ? formatCurrency(filters.minBudget) : 'GH₵0';
      const max = filters.maxBudget ? formatCurrency(filters.maxBudget) : 'GH₵∞';
      parts.push(`💰 ${min} - ${max}`);
    }
    if (filters.urgency) parts.push(`⏰ ${filters.urgency}`);
    if (filters.skills && filters.skills.length > 0) {
      parts.push(
        `🛠️ ${filters.skills.slice(0, 2).join(', ')}${filters.skills.length > 2 ? '...' : ''}`,
      );
    }

    return parts.length > 0 ? parts.join(' • ') : 'No filters applied';
  };

  // Render saved search card
  const renderSearchCard = (search) => (
    <Card
      key={search.id}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      {/* Alert indicator */}
      {search.alertsEnabled && (
        <Chip
          icon={<NotificationsIcon />}
          label="Alerts On"
          color="primary"
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 1,
          }}
        />
      )}

      {/* Menu button */}
      <IconButton
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1,
        }}
        onClick={(e) => {
          setAnchorEl(e.currentTarget);
          setSelectedSearch(search);
        }}
      >
        <MoreIcon />
      </IconButton>

      <CardContent sx={{ flexGrow: 1, pt: search.alertsEnabled ? 5 : 3 }}>
        <Typography variant="h6" component="h3" gutterBottom>
          {search.name}
        </Typography>

        {search.query && (
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Query:</strong> "{search.query}"
          </Typography>
        )}

        <Typography variant="body2" color="text.secondary" paragraph>
          <strong>Filters:</strong> {getFilterSummary(search.filters)}
        </Typography>

        <Stack spacing={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <SearchIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {search.resultsCount || 0} jobs found
            </Typography>
          </Box>

          {search.lastRun && (
            <Box display="flex" alignItems="center" gap={1}>
              <RefreshIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Last run: {formatRelativeTime(search.lastRun)}
              </Typography>
            </Box>
          )}

          <Box display="flex" alignItems="center" gap={1}>
            <ScheduleIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Created: {formatDate(search.createdAt)}
            </Typography>
          </Box>
        </Stack>

        {/* Trending indicator */}
        {search.trending && (
          <Box mt={2}>
            <Chip
              icon={<TrendingIcon />}
              label="Trending Search"
              color="secondary"
              size="small"
              variant="outlined"
            />
          </Box>
        )}
      </CardContent>

      <Divider />

      <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
        <Stack direction="row" spacing={1}>
          <Tooltip
            title={search.alertsEnabled ? 'Disable alerts' : 'Enable alerts'}
          >
            <IconButton
              size="small"
              onClick={() =>
                handleToggleAlerts(search.id, search.alertsEnabled)
              }
              color={search.alertsEnabled ? 'primary' : 'default'}
            >
              {search.alertsEnabled ? (
                <NotificationsIcon />
              ) : (
                <NotificationsOffIcon />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit search">
            <IconButton size="small" onClick={() => handleOpenDialog(search)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Button
          variant="contained"
          size="small"
          startIcon={
            runningSearchId === search.id ? (
              <CircularProgress size={16} />
            ) : (
              <RunIcon />
            )
          }
          onClick={() => handleRunSearch(search)}
          disabled={runningSearchId === search.id}
        >
          {runningSearchId === search.id ? 'Running...' : 'Run Search'}
        </Button>
      </CardActions>
    </Card>
  );

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <Grid container spacing={3}>
      {[...Array(4)].map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <CardContent>
              <Box mb={2}>
                <div
                  style={{
                    height: 24,
                    backgroundColor: theme.palette.grey[300],
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{
                    height: 16,
                    backgroundColor: theme.palette.grey[200],
                    borderRadius: 4,
                    width: '70%',
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  if (loading) {
    return (
      <Box>
        {showHeader && (
          <Box
            mb={3}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h5" display="flex" alignItems="center" gap={1}>
              <BookmarkIcon color="primary" />
              Saved Searches
            </Typography>
          </Box>
        )}
        {renderLoadingSkeleton()}
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button size="small" onClick={loadSavedSearches}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {showHeader && (
        <Box
          mb={3}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h5" display="flex" alignItems="center" gap={1}>
            <BookmarkIcon color="primary" />
            Saved Searches
            <Badge badgeContent={savedSearches.length} color="primary" />
          </Typography>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Save New Search
          </Button>
        </Box>
      )}

      {/* Saved Searches Grid */}
      {savedSearches.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <BookmarkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Saved Searches Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Save your frequently used search criteria to quickly find relevant
            jobs
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Save Your First Search
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {savedSearches.map((search) => (
            <Grid item xs={12} sm={6} md={4} key={search.id}>
              {renderSearchCard(search)}
            </Grid>
          ))}
        </Grid>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            handleRunSearch(selectedSearch);
            setAnchorEl(null);
          }}
        >
          <RunIcon fontSize="small" sx={{ mr: 1 }} />
          Run Search
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleOpenDialog(selectedSearch);
            setAnchorEl(null);
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleToggleAlerts(
              selectedSearch?.id,
              selectedSearch?.alertsEnabled,
            );
            setAnchorEl(null);
          }}
        >
          {selectedSearch?.alertsEnabled ? (
            <>
              <NotificationsOffIcon fontSize="small" sx={{ mr: 1 }} />
              Disable Alerts
            </>
          ) : (
            <>
              <NotificationsIcon fontSize="small" sx={{ mr: 1 }} />
              Enable Alerts
            </>
          )}
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleDelete(selectedSearch?.id);
            setAnchorEl(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? 'Edit Saved Search' : 'Save New Search'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Search Name"
              placeholder="e.g., Plumbing Jobs in Accra"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />

            <TextField
              fullWidth
              label="Search Query"
              placeholder="e.g., emergency plumbing repair"
              value={formData.query}
              onChange={(e) => handleInputChange('query', e.target.value)}
              helperText="Enter keywords to search for"
            />

            <Alert severity="info">
              <Typography variant="body2">
                Filter criteria will be captured from your current search
                filters when saving
              </Typography>
            </Alert>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.alertsEnabled}
                  onChange={(e) =>
                    handleInputChange('alertsEnabled', e.target.checked)
                  }
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Enable job alerts</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Get notified when new jobs match this search
                  </Typography>
                </Box>
              }
            />

            {formData.alertsEnabled && (
              <TextField
                select
                fullWidth
                label="Alert Frequency"
                value={formData.frequency}
                onChange={(e) => handleInputChange('frequency', e.target.value)}
              >
                <MenuItem value="immediate">Immediate</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
              </TextField>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name.trim()}
          >
            {isEditing ? 'Update' : 'Save'} Search
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SavedSearches;

