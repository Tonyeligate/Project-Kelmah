import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Tooltip,
    CircularProgress
} from '@mui/material';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Area,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    Scatter,
    Brush
} from 'recharts';
import { useTheme } from '@mui/material/styles';

function AdvancedVisualization({ data, predictions }) {
    const theme = useTheme();
    const [chartType, setChartType] = useState('composed');
    const [metric, setMetric] = useState('executionTime');
    const [showPredictions, setShowPredictions] = useState(true);
    const [showConfidence, setShowConfidence] = useState(true);
    const [timeRange, setTimeRange] = useState('1w');

    const combinedData = data.map((point, index) => ({
        ...point,
        prediction: predictions?.predictions[index],
        confidenceLower: predictions?.confidence[index]?.lower,
        confidenceUpper: predictions?.confidence[index]?.upper
    }));

    const renderChart = () => {
        switch (chartType) {
            case 'composed':
                return (
                    <ComposedChart data={combinedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey={metric}
                            fill={theme.palette.primary.light}
                            stroke={theme.palette.primary.main}
                        />
                        {showPredictions && (
                            <Line
                                type="monotone"
                                dataKey="prediction"
                                stroke={theme.palette.secondary.main}
                                strokeDasharray="5 5"
                            />
                        )}
                        {showConfidence && (
                            <Area
                                dataKey="confidenceUpper"
                                stroke="transparent"
                                fill={theme.palette.secondary.light}
                                fillOpacity={0.1}
                            />
                        )}
                        <Brush dataKey="timestamp" height={30} stroke={theme.palette.primary.main} />
                    </ComposedChart>
                );
            // Add more chart types...
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Advanced Visualization</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small">
                        <InputLabel>Chart Type</InputLabel>
                        <Select
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value)}
                        >
                            <MenuItem value="composed">Composed</MenuItem>
                            <MenuItem value="scatter">Scatter</MenuItem>
                            <MenuItem value="heatmap">Heatmap</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small">
                        <InputLabel>Metric</InputLabel>
                        <Select
                            value={metric}
                            onChange={(e) => setMetric(e.target.value)}
                        >
                            <MenuItem value="executionTime">Execution Time</MenuItem>
                            <MenuItem value="successRate">Success Rate</MenuItem>
                            <MenuItem value="errorRate">Error Rate</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small">
                        <InputLabel>Time Range</InputLabel>
                        <Select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                        >
                            <MenuItem value="1d">24 Hours</MenuItem>
                            <MenuItem value="1w">1 Week</MenuItem>
                            <MenuItem value="1m">1 Month</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>
            <ResponsiveContainer width="100%" height={400}>
                {renderChart()}
            </ResponsiveContainer>
        </Paper>
    );
}

export default AdvancedVisualization; 