import { useSelector } from 'react-redux';
import { normalizeUser } from '../../../utils/userUtils';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import WorkIcon from '@mui/icons-material/Work';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StarIcon from '@mui/icons-material/Star';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const WorkerDashboardPage = () => {
  const { user: rawUser } = useSelector((state) => state.auth);
  const user = normalizeUser(rawUser);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Mock stats for worker dashboard
  const stats = {
    applications: 12,
    completedJobs: 8,
    earnings: 2450,
    rating: 4.8,
  };

  // Chart data for Earnings Overview
  const earningsData = [
    { name: 'This Month', value: 850, color: '#4CAF50' },
    { name: 'Last Month', value: 720, color: '#2196F3' },
    { name: 'Pending', value: 480, color: '#FF9800' },
    { name: 'Withdrawn', value: 400, color: '#9C27B0' },
  ];

  // Chart data for Applications Overview
  const applicationsData = [
    { name: 'Accepted', value: 5, color: '#4CAF50' },
    { name: 'Pending', value: 4, color: '#FF9800' },
    { name: 'Rejected', value: 3, color: '#F44336' },
  ];

  // Metric cards configuration - LC Portal style
  const metricCards = [
    {
      title: 'Active Applications',
      value: stats.applications,
      bgGradient: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
      icon: <WorkIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />,
    },
    {
      title: 'Completed Jobs',
      value: stats.completedJobs,
      bgGradient: 'linear-gradient(135deg, #009688 0%, #4DB6AC 100%)',
      icon: <AssignmentTurnedInIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />,
    },
    {
      title: 'Total Earnings',
      value: `GH₵${stats.earnings.toLocaleString()}`,
      bgGradient: 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)',
      icon: <AttachMoneyIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />,
    },
    {
      title: 'Average Rating',
      value: stats.rating,
      bgGradient: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
      icon: <StarIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />,
    },
  ];

  return (
    <Box sx={{ backgroundColor: '#FAFAFA', minHeight: '100vh', p: 3 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" sx={{ color: '#999' }} />}
        sx={{ mb: 2 }}
      >
        <Link
          component={RouterLink}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: '#666',
            textDecoration: 'none',
            '&:hover': { color: '#1976D2' },
          }}
        >
          <HomeIcon sx={{ fontSize: 18, mr: 0.5 }} />
          Home
        </Link>
        <Typography sx={{ color: '#333', fontWeight: 500 }}>
          Dashboard
        </Typography>
      </Breadcrumbs>

      {/* Greeting Section */}
      <Typography
        variant="h5"
        sx={{
          color: '#333',
          fontWeight: 600,
          mb: 3,
        }}
      >
        {getGreeting()}, {user?.firstName || 'Worker'}
      </Typography>

      {/* Metric Cards - 4 colored cards LC Portal style */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metricCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2,
                background: card.bgGradient,
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
                height: 120,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {/* Icon positioned on the right */}
              <Box
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                {card.icon}
              </Box>

              {/* Text content */}
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, opacity: 0.9, mb: 1 }}
              >
                {card.title}
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700 }}
              >
                {card.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section - 2 charts side by side */}
      <Grid container spacing={3}>
        {/* Earnings Overview Chart */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: '#fff',
              border: '1px solid #E0E0E0',
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: '#333', fontWeight: 600, mb: 2 }}
            >
              Earnings Overview
            </Typography>
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={earningsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {earningsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`GH₵${value}`, '']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E0E0E0',
                      borderRadius: 8,
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span style={{ color: '#666', fontSize: 12 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Applications Overview Chart */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: '#fff',
              border: '1px solid #E0E0E0',
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: '#333', fontWeight: 600, mb: 2 }}
            >
              Applications Overview
            </Typography>
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={applicationsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {applicationsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E0E0E0',
                      borderRadius: 8,
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span style={{ color: '#666', fontSize: 12 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WorkerDashboardPage;
