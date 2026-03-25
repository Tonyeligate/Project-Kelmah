import React from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Typography,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ContractForm from '../components/common/ContractForm';
import PageCanvas from '@/modules/common/components/PageCanvas';

const EditContractPage = () => {
  const { id } = useParams();

  if (!id) {
    return (
      <PageCanvas disableContainer sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}>
      <Container>
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            We could not find the contract ID for this page.
          </Alert>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Open the contract from the contracts list and try again.
          </Typography>
          <Button component={RouterLink} to="/contracts" variant="contained" color="secondary">
            Go to Contracts
          </Button>
        </Box>
      </Container>
      </PageCanvas>
    );
  }

  return (
    <PageCanvas disableContainer sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}>
    <Container maxWidth="xl" sx={{ px: { xs: 0.5, sm: 2 } }}>
      <Helmet><title>Edit Contract | Kelmah</title></Helmet>
      <Box sx={{ py: { xs: 2, sm: 3 } }}>
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
          <Typography color="text.primary">Edit Contract</Typography>
        </Breadcrumbs>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Update only what changed, then review the contract details before saving.
        </Typography>

        <ContractForm contractId={id} />
      </Box>
    </Container>
    </PageCanvas>
  );
};

export default EditContractPage;
