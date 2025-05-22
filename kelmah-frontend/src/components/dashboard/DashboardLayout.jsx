import React from 'react';
import { Box, Container } from '@mui/material';
import DashboardHeader from './DashboardHeader';

function DashboardLayout({ children }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <DashboardHeader />
            <Container maxWidth="lg" sx={{ flex: 1, py: 3 }}>
                {children}
            </Container>
        </Box>
    );
}

export default DashboardLayout; 