import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    CircularProgress
} from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

export default function AnalyticsDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        userActivity: [],
        learningProgress: [],
        dailyStats: {
            activeUsers: 0,
            completedLessons: 0,
            averageScore: 0
        }
    });

    useEffect(() => {
        // Simulate loading data
        const loadData = async () => {
            try {
                // This is sample data - replace with actual API calls
                const sampleData = {
                    userActivity: [
                        { date: '2024-03-15', users: 120 },
                        { date: '2024-03-16', users: 150 },
                        { date: '2024-03-17', users: 180 },
                        { date: '2024-03-18', users: 200 },
                        { date: '2024-03-19', users: 220 }
                    ],
                    learningProgress: [
                        { month: 'Jan', completed: 65 },
                        { month: 'Feb', completed: 85 },
                        { month: 'Mar', completed: 110 }
                    ],
                    dailyStats: {
                        activeUsers: 245,
                        completedLessons: 567,
                        averageScore: 85
                    }
                };

                setData(sampleData);
            } catch (error) {
                console.error('Failed to load analytics data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
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
            <Typography variant="h5" gutterBottom>
                Analytics Dashboard
            </Typography>

            <Grid container spacing={3}>
                {/* Daily Stats Cards */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Active Users Today
                            </Typography>
                            <Typography variant="h4">
                                {data.dailyStats.activeUsers}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Completed Lessons
                            </Typography>
                            <Typography variant="h4">
                                {data.dailyStats.completedLessons}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Average Score
                            </Typography>
                            <Typography variant="h4">
                                {data.dailyStats.averageScore}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* User Activity Chart */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            User Activity
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.userActivity}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="users"
                                    stroke="#8884d8"
                                    name="Active Users"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Learning Progress Chart */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Learning Progress
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.learningProgress}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    dataKey="completed"
                                    fill="#82ca9d"
                                    name="Completed Lessons"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Paper>
    );
} 