import React from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Typography,
    Divider,
    Badge,
    Avatar,
    alpha,
    useTheme,
    Tooltip
} from '@mui/material';
import {
    Dashboard,
    Work,
    Group,
    Assessment,
    Settings,
    Help,
    ExitToApp,
    Circle as CircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';

const StyledListItemButton = styled(ListItemButton)(({ theme, selected }) => ({
    borderRadius: '10px',
    margin: '4px 8px',
    padding: '10px 16px',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: selected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
    '&:hover': {
        backgroundColor: selected ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.primary.main, 0.04),
        transform: 'translateX(4px)',
    },
    '&::before': selected ? {
        content: '""',
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '4px',
        height: '60%',
        backgroundColor: theme.palette.primary.main,
        borderRadius: '0 4px 4px 0'
    } : {}
}));

const IconWrapper = styled(Box)(({ theme, selected }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: selected ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
    color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
    transition: 'all 0.3s ease',
}));

const navigationItems = [
    { id: 'overview', label: 'Overview', icon: Dashboard, tooltip: 'Dashboard overview' },
    { id: 'jobs', label: 'Jobs Management', icon: Work, tooltip: 'Manage your job postings' },
    { id: 'workers', label: 'Worker Directory', icon: Group, tooltip: 'Browse and manage workers' },
    { id: 'analytics', label: 'Analytics', icon: Assessment, tooltip: 'Review performance metrics' }
];

const bottomNavigationItems = [
    { id: 'settings', label: 'Settings', icon: Settings, tooltip: 'Account settings' },
    { id: 'help', label: 'Help & Support', icon: Help, tooltip: 'Get help and support' },
    { id: 'logout', label: 'Logout', icon: ExitToApp, tooltip: 'Sign out from your account' }
];

function DashboardNavigation({ selectedView, onViewChange }) {
    const navigate = useNavigate();
    const theme = useTheme();
    const notifications = useSelector(state => state.notifications.unreadCount);
    const user = useSelector(state => state.auth.user);

    const handleNavigation = (id) => {
        if (bottomNavigationItems.find(item => item.id === id)) {
            switch (id) {
                case 'settings':
                    navigate('/settings');
                    break;
                case 'help':
                    navigate('/support');
                    break;
                case 'logout':
                    // Handle logout
                    break;
                default:
                    break;
            }
        } else {
            onViewChange(id);
        }
    };

    // Animation variants for staggered list items
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: {
                staggerChildren: 0.07,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <Box 
            sx={{ 
                width: 260, 
                bgcolor: 'background.paper', 
                height: '100%', 
                borderRight: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* User Profile Section */}
            <Box 
                sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    background: `linear-gradient(to bottom, ${alpha(theme.palette.primary.light, 0.1)}, transparent)`,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    mb: 2 
                }}
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                            <Box
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    bgcolor: 'success.main',
                                    border: `2px solid ${theme.palette.background.paper}`
                                }}
                            />
                        }
                    >
                        <Avatar
                            src={user?.avatar}
                            alt={user?.name || 'User'}
                            sx={{ 
                                width: 70, 
                                height: 70, 
                                mx: 'auto', 
                                mb: 1.5,
                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                                border: `3px solid ${theme.palette.background.paper}`
                            }}
                        >
                            {!user?.avatar && (user?.name?.[0] || 'U')}
                        </Avatar>
                    </Badge>
                    <Typography variant="h6" fontWeight="600" sx={{ mb: 0.5 }}>
                        {user?.name || 'Welcome back!'}
                    </Typography>
                    <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '30px',
                            display: 'inline-block'
                        }}
                    >
                        {user?.role || 'Hirer'} Account
                    </Typography>
                </motion.div>
            </Box>

            {/* Main Navigation */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
                <Typography 
                    variant="overline" 
                    sx={{ 
                        pl: 3, 
                        mb: 1, 
                        display: 'block',
                        color: 'text.secondary',
                        letterSpacing: '1px',
                        fontWeight: 600,
                    }}
                >
                    Main Navigation
                </Typography>
                <List 
                    component={motion.ul}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    sx={{ mb: 2 }}
                >
                    {navigationItems.map(({ id, label, icon: Icon, tooltip }) => (
                        <motion.li key={id} variants={itemVariants}>
                            <Tooltip title={tooltip} placement="right" arrow>
                                <ListItem disablePadding>
                                    <StyledListItemButton
                                        selected={selectedView === id}
                                        onClick={() => handleNavigation(id)}
                                    >
                                        <IconWrapper selected={selectedView === id}>
                                            <Icon sx={{ fontSize: 23 }} />
                                        </IconWrapper>
                                        <ListItemText 
                                            primary={label} 
                                            primaryTypographyProps={{ 
                                                fontWeight: selectedView === id ? 600 : 500,
                                                variant: 'body2',
                                                color: selectedView === id ? 'primary.main' : 'text.primary'
                                            }}
                                            sx={{ ml: 1 }} 
                                        />
                                        {id === 'jobs' && notifications > 0 && (
                                            <Badge 
                                                badgeContent={notifications} 
                                                color="error"
                                                sx={{ '& .MuiBadge-badge': { fontWeight: 'bold' } }} 
                                            />
                                        )}
                                    </StyledListItemButton>
                                </ListItem>
                            </Tooltip>
                        </motion.li>
                    ))}
                </List>
            </Box>

            {/* Bottom Navigation */}
            <Box sx={{ px: 1, pb: 2 }}>
                <Divider sx={{ my: 2, opacity: 0.6 }} />
                <Typography 
                    variant="overline" 
                    sx={{ 
                        pl: 3, 
                        mb: 1, 
                        display: 'block',
                        color: 'text.secondary',
                        letterSpacing: '1px',
                        fontWeight: 600,
                    }}
                >
                    Account
                </Typography>
                <List component={motion.ul} variants={containerVariants} initial="hidden" animate="visible">
                    {bottomNavigationItems.map(({ id, label, icon: Icon, tooltip }) => (
                        <motion.li key={id} variants={itemVariants}>
                            <Tooltip title={tooltip} placement="right" arrow>
                                <ListItem disablePadding>
                                    <StyledListItemButton onClick={() => handleNavigation(id)}>
                                        <IconWrapper>
                                            <Icon sx={{ fontSize: 22 }} />
                                        </IconWrapper>
                                        <ListItemText 
                                            primary={label} 
                                            primaryTypographyProps={{ 
                                                variant: 'body2',
                                                color: id === 'logout' ? 'error.main' : 'text.primary'
                                            }}
                                            sx={{ ml: 1 }} 
                                        />
                                    </StyledListItemButton>
                                </ListItem>
                            </Tooltip>
                        </motion.li>
                    ))}
                </List>
            </Box>
        </Box>
    );
}

export default DashboardNavigation; 