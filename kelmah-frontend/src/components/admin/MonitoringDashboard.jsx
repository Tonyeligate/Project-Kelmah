import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { api } from '../../services/api';

function MonitoringDashboard() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await api.get('/api/health');
                setMetrics(response);
            } catch (error) {
                console.error('Failed to fetch metrics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                System Monitoring
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Request Metrics</Typography>
                            <Typography>
                                Total Requests: {metrics.metrics.requests}
                            </Typography>
                            <Typography>
                                Error Rate: {(metrics.metrics.errors / metrics.metrics.requests * 100).toFixed(2)}%
                            </Typography>
                            <Typography>
                                Avg Response Time: {metrics.metrics.averageResponseTime.toFixed(2)}ms
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">System Health</Typography>
                            <Typography>
                                Status: {metrics.status}
                            </Typography>
                            <Typography>
                                Uptime: {Math.floor(metrics.uptime / 3600)} hours
                            </Typography>
                            <Typography>
                                Active Users: {metrics.metrics.activeUsers}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default MonitoringDashboard; 