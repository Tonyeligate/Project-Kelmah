import React from 'react';
import { Paper, Box, Typography, LinearProgress, Grid, IconButton, useTheme, alpha } from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { 
    TrendingUp, 
    WorkOutline, 
    AccessTime, 
    AttachMoney,
    InfoOutlined,
    ArrowUpward
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';

const StatsCard = styled(motion.div)(({ theme }) => ({
    padding: theme.spacing(3),
    borderRadius: '14px',
    background: theme.palette.background.paper,
    boxShadow: '0 3px 15px rgba(0,0,0,0.04)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.07)'
    }
}));

const MetricIcon = styled(Box)(({ theme, color }) => ({
    width: 54,
    height: 54,
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(theme.palette[color].main, 0.12),
    color: theme.palette[color].main,
    marginBottom: theme.spacing(2)
}));

const TrendIndicator = styled(Box)(({ theme, trend }) => ({
    display: 'flex',
    alignItems: 'center',
    color: trend && trend.startsWith('+') ? theme.palette.success.main : theme.palette.error.main,
    fontSize: '0.85rem',
    fontWeight: 500,
    marginLeft: theme.spacing(1)
}));

// Enhanced tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
    const theme = useTheme();
    if (active && payload && payload.length) {
        return (
            <Box
                sx={{
                    backgroundColor: 'background.paper',
                    p: 1.5,
                    border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                    borderRadius: 1.5,
                    boxShadow: '0 3px 14px rgba(0,0,0,0.1)'
                }}
            >
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{label}</Typography>
                {payload.map((entry, index) => (
                    <Box 
                        key={`item-${index}`} 
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            color: entry.color 
                        }}
                    >
                        <Box 
                            sx={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: '50%', 
                                backgroundColor: entry.color,
                                mr: 0.8 
                            }} 
                        />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {entry.name}: {entry.value}
                        </Typography>
                    </Box>
                ))}
            </Box>
        );
    }
    return null;
};

function JobMetrics() {
    const theme = useTheme();
    const { metrics } = useSelector(state => state.dashboard?.data || {});
    
    // Modern, accessible color palette
    const COLORS = [
        theme.palette.primary.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.error.main
    ];
    
    // Mock data for the area chart
    const jobTrends = [
        { month: 'Jan', jobs: 4, applications: 8 },
        { month: 'Feb', jobs: 6, applications: 12 },
        { month: 'Mar', jobs: 8, applications: 16 },
        { month: 'Apr', jobs: 7, applications: 14 },
        { month: 'May', jobs: 9, applications: 20 },
        { month: 'Jun', jobs: 12, applications: 24 }
    ];

    const jobStatusData = [
        { name: 'Completed', value: metrics?.completed || 15, color: theme.palette.success.main },
        { name: 'In Progress', value: metrics?.inProgress || 8, color: theme.palette.primary.main },
        { name: 'Pending', value: metrics?.pending || 5, color: theme.palette.warning.main },
        { name: 'Cancelled', value: metrics?.cancelled || 2, color: theme.palette.error.main }
    ];

    const metricItems = [
        {
            title: 'Success Rate',
            value: `${metrics?.successRate || 0}%`,
            icon: <TrendingUp fontSize="large" />,
            color: 'success',
            trend: metrics?.successRateTrend || '+5%'
        },
        {
            title: 'Active Jobs',
            value: metrics?.activeJobs || 0,
            icon: <WorkOutline fontSize="large" />,
            color: 'primary',
            trend: metrics?.activeJobsTrend || '+2'
        },
        {
            title: 'Avg. Response Time',
            value: metrics?.avgResponseTime || '0h',
            icon: <AccessTime fontSize="large" />,
            color: 'warning',
            trend: metrics?.responseTrend || '-10min'
        },
        {
            title: 'Revenue',
            value: metrics?.revenue || '$0',
            icon: <AttachMoney fontSize="large" />,
            color: 'info',
            trend: metrics?.revenueTrend || '+12%'
        }
    ];

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <Box sx={{ px: 0 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight="600" 
                    sx={{ 
                        borderLeft: `4px solid ${theme.palette.primary.main}`,
                        pl: 2
                    }}
                >
                    Performance Metrics
                </Typography>
                <IconButton 
                    size="small" 
                    sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.15),
                        } 
                    }}
                >
                    <InfoOutlined fontSize="small" />
                </IconButton>
            </Box>

            {/* Stats Grid */}
            <Grid 
                container 
                spacing={3} 
                sx={{ mb: 5 }}
                component={motion.div}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {metricItems.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <StatsCard 
                            variants={itemVariants}
                            whileHover={{ y: -5 }}
                        >
                            <Box>
                                <MetricIcon color={stat.color}>
                                    {stat.icon}
                                </MetricIcon>
                                <Typography variant="h4" fontWeight="bold" 
                                    sx={{ 
                                        mb: 1,
                                        color: theme.palette.text.primary
                                    }}
                                >
                                    {stat.value}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                    {stat.title}
                                </Typography>
                                {stat.trend && (
                                    <TrendIndicator trend={stat.trend}>
                                        {stat.trend}
                                        <ArrowUpward fontSize="inherit" sx={{ ml: 0.5, fontSize: '0.9rem', transform: stat.trend.startsWith('+') ? 'none' : 'rotate(180deg)' }} />
                                    </TrendIndicator>
                                )}
                            </Box>
                        </StatsCard>
                    </Grid>
                ))}
            </Grid>

            {/* Charts */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Paper 
                            sx={{ 
                                p: 3, 
                                height: '100%', 
                                borderRadius: '14px',
                                boxShadow: '0 3px 15px rgba(0,0,0,0.04)',
                                border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                            }}
                        >
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Job Trends
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Monthly job postings and applications
                            </Typography>
                            <ResponsiveContainer width="100%" height={320}>
                                <AreaChart data={jobTrends} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                                    <defs>
                                        <linearGradient id="jobsGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="applicationsGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                                    <XAxis 
                                        dataKey="month" 
                                        tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} 
                                        axisLine={{ stroke: alpha(theme.palette.divider, 0.6) }}
                                    />
                                    <YAxis 
                                        tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                                        axisLine={{ stroke: alpha(theme.palette.divider, 0.6) }}
                                    />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Legend 
                                        wrapperStyle={{ paddingTop: 15 }}
                                        formatter={(value) => (
                                            <span style={{ color: theme.palette.text.primary, fontWeight: 500, fontSize: '0.875rem' }}>
                                                {value}
                                            </span>
                                        )}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="jobs" 
                                        name="Job Postings"
                                        stroke={theme.palette.primary.main} 
                                        fillOpacity={1} 
                                        fill="url(#jobsGradient)" 
                                        strokeWidth={2}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="applications" 
                                        name="Applications"
                                        stroke={theme.palette.success.main} 
                                        fillOpacity={1} 
                                        fill="url(#applicationsGradient)" 
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper 
                            sx={{ 
                                p: 3, 
                                height: '100%', 
                                borderRadius: '14px',
                                boxShadow: '0 3px 15px rgba(0,0,0,0.04)',
                                border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                            }}
                        >
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Job Status Distribution
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Overview of current job statuses
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={jobStatusData}
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={4}
                                            dataKey="value"
                                            nameKey="name"
                                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {jobStatusData.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={entry.color} 
                                                    stroke={theme.palette.background.paper}
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                            <Box sx={{ mt: 0 }}>
                                {jobStatusData.map((entry, index) => (
                                    <Box 
                                        key={entry.name} 
                                        sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            mb: 1,
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box 
                                                sx={{ 
                                                    width: 10, 
                                                    height: 10, 
                                                    borderRadius: '50%', 
                                                    bgcolor: entry.color,
                                                    mr: 1 
                                                }} 
                                            />
                                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                                {entry.name}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" fontWeight={600}>
                                            {entry.value}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </motion.div>
        </Box>
    );
}

export default JobMetrics;