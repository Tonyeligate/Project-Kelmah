import React, { useState, useEffect, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { 
    Box, 
    Grid, 
    useTheme, 
    useMediaQuery, 
    CircularProgress,
    Alert,
    Drawer,
    Container,
    Typography,
    IconButton,
    Tooltip,
    Fab,
    Badge,
    Button,
    SwipeableDrawer
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PropTypes from 'prop-types';
import { startTransition } from 'react';
import { alpha } from '@mui/material/styles';
import { styled } from '@mui/material/styles';

import { fetchDashboardData, updateJobStatus } from '../../store/slices/dashboardSlice';
import { fetchNotifications, markAsRead } from '../../store/slices/notificationsSlice';
import { fetchEvents } from '../../store/slices/calendarSlice';

import DashboardCard from './DashboardCard';
import CreateJobDialog from '../jobs/CreateJobDialog';
import CreateEventDialog from '../calendar/CreateEventDialog';
import QuickActions from './QuickActions';
import ErrorBoundary from '../common/ErrorBoundary';

// Lazy load components
const DashboardNavigation = React.lazy(() => import('./DashboardNavigation'));
const JobMetrics = React.lazy(() => import('./JobMetrics'));
const WorkerManagement = React.lazy(() => import('./WorkerManagement'));
const AnalyticsDashboard = React.lazy(() => import('./AnalyticsDashboard'));
const DashboardCalendar = React.lazy(() => import('./DashboardCalendar'));
const NotificationsPanel = React.lazy(() => import('./NotificationsPanel'));
const WelcomeSection = React.lazy(() => import('./WelcomeSection'));
const ActiveWorkersList = React.lazy(() => import('./ActiveWorkersList'));
const RecentJobsList = React.lazy(() => import('./RecentJobsList'));
const MapView = React.lazy(() => import('../maps/MapView'));

// Custom styled Tab component
const StyledTab = styled(Box)(({ theme, active }) => ({
    padding: '12px 20px',
    minWidth: 100,
    textAlign: 'center',
    fontWeight: active ? 600 : 500,
    fontSize: '0.95rem',
    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    borderRadius: '10px',
    backgroundColor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
    border: `1px solid ${active ? alpha(theme.palette.primary.main, 0.2) : 'transparent'}`,
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.04),
        color: active ? theme.palette.primary.main : theme.palette.text.primary,
    },
}));

// Add loading fallback component
const LoadingFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
        <CircularProgress />
    </Box>
);

function HirerDashboard() {
    const theme = useTheme();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedView, setSelectedView] = useState('overview');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
    const [createJobDialogOpen, setCreateJobDialogOpen] = useState(false);
    const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [workerDetailsOpen, setWorkerDetailsOpen] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Add these selectors near the top of your component
    const { items: notifications } = useSelector(state => state.notifications);
    const unreadNotifications = useSelector(state => state.notifications.unreadCount);
    const dashboardData = useSelector(state => state.dashboard.data);

    // Rename the function to fetchAllDashboardData
    const fetchAllDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const results = await Promise.allSettled([
                dispatch(fetchDashboardData()),
                dispatch(fetchEvents()),
                dispatch(fetchNotifications())
            ]);
            
            // Check for any rejected promises
            const errors = results
                .filter(result => result.status === 'rejected')
                .map(result => result.reason);
                
            if (errors.length > 0) {
                console.error('Errors fetching dashboard data:', errors);
                setError('Some dashboard data failed to load');
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    // Update references to the function
    useEffect(() => {
        fetchAllDashboardData();
    }, [dispatch]);

    const quickActions = [
        {
            title: 'Post New Job',
            icon: 'add',
            color: theme.palette.primary.main,
            onClick: () => handleQuickAction('post-job')
        },
        {
            title: 'Find Talents',
            icon: 'search',
            color: theme.palette.secondary.main,
            onClick: () => handleQuickAction('find-workers')
        },
        {
            title: 'Applications',
            icon: 'description',
            color: theme.palette.success.main,
            onClick: () => handleQuickAction('view-applications')
        },
        {
            title: 'Messages',
            icon: 'message',
            color: theme.palette.info.main,
            onClick: () => navigate('/messages')
        }
    ];

    const handleQuickAction = (actionType) => {
        switch (actionType) {
            case 'post-job':
                setCreateJobDialogOpen(true);
                break;
            case 'find-workers':
                navigate('/find-talents');
                break;
            case 'view-applications':
                navigate('/applications');
                break;
            case 'schedule-meeting':
                setCreateEventDialogOpen(true);
                break;
            default:
                console.warn('Unknown action type:', actionType);
        }
    };

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            await fetchAllDashboardData();
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            startTransition(async () => {
                const unreadNotifications = notifications.filter(n => !n.read);
                await Promise.all(
                    unreadNotifications.map(notification => 
                        dispatch(markAsRead(notification.id)).unwrap()
                    )
                );
                enqueueSnackbar('All notifications marked as read', { 
                    variant: 'success' 
                });
            });
        } catch (error) {
            enqueueSnackbar('Failed to mark all notifications as read', { 
                variant: 'error' 
            });
        }
    };

    const handleWorkerSelect = (worker) => {
        setSelectedWorker(worker);
        setWorkerDetailsOpen(true);
    };

    const handleJobStatusUpdate = async (jobId, newStatus) => {
        try {
            await dispatch(updateJobStatus({ jobId, status: newStatus }));
            enqueueSnackbar('Job status updated successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Failed to update job status', { variant: 'error' });
        }
    };

    const dashboardTabs = [
        { id: 'overview', label: 'Overview', icon: <ViewModuleIcon fontSize="small" /> },
        { id: 'analytics', label: 'Analytics', icon: <BarChartIcon fontSize="small" /> },
        { id: 'calendar', label: 'Calendar', icon: <CalendarMonthIcon fontSize="small" /> },
        { id: 'workers', label: 'Workers', icon: <PeopleAltIcon fontSize="small" /> },
    ];

    const renderOverview = () => (
        <Container maxWidth="xl">
            <Suspense fallback={<CircularProgress />}>
                <ErrorBoundary>
                    <WelcomeSection />
                </ErrorBoundary>
            </Suspense>

            <Box sx={{ mb: 4 }}>
                <QuickActions actions={quickActions} />
            </Box>

            <Box 
                sx={{ 
                    mb: 4, 
                    display: 'flex', 
                    justifyContent: { xs: 'flex-start', md: 'center' },
                    overflowX: 'auto',
                    pb: 1,
                    '&::-webkit-scrollbar': {
                        height: '6px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                        borderRadius: '10px',
                    },
                }}
            >
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {dashboardTabs.map((tab) => (
                        <StyledTab
                            key={tab.id}
                            active={selectedView === tab.id}
                            onClick={() => setSelectedView(tab.id)}
                            component={motion.div}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {tab.icon}
                            {tab.label}
                        </StyledTab>
                    ))}
                </Box>
            </Box>

            <Grid container spacing={4}>
                <Grid item xs={12}>
                    <DashboardCard>
                        <Suspense fallback={<CircularProgress />}>
                            <ErrorBoundary>
                                <JobMetrics metrics={dashboardData?.metrics} />
                            </ErrorBoundary>
                        </Suspense>
                    </DashboardCard>
                </Grid>

                <Grid item xs={12} md={8}>
                    <DashboardCard title="Recent Jobs">
                        <Suspense fallback={<CircularProgress />}>
                            <ErrorBoundary>
                                <RecentJobsList 
                                    jobs={dashboardData?.recentJobs || []}
                                    onStatusUpdate={handleJobStatusUpdate}
                                />
                            </ErrorBoundary>
                        </Suspense>
                    </DashboardCard>
                </Grid>

                <Grid item xs={12} md={4}>
                    <DashboardCard title="Active Workers">
                        <Suspense fallback={<CircularProgress />}>
                            <ErrorBoundary>
                                <ActiveWorkersList 
                                    workers={dashboardData?.workers || []} 
                                />
                            </ErrorBoundary>
                        </Suspense>
                    </DashboardCard>
                </Grid>

                <Grid item xs={12}>
                    <DashboardCard title="Upcoming Events">
                        <Suspense fallback={<CircularProgress />}>
                            <ErrorBoundary>
                                <DashboardCalendar 
                                    events={dashboardData?.events || []} 
                                />
                            </ErrorBoundary>
                        </Suspense>
                    </DashboardCard>
                </Grid>
            </Grid>
        </Container>
    );

    const renderContent = () => {
        switch (selectedView) {
            case 'overview':
                return renderOverview();
            case 'workers':
                return <WorkerManagement />;
            case 'analytics':
                return <AnalyticsDashboard />;
            case 'calendar':
                return <DashboardCalendar events={dashboardData?.events} />;
            default:
                return renderOverview();
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
            {isMobile ? (
                <Drawer
                    anchor="left"
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                >
                    <DashboardNavigation 
                        selectedView={selectedView}
                        onViewChange={(view) => {
                            setSelectedView(view);
                            setDrawerOpen(false);
                        }}
                    />
                </Drawer>
            ) : (
                <Box sx={{ width: 280, flexShrink: 0 }}>
                    <DashboardNavigation 
                        selectedView={selectedView}
                        onViewChange={setSelectedView}
                    />
                </Box>
            )}

            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1, 
                    p: { xs: 2, md: 4 }, 
                    width: { sm: `calc(100% - 280px)` },
                    backgroundColor: alpha(theme.palette.background.default, 0.8),
                    backgroundImage: `
                        radial-gradient(at 90% 0%, ${alpha(theme.palette.primary.light, 0.05)} 0px, transparent 50%),
                        radial-gradient(at 10% 90%, ${alpha(theme.palette.secondary.light, 0.05)} 0px, transparent 50%)
                    `,
                }}
            >
                <Box 
                    sx={{ 
                        mb: 3, 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                        pb: 2,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {isMobile && (
                            <IconButton 
                                onClick={() => setDrawerOpen(true)}
                                sx={{ 
                                    mr: 1.5,
                                    color: theme.palette.text.primary,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                    }
                                }}
                            >
                                <MenuIcon />
                            </IconButton>
                        )}
                        <Typography 
                            variant="h4" 
                            component="h1" 
                            sx={{ 
                                fontWeight: 700,
                                backgroundImage: `linear-gradient(90deg, ${theme.palette.text.primary}, ${alpha(theme.palette.primary.main, 0.8)})`,
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                color: 'transparent',
                            }}
                        >
                            Dashboard
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Refresh dashboard">
                            <IconButton 
                                onClick={handleRefresh} 
                                disabled={isRefreshing}
                                sx={{ 
                                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                    color: theme.palette.text.primary,
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                    }
                                }}
                            >
                                {isRefreshing ? (
                                    <CircularProgress size={20} color="inherit" />
                                ) : (
                                    <RefreshIcon />
                                )}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Notifications">
                            <IconButton 
                                onClick={() => setNotificationsPanelOpen(true)}
                                sx={{ 
                                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                    color: theme.palette.text.primary,
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                    }
                                }}
                            >
                                <Badge 
                                    badgeContent={unreadNotifications} 
                                    color="error"
                                    sx={{ 
                                        '& .MuiBadge-badge': { 
                                            fontWeight: 'bold',
                                            minWidth: '18px',
                                            height: '18px',
                                        } 
                                    }}
                                >
                                    <NotificationsIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedView}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </Box>

            <Suspense fallback={<LoadingFallback />}>
                <CreateJobDialog 
                    open={createJobDialogOpen} 
                    onClose={() => setCreateJobDialogOpen(false)} 
                />
            </Suspense>

            <CreateEventDialog
                open={createEventDialogOpen}
                onClose={() => setCreateEventDialogOpen(false)}
                onSuccess={() => {
                    setCreateEventDialogOpen(false);
                    handleRefresh();
                }}
            />

            <SwipeableDrawer
                anchor="right"
                open={notificationsPanelOpen}
                onClose={() => setNotificationsPanelOpen(false)}
                onOpen={() => setNotificationsPanelOpen(true)}
                PaperProps={{
                    sx: {
                        width: { xs: '100%', sm: 400 },
                        borderRadius: { xs: 0, sm: '16px 0 0 16px' },
                        boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
                    }
                }}
            >
                <Suspense fallback={
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                }>
                    <NotificationsPanel
                        notifications={notifications}
                        onClose={() => setNotificationsPanelOpen(false)}
                        onMarkAllRead={handleMarkAllRead}
                    />
                </Suspense>
            </SwipeableDrawer>

            <SwipeableDrawer
                anchor="bottom"
                open={workerDetailsOpen}
                onClose={() => setWorkerDetailsOpen(false)}
                onOpen={() => {}}
                PaperProps={{
                    sx: {
                        borderRadius: '24px 24px 0 0',
                        maxHeight: '80vh',
                    }
                }}
            >
                {selectedWorker && (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>{selectedWorker.name}</Typography>
                        <Typography variant="body1" color="text.secondary">{selectedWorker.profession}</Typography>
                        {/* Add more worker details here */}
                    </Box>
                )}
            </SwipeableDrawer>

            <Fab
                color="primary"
                aria-label="add"
                sx={{ 
                    position: 'fixed', 
                    bottom: 24, 
                    right: 24,
                    boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                }}
                onClick={() => setCreateJobDialogOpen(true)}
            >
                <AddIcon />
            </Fab>
        </Box>
    );
}

// Update the theme customization
const customTheme = {
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '16px',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)'
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                    textTransform: 'none'
                }
            }
        }
    }
};

// Add prop validation
CreateJobDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default HirerDashboard;