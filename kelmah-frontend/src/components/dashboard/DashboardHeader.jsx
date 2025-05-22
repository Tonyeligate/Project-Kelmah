import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Badge,
    Menu,
    MenuItem,
    Box,
    Avatar,
    Divider,
    ListItemIcon,
    Button
} from '@mui/material';
import {
    Notifications,
    BookmarkBorder,
    Settings,
    Logout,
    Person,
    Work,
    Message,
    Dashboard
} from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice';

function DashboardHeader() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);
    
    const [anchorEl, setAnchorEl] = useState(null);
    const [notificationAnchor, setNotificationAnchor] = useState(null);
    
    const handleProfileMenu = (event) => setAnchorEl(event.currentTarget);
    const handleNotificationMenu = (event) => setNotificationAnchor(event.currentTarget);
    
    const handleClose = () => {
        setAnchorEl(null);
        setNotificationAnchor(null);
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <AppBar position="static" color="default" elevation={1}>
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    {user?.role === 'hirer' ? 'Hirer Dashboard' : 'Worker Dashboard'}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Quick Actions */}
                    {user?.role === 'worker' ? (
                        <Button
                            startIcon={<Work />}
                            onClick={() => navigate('/find-work')}
                            color="primary"
                            variant="contained"
                            size="small"
                        >
                            Find Work
                        </Button>
                    ) : (
                        <Button
                            startIcon={<Work />}
                            onClick={() => navigate('/post-job')}
                            color="primary"
                            variant="contained"
                            size="small"
                        >
                            Post Job
                        </Button>
                    )}

                    {/* Messages */}
                    <IconButton onClick={() => navigate('/messages')}>
                        <Badge badgeContent={3} color="error">
                            <Message />
                        </Badge>
                    </IconButton>

                    {/* Notifications */}
                    <IconButton onClick={handleNotificationMenu}>
                        <Badge badgeContent={5} color="error">
                            <Notifications />
                        </Badge>
                    </IconButton>

                    {/* Saved Jobs */}
                    <IconButton onClick={() => navigate('/saved-jobs')}>
                        <Badge badgeContent={2} color="primary">
                            <BookmarkBorder />
                        </Badge>
                    </IconButton>

                    {/* Profile Menu */}
                    <IconButton onClick={handleProfileMenu}>
                        <Avatar 
                            alt={user?.username} 
                            src={user?.avatar}
                            sx={{ width: 32, height: 32 }}
                        />
                    </IconButton>
                </Box>

                {/* Profile Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    onClick={handleClose}
                >
                    <MenuItem onClick={() => navigate('/dashboard')}>
                        <ListItemIcon><Dashboard fontSize="small" /></ListItemIcon>
                        Dashboard
                    </MenuItem>
                    <MenuItem onClick={() => navigate('/profile')}>
                        <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                        Profile
                    </MenuItem>
                    <MenuItem onClick={() => navigate('/settings')}>
                        <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
                        Settings
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                        <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
                        Logout
                    </MenuItem>
                </Menu>

                {/* Notifications Menu */}
                <Menu
                    anchorEl={notificationAnchor}
                    open={Boolean(notificationAnchor)}
                    onClose={handleClose}
                    onClick={handleClose}
                    PaperProps={{
                        sx: { width: 320, maxHeight: 400 }
                    }}
                >
                    <MenuItem>
                        <Typography variant="subtitle2">
                            New job match: "React Developer"
                        </Typography>
                    </MenuItem>
                    <MenuItem>
                        <Typography variant="subtitle2">
                            Payment received: $500
                        </Typography>
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={() => navigate('/notifications')}>
                        <Typography color="primary">View All Notifications</Typography>
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );
}

export default DashboardHeader; 