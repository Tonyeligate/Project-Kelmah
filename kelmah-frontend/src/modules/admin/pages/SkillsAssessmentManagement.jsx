import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import ResponsiveDataView from '../../../components/common/ResponsiveDataView';
import { adminService } from '../services/adminService';
import PageCanvas from '@/modules/common/components/PageCanvas';
import { TOUCH_TARGET_MIN, Z_INDEX } from '@/constants/layout';
import { withBottomNavSafeArea } from '@/utils/safeArea';

const TabPanel = ({ children, value, index }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`skills-admin-tabpanel-${index}`}
    aria-labelledby={`skills-admin-tab-${index}`}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const SkillsAssessmentManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [tests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  const handleOpenSupportRequest = () => {
    setOpenCreateDialog(false);
    navigate('/support', {
      state: {
        reason: 'admin-skills-test-request',
        source: '/admin/skills-management',
        context: {
          totalUsers: stats?.totalUsers ?? 0,
          totalWorkers: stats?.totalWorkers ?? 0,
        },
      },
    });
  };

  const handleReviewLiveAssessments = () => {
    setOpenCreateDialog(false);
    navigate('/worker/skills');
  };

  useEffect(() => {
    const loadStats = async () => {
      if (
        !isAuthenticated ||
        (user?.role !== 'admin' && user?.userType !== 'admin')
      ) {
        return;
      }

      setLoading(true);
      setError('');
      try {
        const nextStats = await adminService.getSystemStats();
        setStats(nextStats);
      } catch (requestError) {
        setError(requestError?.message || 'Failed to load admin stats');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [isAuthenticated, user]);

  if (
    !isAuthenticated ||
    (user?.role !== 'admin' && user?.userType !== 'admin')
  ) {
    return (
      <PageCanvas
        disableContainer
        sx={{ pt: { xs: 1, sm: 4 }, pb: { xs: 4, md: 6 } }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">
            Access denied. Admin privileges required.
          </Alert>
        </Container>
      </PageCanvas>
    );
  }

  return (
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 1, sm: 4 }, pb: { xs: withBottomNavSafeArea(24), md: 6 } }}
    >
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 1, sm: 4 }, px: { xs: 0.75, sm: 2 } }}
      >
        <Helmet>
          <title>Skills Assessment Management | Kelmah</title>
        </Helmet>
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          gutterBottom
          sx={{ lineHeight: 1.1 }}
        >
          Skills Assessment Management
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: { xs: 1.5, sm: 3 } }}>
          <Tabs
            value={tabValue}
            onChange={(_, nextValue) => setTabValue(nextValue)}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: { xs: 40, sm: 48 },
                px: { xs: 1, sm: 2 },
                py: { xs: 0.5, sm: 1.25 },
              },
            }}
          >
            <Tab label="Overview" icon={<AssessmentIcon />} />
            <Tab label="Test Management" icon={<SchoolIcon />} />
            <Tab label="Analytics" icon={<AssessmentIcon />} />
          </Tabs>

          <Divider sx={{ my: 2 }} />

          <TabPanel value={tabValue} index={0}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Assessment Overview
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Tests: {tests.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Users: {stats?.activeUsers ?? 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Platform Signals
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Users: {stats?.totalUsers ?? 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Workers: {stats?.totalWorkers ?? 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Typography variant={isMobile ? 'subtitle1' : 'h6'}>
                Assessment Test Operations
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateDialog(true)}
                sx={{
                  minHeight: TOUCH_TARGET_MIN,
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              >
                Request New Test
              </Button>
            </Box>

            <ResponsiveDataView
              rows={tests}
              emptyMessage="No assessment tests found. Create your first test to get started."
              renderCard={() => null}
            >
              <Paper variant="outlined">
                <Box sx={{ p: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No assessment tests found. Create your first test to get
                    started.
                  </Typography>
                </Box>
              </Paper>
            </ResponsiveDataView>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      {stats?.totalUsers ?? 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      {stats?.activeUsers ?? 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Users
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      {stats?.systemHealth ?? 'unknown'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      System Health
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>

        <Dialog
          open={openCreateDialog}
          onClose={() => setOpenCreateDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Request Skills Test Setup</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Direct test authoring is being migrated. You can still take action
              now:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              1. Review the live worker skills experience to validate existing
              assessments.
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.75 }}
            >
              2. Open Support to request a new assessment template or rollout.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleReviewLiveAssessments} variant="outlined">
              Review Live Assessments
            </Button>
            <Button onClick={handleOpenSupportRequest} variant="contained">
              Open Support Request
            </Button>
            <Button onClick={() => setOpenCreateDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
        <Paper
          elevation={8}
          sx={(theme) => ({
            display: { xs: 'flex', sm: 'none' },
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: withBottomNavSafeArea(0),
            zIndex: Z_INDEX.stickyCta,
            px: 1,
            py: 1,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          })}
        >
          <Button
            fullWidth
            variant="contained"
            color="secondary"
            sx={{ minHeight: TOUCH_TARGET_MIN }}
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
          >
            Request New Test
          </Button>
        </Paper>
      </Container>
    </PageCanvas>
  );
};

export default SkillsAssessmentManagement;
