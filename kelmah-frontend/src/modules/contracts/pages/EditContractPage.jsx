import React from 'react';
import { Box, Container, Typography, Breadcrumbs, Link, CircularProgress } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import ContractForm from '../../../components/contracts/ContractForm';

const EditContractPage = () => {
  const { id } = useParams();
  
  if (!id) {
    return (
      <Container>
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Typography variant="h5" color="error">
            Contract ID is missing. Unable to edit contract.
          </Typography>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link component={RouterLink} to="/" underline="hover" color="inherit">
            Dashboard
          </Link>
          <Link 
            component={RouterLink} 
            to="/contracts" 
            underline="hover" 
            color="inherit"
          >
            Contracts
          </Link>
          <Typography color="text.primary">Edit Contract #{id}</Typography>
        </Breadcrumbs>
        
        <ContractForm contractId={id} />
      </Box>
    </Container>
  );
};

export default EditContractPage; 
