import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

function AdminDashboard() {
    const user = JSON.parse(localStorage.getItem('user'));

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Admin Dashboard
                </Typography>
                <Typography variant="body1">
                    Welcome, {user?.username || 'Admin'}!
                </Typography>
            </Paper>
        </Box>
    );
}

export default AdminDashboard; 