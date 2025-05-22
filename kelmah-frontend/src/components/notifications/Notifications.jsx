import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

function Notifications() {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Notifications
                </Typography>
                <Typography>
                    Notifications feature coming soon...
                </Typography>
            </Paper>
        </Container>
    );
}

export default Notifications; 