import React from 'react';
import { 
    Menu, MenuItem, ListItemIcon, ListItemText, 
    Divider, Avatar, Box, Typography 
} from '@mui/material';
import { 
    Dashboard, Person, Settings, 
    Logout, WorkOutline 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

function ProfileMenu({ anchorEl, open, onClose }) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);

    const handleMenuClick = (path) => {
        navigate(path);
        onClose();
    };

    const handleLogout = () => {
        dispatch(logout());
        onClose();
    };

    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            PaperProps={{
                elevation: 0,
                sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    width: 220,
                    '& .MuiAvatar-root': {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                    }
                },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
            <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle1" noWrap>
                    {user?.name || 'User'}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                    {user?.email || 'user@example.com'}
                </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => handleMenuClick('/dashboard')}>
                <ListItemIcon>
                    <Dashboard fontSize="small" />
                </ListItemIcon>
                <ListItemText>Dashboard</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleMenuClick('/profile')}>
                <ListItemIcon>
                    <Person fontSize="small" />
                </ListItemIcon>
                <ListItemText>Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleMenuClick('/settings')}>
                <ListItemIcon>
                    <Settings fontSize="small" />
                </ListItemIcon>
                <ListItemText>Settings</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                    <Logout fontSize="small" />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
            </MenuItem>
        </Menu>
    );
}

export default ProfileMenu; 