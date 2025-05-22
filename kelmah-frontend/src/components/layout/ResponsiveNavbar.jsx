import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Button,
    Drawer,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Box,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    Menu as MenuIcon,
    Home,
    Work,
    Person,
    Message,
    Notifications,
    Close,
    Dashboard
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ResponsiveNavbar = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [drawerOpen, setDrawerOpen] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const menuItems = [
        { text: 'Home', icon: <Home />, path: '/' },
        { text: 'Jobs', icon: <Work />, path: '/jobs' },
        { text: 'Profile', icon: <Person />, path: '/profile' },
        { text: 'Messages', icon: <Message />, path: '/messages' },
        { text: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard', role: 'admin' }
    ];

    const navItems = [
        { path: '/', label: 'Home' },
        { path: '/jobs', label: 'Find Jobs' },
        { path: '/workers', label: 'Find Workers' },
        { path: '/pricing', label: 'Pricing' },
        { path: '/about', label: 'About Us' },
    ];

    const handleNavigation = (path) => {
        navigate(path);
        if (isMobile) {
            setDrawerOpen(false);
        }
    };

    const renderDrawer = () => (
        <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
        >
            <Box sx={{ width: 250 }}>
                <Box sx={{ 
                    p: 2, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="h6">Menu</Typography>
                    <IconButton onClick={() => setDrawerOpen(false)}>
                        <Close />
                    </IconButton>
                </Box>
                <List>
                    {menuItems.map((item) => (
                        <ListItem 
                            button 
                            key={item.text}
                            onClick={() => handleNavigation(item.path)}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Drawer>
    );

    return (
        <>
            <AppBar position="fixed">
                <Toolbar>
                    {isMobile ? (
                        <>
                            <IconButton
                                color="inherit"
                                edge="start"
                                onClick={() => setDrawerOpen(true)}
                            >
                                <MenuIcon />
                            </IconButton>
                            <Typography 
                                variant="h6" 
                                sx={{ flexGrow: 1, ml: 2 }}
                            >
                                Kelmah
                            </Typography>
                        </>
                    ) : (
                        <>
                            <Typography 
                                variant="h6" 
                                sx={{ flexGrow: 1 }}
                            >
                                Kelmah
                            </Typography>
                            {menuItems.map((item) => (
                                <Button
                                    key={item.text}
                                    color="inherit"
                                    startIcon={item.icon}
                                    onClick={() => handleNavigation(item.path)}
                                    sx={{ mx: 1 }}
                                >
                                    {item.text}
                                </Button>
                            ))}
                        </>
                    )}
                    {user && (
                        <IconButton color="inherit">
                            <Notifications />
                        </IconButton>
                    )}
                </Toolbar>
            </AppBar>
            {renderDrawer()}
        </>
    );
};

export default ResponsiveNavbar;