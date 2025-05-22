import React from 'react';
import { Box, Paper, Tabs, Tab } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

function SettingsLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { label: 'Profile', path: '/profile' },
        { label: 'Market Profile', path: '/profile/market' },
        { label: 'Notifications', path: '/settings' },
        { label: 'Security', path: '/settings/security' }
    ];

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ mb: 3 }}>
                <Tabs 
                    value={tabs.findIndex(tab => tab.path === location.pathname)}
                    onChange={(_, index) => navigate(tabs[index].path)}
                >
                    {tabs.map(tab => (
                        <Tab key={tab.path} label={tab.label} />
                    ))}
                </Tabs>
            </Paper>
            {children}
        </Box>
    );
}

export default SettingsLayout; 