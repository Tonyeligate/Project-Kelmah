import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

function PerformanceChart({ data = [] }) {
    return (
        <Paper sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
                Performance Overview
            </Typography>
            <Box sx={{ width: '100%', height: '90%' }}>
                <ResponsiveContainer>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                            type="monotone" 
                            dataKey="earnings" 
                            stroke="#8884d8" 
                            name="Earnings"
                        />
                        <Line 
                            type="monotone" 
                            dataKey="jobs" 
                            stroke="#82ca9d" 
                            name="Completed Jobs"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
}

export default PerformanceChart; 