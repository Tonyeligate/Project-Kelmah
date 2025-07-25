import React, { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Grid,
  Alert,
  Skeleton,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  ReceiptLong as ReceiptIcon,
} from '@mui/icons-material';
import { useContracts } from '../contexts/ContractContext';
import { Link } from 'react-router-dom';
import ContractCard from '../components/common/ContractCard';

const ContractManagementPage = () => {
  const { contracts, loading, error } = useContracts();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filteredContracts = useMemo(() => {
    if (loading) return [];
    const statusMap = ['all', 'active', 'pending', 'completed', 'dispute'];
    const selectedStatus = statusMap[tabValue];
    if (selectedStatus === 'all') return contracts;
    return contracts.filter((contract) => contract.status === selectedStatus);
  }, [contracts, tabValue, loading]);

  return (
    <Container
      maxWidth="xl"
      sx={{ py: 4, bgcolor: 'background.default', color: 'text.primary' }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ReceiptIcon
            sx={{ fontSize: 36, mr: 1.5, color: 'secondary.main' }}
          />
          <Typography variant="h4" fontWeight="bold">
            Contract Management
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/contracts/create"
          startIcon={<AddIcon />}
          variant="contained"
          color="secondary"
          sx={{ fontWeight: 'bold' }}
        >
          New Contract
        </Button>
      </Box>

      {/* Summary line for contract counts */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredContracts.length} of {contracts.length} contracts
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={(theme) => ({
          mb: 4,
          p: 2,
          backgroundColor: alpha(theme.palette.primary.main, 0.7),
          backdropFilter: 'blur(10px)',
          borderRadius: theme.spacing(2),
          border: `2px solid ${theme.palette.secondary.main}`,
          boxShadow: `inset 0 0 8px rgba(255, 215, 0, 0.5)`,
          transition:
            'box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out',
          '&:hover': {
            boxShadow: `0 0 12px rgba(255, 215, 0, 0.3), inset 0 0 8px rgba(255, 215, 0, 0.5)`,
            borderColor: theme.palette.secondary.light,
          },
        })}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="secondary"
          textColor="secondary"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="contract status tabs"
          sx={{
            '& .MuiTab-root': {
              fontWeight: '600',
            },
          }}
        >
          <Tab label={`All (${contracts.length})`} />
          <Tab
            label={`Active (${contracts.filter((c) => c.status === 'active').length})`}
          />
          <Tab
            label={`Pending (${contracts.filter((c) => c.status === 'pending').length})`}
          />
          <Tab
            label={`Completed (${contracts.filter((c) => c.status === 'completed').length})`}
          />
          <Tab
            label={`Disputes (${contracts.filter((c) => c.status === 'dispute').length})`}
          />
        </Tabs>
      </Paper>

      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 8 }).map((_, idx) => (
            <Grid item key={idx} xs={12} sm={6} md={4} lg={3}>
              <Skeleton
                variant="rectangular"
                height={200}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          ))}
        </Grid>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredContracts.length > 0 ? (
            filteredContracts.map((contract) => (
              <Grid item key={contract.id} xs={12} sm={6} md={4} lg={3}>
                <ContractCard contract={contract} />
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 5,
                  mt: 4,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  No contracts found in this category.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
};

export default ContractManagementPage;
