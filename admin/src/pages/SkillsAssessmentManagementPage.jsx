import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SchoolIcon from '@mui/icons-material/School';
import { Helmet } from 'react-helmet-async';
import { adminService } from '@/services/adminService';

const TabPanel = ({ children, index, value }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null}
  </div>
);

const DRAFT_TESTS = [
  { id: 'carpentry-core', name: 'Carpentry Core Safety', category: 'Carpentry', status: 'Draft' },
  { id: 'electrical-intro', name: 'Electrical Basics', category: 'Electrical', status: 'Draft' },
  { id: 'plumbing-qa', name: 'Plumbing Quality Checks', category: 'Plumbing', status: 'Review' },
];

const SkillsAssessmentManagementPage = () => {
  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const systemStats = await adminService.getSystemStats();
        setStats(systemStats);
      } catch (requestError) {
        setError(requestError?.message || 'Failed to load stats for skills overview.');
      }
    };

    load();
  }, []);

  const draftSummary = useMemo(() => {
    const byStatus = DRAFT_TESTS.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    return byStatus;
  }, []);

  return (
    <Box>
      <Helmet>
        <title>Skills Management | Kelmah Admin</title>
      </Helmet>

      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Skills Assessment Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Track readiness of assessment pipelines and quality controls.
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <Tabs
          value={tab}
          onChange={(_, next) => setTab(next)}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          <Tab icon={<AssessmentIcon />} iconPosition="start" label="Overview" />
          <Tab icon={<SchoolIcon />} iconPosition="start" label="Test Pipeline" />
          <Tab icon={<AssessmentIcon />} iconPosition="start" label="Signals" />
        </Tabs>
        <Divider sx={{ mt: 1.5, mb: 1 }} />

        <TabPanel value={tab} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Coverage</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Draft tests: {DRAFT_TESTS.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Workers on platform: {stats?.totalWorkers ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Governance</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active users: {stats?.activeUsers ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    System health: {stats?.systemHealth || 'unknown'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
              mb: 1.5,
            }}
          >
            <Typography variant="h6">Draft and Review Queue</Typography>
            <Button variant="contained" startIcon={<AddIcon />}>
              Create Test Blueprint
            </Button>
          </Box>

          <Stack spacing={1}>
            {DRAFT_TESTS.map((test) => (
              <Box
                key={test.id}
                sx={{
                  border: '1px solid rgba(17,24,39,0.08)',
                  borderRadius: 2,
                  p: 1.25,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>{test.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {test.category}
                  </Typography>
                </Box>
                <Chip label={test.status} size="small" />
              </Box>
            ))}
          </Stack>
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{draftSummary.Draft || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Draft tests
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{draftSummary.Review || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    In review
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{stats?.newUsersThisMonth ?? 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    New users this month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default SkillsAssessmentManagementPage;
