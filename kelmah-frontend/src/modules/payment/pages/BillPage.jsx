import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
  Box,
  Divider,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { usePayments } from '../contexts/PaymentContext';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
// Currency formatter for Ghana Cedi
const currencyFormatter = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
});

const BillPage = () => {
  const { bills, loading, payBill, actionLoading, error } = usePayments();
  const billsArray = Array.isArray(bills)
    ? bills
    : bills?.bills && Array.isArray(bills.bills)
      ? bills.bills
      : bills?.data && Array.isArray(bills.data)
        ? bills.data
        : [];
  // Filters & pagination state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [dialogStep, setDialogStep] = useState(0);

  const applyFilters = () => {
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setAppliedStatus(statusFilter);
    setPage(1);
  };
  // New: clear filters
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setAppliedStartDate('');
    setAppliedEndDate('');
    setAppliedStatus('all');
    setPage(1);
  };
  // Filter bills
  const filteredBills = billsArray.filter((b) => {
    let ok = true;
    if (appliedStartDate)
      ok = ok && new Date(b.dueDate) >= new Date(appliedStartDate);
    if (appliedEndDate)
      ok = ok && new Date(b.dueDate) <= new Date(appliedEndDate);
    if (appliedStatus !== 'all') ok = ok && b.status === appliedStatus;
    return ok;
  });
  const pageCount = Math.ceil(filteredBills.length / perPage);
  const pagedBills = filteredBills.slice((page - 1) * perPage, page * perPage);

  const handleOpenConfirm = (bill) => {
    setSelectedBill(bill);
    setConfirmDialogOpen(true);
    setDialogStep(0);
  };

  const handleCloseConfirm = () => {
    setConfirmDialogOpen(false);
    setSelectedBill(null);
    setDialogStep(0);
  };

  const handleConfirmPayment = async () => {
    setDialogStep(1);
    await payBill(selectedBill.id);
    setDialogStep(2);
    setTimeout(handleCloseConfirm, 1000);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'paid':
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label="Paid"
            color="success"
            size="small"
          />
        );
      case 'unpaid':
        return (
          <Chip
            icon={<HourglassEmptyIcon />}
            label="Unpaid"
            color="warning"
            size="small"
          />
        );
      case 'overdue':
        return (
          <Chip
            icon={<ErrorOutlineIcon />}
            label="Overdue"
            color="error"
            size="small"
          />
        );
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 0.5, sm: 2 } }}>
      <Paper
        sx={{
          p: { xs: 2, sm: 4 },
          borderRadius: 2,
          background: 'linear-gradient(to right, #28313b, #485461, #ffd700)',
          color: 'white',
          border: '2px solid',
          borderColor: 'secondary.main',
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{ mb: 3, color: 'secondary.main' }}
        >
          Your Bills
        </Typography>
        {/* Filters */}
        <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 2, md: 2, lg: 1.5 }, alignItems: 'center' }}>
          <Tooltip title="Filter bills due on or after this date">
            <TextField
              label="From"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
            />
          </Tooltip>
          <Tooltip title="Filter bills due on or before this date">
            <TextField
              label="To"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
            />
          </Tooltip>
          <Tooltip title="Filter by bill status">
            <FormControl sx={{ minWidth: { xs: 0, sm: 140 }, flex: { xs: '1 1 100%', sm: '0 1 auto' } }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="unpaid">Unpaid</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
          </Tooltip>
          <Tooltip title="Apply filters">
            <Button
              variant="outlined"
              color="secondary"
              sx={{ borderWidth: 2, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
              onClick={applyFilters}
            >
              Filter
            </Button>
          </Tooltip>
          <Tooltip title="Clear filters">
            <Button
              variant="outlined"
              color="secondary"
              sx={{ borderWidth: 2, flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
              onClick={clearFilters}
            >
              Clear
            </Button>
          </Tooltip>
        </Box>
        {/* Show error if fetch failed */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {loading ? (
          <Typography>Loading bills...</Typography>
        ) : filteredBills.length === 0 ? (
          <Typography color="text.secondary">
            No bills match your filter criteria.
          </Typography>
        ) : (
          // Summary above list
          filteredBills.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {(page - 1) * perPage + 1} -{' '}
                {Math.min(filteredBills.length, page * perPage)} of{' '}
                {filteredBills.length} bills
              </Typography>
            </Box>
          )
        )}
        {loading ? (
          <Typography>Loading bills...</Typography>
        ) : filteredBills.length === 0 ? (
          <Typography color="text.secondary">
            No bills match your filter criteria.
          </Typography>
        ) : (
          <List>
            {pagedBills.map((bill, index) => (
              <React.Fragment key={bill.id}>
                <ListItem sx={{ flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 1, sm: 0 }, py: { xs: 1.5, sm: 1 } }}>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="medium">
                        {bill.title}
                      </Typography>
                    }
                    secondary={`Due: ${new Date(bill.dueDate).toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2, md: 2, lg: 1.5 }, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
                    {getStatusChip(bill.status)}
                    <Typography variant="h6" fontWeight="medium">
                      {currencyFormatter.format(bill.amount)}
                    </Typography>
                    {(bill.status === 'unpaid' ||
                      bill.status === 'overdue') && (
                      <Box>
                        <Tooltip title="Pay this bill">
                          <Button
                            variant="contained"
                            color="secondary"
                            size="small"
                            sx={{ boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }}
                            startIcon={
                              <PaymentIcon sx={{ color: 'common.white' }} />
                            }
                            disabled={actionLoading === bill.id}
                            onClick={() => handleOpenConfirm(bill)}
                          >
                            {actionLoading === bill.id ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              'Pay'
                            )}
                          </Button>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                </ListItem>
                {index < pagedBills.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
        {/* Pagination */}
        {pageCount > 1 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(e, val) => setPage(val)}
              color="secondary"
            />
          </Box>
        )}
        <Dialog
          open={confirmDialogOpen}
          onClose={handleCloseConfirm}
          maxWidth="xs"
          fullWidth
          BackdropProps={{
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
            },
          }}
          PaperProps={{
            sx: {
              bgcolor: 'grey.900',
              color: 'text.primary',
              borderRadius: 2,
              border: '2px solid',
              borderColor: 'secondary.main',
              boxShadow: '0 0 16px rgba(255,215,0,0.5)',
            },
          }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon sx={{ color: 'secondary.main', fontSize: 28 }} />{' '}
            Confirm Payment
          </DialogTitle>
          <DialogContent dividers>
            {selectedBill && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography>
                  You're about to pay{' '}
                  <strong>
                    {currencyFormatter.format(selectedBill.amount)}
                  </strong>{' '}
                  for:
                </Typography>
                <Typography variant="subtitle1" fontWeight="medium">
                  “{selectedBill.title}”
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCloseConfirm}
              variant="outlined"
              color="secondary"
              sx={{ borderWidth: 2 }}
              disabled={dialogStep === 1}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleConfirmPayment}
              disabled={dialogStep === 1}
              startIcon={
                dialogStep === 1 ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <PaymentIcon sx={{ color: 'common.white' }} />
                )
              }
              sx={{ boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }}
            >
              {dialogStep === 1 ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default BillPage;
