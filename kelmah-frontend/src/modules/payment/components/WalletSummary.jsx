import React from 'react';
import {
  Paper,
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
} from '@mui/material';
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  HourglassTop as HourglassTopIcon,
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, color }) => (
  <Card
    variant="outlined"
    sx={{ bgcolor: 'background.default', height: '100%' }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {icon}
        <Typography color="text.secondary" ml={1}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h5" component="div" color={color}>
        ${value.toFixed(2)}
      </Typography>
    </CardContent>
  </Card>
);

const WalletSummary = ({
  walletBalance,
  transactions,
  escrows,
  onWithdrawClick,
  onDepositClick,
}) => {
  const totalEarned = transactions
    .filter((t) => t.type === 'received')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPending = escrows.reduce(
    (sum, escrow) => sum + escrow.pendingAmount,
    0,
  );

  const totalWithdrawn = transactions
    .filter((t) => t.type === 'sent' && t.description.includes('Withdrawal'))
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Paper sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Box
            sx={{
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(45deg, #FFD700 30%, #FFA500 90%)',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" color="black">
              Available Balance
            </Typography>
            <Typography variant="h3" color="black" fontWeight="bold">
              ${walletBalance.toFixed(2)}
            </Typography>
            <Box
              sx={{
                mt: 2,
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <Button
                variant="contained"
                color="inherit"
                onClick={onWithdrawClick}
              >
                Withdraw
              </Button>
              <Button
                variant="contained"
                color="inherit"
                onClick={onDepositClick}
              >
                Add Funds
              </Button>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <StatCard
                title="Total Earned"
                value={totalEarned}
                color="success.main"
                icon={<ArrowUpwardIcon color="success" />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                title="Pending in Escrow"
                value={totalPending}
                color="warning.main"
                icon={<HourglassTopIcon color="warning" />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                title="Total Withdrawn"
                value={totalWithdrawn}
                color="error.main"
                icon={<ArrowDownwardIcon color="error" />}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default WalletSummary;
