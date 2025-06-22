import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  LinearProgress
} from '@mui/material';
import {
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { useAuth } from '../../auth/contexts/AuthContext';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const EarningsTracker = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    monthlyEarnings: 0,
    pendingEarnings: 0,
    completedJobs: 0,
    averageEarnings: 0
  });
  const [timeRange, setTimeRange] = useState('month');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEarning, setSelectedEarning] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchEarnings();
  }, [timeRange]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const startDate = startOfMonth(subMonths(new Date(), getMonthsForRange(timeRange)));
      const endDate = endOfMonth(new Date());

      const response = await fetch(
        `/api/workers/${user.id}/earnings?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
      );
      const data = await response.json();
      
      setEarnings(data.earnings);
      setSummary(data.summary);
      setChartData(data.chartData);
      setError(null);
    } catch (err) {
      setError('Failed to load earnings data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMonthsForRange = (range) => {
    switch (range) {
      case 'week':
        return 1;
      case 'month':
        return 1;
      case 'quarter':
        return 3;
      case 'year':
        return 12;
      default:
        return 1;
    }
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDialogOpen = (earning) => {
    setSelectedEarning(earning);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedEarning(null);
  };

  const handleDownloadReceipt = async (earningId) => {
    try {
      const response = await fetch(`/api/workers/${user.id}/earnings/${earningId}/receipt`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${earningId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download receipt');
      console.error(err);
    }
  };

  const renderSummaryCards = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AttachMoneyIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Earnings</Typography>
            </Box>
            <Typography variant="h4">
              ${summary.totalEarnings.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Monthly Earnings</Typography>
            </Box>
            <Typography variant="h4">
              ${summary.monthlyEarnings.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PendingIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Pending Earnings</Typography>
            </Box>
            <Typography variant="h4">
              ${summary.pendingEarnings.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CalendarIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Completed Jobs</Typography>
            </Box>
            <Typography variant="h4">
              {summary.completedJobs}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderEarningsChart = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Earnings Trend</Typography>
        <FormControl size="small">
          <Select
            value={timeRange}
            onChange={handleTimeRangeChange}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="quarter">Last Quarter</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <ChartTooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="earnings"
              stroke="#1976d2"
              name="Earnings"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );

  const renderEarningsTable = () => (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Earnings History</Typography>
        <Button
          startIcon={<DownloadIcon />}
          onClick={() => {/* Implement export functionality */}}
        >
          Export
        </Button>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Job Title</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {earnings
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((earning) => (
                <TableRow key={earning.id}>
                  <TableCell>{format(new Date(earning.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{earning.jobTitle}</TableCell>
                  <TableCell>${earning.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={earning.status}
                      color={earning.status === 'completed' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleDialogOpen(earning)}
                      >
                        <ReceiptIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download Receipt">
                      <IconButton
                        size="small"
                        onClick={() => handleDownloadReceipt(earning.id)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={earnings.length}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Paper>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Earnings Tracker
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchEarnings}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {renderSummaryCards()}
          {renderEarningsChart()}
          {renderEarningsTable()}
        </>
      )}

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Earning Details
        </DialogTitle>
        <DialogContent>
          {selectedEarning && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedEarning.date), 'MMM dd, yyyy')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Amount
                  </Typography>
                  <Typography variant="body1">
                    ${selectedEarning.amount.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Job Title
                  </Typography>
                  <Typography variant="body1">
                    {selectedEarning.jobTitle}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedEarning.status}
                    color={selectedEarning.status === 'completed' ? 'success' : 'warning'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Method
                  </Typography>
                  <Typography variant="body1">
                    {selectedEarning.paymentMethod}
                  </Typography>
                </Grid>
                {selectedEarning.notes && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body1">
                      {selectedEarning.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Close</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => handleDownloadReceipt(selectedEarning?.id)}
          >
            Download Receipt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EarningsTracker; 


