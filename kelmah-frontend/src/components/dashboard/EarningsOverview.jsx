import React from 'react';
import { Paper, Typography, Box, Grid, Divider } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AttachMoney, TrendingUp, AccountBalance } from '@mui/icons-material';

function EarningsOverview({ earnings }) {
    const earningsSummary = [
        {
            title: "Available Balance",
            value: earnings?.availableBalance || 0,
            icon: <AccountBalance color="primary" />,
            change: "+12%"
        },
        {
            title: "Pending Payments",
            value: earnings?.pendingPayments || 0,
            icon: <AttachMoney color="warning" />,
            change: "Pending"
        },
        {
            title: "Monthly Earnings",
            value: earnings?.monthlyEarnings || 0,
            icon: <TrendingUp color="success" />,
            change: "+8%"
        }
    ];

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Earnings Overview
            </Typography>

            <Grid container spacing={3} sx={{ mb: 3 }}>
                {earningsSummary.map((item, index) => (
                    <Grid item xs={12} md={4} key={index}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ 
                                mr: 2, 
                                bgcolor: 'action.hover', 
                                p: 1, 
                                borderRadius: 1 
                            }}>
                                {item.icon}
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    {item.title}
                                </Typography>
                                <Typography variant="h6">
                                    ${item.value.toFixed(2)}
                                </Typography>
                                <Typography 
                                    variant="caption" 
                                    color={item.change.includes('+') ? 'success.main' : 'text.secondary'}
                                >
                                    {item.change}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                ))}
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ height: 300, mt: 3 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={earnings?.monthlyData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="amount" fill="#1976d2" />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
}

export default EarningsOverview; 