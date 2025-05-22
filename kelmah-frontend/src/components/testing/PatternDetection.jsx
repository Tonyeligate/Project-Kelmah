import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Alert,
    Chip,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Collapse,
    LinearProgress
} from '@mui/material';
import {
    Warning,
    Error,
    ExpandMore,
    ExpandLess,
    Timeline,
    Speed,
    BugReport
} from '@mui/icons-material';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

function PatternDetection({ workflowId }) {
    const [patterns, setPatterns] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({});
    const [realTimeData, setRealTimeData] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        loadPatterns();
        initializeWebSocket();

        return () => {
            if (socket) socket.close();
        };
    }, [workflowId]);

    const loadPatterns = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/workflows/${workflowId}/patterns`);
            setPatterns(response.data);
        } catch (error) {
            console.error('Error loading patterns:', error);
        } finally {
            setLoading(false);
        }
    };

    const initializeWebSocket = () => {
        const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/workflows/${workflowId}/monitor`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setRealTimeData(prev => [...prev.slice(-29), data]);
        };

        setSocket(ws);
    };

    if (loading) return <LinearProgress />;

    return (
        <Box>
            <Grid container spacing={3}>
                {/* Real-time Monitoring */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Real-time Monitoring
                        </Typography>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={realTimeData}>
                                <XAxis dataKey="timestamp" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="execution_time" stroke="#8884d8" />
                                <Line type="monotone" dataKey="error_rate" stroke="#ff4444" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Patterns */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Detected Patterns
                            </Typography>
                            <List>
                                {patterns?.patterns.map((pattern, index) => (
                                    <ListItem key={index}>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {pattern.severity === 'error' ? <Error color="error" /> : <Warning color="warning" />}
                                                    {pattern.title}
                                                </Box>
                                            }
                                            secondary={pattern.description}
                                        />
                                        <IconButton onClick={() => setExpanded(prev => ({ ...prev, [index]: !prev[index] }))}>
                                            {expanded[index] ? <ExpandLess /> : <ExpandMore />}
                                        </IconButton>
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Anomalies */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Detected Anomalies
                            </Typography>
                            {patterns?.anomalies.map((anomaly, index) => (
                                <Alert 
                                    key={index}
                                    severity={anomaly.severity}
                                    sx={{ mb: 1 }}
                                >
                                    <Typography variant="subtitle2">
                                        {anomaly.metric} Anomaly
                                    </Typography>
                                    <Typography variant="body2">
                                        Value: {anomaly.value} (z-score: {anomaly.zScore.toFixed(2)})
                                    </Typography>
                                </Alert>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Correlations */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Metric Correlations
                        </Typography>
                        <Grid container spacing={2}>
                            {Object.entries(patterns?.correlations || {}).map(([metrics, correlation]) => (
                                <Grid item xs={12} md={4} key={metrics}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="subtitle2" gutterBottom>
                                                {metrics.replace('_', ' vs ')}
                                            </Typography>
                                            <Typography variant="h4" color={correlation > 0 ? 'success.main' : 'error.main'}>
                                                {correlation.toFixed(2)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default PatternDetection; 