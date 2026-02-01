import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
  Divider,
  Grid,
  Stack,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import Skeleton from '@mui/material/Skeleton';

const mockDisputes = [
  {
    id: 1,
    contract: 'KNC-00123',
    job: 'Living Room Painting',
    status: 'under_review',
    submitted: '2024-07-20T10:00:00Z',
  },
  {
    id: 2,
    contract: 'KNC-00115',
    job: 'Bathroom Tile Installation',
    status: 'resolved',
    submitted: '2024-06-15T15:30:00Z',
    resolution: 'Partial Refund Issued',
  },
  {
    id: 3,
    contract: 'KNC-00128',
    job: 'Custom Shelving Unit',
    status: 'under_review',
    submitted: '2024-07-22T11:00:00Z',
  },
];

const getStatusChip = (status) => {
  if (status === 'resolved') {
    return (
      <Chip
        icon={<CheckCircleIcon />}
        label="Resolved"
        color="success"
        size="small"
      />
    );
  }
  return (
    <Chip
      icon={<HourglassEmptyIcon />}
      label="Under Review"
      color="warning"
      size="small"
    />
  );
};

const DisputeItem = ({ dispute }) => (
  <Paper variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
    <ListItem sx={{ p: 2 }}>
      <Grid container alignItems="center" spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" fontWeight="bold">
            {dispute.job}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Contract: {dispute.contract}
          </Typography>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          {getStatusChip(dispute.status)}
        </Grid>
        <Grid item xs={6} sm={3} md={3}>
          <Typography variant="body2" color="text.secondary">
            Submitted: {new Date(dispute.submitted).toLocaleDateString()}
          </Typography>
        </Grid>
        <Grid item xs={12} md={3} sx={{ textAlign: { md: 'right' } }}>
          <Button variant="outlined" size="small">
            View Details
          </Button>
        </Grid>
        {dispute.resolution && (
          <Grid
            item
            xs={12}
            sx={{
              pt: 1,
              mt: 1,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2">
              <strong>Resolution:</strong> {dispute.resolution}
            </Typography>
          </Grid>
        )}
      </Grid>
    </ListItem>
  </Paper>
);

const DisputesPage = () => {
  const [tab, setTab] = React.useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (event, newValue) => setTab(newValue);

  const activeDisputes = mockDisputes.filter(
    (d) => d.status === 'under_review',
  );
  const resolvedDisputes = mockDisputes.filter((d) => d.status === 'resolved');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <GavelIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight="bold">
          Dispute Resolution Center
        </Typography>
      </Stack>

      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={handleChange} aria-label="disputes tabs">
            <Tab label={`Active Disputes (${activeDisputes.length})`} />
            <Tab label={`Resolved Cases (${resolvedDisputes.length})`} />
          </Tabs>
        </Box>
        <Box p={3}>
          {loading ? (
            <Box>
              {Array.from(new Array(3)).map((_, idx) => (
                <Skeleton
                  key={idx}
                  variant="rectangular"
                  height={100}
                  sx={{ mb: 2, borderRadius: 2 }}
                />
              ))}
            </Box>
          ) : (
            <>
              {tab === 0 && (
                <List>
                  {activeDisputes.length > 0 ? (
                    activeDisputes.map((d) => (
                      <DisputeItem key={d.id} dispute={d} />
                    ))
                  ) : (
                    <Typography>No active disputes.</Typography>
                  )}
                </List>
              )}
              {tab === 1 && (
                <List>
                  {resolvedDisputes.length > 0 ? (
                    resolvedDisputes.map((d) => (
                      <DisputeItem key={d.id} dispute={d} />
                    ))
                  ) : (
                    <Typography>No resolved cases.</Typography>
                  )}
                </List>
              )}
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default DisputesPage;
