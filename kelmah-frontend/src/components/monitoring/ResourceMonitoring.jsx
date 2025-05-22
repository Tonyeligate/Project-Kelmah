import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    Grid,
    CircularProgress,
    Alert 
} from '@mui/material';
import { Storage, Memory, Speed } from '@mui/icons-material';

export function ResourceMonitoring() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading metrics
        const loadMetrics = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                setMetrics({
                    cpu: 45,
                    memory: 60,
                    disk: 30
                });
            } catch (error) {
                console.error('Failed to load metrics:', error);
            } finally {
                setLoading(false);
            }
        };

        loadMetrics();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Storage /> Resource Monitoring
            </Typography>

            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Speed color="primary" sx={{ fontSize: 40 }} />
                        <Typography variant="h6">CPU Usage</Typography>
                        <Typography variant="h4" color="primary">{metrics?.cpu}%</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Memory color="secondary" sx={{ fontSize: 40 }} />
                        <Typography variant="h6">Memory Usage</Typography>
                        <Typography variant="h4" color="secondary">{metrics?.memory}%</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Storage color="success" sx={{ fontSize: 40 }} />
                        <Typography variant="h6">Disk Usage</Typography>
                        <Typography variant="h4" color="success.main">{metrics?.disk}%</Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Paper>
    );
} 