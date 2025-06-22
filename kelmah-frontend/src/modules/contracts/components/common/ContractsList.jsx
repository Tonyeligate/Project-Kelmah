import React from 'react';
import { Grid, CircularProgress, Alert, Typography } from '@mui/material';
import { useContracts } from '../../contexts/ContractContext';
import ContractCard from './ContractCard';

const ContractsList = () => {
  const { contracts, loading, error } = useContracts();

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!contracts || contracts.length === 0) {
    return <Typography variant="body2" color="text.secondary">No contracts found.</Typography>;
  }

  return (
    <Grid container spacing={3}>
      {contracts.map(contract => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={contract.id}>
          <ContractCard contract={contract} />
        </Grid>
      ))}
    </Grid>
  );
};

export default ContractsList;
