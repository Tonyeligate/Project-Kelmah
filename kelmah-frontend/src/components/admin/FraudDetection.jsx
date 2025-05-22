import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tabs,
  Tab,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  PersonOff as BlockIcon,
  CheckCircle as ApproveIcon,
  Flag as FlagIcon,
  FilterList as FilterIcon,
  Timeline as TimelineIcon,
  Error as AlertIcon,
  WifiOff as ProxyIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

const riskLevelColors = {
  low: 'success',
  medium: 'warning',
  high: 'error'
};

const FraudDetection = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskLevelFilter, setRiskLevelFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [statsData, setStatsData] = useState({
    dailyAlerts: [],
    categoryCounts: {},
    riskLevelCounts: {}
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFraudAlerts();
    fetchStats();
  }, []);

  const fetchFraudAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/fraud-detection/alerts', {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      
      setFraudAlerts(response.data.alerts || []);
    } catch (err) {
      console.error('Error fetching fraud alerts:', err);
      setError('Failed to load fraud alerts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/fraud-detection/stats', {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      
      setStatsData(response.data.stats || {
        dailyAlerts: [],
        categoryCounts: {},
        riskLevelCounts: {}
      });
    } catch (err) {
      console.error('Error fetching fraud stats:', err);
      // We don't set the main error state here to avoid blocking the main UI
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchFraudAlerts(), fetchStats()]);
    setRefreshing(false);
  };

  const handleViewDetails = (alert) => {
    setSelectedAlert(alert);
    setDetailsOpen(true);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleRiskLevelFilter = (event) => {
    setRiskLevelFilter(event.target.value);
  };

  const handleCategoryFilter = (event) => {
    setCategoryFilter(event.target.value);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };

  const resolveAlert = async (alertId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/fraud-detection/alerts/${alertId}/resolve`, 
        { action },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Update UI after resolution
      setFraudAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: 'resolved', resolution: action } 
            : alert
        )
      );
      
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(prev => ({ ...prev, status: 'resolved', resolution: action }));
      }
      
      // Refresh stats after resolution
      fetchStats();
    } catch (err) {
      console.error('Error resolving alert:', err);
      alert('Failed to resolve alert. Please try again.');
    }
  };

  const getAlertTypeIcon = (category) => {
    switch (category) {
      case 'payment':
        return <SecurityIcon />;
      case 'login':
        return <ProxyIcon />;
      case 'profile':
        return <ErrorIcon />;
      case 'behavior':
        return <TimelineIcon />;
      default:
        return <AlertIcon />;
    }
  };

  const filteredAlerts = fraudAlerts.filter(alert => {
    const matchesSearch = searchQuery === '' || 
      alert.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRiskLevel = riskLevelFilter === 'all' || alert.riskLevel === riskLevelFilter;
    const matchesCategory = categoryFilter === 'all' || alert.category === categoryFilter;
    
    return matchesSearch && matchesRiskLevel && matchesCategory;
  });

  // Organize alerts by status for the tabs
  const pendingAlerts = filteredAlerts.filter(alert => alert.status === 'pending');
  const resolvedAlerts = filteredAlerts.filter(alert => alert.status === 'resolved');

  // Format chart data
  const formatTimeSeriesData = (data = []) => {
    return data.map(item => ({
      date: format(parseISO(item.date), 'MMM dd'),
      count: item.count
    }));
  };

  const formatCategoryData = (data = {}) => {
    return Object.keys(data).map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: data[key]
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5">
          Fraud Detection & Prevention
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Fraud Alert Trends" 
              subheader="Number of alerts over time" 
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatTimeSeriesData(statsData.dailyAlerts)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip formatter={(value) => [`${value} alerts`, 'Count']} />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} name="Alerts" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card>
                <CardHeader 
                  title="Alert Categories" 
                  subheader="Distribution by type" 
                />
                <CardContent>
                  <Box>
                    {formatCategoryData(statsData.categoryCounts).map((category) => (
                      <Box key={category.name} sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">{category.name}</Typography>
                          <Typography variant="body2" fontWeight="bold">{category.value}</Typography>
                        </Box>
                        <Box sx={{ width: '100%', display: 'flex' }}>
                          <Box
                            sx={{
                              width: `${(category.value / Math.max(...formatCategoryData(statsData.categoryCounts).map(c => c.value))) * 100}%`,
                              bgcolor: 'primary.main',
                              height: 10,
                              borderRadius: 1
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardHeader 
                  title="Risk Level Summary" 
                  subheader="Alerts by severity" 
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                    {Object.entries(statsData.riskLevelCounts || {}).map(([level, count]) => (
                      <Box key={level} sx={{ textAlign: 'center' }}>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            color: riskLevelColors[level] 
                              ? `${riskLevelColors[level]}.main` 
                              : 'text.primary' 
                          }}
                        >
                          {count}
                        </Typography>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {level}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WarningIcon sx={{ mr: 1 }} />
                  Pending Alerts
                  <Chip 
                    label={pendingAlerts.length} 
                    size="small" 
                    sx={{ ml: 1 }} 
                    color="warning"
                  />
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ mr: 1 }} />
                  Resolved Alerts
                  <Chip 
                    label={resolvedAlerts.length} 
                    size="small" 
                    sx={{ ml: 1 }} 
                    color="success"
                  />
                </Box>
              } 
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search by user ID or description"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ minWidth: 300 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Risk Level</InputLabel>
              <Select
                value={riskLevelFilter}
                onChange={handleRiskLevelFilter}
                label="Risk Level"
                startAdornment={<FilterIcon fontSize="small" sx={{ mr: 1 }} />}
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={handleCategoryFilter}
                label="Category"
                startAdornment={<FilterIcon fontSize="small" sx={{ mr: 1 }} />}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="payment">Payment</MenuItem>
                <MenuItem value="login">Login</MenuItem>
                <MenuItem value="profile">Profile</MenuItem>
                <MenuItem value="behavior">Behavior</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Divider />

        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Alert ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Risk Level</TableCell>
                <TableCell>Detected At</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(activeTab === 0 ? pendingAlerts : resolvedAlerts).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" sx={{ py: 2 }}>
                      {activeTab === 0 
                        ? 'No pending fraud alerts found' 
                        : 'No resolved fraud alerts found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                (activeTab === 0 ? pendingAlerts : resolvedAlerts).map((alert) => (
                  <TableRow 
                    key={alert.id} 
                    sx={{ 
                      '&:hover': { bgcolor: 'action.hover' },
                      bgcolor: alert.riskLevel === 'high' ? alpha => `rgba(244, 67, 54, 0.05)` : 'inherit'
                    }}
                  >
                    <TableCell>{alert.id}</TableCell>
                    <TableCell>
                      <Tooltip title={alert.category}>
                        <Chip
                          icon={getAlertTypeIcon(alert.category)}
                          label={alert.category}
                          size="small"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>{alert.userId}</TableCell>
                    <TableCell>{alert.description}</TableCell>
                    <TableCell>
                      <Chip 
                        label={alert.riskLevel} 
                        color={riskLevelColors[alert.riskLevel] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(alert.detectedAt), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {activeTab === 0 ? (
                        <>
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewDetails(alert)}
                            sx={{ mr: 1 }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          {alert.riskLevel === 'high' && (
                            <IconButton 
                              size="small"
                              color="error"
                              onClick={() => resolveAlert(alert.id, 'block')}
                            >
                              <BlockIcon fontSize="small" />
                            </IconButton>
                          )}
                        </>
                      ) : (
                        <Chip 
                          label={alert.resolution || 'Resolved'} 
                          size="small"
                          color={alert.resolution === 'block' ? 'error' : 'success'}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Alert details dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        {selectedAlert && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FlagIcon sx={{ mr: 1, color: riskLevelColors[selectedAlert.riskLevel] + '.main' }} />
                Fraud Alert Details
                <Chip 
                  label={selectedAlert.riskLevel} 
                  color={riskLevelColors[selectedAlert.riskLevel] || 'default'}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Alert Information</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Alert ID</Typography>
                    <Typography variant="body1">{selectedAlert.id}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Category</Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {selectedAlert.category}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Description</Typography>
                    <Typography variant="body1">{selectedAlert.description}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Detected At</Typography>
                    <Typography variant="body1">
                      {format(new Date(selectedAlert.detectedAt), 'MMM dd, yyyy HH:mm:ss')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>User Information</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">User ID</Typography>
                    <Typography variant="body1">{selectedAlert.userId}</Typography>
                  </Box>
                  {selectedAlert.userEmail && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Email</Typography>
                      <Typography variant="body1">{selectedAlert.userEmail}</Typography>
                    </Box>
                  )}
                  {selectedAlert.metadata && (
                    <>
                      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>Additional Data</Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                        <pre style={{ margin: 0, overflow: 'auto' }}>
                          {JSON.stringify(selectedAlert.metadata, null, 2)}
                        </pre>
                      </Paper>
                    </>
                  )}
                </Grid>
                <Grid item xs={12}>
                  {selectedAlert.status === 'pending' ? (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      This alert requires your attention and action.
                    </Alert>
                  ) : (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      This alert was resolved with action: {selectedAlert.resolution}
                    </Alert>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              {selectedAlert.status === 'pending' ? (
                <>
                  <Button
                    onClick={() => resolveAlert(selectedAlert.id, 'ignore')}
                  >
                    Mark as False Positive
                  </Button>
                  <Button
                    onClick={() => resolveAlert(selectedAlert.id, 'flag')}
                    color="warning"
                  >
                    Flag Account
                  </Button>
                  <Button
                    onClick={() => resolveAlert(selectedAlert.id, 'block')}
                    color="error"
                    variant="contained"
                  >
                    Block User
                  </Button>
                </>
              ) : (
                <Button onClick={handleCloseDetails}>Close</Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default FraudDetection; 