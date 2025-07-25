import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import WorkIcon from '@mui/icons-material/Work';
import DashboardCard from '../common/DashboardCard';

const MyEarnings = () => {
  return (
    <DashboardCard title="My Activity">
      <Grid container spacing={2} alignItems="center" sx={{ p: 1 }}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <MonetizationOnIcon
              sx={{ fontSize: 48, color: 'success.main', mr: 1.5 }}
            />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                $2,850
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This Month
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WorkIcon sx={{ fontSize: 48, color: 'primary.main', mr: 1.5 }} />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                12
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Jobs Completed
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </DashboardCard>
  );
};

export default MyEarnings;
