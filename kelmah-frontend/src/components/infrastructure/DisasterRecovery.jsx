import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineOppositeContent
} from '@mui/material';
import {
    Warning,
    Refresh,
    Save,
    PlayArrow,
    Stop,
    History,
    Settings,
    CloudSync,
    Schedule,
    Assessment,
    Check
} from '@mui/icons-material';

function DisasterRecovery({ templateId }) {
    const [recoveryPlans, setRecoveryPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [drTests, setDrTests] = useState([]);
    const [activeRecovery, setActiveRecovery] = useState(null);
    const [planDialog, setPlanDialog] = useState(false);

    useEffect(() => {
        loadDRData();
    }, [templateId]);

    const loadDRData = async () => {
        try {
            const [plansRes, testsRes, activeRes] = await Promise.all([
                api.get(`/api/templates/${templateId}/recovery-plans`),
                api.get(`/api/templates/${templateId}/dr-tests`),
                api.get(`/api/templates/${templateId}/active-recovery`)
            ]);
            setRecoveryPlans(plansRes.data);
            setDrTests(testsRes.data);
            setActiveRecovery(activeRes.data);
        } catch (error) {
            console.error('Failed to load DR data:', error);
        }
    };

    const initiateRecovery = async (planId) => {
        try {
            await api.post(`/api/recovery-plans/${planId}/execute`);
            await loadDRData();
        } catch (error) {
            console.error('Failed to initiate recovery:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Disaster Recovery</Typography>
                <Button
                    startIcon={<Save />}
                    onClick={() => {
                        setSelectedPlan(null);
                        setPlanDialog(true);
                    }}
                >
                    New Recovery Plan
                </Button>
            </Box>

            {activeRecovery && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    Active Recovery in Progress - {activeRecovery.plan.name}
                    <Button
                        size="small"
                        startIcon={<Stop />}
                        onClick={() => handleStopRecovery(activeRecovery.id)}
                        sx={{ ml: 2 }}
                    >
                        Stop Recovery
                    </Button>
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Recovery Plans */}
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                        Recovery Plans
                    </Typography>
                    {recoveryPlans.map(plan => (
                        <Paper
                            key={plan.id}
                            sx={{ p: 2, mb: 2, border: 1, borderColor: 'divider' }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="subtitle1">
                                    {plan.name}
                                </Typography>
                                <Chip
                                    size="small"
                                    label={plan.status}
                                    color={getStatusColor(plan.status)}
                                />
                            </Box>

                            <Typography color="textSecondary" paragraph>
                                {plan.description}
                            </Typography>

                            <Stepper orientation="vertical">
                                {plan.steps.map((step, index) => (
                                    <Step key={index} active={true}>
                                        <StepLabel>{step.name}</StepLabel>
                                        <StepContent>
                                            <Typography variant="body2">
                                                {step.description}
                                            </Typography>
                                        </StepContent>
                                    </Step>
                                ))}
                            </Stepper>

                            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                <Button
                                    size="small"
                                    startIcon={<PlayArrow />}
                                    onClick={() => initiateRecovery(plan.id)}
                                >
                                    Execute Plan
                                </Button>
                                <Button
                                    size="small"
                                    startIcon={<History />}
                                    onClick={() => setSelectedPlan(plan)}
                                >
                                    View History
                                </Button>
                            </Box>
                        </Paper>
                    ))}
                </Grid>

                {/* DR Test Results */}
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                        DR Test Results
                    </Typography>
                    <Timeline>
                        {drTests.map((test, index) => (
                            <TimelineItem key={test.id}>
                                <TimelineOppositeContent color="textSecondary">
                                    {new Date(test.timestamp).toLocaleString()}
                                </TimelineOppositeContent>
                                <TimelineSeparator>
                                    <TimelineDot color={test.success ? 'success' : 'error'} />
                                    {index < drTests.length - 1 && <TimelineConnector />}
                                </TimelineSeparator>
                                <TimelineContent>
                                    <Typography variant="subtitle2">
                                        {test.planName}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Duration: {test.duration}s
                                    </Typography>
                                    {!test.success && (
                                        <Alert severity="error" sx={{ mt: 1 }}>
                                            {test.errorMessage}
                                        </Alert>
                                    )}
                                </TimelineContent>
                            </TimelineItem>
                        ))}
                    </Timeline>
                </Grid>
            </Grid>
        </Paper>
    );
}

// Cost Optimization
function CostOptimization({ templateId }) {
    const [costMetrics, setCostMetrics] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [savings, setSavings] = useState(null);
    const [timeRange, setTimeRange] = useState('30d');
    const [optimizationStatus, setOptimizationStatus] = useState(null);

    useEffect(() => {
        loadCostData();
    }, [templateId, timeRange]);

    const loadCostData = async () => {
        try {
            const [metricsRes, recommendationsRes, savingsRes] = await Promise.all([
                api.get(`/api/templates/${templateId}/cost-metrics`, {
                    params: { timeRange }
                }),
                api.get(`/api/templates/${templateId}/cost-recommendations`),
                api.get(`/api/templates/${templateId}/cost-savings`)
            ]);
            setCostMetrics(metricsRes.data);
            setRecommendations(recommendationsRes.data);
            setSavings(savingsRes.data);
        } catch (error) {
            console.error('Failed to load cost data:', error);
        }
    };

    const applyOptimization = async (recommendationId) => {
        try {
            setOptimizationStatus('applying');
            await api.post(`/api/cost-recommendations/${recommendationId}/apply`);
            await loadCostData();
        } catch (error) {
            console.error('Failed to apply optimization:', error);
        } finally {
            setOptimizationStatus(null);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Cost Optimization</Typography>
                <FormControl size="small">
                    <InputLabel>Time Range</InputLabel>
                    <Select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        label="Time Range"
                    >
                        <MenuItem value="7d">Last 7 Days</MenuItem>
                        <MenuItem value="30d">Last 30 Days</MenuItem>
                        <MenuItem value="90d">Last 90 Days</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Grid container spacing={3}>
                {/* Cost Metrics */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                            ${costMetrics?.totalCost}
                        </Typography>
                        <Typography color="textSecondary">
                            Total Cost
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                            ${savings?.totalSaved}
                        </Typography>
                        <Typography color="textSecondary">
                            Total Savings
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                            ${costMetrics?.projectedCost}
                        </Typography>
                        <Typography color="textSecondary">
                            Projected Cost
                        </Typography>
                    </Paper>
                </Grid>

                {/* Cost Breakdown */}
                <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                        Cost Breakdown
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={costMetrics?.breakdown}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="service" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="cost" fill="#8884d8" name="Cost ($)" />
                        </BarChart>
                    </ResponsiveContainer>
                </Grid>

                {/* Optimization Recommendations */}
                <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                        Optimization Recommendations
                    </Typography>
                    {recommendations.map(rec => (
                        <Paper
                            key={rec.id}
                            sx={{ p: 2, mb: 2, border: 1, borderColor: 'divider' }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="subtitle1">
                                    {rec.title}
                                </Typography>
                                <Typography color="success.main">
                                    Potential Savings: ${rec.potentialSavings}
                                </Typography>
                            </Box>

                            <Typography color="textSecondary" paragraph>
                                {rec.description}
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    size="small"
                                    startIcon={<Check />}
                                    onClick={() => applyOptimization(rec.id)}
                                    disabled={optimizationStatus === 'applying'}
                                >
                                    Apply Optimization
                                </Button>
                                <Button
                                    size="small"
                                    startIcon={<Assessment />}
                                    onClick={() => handleViewImpact(rec)}
                                >
                                    View Impact
                                </Button>
                            </Box>
                        </Paper>
                    ))}
                </Grid>
            </Grid>
        </Paper>
    );
}

export { DisasterRecovery, CostOptimization }; 