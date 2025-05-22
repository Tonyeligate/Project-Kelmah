import React from 'react';
import { Grid, Box, Typography } from '@mui/material';

function ServiceList({ services }) {
    return (
        <Box>
            <Grid container spacing={3}>
                {services.map(service => (
                    <Grid item xs={12} sm={6} md={4} key={service.id}>
                        {/* Service card component here */}
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

export default ServiceList; 