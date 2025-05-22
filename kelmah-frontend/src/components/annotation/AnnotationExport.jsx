import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    FormControlLabel,
    Checkbox,
    Radio,
    RadioGroup,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    Select,
    MenuItem,
    Grid
} from '@mui/material';
import {
    PictureAsPdf,
    Image,
    Description,
    Download,
    Settings
} from '@mui/icons-material';

const EXPORT_OPTIONS = {
    pdf: {
        icon: PictureAsPdf,
        label: 'PDF Document',
        formats: ['A4', 'Letter', 'Custom']
    },
    image: {
        icon: Image,
        label: 'Image',
        formats: ['PNG', 'JPEG', 'SVG']
    },
    json: {
        icon: Description,
        label: 'JSON Data',
        formats: ['Compact', 'Readable']
    }
};

function AnnotationExport({ annotations, originalContent }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [exportType, setExportType] = useState('pdf');
    const [exportFormat, setExportFormat] = useState('A4');
    const [includeOriginal, setIncludeOriginal] = useState(true);
    const [includeMeta, setIncludeMeta] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [customSize, setCustomSize] = useState({ width: 0, height: 0 });

    const handleExport = async () => {
        try {
            setLoading(true);
            setError(null);

            const exportConfig = {
                type: exportType,
                format: exportFormat,
                includeOriginal,
                includeMeta,
                customSize: exportFormat === 'Custom' ? customSize : undefined,
                annotations,
                originalContent
            };

            const response = await api.post('/api/annotations/export', exportConfig, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `annotations-${Date.now()}.${getFileExtension()}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setDialogOpen(false);

        } catch (error) {
            setError('Failed to export annotations. Please try again.');
            console.error('Export failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFileExtension = () => {
        switch (exportType) {
            case 'pdf': return 'pdf';
            case 'image': return exportFormat.toLowerCase();
            case 'json': return 'json';
            default: return '';
        }
    };

    return (
        <>
            <Button
                startIcon={<Download />}
                onClick={() => setDialogOpen(true)}
                variant="contained"
            >
                Export Annotations
            </Button>

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Export Annotations</DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Export Type
                        </Typography>
                        <RadioGroup
                            value={exportType}
                            onChange={(e) => setExportType(e.target.value)}
                        >
                            {Object.entries(EXPORT_OPTIONS).map(([type, config]) => {
                                const Icon = config.icon;
                                return (
                                    <FormControlLabel
                                        key={type}
                                        value={type}
                                        control={<Radio />}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Icon />
                                                {config.label}
                                            </Box>
                                        }
                                    />
                                );
                            })}
                        </RadioGroup>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Format Options
                        </Typography>
                        <FormControl fullWidth>
                            <Select
                                value={exportFormat}
                                onChange={(e) => setExportFormat(e.target.value)}
                            >
                                {EXPORT_OPTIONS[exportType].formats.map(format => (
                                    <MenuItem key={format} value={format}>
                                        {format}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {exportFormat === 'Custom' && (
                            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Width (px)"
                                    type="number"
                                    value={customSize.width}
                                    onChange={(e) => setCustomSize(prev => ({
                                        ...prev,
                                        width: parseInt(e.target.value)
                                    }))}
                                />
                                <TextField
                                    label="Height (px)"
                                    type="number"
                                    value={customSize.height}
                                    onChange={(e) => setCustomSize(prev => ({
                                        ...prev,
                                        height: parseInt(e.target.value)
                                    }))}
                                />
                            </Box>
                        )}
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Include Options
                        </Typography>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={includeOriginal}
                                    onChange={(e) => setIncludeOriginal(e.target.checked)}
                                />
                            }
                            label="Include original content"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={includeMeta}
                                    onChange={(e) => setIncludeMeta(e.target.checked)}
                                />
                            }
                            label="Include metadata"
                        />
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleExport}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <Download />}
                    >
                        {loading ? 'Exporting...' : 'Export'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

// Real-time Analytics Updates
function RealTimeAnalytics({ resourceId }) {
    const [realtimeData, setRealtimeData] = useState(null);
    const [wsConnection, setWsConnection] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        connectWebSocket();
        return () => {
            if (wsConnection) {
                wsConnection.close();
            }
        };
    }, [resourceId]);

    const connectWebSocket = () => {
        try {
            const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/analytics/${resourceId}`);
            
            ws.onopen = () => {
                console.log('Analytics WebSocket connected');
                setError(null);
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleAnalyticsUpdate(data);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError('Failed to connect to real-time analytics');
            };

            ws.onclose = () => {
                console.log('WebSocket closed');
                // Attempt to reconnect after delay
                setTimeout(connectWebSocket, 3000);
            };

            setWsConnection(ws);
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            setError('Failed to initialize real-time analytics');
        }
    };

    const handleAnalyticsUpdate = (data) => {
        setRealtimeData(prev => ({
            ...prev,
            ...data,
            lastUpdate: new Date()
        }));
    };

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Real-time Analytics
            </Typography>
            
            {realtimeData && (
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                Active Users
                            </Typography>
                            <Typography variant="h4">
                                {realtimeData.activeUsers}
                            </Typography>
                        </Paper>
                    </Grid>
                    
                    {/* Add more real-time metrics */}
                </Grid>
            )}
        </Box>
    );
}

export { AnnotationExport, RealTimeAnalytics }; 