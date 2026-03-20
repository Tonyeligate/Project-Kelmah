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
  DescriptionOutlined as DescriptionOutlinedIcon,
} from '@mui/icons-material';
import { useContracts } from '../contexts/ContractContext';
import { useAuth } from '../../auth/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ContractCard from '../components/common/ContractCard';

const ContractManagementPage = () => {
  const { contracts, loading, error } = useContracts();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const canCreateContract = ['hirer', 'admin'].includes(user?.role);
  const statusTabs = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'closed', label: 'Closed' },
  ];

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filteredContracts = useMemo(() => {
    if (loading) return [];
    const selectedStatus = statusTabs[tabValue]?.value || 'all';
    if (selectedStatus === 'all') return contracts || [];
    if (selectedStatus === 'closed') {
      return (contracts || []).filter(
        (contract) =>
          contract.status === 'terminated' || contract.status === 'cancelled',
      );
    }
    return (contracts || []).filter((contract) => contract.status === selectedStatus);
  }, [contracts, tabValue, loading]);

  return (
    <Container
      maxWidth="xl"
      sx={{ py: 4, bgcolor: 'background.default', color: 'text.primary' }}
    >
      <Helmet><title>Manage Contracts | Kelmah</title></Helmet>
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
            {canCreateContract ? 'Contract Management' : 'My Contracts'}
          </Typography>
        </Box>
        {canCreateContract && (
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
        )}
      </Box>

      {/* Summary line for contract counts */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredContracts.length} of {(contracts || []).length} contracts
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
          {statusTabs.map((tab) => {
            const total = Array.isArray(contracts)
              ? tab.value === 'all'
                ? contracts.length
                : tab.value === 'closed'
                  ? contracts.filter(
                    (contract) =>
                      contract.status === 'terminated' ||
                      contract.status === 'cancelled',
                  ).length
                  : contracts.filter((contract) => contract.status === tab.value)
                    .length
              : 0;

            return <Tab key={tab.value} label={`${tab.label} (${total})`} />;
          })}
        </Tabs>
      </Paper>

      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 8 }).map((_, idx) => (
            <Grid item key={`contract-management-skeleton-${idx}`} xs={12} sm={6} md={4} lg={3}>
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
              <Grid item key={contract.id || contract._id} xs={12} sm={6} md={4} lg={3}>
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
                  border: '1px dashed',
                  borderColor: 'divider',
                }}
              >
                <DescriptionOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No contracts found in this category
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                  {canCreateContract
                    ? 'Try a different status filter or create a new contract to get started.'
                    : 'Contracts created for your accepted jobs will appear here once a hirer sends one to you.'}
                </Typography>
                {canCreateContract ? (
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/contracts/create')}
                    sx={{ minHeight: 44 }}
                  >
                    Create Contract
                  </Button>
                ) : null}
              </Box>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
};

export default ContractManagementPage;
