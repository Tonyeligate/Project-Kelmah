import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  AccountBalance as WalletIcon,
  Payment as PaymentIcon,
  Security as EscrowIcon,
  Gavel as DisputeIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import Wallet from './Wallet';
import PaymentMethods from './PaymentMethods';
import TransactionHistory from './TransactionHistory';
import Escrow from './Escrow';
import Disputes from './Disputes';
import PaymentSettings from './PaymentSettings';

const PaymentDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <Wallet />;
      case 1:
        return <PaymentMethods />;
      case 2:
        return <TransactionHistory />;
      case 3:
        return <Escrow />;
      case 4:
        return <Disputes />;
      case 5:
        return <PaymentSettings />;
      default:
        return null;
    }
  };

  const renderQuickStats = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WalletIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Wallet Balance</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h4" color="primary">
              Loading...
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EscrowIcon sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="h6">Escrow Balance</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h4" color="warning.main">
              Loading...
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DisputeIcon sx={{ mr: 1, color: 'error.main' }} />
              <Typography variant="h6">Active Disputes</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h4" color="error">
              Loading...
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Payment Dashboard
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<WalletIcon />}
            label="Wallet"
            iconPosition="start"
          />
          <Tab
            icon={<PaymentIcon />}
            label="Payment Methods"
            iconPosition="start"
          />
          <Tab
            icon={<PaymentIcon />}
            label="Transaction History"
            iconPosition="start"
          />
          <Tab
            icon={<EscrowIcon />}
            label="Escrow"
            iconPosition="start"
          />
          <Tab
            icon={<DisputeIcon />}
            label="Disputes"
            iconPosition="start"
          />
          <Tab
            icon={<SettingsIcon />}
            label="Settings"
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {activeTab === 0 && renderQuickStats()}

      <Box sx={{ mt: 3 }}>
        {renderTabContent()}
      </Box>
    </Box>
  );
};

export default PaymentDashboard; 