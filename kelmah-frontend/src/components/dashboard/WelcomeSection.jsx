import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import WorkIcon from '@mui/icons-material/Work';
import DescriptionIcon from '@mui/icons-material/Description';
import EventIcon from '@mui/icons-material/Event';

const AnimatedNumber = ({ n }) => {
    const { number } = useSpring({
        from: { number: 0 },
        number: n,
        delay: 200,
        config: { mass: 1, tension: 20, friction: 10 }
    });
    return <animated.div>{number.to((n) => n.toFixed(0))}</animated.div>;
};

const StatsCard = ({ label, value, color, icon, delay }) => {
    const theme = useTheme();
    
    return (
        <Paper
            component={motion.div}
            whileHover={{ 
                scale: 1.03,
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: theme.palette.background.paper,
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                border: `1px solid ${alpha(color, 0.2)}`,
                boxShadow: `0 4px 20px ${alpha(color, 0.1)}`,
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    background: color,
                    borderRadius: '4px 0 0 4px',
                }
            }}
        >
            <Box>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    {label}
                </Typography>
                <Typography variant="h4" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
                    <AnimatedNumber n={value} />
                </Typography>
            </Box>
            <Box 
                sx={{ 
                    backgroundColor: alpha(color, 0.1), 
                    p: 1.5, 
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {icon}
            </Box>
        </Paper>
    );
};

function WelcomeSection() {
    const { user } = useAuth();
    const theme = useTheme();
    const [stats, setStats] = useState({
        activeJobs: 0,
        totalApplications: 0,
        upcomingInterviews: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await apiService.getDashboardStats();
                if (response?.stats) {
                    setStats(response.stats);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
                setError('Failed to load dashboard stats');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return <Box>Loading...</Box>;
    }

    if (error) {
        return <Box color="error.main">{error}</Box>;
    }

    const welcomeVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: {
                duration: 0.6,
                delay: 0.2
            }
        }
    };

    return (
        <Box 
            sx={{ 
                position: 'relative', 
                overflow: 'hidden',
                borderRadius: '20px',
                p: { xs: 3, md: 4 },
                mb: 4,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
        >
            <motion.div
                variants={welcomeVariants}
                initial="hidden"
                animate="visible"
            >
                <Typography 
                    variant="h4" 
                    gutterBottom
                    sx={{ 
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        mb: 3
                    }}
                >
                    Welcome back, {user?.name || 'Sam'}!
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <StatsCard 
                            label="Active Jobs" 
                            value={stats.activeJobs} 
                            color={theme.palette.success.main}
                            icon={<WorkIcon sx={{ color: theme.palette.success.main, fontSize: 28 }} />}
                            delay={0.3}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <StatsCard 
                            label="Applications" 
                            value={stats.totalApplications} 
                            color={theme.palette.info.main}
                            icon={<DescriptionIcon sx={{ color: theme.palette.info.main, fontSize: 28 }} />}
                            delay={0.4}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <StatsCard 
                            label="Upcoming Interviews" 
                            value={stats.upcomingInterviews} 
                            color={theme.palette.warning.main}
                            icon={<EventIcon sx={{ color: theme.palette.warning.main, fontSize: 28 }} />}
                            delay={0.5}
                        />
                    </Grid>
                </Grid>
            </motion.div>
        </Box>
    );
}

export default WelcomeSection; 