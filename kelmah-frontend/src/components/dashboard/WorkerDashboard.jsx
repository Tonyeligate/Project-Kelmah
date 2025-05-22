import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
    Grid, Box, Typography, IconButton, Chip, Paper,
    useTheme, alpha, CircularProgress, Alert, Snackbar,
    Card, CardContent, LinearProgress, Avatar, Button,
    Divider, Skeleton, Tab, Tabs, Badge, Tooltip, Menu,
    MenuItem, ListItemIcon, ListItemText, useMediaQuery
} from '@mui/material';
import {
    Rocket, Search, Star, Message, Person,
    Assignment, Analytics, Work, Timeline, Check,
    Refresh as RefreshIcon, TrendingUp, CalendarMonth,
    WorkHistory, Assessment, Notifications, ArrowUpward,
    ErrorOutline, Info as InfoIcon, MoreVert, FilterList,
    ArrowForward, ChevronRight, AttachMoney, LocationOn,
    AccessTime, ManageAccounts, BarChart, DonutLarge,
    EmojiEvents, VerifiedUser, HomeRepairService, ChevronLeft,
    Diamond, EmojiEvents as Trophy
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import ApplicationTracker from './ApplicationTracker';
import SkillAssessmentModule from './SkillAssessmentModule';
import { apiService } from '../../services/api';

// Dynamically import Chart to handle potential missing dependency
const Chart = lazy(() => {
    try {
        return import('react-apexcharts');
    } catch (error) {
        console.warn('react-apexcharts not available, using fallback');
        return { default: () => <Box sx={{ p: 2, textAlign: 'center' }}>Charts loading...</Box> };
    }
});

// Enhanced styled components with animations and better visuals
const DashboardCard = styled(Paper)(({ theme }) => ({
    background: theme.palette.mode === 'dark' 
        ? alpha(theme.palette.background.paper, 0.8)
        : theme.palette.background.paper,
    borderRadius: 16,
    padding: theme.spacing(3),
    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
        boxShadow: '0 6px 25px 0 rgba(0,0,0,0.07)',
    },
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    },
}));

const StatsCard = styled(Card)(({ theme }) => ({
    background: theme.palette.mode === 'dark'
        ? alpha(theme.palette.background.paper, 0.8)
        : theme.palette.background.paper,
    borderRadius: 16,
    padding: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    minWidth: 250,
    boxShadow: '0 4px 15px 0 rgba(0,0,0,0.05)',
    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease',
    cursor: 'pointer',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 25px 0 rgba(0,0,0,0.1)',
    },
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
    height: 8,
    borderRadius: 4,
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    '.MuiLinearProgress-bar': {
        borderRadius: 4,
    },
}));

const ErrorContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(3),
    textAlign: 'center',
    height: '100%',
    minHeight: 200,
}));

const EmptyStateContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
    textAlign: 'center',
    height: '100%',
    minHeight: 200,
    color: theme.palette.text.secondary,
}));

const AnimatedAvatar = styled(Avatar)(({ theme }) => ({
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'scale(1.1)',
    }
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        backgroundColor: theme.palette.success.main,
        color: theme.palette.success.main,
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
        '&::after': {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            content: '""',
        },
    },
}));

const TimelineContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1, 0),
    position: 'relative',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 16,
        width: 2,
        backgroundColor: alpha(theme.palette.primary.main, 0.2),
    }
}));

const TimelineItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    marginBottom: theme.spacing(3),
    position: 'relative',
    '&:last-child': {
        marginBottom: 0
    }
}));

const TimelineIcon = styled(Box)(({ theme, color }) => ({
    width: 34,
    height: 34,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color ? alpha(theme.palette[color].main, 0.12) : alpha(theme.palette.primary.main, 0.12),
    color: color ? theme.palette[color].main : theme.palette.primary.main,
    zIndex: 1,
    marginRight: theme.spacing(2),
}));

const GradientText = styled(Typography)(({ theme }) => ({
    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textFillColor: 'transparent',
    fontWeight: 600,
}));

const SummaryCard = styled(Paper)(({ theme }) => ({
    background: theme.palette.mode === 'dark' 
        ? `linear-gradient(to right, ${alpha(theme.palette.primary.dark, 0.9)}, ${alpha(theme.palette.secondary.dark, 0.9)})`
        : `linear-gradient(to right, ${alpha(theme.palette.primary.light, 0.9)}, ${alpha(theme.palette.secondary.light, 0.9)})`,
    borderRadius: 16,
    padding: theme.spacing(3),
    color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.common.black,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 8px 25px 0 rgba(0,0,0,0.1)',
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `url('/patterns/circuit-board.svg') repeat`,
        opacity: 0.1,
        zIndex: 0,
    }
}));

// Enhanced styles for better visual appeal
const DashboardBackground = styled(Box)(({ theme }) => ({
    position: 'relative',
    padding: theme.spacing(3),
    minHeight: 'calc(100vh - 64px)',
    backgroundImage: theme.palette.mode === 'dark'
        ? `linear-gradient(to bottom right, ${alpha(theme.palette.primary.dark, 0.05)}, ${alpha(theme.palette.background.default, 1)})`
        : `linear-gradient(to bottom right, ${alpha(theme.palette.primary.light, 0.05)}, ${alpha(theme.palette.background.default, 1)})`,
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url(/assets/patterns/grid-pattern.svg)',
        backgroundSize: '50px 50px',
        opacity: 0.03,
        pointerEvents: 'none',
    }
}));

const UpgradeCard = styled(Card)(({ theme }) => ({
    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
    color: theme.palette.common.white,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(3),
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url(/assets/patterns/dots-pattern.svg) repeat',
        opacity: 0.1,
        zIndex: 0,
    }
}));

function WorkerDashboard() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const user = useSelector(state => state.auth.user);
    const [activeTab, setActiveTab] = useState(0);
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    
    const [loading, setLoading] = useState({
        applications: true,
        skills: true,
        stats: true,
        activities: true,
        recommendations: true
    });
    const [error, setError] = useState({
        applications: null,
        skills: null,
        stats: null,
        activities: null,
        recommendations: null
    });
    const [retryCount, setRetryCount] = useState({
        applications: 0,
        skills: 0,
        stats: 0,
        activities: 0,
        recommendations: 0
    });
    
    // Core data states
    const [applications, setApplications] = useState([]);
    const [skills, setSkills] = useState([]);
    const [completedAssessments, setCompletedAssessments] = useState([]);
    
    // New data states
    const [activities, setActivities] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [upcomingJobs, setUpcomingJobs] = useState([]);
    const [chartData, setChartData] = useState({
        applicationStats: null,
        earningsStats: null,
        skillBreakdown: null
    });
    
    const [stats, setStats] = useState({
        profileViews: { count: 0, trend: 'neutral', percentage: 0 },
        messages: { count: 0, trend: 'neutral', percentage: 0 },
        proposals: { count: 0, trend: 'neutral', percentage: 0 },
        rating: { average: 0, count: 0 },
        earnings: { total: 0, pending: 0, trend: 'neutral', percentage: 0 },
        completionRate: { value: 0, total: 0, completed: 0 }
    });
    
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [filterOpen, setFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        applications: 'all',
        skills: 'all',
        timeline: '30days'
    });

    // Mock data generation for new UI elements
    const generateMockActivities = () => {
        const activityTypes = [
            { type: 'application', icon: <Assignment fontSize="small" />, color: 'primary', text: 'You applied to' },
            { type: 'message', icon: <Message fontSize="small" />, color: 'info', text: 'You received a message from' },
            { type: 'profile_view', icon: <Person fontSize="small" />, color: 'secondary', text: 'Your profile was viewed by' },
            { type: 'assessment', icon: <Assessment fontSize="small" />, color: 'warning', text: 'You completed an assessment for' },
            { type: 'job_offer', icon: <Check fontSize="small" />, color: 'success', text: 'You received a job offer for' }
        ];
        
        const mockCompanies = [
            'Acme Corporation', 'Johnson Family', 'ABC Plumbing', 'Springfield HVAC', 
            'Modern Electrical Services', 'Smith Contractors', 'Reliable Home Repairs',
            'City Maintenance Department', 'Dream Home Construction'
        ];
        
        const mockJobs = [
            'Plumbing Repair', 'Electrical Wiring', 'HVAC Installation', 'Roof Repair',
            'Kitchen Remodeling', 'Bathroom Renovation', 'Deck Construction', 'Exterior Painting',
            'Floor Installation', 'Window Replacement'
        ];
        
        return Array.from({ length: 10 }, (_, i) => {
            const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
            const company = mockCompanies[Math.floor(Math.random() * mockCompanies.length)];
            const job = mockJobs[Math.floor(Math.random() * mockJobs.length)];
            
            return {
                id: `activity-${i + 1}`,
                type: activityType.type,
                icon: activityType.icon,
                color: activityType.color,
                text: activityType.text,
                entity: job,
                company: company,
                timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))
            };
        }).sort((a, b) => b.timestamp - a.timestamp);
    };
    
    const generateMockRecommendations = () => {
        const mockJobs = [
            {
                id: 'rec-1',
                title: 'Plumbing Service for Residential Complex',
                company: 'TownView Apartments',
                location: 'Denver, CO',
                budget: '$2,500-3,000',
                matchScore: 95,
                description: 'Complete overhaul of plumbing system in a 24-unit residential complex.',
                postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                skills: ['Commercial Plumbing', 'Pipe Fitting', 'Water Heater Installation']
            },
            {
                id: 'rec-2',
                title: 'Electrical System Upgrade for Office Building',
                company: 'Highland Business Center',
                location: 'Chicago, IL',
                budget: '$4,000-5,000',
                matchScore: 88,
                description: 'Upgrading electrical panels and wiring for a 5-story office building.',
                postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                skills: ['Commercial Electrical', 'Panel Installation', 'Code Compliance']
            },
            {
                id: 'rec-3',
                title: 'HVAC Replacement for Restaurant',
                company: 'Fusion Bistro',
                location: 'Austin, TX',
                budget: '$6,000-7,500',
                matchScore: 82,
                description: 'Replace and install new HVAC system for a busy downtown restaurant.',
                postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                skills: ['Commercial HVAC', 'Refrigeration', 'Ventilation Systems']
            }
        ];
        
        return mockJobs;
    };
    
    const generateMockChartData = () => {
        // Applications by status chart
        const applicationStats = {
            options: {
                chart: {
                    id: 'application-status',
                    fontFamily: 'Roboto, sans-serif',
                    toolbar: {
                        show: false
                    }
                },
                colors: [
                    theme.palette.primary.main,
                    theme.palette.info.main,
                    theme.palette.success.main,
                    theme.palette.warning.main,
                    theme.palette.error.main
                ],
                labels: ['Pending', 'Viewed', 'Interview', 'Offered', 'Declined'],
                legend: {
                    position: 'bottom',
                    horizontalAlign: 'center',
                    fontSize: '12px'
                },
                dataLabels: {
                    enabled: false
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '70%',
                            labels: {
                                show: true,
                                name: {
                                    show: true,
                                    fontSize: '14px',
                                    fontWeight: 600
                                },
                                value: {
                                    show: true,
                                    fontSize: '16px',
                                    fontWeight: 400
                                },
                                total: {
                                    show: true,
                                    label: 'Total',
                                    fontSize: '16px',
                                    fontWeight: 600
                                }
                            }
                        }
                    }
                }
            },
            series: [4, 5, 2, 3, 1]
        };
        
        // Monthly earnings chart
        const earningsStats = {
            options: {
                chart: {
                    id: 'monthly-earnings',
                    fontFamily: 'Roboto, sans-serif',
                    toolbar: {
                        show: false
                    },
                    zoom: {
                        enabled: false
                    }
                },
                colors: [theme.palette.primary.main],
                stroke: {
                    curve: 'smooth',
                    width: 3
                },
                grid: {
                    borderColor: theme.palette.divider,
                    row: {
                        colors: [
                            alpha(theme.palette.background.default, 0.5),
                            'transparent'
                        ],
                        opacity: 0.2
                    }
                },
                markers: {
                    size: 5,
                    colors: [theme.palette.background.paper],
                    strokeColors: theme.palette.primary.main,
                    strokeWidth: 2
                },
                xaxis: {
                    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    labels: {
                        style: {
                            colors: theme.palette.text.secondary
                        }
                    },
                    axisBorder: {
                        show: false
                    }
                },
                yaxis: {
                    labels: {
                        style: {
                            colors: theme.palette.text.secondary
                        },
                        formatter: (value) => `$${value}`
                    }
                },
                tooltip: {
                    theme: theme.palette.mode
                }
            },
            series: [{
                name: 'Earnings',
                data: [2800, 1500, 3200, 4100, 2900, 3800]
            }]
        };
        
        // Skills breakdown
        const skillBreakdown = {
            options: {
                chart: {
                    id: 'skill-radar',
                    fontFamily: 'Roboto, sans-serif',
                    toolbar: {
                        show: false
                    }
                },
                colors: [theme.palette.primary.main],
                stroke: {
                    width: 2
                },
                fill: {
                    opacity: 0.4
                },
                markers: {
                    size: 0
                },
                xaxis: {
                    categories: ['Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'Painting'],
                    labels: {
                        style: {
                            colors: [
                                theme.palette.text.secondary,
                                theme.palette.text.secondary,
                                theme.palette.text.secondary,
                                theme.palette.text.secondary,
                                theme.palette.text.secondary
                            ]
                        }
                    }
                }
            },
            series: [{
                name: 'Skill Level',
                data: [90, 75, 80, 60, 70]
            }]
        };
        
        return {
            applicationStats,
            earningsStats,
            skillBreakdown
        };
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(prev => ({ ...prev, stats: true }));
            const response = await apiService.getDashboardStats();
            if (response && response.success !== false) {
            setStats({
                    profileViews: response.profileViews || { count: 0, trend: 'neutral', percentage: 0 },
                    messages: response.messages || { count: 0, trend: 'neutral', percentage: 0 },
                    proposals: response.proposals || { count: 0, trend: 'neutral', percentage: 0 },
                    rating: response.rating || { average: 0, count: 0 },
                    earnings: { total: 12500, pending: 2800, trend: 'up', percentage: 12 },
                    completionRate: { value: 95, total: 40, completed: 38 }
            });
            setError(prev => ({ ...prev, stats: null }));
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setError(prev => ({ ...prev, stats: 'Failed to load dashboard statistics' }));
            
            // Automatic retry logic with exponential backoff
            if (retryCount.stats < 3) {
                const delay = Math.pow(2, retryCount.stats) * 1000;
                setTimeout(() => {
                    setRetryCount(prev => ({ ...prev, stats: prev.stats + 1 }));
                    fetchDashboardData();
                }, delay);
            }
        } finally {
            setLoading(prev => ({ ...prev, stats: false }));
        }
    };

    const fetchApplications = async () => {
        try {
            setLoading(prev => ({ ...prev, applications: true }));
            const response = await apiService.getJobApplications();
            if (response && response.success !== false) {
                setApplications(Array.isArray(response) ? response : []);
            setError(prev => ({ ...prev, applications: null }));
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('Error fetching applications:', err);
            setError(prev => ({ ...prev, applications: 'Failed to load job applications' }));
            
            // Automatic retry logic
            if (retryCount.applications < 3) {
                const delay = Math.pow(2, retryCount.applications) * 1000;
                setTimeout(() => {
                    setRetryCount(prev => ({ ...prev, applications: prev.applications + 1 }));
                    fetchApplications();
                }, delay);
            }
        } finally {
            setLoading(prev => ({ ...prev, applications: false }));
        }
    };

    const fetchSkillsData = async () => {
        try {
            setLoading(prev => ({ ...prev, skills: true }));
            
            // Use Promise.allSettled to handle partial success
            const [skillsResponse, assessmentsResponse] = await Promise.allSettled([
                apiService.getWorkerSkills(),
                apiService.getSkillAssessments()
            ]);
            
            if (skillsResponse.status === 'fulfilled' && skillsResponse.value) {
                setSkills(Array.isArray(skillsResponse.value) ? skillsResponse.value : []);
            }
            
            if (assessmentsResponse.status === 'fulfilled' && assessmentsResponse.value) {
                setCompletedAssessments(Array.isArray(assessmentsResponse.value) ? assessmentsResponse.value : []);
            }
            
            // Only set error if both failed
            if (skillsResponse.status === 'rejected' && assessmentsResponse.status === 'rejected') {
                setError(prev => ({ ...prev, skills: 'Failed to load skills data' }));
            } else {
            setError(prev => ({ ...prev, skills: null }));
            }
        } catch (err) {
            console.error('Error fetching skills data:', err);
            setError(prev => ({ ...prev, skills: 'Failed to load skills data' }));
            
            // Automatic retry logic
            if (retryCount.skills < 3) {
                const delay = Math.pow(2, retryCount.skills) * 1000;
                setTimeout(() => {
                    setRetryCount(prev => ({ ...prev, skills: prev.skills + 1 }));
                    fetchSkillsData();
                }, delay);
            }
        } finally {
            setLoading(prev => ({ ...prev, skills: false }));
        }
    };
    
    // New fetch functions for additional data
    const fetchActivities = () => {
        try {
            setLoading(prev => ({ ...prev, activities: true }));
            
            // In a real implementation, we would call an API endpoint
            // For now, we'll use our mock data generator
            setTimeout(() => {
                const mockActivities = generateMockActivities();
                setActivities(mockActivities);
                setError(prev => ({ ...prev, activities: null }));
                setLoading(prev => ({ ...prev, activities: false }));
            }, 800); // Simulate network delay
            
        } catch (err) {
            console.error('Error fetching activities:', err);
            setError(prev => ({ ...prev, activities: 'Failed to load activity data' }));
            setLoading(prev => ({ ...prev, activities: false }));
        }
    };
    
    const fetchRecommendations = () => {
        try {
            setLoading(prev => ({ ...prev, recommendations: true }));
            
            // In a real implementation, we would call an API endpoint
            // For now, we'll use our mock data generator
            setTimeout(() => {
                const mockRecommendations = generateMockRecommendations();
                setRecommendations(mockRecommendations);
                setChartData(generateMockChartData());
                setError(prev => ({ ...prev, recommendations: null }));
                setLoading(prev => ({ ...prev, recommendations: false }));
            }, 1000); // Simulate network delay
            
        } catch (err) {
            console.error('Error fetching recommendations:', err);
            setError(prev => ({ ...prev, recommendations: 'Failed to load recommendations data' }));
            setLoading(prev => ({ ...prev, recommendations: false }));
        }
    };

    useEffect(() => {
        fetchDashboardData();
        fetchApplications();
        fetchSkillsData();
        fetchActivities();
        fetchRecommendations();
        
        // Set up polling for real-time updates (every 5 minutes)
        const intervalId = setInterval(() => {
            fetchDashboardData();
            fetchApplications();
            fetchActivities();
        }, 5 * 60 * 1000);
        
        return () => clearInterval(intervalId);
    }, []);

    // Render helper functions for better UI
    const renderStatCard = (title, value, icon, trend, loading, error) => {
        return (
            <StatsCard elevation={2}>
                <AnimatedAvatar
                    sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        width: 56,
                        height: 56
                    }}
                >
                    {icon}
                </AnimatedAvatar>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {title}
                    </Typography>
                    {loading ? (
                        <Skeleton variant="text" width={60} height={32} />
                    ) : error ? (
                        <Typography color="error" variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                            <ErrorOutline fontSize="small" sx={{ mr: 0.5 }} /> Error
                        </Typography>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="h5" fontWeight="600">
                                {value}
                            </Typography>
                            {trend && (
                                <Chip
                                    size="small"
                                    icon={trend === 'up' ? <TrendingUp fontSize="small" /> : null}
                                    label={`${trend === 'up' ? '+' : trend === 'down' ? '-' : ''}${trend.percentage || 0}%`}
                                    color={trend === 'up' ? 'success' : trend === 'down' ? 'error' : 'default'}
                                    sx={{ ml: 1, height: 20 }}
                                />
                            )}
                        </Box>
                    )}
                </Box>
            </StatsCard>
        );
    };

    const renderErrorState = (message, onRetry) => (
        <ErrorContainer>
            <ErrorOutline sx={{ fontSize: 40, color: 'error.main', mb: 2 }} />
            <Typography variant="h6" color="error" gutterBottom>
                {message || 'Something went wrong'}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                There was a problem loading the data. Please try again.
            </Typography>
            <Button
                variant="outlined"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={onRetry}
                sx={{ mt: 2 }}
            >
                Retry
            </Button>
        </ErrorContainer>
    );

    const renderEmptyState = (title, description, icon) => (
        <EmptyStateContainer>
            {icon || <InfoIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />}
            <Typography variant="h6" gutterBottom>
                {title}
            </Typography>
            <Typography variant="body2" paragraph>
                {description}
            </Typography>
        </EmptyStateContainer>
    );
    
    const renderActivityItem = (activity) => (
        <TimelineItem key={activity.id}>
            <TimelineIcon color={activity.color}>
                {activity.icon}
            </TimelineIcon>
            <Box>
                <Typography variant="body2" fontWeight={500}>
                    {activity.text} <span style={{ fontWeight: 600 }}>{activity.entity}</span>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {activity.company} • {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </Typography>
            </Box>
        </TimelineItem>
    );
    
    const renderRecommendationCard = (job) => (
        <Card 
            key={job.id} 
            elevation={1} 
            sx={{ 
                mb: 2, 
                borderRadius: 2,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4]
                }
            }}
        >
            <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" noWrap sx={{ fontWeight: 'medium', maxWidth: '80%' }}>
                        {job.title}
                    </Typography>
                    <Chip 
                        label={`${job.matchScore}% Match`} 
                        size="small"
                        color={job.matchScore > 90 ? 'success' : job.matchScore > 80 ? 'primary' : 'default'}
                    />
                </Box>
                
                <Typography variant="body2" color="text.secondary" paragraph noWrap>
                    {job.description}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 1, gap: 1 }}>
                    <Chip
                        size="small"
                        icon={<AttachMoney fontSize="small" />}
                        label={job.budget}
                        variant="outlined"
                    />
                    <Chip
                        size="small"
                        icon={<LocationOn fontSize="small" />}
                        label={job.location}
                        variant="outlined"
                    />
                    <Chip
                        size="small"
                        icon={<AccessTime fontSize="small" />}
                        label={formatDistanceToNow(new Date(job.postedDate), { addSuffix: true })}
                        variant="outlined"
                    />
                </Box>
                
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mt: 2
                }}>
                    <Typography variant="body2">
                        {job.company}
                    </Typography>
                    <Button
                        variant="contained"
                        size="small"
                        endIcon={<ArrowForward />}
                        sx={{ borderRadius: 4 }}
                    >
                        Apply Now
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );

    // Event handlers
    const handleViewJob = async (jobId) => {
        try {
            const details = await apiService.getJobApplicationDetails(jobId);
            console.log('Job details:', details);
        } catch (err) {
            setSnackbar({
                open: true,
                message: 'Failed to load job details',
                severity: 'error'
            });
        }
    };

    const handleViewFeedback = async (applicationId) => {
        try {
            const feedback = await apiService.getJobApplicationFeedback(applicationId);
            console.log('Application feedback:', feedback);
        } catch (err) {
            setSnackbar({
                open: true,
                message: 'Failed to load application feedback',
                severity: 'error'
            });
        }
    };

    const handleStartAssessment = async (skillId) => {
        try {
            const assessment = await apiService.startSkillAssessment(skillId);
            console.log('Started assessment:', assessment);
        } catch (err) {
            setSnackbar({
                open: true,
                message: 'Failed to start assessment',
                severity: 'error'
            });
        }
    };

    const handleRetakeAssessment = async (assessmentId) => {
        try {
            const assessment = await apiService.startSkillAssessment(assessmentId);
            console.log('Retaking assessment:', assessment);
        } catch (err) {
            setSnackbar({
                open: true,
                message: 'Failed to start assessment retake',
                severity: 'error'
            });
        }
    };

    const handleRefresh = () => {
        // Reset retry counts
        setRetryCount({
            applications: 0,
            skills: 0,
            stats: 0,
            activities: 0,
            recommendations: 0
        });
        
        fetchDashboardData();
        fetchApplications();
        fetchSkillsData();
        fetchActivities();
        fetchRecommendations();
        
        setSnackbar({
            open: true,
            message: 'Refreshing dashboard data...',
            severity: 'info'
        });
    };
    
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };
    
    const handleMenuOpen = (event) => {
        setMenuAnchorEl(event.currentTarget);
    };
    
    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };
    
    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const handleSnackbarClose = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Additional component for interactive job calendar
    const CalendarView = ({ jobs }) => {
        const theme = useTheme();
        const [selectedDate, setSelectedDate] = useState(new Date());
        
        // Mock data for calendar view
        const upcomingJobs = [
            { id: 'job-1', title: 'Plumbing Repair', date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), client: 'Johnson Family', address: '123 Main St, Denver CO' },
            { id: 'job-2', title: 'Electrical Wiring', date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), client: 'ABC Restaurant', address: '456 Oak Ave, Chicago IL' },
            { id: 'job-3', title: 'HVAC Maintenance', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), client: 'City Hospital', address: '789 Pine St, Austin TX' },
        ];
        
        const jobsForSelectedDate = upcomingJobs.filter(job => 
            job.date.getDate() === selectedDate.getDate() &&
            job.date.getMonth() === selectedDate.getMonth() &&
            job.date.getFullYear() === selectedDate.getFullYear()
        );

    return (
            <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Upcoming Jobs Calendar
                </Typography>
                
        <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    mt: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 2,
                    overflow: 'hidden'
                }}>
                    <Box sx={{ 
                        display: 'flex', 
                        p: 2, 
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}>
                        <IconButton size="small" onClick={() => {
                            const newDate = new Date(selectedDate);
                            newDate.setDate(newDate.getDate() - 1);
                            setSelectedDate(newDate);
                        }}>
                            <ChevronLeft />
                        </IconButton>
                        <Typography 
                            sx={{ 
                                flex: 1, 
                                textAlign: 'center',
                                fontWeight: 'medium'
                            }}
                        >
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </Typography>
                        <IconButton size="small" onClick={() => {
                            const newDate = new Date(selectedDate);
                            newDate.setDate(newDate.getDate() + 1);
                            setSelectedDate(newDate);
                        }}>
                            <ChevronRight />
                        </IconButton>
                    </Box>
                    
                    <Box sx={{ p: 2 }}>
                        {jobsForSelectedDate.length > 0 ? (
                            jobsForSelectedDate.map(job => (
                                <Card key={job.id} sx={{ mb: 2, p: 2, borderRadius: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <HomeRepairService sx={{ mr: 1, color: theme.palette.primary.main }} />
                                        <Typography variant="subtitle1" fontWeight="medium">
                                            {job.title}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Client: {job.client}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {job.address}
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                        <Button 
                                            size="small" 
                                            variant="outlined" 
                                            startIcon={<CalendarMonth />}
                                            sx={{ mr: 1 }}
                                        >
                                            Reschedule
                                        </Button>
                                        <Button 
                                            size="small" 
                                            variant="contained"
                                            startIcon={<ArrowForward />}
                                        >
                                            View Details
                                        </Button>
                                    </Box>
                                </Card>
                            ))
                        ) : (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <CalendarMonth sx={{ fontSize: 40, color: alpha(theme.palette.text.secondary, 0.5), mb: 1 }} />
                                <Typography variant="body1" gutterBottom>
                                    No jobs scheduled for this day
                                </Typography>
                                <Button 
                                    variant="outlined" 
                                    size="small"
                                    startIcon={<Search />}
                                    sx={{ mt: 1 }}
                                >
                                    Find Available Jobs
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        );
    };

    return (
        <DashboardBackground>
            {/* Header Section */}
            <Box 
                sx={{ 
                    mb: 4,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 2
                }}
            >
                <Box>
                    <Typography 
                        variant="h4" 
                        sx={{ 
                            fontWeight: 600,
                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        Welcome back, {user?.firstName || 'Worker'} 👋
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                        Here's what's happening with your job applications
                    </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<RefreshIcon />}
                        onClick={handleRefresh}
                        disabled={loading.stats || loading.applications || loading.skills}
                    >
                        {(loading.stats || loading.applications || loading.skills) ? (
                            <>
                                <CircularProgress size={16} sx={{ mr: 1 }} />
                                Refreshing...
                            </>
                        ) : 'Refresh'}
                    </Button>
                    
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            // Navigate to view history page
                        }}
                        startIcon={<Timeline />}
                    >
                        View History
                    </Button>
                </Box>
            </Box>

            {/* Premium Member Card - New */}
            <UpgradeCard>
                <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56, mr: 2 }}>
                            <Diamond />
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Upgrade to Premium Membership
                            </Typography>
                            <Typography variant="body2">
                                Get priority job matching, advanced analytics, and verified badge for your profile.
                            </Typography>
                        </Box>
            </Box>
                    <Button 
                        variant="outlined" 
                        color="inherit" 
                        sx={{ 
                            borderColor: 'rgba(255,255,255,0.5)', 
                            '&:hover': { borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.1)' } 
                        }}
                        endIcon={<ChevronRight />}
                    >
                        Explore Premium
                    </Button>
                </Box>
            </UpgradeCard>

            {/* Stats cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    {renderStatCard(
                        'Profile Views',
                        loading.stats ? '...' : error.stats ? 'Error' : stats.profileViews.count,
                        <Search />,
                        stats.profileViews,
                        loading.stats,
                        error.stats
                    )}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    {renderStatCard(
                        'Messages',
                        loading.stats ? '...' : error.stats ? 'Error' : stats.messages.count,
                        <Message />,
                        stats.messages,
                        loading.stats,
                        error.stats
                    )}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    {renderStatCard(
                        'Proposals',
                        loading.stats ? '...' : error.stats ? 'Error' : stats.proposals.count,
                        <Assignment />,
                        stats.proposals,
                        loading.stats,
                        error.stats
                    )}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    {renderStatCard(
                        'Rating',
                        loading.stats ? '...' : error.stats ? 'Error' : stats.rating.average,
                        <Star />,
                        null,
                        loading.stats,
                        error.stats
                    )}
                </Grid>
            </Grid>
            
            {/* Main content */}
            <Grid container spacing={3}>
                {/* Job Applications */}
                <Grid item xs={12} lg={7}>
                    <DashboardCard>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Work sx={{ mr: 1, color: theme.palette.primary.main }} />
                                <Typography variant="h6">Job Applications</Typography>
                            </Box>
                            <Chip 
                                label={`${applications.length} Total`}
                                size="small"
                                color="primary"
                                variant="outlined" 
                            />
                        </Box>
                        
                        {loading.applications ? (
                            <Box sx={{ p: 3 }}>
                                <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 1 }} />
                                <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 1 }} />
                                <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
                            </Box>
                        ) : error.applications ? (
                            renderErrorState(error.applications, fetchApplications)
                        ) : applications.length === 0 ? (
                            renderEmptyState(
                                'No job applications found',
                                'Start applying to jobs to track your progress here!',
                                <WorkHistory sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                            )
                        ) : (
                        <ApplicationTracker 
                            applications={applications}
                            onViewJob={handleViewJob}
                            onViewFeedback={handleViewFeedback}
                        />
                        )}
                    </DashboardCard>
                </Grid>

                {/* Skills Assessment */}
                <Grid item xs={12} lg={5}>
                    <DashboardCard>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Assessment sx={{ mr: 1, color: theme.palette.primary.main }} />
                                <Typography variant="h6">Skills Assessment</Typography>
                            </Box>
                            <Button 
                                variant="text" 
                                size="small"
                                onClick={() => {
                                    // Navigate to skills profile
                                }}
                            >
                                Improve your profile
                            </Button>
                        </Box>
                        
                        {loading.skills ? (
                            <Box sx={{ p: 3 }}>
                                <Skeleton variant="rectangular" height={120} sx={{ mb: 2, borderRadius: 1 }} />
                                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
                            </Box>
                        ) : error.skills ? (
                            renderErrorState(error.skills, fetchSkillsData)
                        ) : skills.length === 0 ? (
                            renderEmptyState(
                                'No skills data found',
                                'Add skills to your profile to see assessments and recommendations!',
                                <Assessment sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                            )
                        ) : (
                        <SkillAssessmentModule 
                            skills={skills}
                                assessments={completedAssessments}
                            onStartAssessment={handleStartAssessment}
                            onRetakeAssessment={handleRetakeAssessment}
                        />
                        )}
                    </DashboardCard>
                </Grid>

                {/* Summary Card */}
                <Grid item xs={12}>
                    <SummaryCard>
                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                            <Box>
                                        <GradientText variant="h4" gutterBottom>
                                            ${stats.earnings.total.toLocaleString()}
                                        </GradientText>
                                        <Typography variant="body1" color="text.primary" gutterBottom>
                                            Total Earnings
                                </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                            <Chip
                                                size="small"
                                                icon={<TrendingUp fontSize="small" />}
                                                label={`+${stats.earnings.percentage}%`}
                                                color="success"
                                                sx={{ mr: 2, fontWeight: 'bold' }}
                                            />
                                <Typography variant="body2" color="text.secondary">
                                                from last month
                                </Typography>
                                        </Box>
                                        
                                        <Box sx={{ mt: 3 }}>
                                            <Typography variant="body2" color="text.primary" gutterBottom>
                                                Job Completion Rate
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="h6" sx={{ mr: 2 }}>
                                                    {stats.completionRate.value}%
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {stats.completionRate.completed}/{stats.completionRate.total} jobs
                                                </Typography>
                                            </Box>
                                            <ProgressBar 
                                                variant="determinate" 
                                                value={stats.completionRate.value} 
                                                color="success"
                                            />
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="text.primary" gutterBottom>
                                        Earnings Trend
                                    </Typography>
                                    <Suspense fallback={<Box sx={{ height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>}>
                                        {chartData.earningsStats && (
                                            <Box sx={{ height: 170 }}>
                                                <Chart
                                                    type="line"
                                                    options={chartData.earningsStats.options}
                                                    series={chartData.earningsStats.series}
                                                    height="100%"
                                                />
                                            </Box>
                                        )}
                                    </Suspense>
                                </Grid>
                            </Grid>
                            
                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="text"
                                    sx={{ color: 'inherit' }}
                                    endIcon={<ChevronRight />}
                                >
                                    View Earnings Details
                                </Button>
                            </Box>
                        </Box>
                    </SummaryCard>
                </Grid>

                {/* Recommended Jobs */}
                <Grid item xs={12} md={7}>
                    <DashboardCard>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Rocket sx={{ mr: 1, color: theme.palette.primary.main }} />
                                <Typography variant="h6">Recommended Jobs</Typography>
                            </Box>
                            <IconButton 
                                size="small"
                                onClick={handleMenuOpen}
                                aria-label="filter"
                            >
                                <FilterList />
                            </IconButton>
                        </Box>
                        
                        {loading.recommendations ? (
                            <Box sx={{ p: 1 }}>
                                <Skeleton variant="rectangular" height={140} sx={{ mb: 2, borderRadius: 2 }} />
                                <Skeleton variant="rectangular" height={140} sx={{ mb: 2, borderRadius: 2 }} />
                                <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
                            </Box>
                        ) : error.recommendations ? (
                            renderErrorState(error.recommendations, fetchRecommendations)
                        ) : recommendations.length === 0 ? (
                            renderEmptyState(
                                'No job recommendations available',
                                'Complete more skill assessments to get personalized job recommendations!',
                                <Search sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                            )
                        ) : (
                            <Box>
                                {recommendations.map(job => renderRecommendationCard(job))}
                                
                                <Box sx={{ mt: 2, textAlign: 'center' }}>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        endIcon={<ChevronRight />}
                                    >
                                        View All Recommendations
                                    </Button>
                                </Box>
                            </Box>
                        )}
                        
                        <Menu
                            anchorEl={menuAnchorEl}
                            open={Boolean(menuAnchorEl)}
                            onClose={handleMenuClose}
                        >
                            <MenuItem onClick={() => {
                                handleFilterChange('recommendations', 'best-match');
                                handleMenuClose();
                            }}>
                                <ListItemIcon>
                                    <Star fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Best Match</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => {
                                handleFilterChange('recommendations', 'newest');
                                handleMenuClose();
                            }}>
                                <ListItemIcon>
                                    <AccessTime fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Newest First</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => {
                                handleFilterChange('recommendations', 'highest-paid');
                                handleMenuClose();
                            }}>
                                <ListItemIcon>
                                    <AttachMoney fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Highest Paid</ListItemText>
                            </MenuItem>
                        </Menu>
                    </DashboardCard>
                </Grid>

                {/* Recent Activity Timeline */}
                <Grid item xs={12} md={5}>
                    <DashboardCard>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Timeline sx={{ mr: 1, color: theme.palette.primary.main }} />
                                <Typography variant="h6">Recent Activity</Typography>
                            </Box>
                            <Tabs 
                                value={activeTab} 
                                onChange={handleTabChange}
                                textColor="primary"
                                indicatorColor="primary"
                                sx={{ '.MuiTabs-indicator': { height: 3, borderRadius: 1.5 } }}
                            >
                                <Tab 
                                    label="All" 
                                    sx={{ minWidth: 60, px: 1 }}
                                />
                                <Tab 
                                    label="Applications" 
                                    sx={{ minWidth: 60, px: 1 }}
                                />
                            </Tabs>
                        </Box>
                        
                        {loading.activities ? (
                            <Box sx={{ p: 2 }}>
                                {[1, 2, 3, 4].map((_, index) => (
                                    <Box key={index} sx={{ display: 'flex', mb: 2 }}>
                                        <Skeleton variant="circular" width={34} height={34} sx={{ mr: 2 }} />
                                        <Box sx={{ width: '100%' }}>
                                            <Skeleton variant="text" sx={{ width: '70%' }} />
                                            <Skeleton variant="text" sx={{ width: '40%' }} />
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        ) : error.activities ? (
                            renderErrorState(error.activities, fetchActivities)
                        ) : activities.length === 0 ? (
                            renderEmptyState(
                                'No recent activity',
                                'Your recent activities will appear here as you use the platform.',
                                <Timeline sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                            )
                        ) : (
                            <TimelineContainer>
                                {activities
                                    .filter(activity => 
                                        activeTab === 0 ||
                                        (activeTab === 1 && activity.type === 'application')
                                    )
                                    .slice(0, 6)
                                    .map(activity => renderActivityItem(activity))
                                }
                                
                                {activities.length > 6 && (
                                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                                        <Button
                                            variant="text"
                                            size="small"
                                            endIcon={<ChevronRight />}
                                        >
                                            View More Activities
                                        </Button>
                                    </Box>
                                )}
                            </TimelineContainer>
                        )}
                    </DashboardCard>
                </Grid>

                {/* Calendar View - New */}
                <Grid item xs={12} md={6}>
                    <DashboardCard>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarMonth sx={{ mr: 1, color: theme.palette.primary.main }} />
                                <Typography variant="h6">Work Schedule</Typography>
                            </Box>
                            <Button 
                                variant="text" 
                                size="small"
                                endIcon={<ChevronRight />}
                            >
                                View Calendar
                            </Button>
                        </Box>
                        
                        <CalendarView jobs={upcomingJobs} />
                    </DashboardCard>
                </Grid>
                
                {/* Achievements/Badges - New */}
                <Grid item xs={12} md={6}>
                    <DashboardCard>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Trophy sx={{ mr: 1, color: theme.palette.primary.main }} />
                                <Typography variant="h6">Achievements & Badges</Typography>
                            </Box>
                        </Box>
                        
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={4}>
                                <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center',
                                    p: 2,
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                    borderRadius: 2,
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)' }
                                }}>
                                    <Avatar 
                                sx={{ 
                                            width: 50, 
                                            height: 50, 
                                            mb: 1, 
                                            bgcolor: alpha(theme.palette.success.main, 0.1),
                                            color: theme.palette.success.main
                                        }}
                                    >
                                        <VerifiedUser />
                                    </Avatar>
                                    <Typography variant="body2" textAlign="center">
                                        Verified Pro
                                    </Typography>
                        </Box>
                            </Grid>
                            <Grid item xs={4}>
                                <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center',
                                    p: 2,
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                    borderRadius: 2,
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)' }
                                }}>
                                    <Avatar 
                                        sx={{ 
                                            width: 50, 
                                            height: 50, 
                                            mb: 1, 
                                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                                            color: theme.palette.warning.main
                                        }}
                                    >
                                        <EmojiEvents />
                                    </Avatar>
                                    <Typography variant="body2" textAlign="center">
                                        Top Rated
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={4}>
                                <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center',
                                    p: 2,
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                    borderRadius: 2,
                                    filter: 'grayscale(1)',
                                    opacity: 0.7,
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)' }
                                }}>
                                    <Avatar 
                                        sx={{ 
                                            width: 50, 
                                            height: 50, 
                                            mb: 1, 
                                            bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                            color: theme.palette.secondary.main
                                        }}
                                    >
                                        <Diamond />
                                    </Avatar>
                                    <Typography variant="body2" textAlign="center">
                                        Elite Status
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                        
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Progress to Next Badge
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" sx={{ mr: 2 }}>
                                    68%
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    5 more completed jobs needed
                                </Typography>
                            </Box>
                            <ProgressBar 
                                variant="determinate" 
                                value={68} 
                                color="secondary"
                            />
                        </Box>
                    </DashboardCard>
                </Grid>

                {/* Data Visualization */}
                <Grid item xs={12}>
                    <DashboardCard>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <BarChart sx={{ mr: 1, color: theme.palette.primary.main }} />
                                <Typography variant="h6">Analytics Dashboard</Typography>
                            </Box>
                            <Box>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleFilterChange('timeline', '30days')}
                                    color={filters.timeline === '30days' ? 'primary' : 'inherit'}
                                    sx={{ mr: 1 }}
                                >
                                    30 Days
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleFilterChange('timeline', '90days')}
                                    color={filters.timeline === '90days' ? 'primary' : 'inherit'}
                                    sx={{ mr: 1 }}
                                >
                                    90 Days
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleFilterChange('timeline', 'year')}
                                    color={filters.timeline === 'year' ? 'primary' : 'inherit'}
                                >
                                    Year
                                </Button>
                            </Box>
                        </Box>
                        
                        {loading.recommendations ? (
                            <Box sx={{ p: 3 }}>
                                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
                            </Box>
                        ) : error.recommendations ? (
                            renderErrorState(error.recommendations, fetchRecommendations)
                        ) : (
                            <Suspense fallback={<Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="subtitle1" align="center" gutterBottom>
                                            Applications by Status
                                        </Typography>
                                        {chartData.applicationStats && (
                                            <Chart
                                                type="donut"
                                                options={chartData.applicationStats.options}
                                                series={chartData.applicationStats.series}
                                                height={300}
                                            />
                                        )}
                                    </Grid>
                                    <Grid item xs={12} md={8}>
                                        <Typography variant="subtitle1" align="center" gutterBottom>
                                            Skills Breakdown
                                        </Typography>
                                        {chartData.skillBreakdown && (
                                            <Chart
                                                type="radar"
                                                options={chartData.skillBreakdown.options}
                                                series={chartData.skillBreakdown.series}
                                                height={300}
                                            />
                                        )}
                                    </Grid>
                                </Grid>
                            </Suspense>
                        )}
                    </DashboardCard>
                </Grid>
            </Grid>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleSnackbarClose} 
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </DashboardBackground>
    );
}

export default WorkerDashboard;