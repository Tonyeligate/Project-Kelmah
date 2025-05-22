import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  ArticleOutlined as ContractIcon
} from '@mui/icons-material';

// Import contract slice actions and selectors
import {
  fetchContracts,
  selectContracts,
  selectContractsLoading,
  selectContractsError
} from '../../store/slices/contractSlice';

// Status colors for contract chips
const statusColors = {
  draft: 'default',
  pending: 'warning',
  active: 'success',
  completed: 'info',
  cancelled: 'error',
  disputed: 'error'
};

const ContractManagementPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const contracts = useSelector(selectContracts);
  const loading = useSelector(selectContractsLoading);
  const error = useSelector(selectContractsError);
  
  // Local state for filters
  const [tabValue, setTabValue] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');

  // Tab labels mapping to contract statuses
  const tabs = [
    { label: 'All Contracts', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
    { label: 'Drafts', value: 'draft' }
  ];

  // Load contracts on mount and when filter changes
  useEffect(() => {
    const filters = filterStatus !== 'all' ? { status: filterStatus } : {};
    dispatch(fetchContracts(filters));
  }, [dispatch, filterStatus]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setFilterStatus(tabs[newValue].value);
  };

  // Navigate to contract details
  const handleViewContract = (contractId) => {
    navigate(`/contracts/${contractId}`);
  };

  // Navigate to create contract page
  const handleCreateContract = () => {
    navigate('/contracts/create');
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Refresh contracts list
  const handleRefresh = () => {
    const filters = filterStatus !== 'all' ? { status: filterStatus } : {};
    dispatch(fetchContracts(filters));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Contract Management
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleCreateContract}
          >
            New Contract
          </Button>
        </Box>
      </Box>

      {/* Status filter tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      {/* Error alert */}
      {error.contracts && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading contracts: {error.contracts}
        </Alert>
      )}

      {/* Loading indicator */}
      {loading.contracts ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Contracts table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              {contracts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <ContractIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No contracts found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {filterStatus === 'all' 
                      ? "You don't have any contracts yet."
                      : `You don't have any ${filterStatus} contracts.`}
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={handleCreateContract}
                  >
                    Create Your First Contract
                  </Button>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Contract Title</TableCell>
                        <TableCell>Client/Worker</TableCell>
                        <TableCell>Start Date</TableCell>
                        <TableCell>End Date</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {contracts.map((contract) => (
                        <TableRow key={contract.id} hover>
                          <TableCell>{contract.title}</TableCell>
                          <TableCell>
                            {contract.clientName || contract.workerName || 'N/A'}
                          </TableCell>
                          <TableCell>{formatDate(contract.startDate)}</TableCell>
                          <TableCell>{formatDate(contract.endDate)}</TableCell>
                          <TableCell>
                            ${contract.value?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={contract.status.charAt(0).toUpperCase() + contract.status.slice(1)} 
                              color={statusColors[contract.status] || 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleViewContract(contract.id)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default ContractManagementPage; 