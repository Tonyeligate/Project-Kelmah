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
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { usePayments } from '../contexts/PaymentContext';
import { Helmet } from 'react-helmet-async';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { currencyFormatter } from '@/modules/common/utils/formatters';
import PageCanvas from '../../common/components/PageCanvas';
import { TOUCH_TARGET_MIN, Z_INDEX } from '@/constants/layout';
import { withBottomNavSafeArea } from '@/utils/safeArea';

const BillPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { bills, loading, payBill, actionLoading, error } = usePayments();
  const timerRef = React.useRef(null);
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
    try {
      await payBill(selectedBill.id || selectedBill._id);
      setDialogStep(2);
      timerRef.current = setTimeout(handleCloseConfirm, 1000);
    } catch {
      setDialogStep(0);
    }
  };

  // Cleanup timer on unmount to prevent state update on unmounted component
  React.useEffect(() => () => clearTimeout(timerRef.current), []);

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
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 1, sm: 4 }, pb: { xs: withBottomNavSafeArea(72), md: 6 } }}
    >
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 1, sm: 4 }, px: { xs: 0.75, sm: 2 } }}
      >
        <Helmet>
          <title>Bills | Kelmah</title>
        </Helmet>
        <Paper
          sx={{
            p: { xs: 1.5, sm: 4 },
            borderRadius: 2,
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.action.hover})`,
            color: 'text.primary',
            border: '2px solid',
            borderColor: 'secondary.main',
          }}
        >
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            fontWeight="bold"
            sx={{ mb: 1.25, color: 'secondary.main', lineHeight: 1.1 }}
          >
            Your Bills
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
          >
            Review upcoming bills, filter by date or status, and pay pending
            bills.
          </Typography>
          {/* Filters */}
          <Box
            sx={{
              mb: 2,
              display: 'flex',
              flexWrap: 'wrap',
              gap: { xs: 0.75, sm: 2, md: 2, lg: 1.5 },
              alignItems: 'center',
            }}
          >
            <Tooltip title="Filter bills due on or after this date">
              <TextField
                size={isMobile ? 'small' : 'medium'}
                label="Due From"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ 'aria-label': 'Filter bills due from date' }}
                sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
              />
            </Tooltip>
            <Tooltip title="Filter bills due on or before this date">
              <TextField
                size={isMobile ? 'small' : 'medium'}
                label="Due To"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ 'aria-label': 'Filter bills due to date' }}
                sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' } }}
              />
            </Tooltip>
            <Tooltip title="Filter by bill status">
              <FormControl
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  minWidth: { xs: 0, sm: 140 },
                  flex: { xs: '1 1 100%', sm: '0 1 auto' },
                }}
              >
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  inputProps={{ 'aria-label': 'Filter bills by status' }}
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
                sx={{
                  borderWidth: 2,
                  minHeight: TOUCH_TARGET_MIN,
                  flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' },
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
                onClick={applyFilters}
              >
                Apply
              </Button>
            </Tooltip>
            <Tooltip title="Clear filters">
              <Button
                variant="outlined"
                color="secondary"
                sx={{
                  borderWidth: 2,
                  minHeight: TOUCH_TARGET_MIN,
                  flex: { xs: '1 1 calc(50% - 4px)', sm: '0 1 auto' },
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
                onClick={clearFilters}
              >
                Clear Filters
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
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress color="secondary" />
            </Box>
          ) : filteredBills.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 5,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <ReceiptLongOutlinedIcon
                sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No bills match your filters
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                Change your date or status filters to find the bills you need.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={clearFilters}
                sx={{ minHeight: 44 }}
              >
                Clear Filters
              </Button>
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {(page - 1) * perPage + 1} -{' '}
                  {Math.min(filteredBills.length, page * perPage)} of{' '}
                  {filteredBills.length} bills
                </Typography>
              </Box>
              <List>
                {pagedBills.map((bill, index) => (
                  <React.Fragment key={bill.id || bill._id}>
                    <ListItem
                      sx={{
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: { xs: 1, sm: 0 },
                        py: { xs: 1.5, sm: 1 },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight="medium">
                            {bill.title}
                          </Typography>
                        }
                        secondary={
                          bill.dueDate
                            ? `Due: ${new Date(bill.dueDate).toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' })}`
                            : 'No due date'
                        }
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: { xs: 1, sm: 2, md: 2, lg: 1.5 },
                          flexWrap: 'wrap',
                          width: { xs: '100%', sm: 'auto' },
                          justifyContent: {
                            xs: 'space-between',
                            sm: 'flex-end',
                          },
                        }}
                      >
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
                                sx={{
                                  boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
                                  minHeight: 44,
                                }}
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
                    {index < pagedBills.length - 1 && (
                      <Divider component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </>
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
            aria-labelledby="confirm-payment-dialog-title"
            BackdropProps={{
              sx: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
              },
            }}
            PaperProps={{
              sx: {
                bgcolor: 'background.paper',
                color: 'text.primary',
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'secondary.main',
                boxShadow: '0 0 16px rgba(255,215,0,0.5)',
              },
            }}
          >
            <DialogTitle
              id="confirm-payment-dialog-title"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <PaymentIcon sx={{ color: 'secondary.main', fontSize: 28 }} />{' '}
              Confirm Payment
            </DialogTitle>
            <DialogContent dividers>
              {selectedBill && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography>
                    You are about to pay{' '}
                    <strong>
                      {currencyFormatter.format(selectedBill.amount)}
                    </strong>{' '}
                    for:
                  </Typography>
                  <Typography variant="subtitle1" fontWeight="medium">
                    "{selectedBill.title}"
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleCloseConfirm}
                variant="outlined"
                color="secondary"
                sx={{ borderWidth: 2, minHeight: 44 }}
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
                sx={{
                  boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
                  minHeight: 44,
                }}
              >
                {dialogStep === 1 ? 'Processing...' : 'Pay Bill'}
              </Button>
            </DialogActions>
          </Dialog>

          <Paper
            elevation={8}
            sx={(theme) => ({
              display: { xs: 'flex', sm: 'none' },
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: withBottomNavSafeArea(0),
              zIndex: Z_INDEX.stickyCta,
              px: 1,
              py: 1,
              gap: 1,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            })}
          >
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              sx={{ minHeight: TOUCH_TARGET_MIN, borderWidth: 2 }}
              onClick={clearFilters}
            >
              Clear
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              sx={{
                minHeight: TOUCH_TARGET_MIN,
                boxShadow: '0 2px 8px rgba(255,215,0,0.35)',
              }}
              onClick={applyFilters}
            >
              Apply
            </Button>
          </Paper>
        </Paper>
      </Container>
    </PageCanvas>
  );
};

export default BillPage;
