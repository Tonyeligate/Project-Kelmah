import React, { useState, useEffect } from 'react';
import { 
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  Tooltip,
  TextField,
  MenuItem,
  InputAdornment,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import ContractService from '../../services/ContractService';
import ContractDetails from './ContractDetails';

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_signature', label: 'Pending Signature' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'disputed', label: 'Disputed' }
];

const getStatusColor = (status) => {
  const statusMap = {
    'draft': 'default',
    'pending_signature': 'warning',
    'active': 'success',
    'completed': 'info',
    'cancelled': 'error',
    'disputed': 'error'
  };
  
  return statusMap[status] || 'default';
};

const ContractsList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedContract, setSelectedContract] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, [page, rowsPerPage, statusFilter]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {
        page: page + 1,  // API pagination is 1-indexed
        limit: rowsPerPage,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        startDate: dateRangeFilter.startDate || undefined,
        endDate: dateRangeFilter.endDate || undefined
      };

      const response = await ContractService.getContracts(filters);
      setContracts(response.data.contracts);
      setTotalCount(response.data.totalCount);
    } catch (err) {
      console.error('Error fetching contracts:', err);
      setError('Failed to load contracts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewContract = (contract) => {
    setSelectedContract(contract.id);
    setDetailsOpen(true);
  };

  const handleEditContract = (contractId) => {
    navigate(`/contracts/edit/${contractId}`);
  };

  const handleDetailsClose = () => {
    setDetailsOpen(false);
    setSelectedContract(null);
  };

  const handleCreateContract = () => {
    navigate('/contracts/create');
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleDateRangeChange = (field) => (event) => {
    setDateRangeFilter({
      ...dateRangeFilter,
      [field]: event.target.value
    });
  };

  const handleFilterDialogOpen = () => {
    setFilterDialogOpen(true);
  };

  const handleFilterDialogClose = () => {
    setFilterDialogOpen(false);
  };

  const handleApplyFilters = () => {
    setPage(0);
    fetchContracts();
    setFilterDialogOpen(false);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRangeFilter({
      startDate: '',
      endDate: ''
    });
    setPage(0);
    setFilterDialogOpen(false);
  };

  const handleRefresh = () => {
    fetchContracts();
  };

  const handleConfirmDelete = (contract) => {
    setContractToDelete(contract);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteCancel = () => {
    setConfirmDeleteOpen(false);
    setContractToDelete(null);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!contractToDelete) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);
      await ContractService.deleteContract(contractToDelete.id);
      
      // Remove the deleted contract from the list
      setContracts(contracts.filter(c => c.id !== contractToDelete.id));
      setConfirmDeleteOpen(false);
      setContractToDelete(null);
    } catch (err) {
      console.error('Error deleting contract:', err);
      setDeleteError('Failed to delete contract. It may be in use or you may not have permission.');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderMobileView = () => (
    <Box>
      {contracts.map((contract) => (
        <Card key={contract.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="h6">
                {contract.title || `Contract #${contract.contractNumber}`}
              </Typography>
              <Chip 
                label={contract.status}
                color={getStatusColor(contract.status)}
                size="small"
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {contract.jobTitle}
            </Typography>
            
            <Grid container spacing={1} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Hirer</Typography>
                <Typography variant="body2">{contract.hirer?.name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Worker</Typography>
                <Typography variant="body2">{contract.worker?.name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Created</Typography>
                <Typography variant="body2">
                  {format(new Date(contract.createdAt), 'MMM d, yyyy')}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Amount</Typography>
                <Typography variant="body2">${contract.paymentAmount?.toFixed(2) || 'N/A'}</Typography>
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={() => handleViewContract(contract)}
              >
                View
              </Button>
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => handleEditContract(contract.id)}
                sx={{ ml: 1 }}
              >
                Edit
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => handleConfirmDelete(contract)}
                sx={{ ml: 1 }}
              >
                Delete
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  const renderDesktopView = () => (
    <TableContainer component={Paper}>
      <Table aria-label="contracts table">
        <TableHead>
          <TableRow>
            <TableCell>Contract #</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Job</TableCell>
            <TableCell>Hirer</TableCell>
            <TableCell>Worker</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from(new Array(rowsPerPage)).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
              </TableRow>
            ))
          ) : contracts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center">
                No contracts found
              </TableCell>
            </TableRow>
          ) : (
            contracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell>{contract.contractNumber}</TableCell>
                <TableCell>{contract.title}</TableCell>
                <TableCell>{contract.jobTitle}</TableCell>
                <TableCell>{contract.hirer?.name || 'N/A'}</TableCell>
                <TableCell>{contract.worker?.name || 'N/A'}</TableCell>
                <TableCell>
                  {format(new Date(contract.createdAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={contract.status}
                    color={getStatusColor(contract.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>${contract.paymentAmount?.toFixed(2) || 'N/A'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="View">
                    <IconButton
                      size="small"
                      onClick={() => handleViewContract(contract)}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => handleEditContract(contract.id)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleConfirmDelete(contract)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h5" component="h1" gutterBottom={isMobile}>
          Contracts
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mt: isMobile ? 1 : 0 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateContract}
          >
            New Contract
          </Button>
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <TextField
          placeholder="Search contracts..."
          value={searchTerm}
          onChange={handleSearchChange}
          size="small"
          sx={{ flexGrow: 1, maxWidth: { xs: '100%', sm: 300 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchTerm('')}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              fetchContracts();
            }
          }}
        />

        {!isMobile && (
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            size="small"
            sx={{ width: 150 }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        )}

        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={handleFilterDialogOpen}
          size={isMobile ? "small" : "medium"}
        >
          {isMobile ? "Filters" : "More Filters"}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && contracts.length === 0 && (
        <LinearProgress sx={{ mx: 2 }} />
      )}

      <Box sx={{ mx: 2 }}>
        {isMobile ? renderMobileView() : renderDesktopView()}
      </Box>

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{ px: 2 }}
      />

      {/* Contract Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleDetailsClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        {selectedContract && (
          <ContractDetails
            contractId={selectedContract}
            onClose={handleDetailsClose}
          />
        )}
        <DialogActions>
          <Button onClick={handleDetailsClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={handleFilterDialogClose}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Filter Contracts</DialogTitle>
        <DialogContent>
          <TextField
            label="Search"
            fullWidth
            margin="normal"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          
          <TextField
            select
            label="Status"
            fullWidth
            margin="normal"
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            margin="normal"
            value={dateRangeFilter.startDate}
            onChange={handleDateRangeChange('startDate')}
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField
            label="End Date"
            type="date"
            fullWidth
            margin="normal"
            value={dateRangeFilter.endDate}
            onChange={handleDateRangeChange('endDate')}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearFilters}>Clear All</Button>
          <Button onClick={handleFilterDialogClose}>Cancel</Button>
          <Button onClick={handleApplyFilters} variant="contained">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          <Typography>
            Are you sure you want to delete contract #{contractToDelete?.contractNumber}? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            disabled={isDeleting}
            variant="contained"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContractsList; 