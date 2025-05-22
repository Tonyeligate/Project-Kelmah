import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    FormGroup,
    FormControlLabel,
    CircularProgress,
    Dialog
} from '@mui/material';
import {
    Download,
    Schedule,
    Settings,
    FilterList
} from '@mui/icons-material';

const EXPORT_FORMATS = {
    xlsx: { label: 'Excel', icon: '📊' },
    csv: { label: 'CSV', icon: '📝' },
    json: { label: 'JSON', icon: '{ }' },
    pdf: { label: 'PDF', icon: '📄' }
};

function DataExporter({ data, config }) {
    const [format, setFormat] = useState('xlsx');
    const [selectedFields, setSelectedFields] = useState([]);
    const [dateRange, setDateRange] = useState([null, null]);
    const [loading, setLoading] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);

    const handleExport = async () => {
        try {
            setLoading(true);
            const response = await api.post('/api/export', {
                format,
                fields: selectedFields,
                dateRange,
                filters: config?.filters
            }, { responseType: 'blob' });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `export-${new Date().toISOString()}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Export Data</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        startIcon={<Schedule />}
                        onClick={() => setScheduleOpen(true)}
                    >
                        Schedule Export
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Download />}
                        onClick={handleExport}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Export'}
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Format Selection */}
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>Export Format</InputLabel>
                        <Select
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                        >
                            {Object.entries(EXPORT_FORMATS).map(([key, value]) => (
                                <MenuItem key={key} value={key}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <span>{value.icon}</span>
                                        {value.label}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Field Selection */}
                <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                        Select Fields
                    </Typography>
                    <FormGroup row>
                        {Object.keys(data[0] || {}).map(field => (
                            <FormControlLabel
                                key={field}
                                control={
                                    <Checkbox
                                        checked={selectedFields.includes(field)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedFields([...selectedFields, field]);
                                            } else {
                                                setSelectedFields(selectedFields.filter(f => f !== field));
                                            }
                                        }}
                                    />
                                }
                                label={field}
                            />
                        ))}
                    </FormGroup>
                </Grid>
            </Grid>

            {/* Schedule Dialog */}
            <ExportScheduleDialog
                open={scheduleOpen}
                onClose={() => setScheduleOpen(false)}
                config={{
                    format,
                    fields: selectedFields,
                    dateRange,
                    filters: config?.filters
                }}
            />
        </Paper>
    );
}

// Add widget presets
const WIDGET_PRESETS = {
    performance: {
        title: 'Performance Overview',
        type: 'line',
        metrics: ['executionTime', 'responseTime'],
        options: {
            stacked: false,
            showLegend: true,
            showGrid: true
        }
    },
    errors: {
        title: 'Error Distribution',
        type: 'pie',
        metrics: ['errorCount'],
        options: {
            showLabels: true,
            showLegend: true
        }
    },
    coverage: {
        title: 'Test Coverage',
        type: 'bar',
        metrics: ['lineCoverage', 'branchCoverage'],
        options: {
            stacked: true,
            showLabels: true
        }
    }
};

function WidgetPresets({ onSelect }) {
    return (
        <Grid container spacing={2}>
            {Object.entries(WIDGET_PRESETS).map(([key, preset]) => (
                <Grid item xs={12} md={4} key={key}>
                    <Paper
                        sx={{
                            p: 2,
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'action.hover'
                            }
                        }}
                        onClick={() => onSelect(preset)}
                    >
                        <Typography variant="subtitle1" gutterBottom>
                            {preset.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            {preset.metrics.map(metric => (
                                <Chip
                                    key={metric}
                                    label={metric}
                                    size="small"
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                            {preset.type} chart
                        </Typography>
                    </Paper>
                </Grid>
            ))}
        </Grid>
    );
}

export { DataExporter, WidgetPresets, WIDGET_PRESETS }; 