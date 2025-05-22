import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot
} from '@mui/lab';
import {
    Warning,
    CheckCircle,
    Error,
    TrendingUp,
    Schedule,
    Person,
    Payment
} from '@mui/icons-material';
import api from '../../api/axios';

function DisputeAnalysis({ disputeId }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalysis();
    }, [disputeId]);

    const fetchAnalysis = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/disputes/${disputeId}/analysis`);
            setAnalysis(response.data);
        } catch (error) {
            setError(error.response?.data?.message || 'Error loading analysis');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box>
            <Grid container spacing={3}>
                {/* Success Metrics */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Similar Cases Metrics
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Card>
                                    <CardContent>
                                        <Typography color="textSecondary" gutterBottom>
                                            Resolution Rate
                                        </Typography>
                                        <Typography variant="h4">
                                            {Math.round((analysis.successMetrics.resolved_cases / 
                                                analysis.successMetrics.total_cases) * 100)}%
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6}>
                                <Card>
                                    <CardContent>
                                        <Typography color="textSecondary" gutterBottom>
                                            Avg Resolution Time
                                        </Typography>
                                        <Typography variant="h4">
                                            {analysis.successMetrics.avg_resolution_time}h
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Recommendations */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Recommendations
                        </Typography>
                        <List>
                            {analysis.recommendations.map((rec, index) => (
                                <ListItem key={index}>
                                    <ListItemIcon>
                                        {rec.type === 'warning' && <Warning color="warning" />}
                                        {rec.type === 'priority' && <Error color="error" />}
                                        {rec.type === 'alert' && <Warning color="error" />}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={rec.message}
                                        secondary={rec.action}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                {/* Similar Cases Timeline */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Similar Cases History
                        </Typography>
                        <Timeline>
                            {analysis.similarDisputes.map((dispute, index) => (
                                <TimelineItem key={dispute.id}>
                                    <TimelineSeparator>
                                        <TimelineDot color={
                                            dispute.status === 'resolved' ? 'success' : 
                                            dispute.status === 'escalated' ? 'error' : 'grey'
                                        } />
                                        {index < analysis.similarDisputes.length - 1 && (
                                            <TimelineConnector />
                                        )}
                                    </TimelineSeparator>
                                    <TimelineContent>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2">
                                                Dispute #{dispute.id}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Amount: KES {dispute.amount.toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Resolution Time: {dispute.resolution_time}h
                                            </Typography>
                                            <Box sx={{ mt: 1 }}>
                                                <Chip
                                                    size="small"
                                                    label={dispute.status}
                                                    color={
                                                        dispute.status === 'resolved' ? 'success' :
                                                        dispute.status === 'escalated' ? 'error' : 'default'
                                                    }
                                                />
                                            </Box>
                                        </Box>
                                    </TimelineContent>
                                </TimelineItem>
                            ))}
                        </Timeline>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default DisputeAnalysis; 