import React from 'react';
import { Paper, Typography } from '@mui/material';
import MapView from '../maps/MapView';

const DashboardMap = () => {
    // Example coordinates - replace with actual data
    const defaultLocation = {
        lat: 40.7128,
        lng: -74.0060
    };

    const markers = [
        {
            position: defaultLocation,
            title: "Current Location"
        }
    ];

    return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Location Overview
            </Typography>
            <MapView 
                center={defaultLocation}
                markers={markers}
                zoom={12}
            />
        </Paper>
    );
};

export default DashboardMap; 