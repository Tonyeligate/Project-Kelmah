// ARCHIVED PAGE: intentionally not route-mounted. Active profile flows are role-specific routes under /worker and /hirer.
import { Alert, Box, Container, Typography } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PageCanvas from '../../common/components/PageCanvas';

const ProfilePage = () => (
  <PageCanvas disableContainer sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 }, overflowX: 'clip' }}>
    <Container maxWidth="md" sx={{ py: 6, width: '100%', minWidth: 0 }}>
      <Helmet><title>Profile | Kelmah</title></Helmet>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight={700}>
          Archived Profile Page
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          This page is archived and not used by active routes.
        </Typography>
      </Box>
      <Alert severity="info">
        Active profile experiences are available at role-specific paths: worker profile and hirer profile.
      </Alert>
    </Container>
  </PageCanvas>
);

export default ProfilePage;
