import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { adminService } from '@/services/adminService';

const StatCard = ({ title, value, helper }) => (
  <Card>
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h5" sx={{ mt: 0.8 }}>
        {value}
      </Typography>
      {helper ? (
        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      ) : null}
    </CardContent>
  </Card>
);

const statusToColor = (status) => {
  if (status === 'healthy' || status === 'ok') {
    return 'success';
  }
  if (status === 'degraded' || status === 'warning') {
    return 'warning';
  }
  if (status === 'down' || status === 'error') {
    return 'error';
  }
  return 'default';
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [providerStatus, setProviderStatus] = useState({});

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const [systemStats, health] = await Promise.all([
        adminService.getSystemStats(),
        adminService.getProviderStatus(),
      ]);

      setStats(systemStats);
      setProviderStatus(health || {});
    } catch (requestError) {
      setError(requestError?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const serviceRows = useMemo(() => {
    const services =
      providerStatus?.services ||
      providerStatus?.serviceStatus ||
      providerStatus?.checks ||
      {};

    if (!services || typeof services !== 'object') {
      return [];
    }

    return Object.entries(services).map(([name, details]) => {
      const status =
        details?.status ||
        details?.health ||
        (typeof details === 'string' ? details : 'unknown');

      return {
        name,
        status,
        latency: details?.latency || details?.responseTime || null,
      };
    });
  }, [providerStatus]);

  return (
    <Box>
      <Helmet>
        <title>Admin Dashboard | Kelmah</title>
      </Helmet>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h4">Operations Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Live platform posture and admin workflow shortcuts.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load}>
          Refresh
        </Button>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Total Users"
                value={stats?.totalUsers ?? 0}
                helper="All accounts on platform"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Active Users"
                value={stats?.activeUsers ?? 0}
                helper="Recently engaged accounts"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="New This Month"
                value={stats?.newUsersThisMonth ?? 0}
                helper="New registrations"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Total Workers"
                value={stats?.totalWorkers ?? 0}
                helper={`System health: ${stats?.systemHealth || 'unknown'}`}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} lg={7}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1.5 }}>
                    Service Health
                  </Typography>
                  {serviceRows.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No aggregate health data returned from gateway.
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {serviceRows.map((service) => (
                        <Box
                          key={service.name}
                          sx={{
                            p: 1.25,
                            border: '1px solid rgba(17,24,39,0.08)',
                            borderRadius: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>
                              {service.name}
                            </Typography>
                            {service.latency ? (
                              <Typography variant="caption" color="text.secondary">
                                Latency: {service.latency}
                              </Typography>
                            ) : null}
                          </Box>
                          <Chip
                            size="small"
                            label={service.status}
                            color={statusToColor(service.status)}
                          />
                        </Box>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1.5 }}>
                    Quick Actions
                  </Typography>
                  <Stack spacing={1.25}>
                    <Button
                      variant="contained"
                      startIcon={<SchoolIcon />}
                      onClick={() => navigate('/skills-management')}
                    >
                      Open Skills Management
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<AccountBalanceWalletIcon />}
                      onClick={() => navigate('/payouts')}
                    >
                      Open Payout Queue
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      Use this portal for high-signal operational workflows only.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default AdminDashboardPage;
