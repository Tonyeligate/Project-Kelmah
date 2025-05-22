import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Tooltip,
    CircularProgress,
    Skeleton,
    Alert,
    Tabs,
    Tab,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    ZoomIn,
    ZoomOut,
    Fullscreen,
    FullscreenExit,
    Print,
    Download,
    Code,
    Visibility,
    Edit
} from '@mui/icons-material';

function TemplatePreview({ templateId, mode = 'preview' }) {
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeTab, setActiveTab] = useState('rendered');
    const [sampleData, setSampleData] = useState(null);
    const previewRef = useRef(null);

    useEffect(() => {
        loadTemplate();
        loadSampleData();
    }, [templateId]);

    const loadTemplate = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/templates/${templateId}`);
            setTemplate(response.data);
            setError(null);
        } catch (error) {
            setError('Failed to load template');
            console.error('Template load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSampleData = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/sample-data`);
            setSampleData(response.data);
        } catch (error) {
            console.error('Sample data load error:', error);
        }
    };

    const handleZoom = (direction) => {
        setZoom(prev => Math.max(0.5, Math.min(2, prev + direction * 0.1)));
    };

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            previewRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
        setIsFullscreen(!isFullscreen);
    };

    const handlePrint = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/print`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `template-${templateId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Print error:', error);
        }
    };

    if (loading) {
        return <Skeleton variant="rectangular" height={400} />;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Paper ref={previewRef} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Template Preview</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Zoom Out">
                        <IconButton onClick={() => handleZoom(-1)}>
                            <ZoomOut />
                        </IconButton>
                    </Tooltip>
                    <Typography sx={{ minWidth: 40, textAlign: 'center' }}>
                        {Math.round(zoom * 100)}%
                    </Typography>
                    <Tooltip title="Zoom In">
                        <IconButton onClick={() => handleZoom(1)}>
                            <ZoomIn />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                        <IconButton onClick={toggleFullscreen}>
                            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Print">
                        <IconButton onClick={handlePrint}>
                            <Print />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                sx={{ mb: 2 }}
            >
                <Tab value="rendered" icon={<Visibility />} label="Rendered" />
                <Tab value="code" icon={<Code />} label="Code" />
                <Tab value="data" icon={<Edit />} label="Sample Data" />
            </Tabs>

            <Box
                sx={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    transition: 'transform 0.2s'
                }}
            >
                {activeTab === 'rendered' && (
                    <iframe
                        src={`/api/templates/${templateId}/preview`}
                        style={{ width: '100%', height: 600, border: 'none' }}
                    />
                )}
                {activeTab === 'code' && (
                    <pre style={{ overflow: 'auto', maxHeight: 600 }}>
                        {JSON.stringify(template, null, 2)}
                    </pre>
                )}
                {activeTab === 'data' && (
                    <pre style={{ overflow: 'auto', maxHeight: 600 }}>
                        {JSON.stringify(sampleData, null, 2)}
                    </pre>
                )}
            </Box>
        </Paper>
    );
}

// Batch Operations Component
function BatchOperations({ selectedTemplates, onOperationComplete }) {
    const [operation, setOperation] = useState(null);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const operations = {
        delete: {
            label: 'Delete Templates',
            icon: <Delete />,
            confirm: true,
            action: async () => {
                await api.post('/api/templates/batch/delete', {
                    templateIds: selectedTemplates
                });
            }
        },
        export: {
            label: 'Export Templates',
            icon: <Download />,
            action: async () => {
                const response = await api.post('/api/templates/batch/export', {
                    templateIds: selectedTemplates
                }, { responseType: 'blob' });
                
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'templates.zip');
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        },
        duplicate: {
            label: 'Duplicate Templates',
            icon: <ContentCopy />,
            action: async () => {
                await api.post('/api/templates/batch/duplicate', {
                    templateIds: selectedTemplates
                });
            }
        }
    };

    const handleOperation = async (op) => {
        try {
            setOperation(op);
            setProgress(0);
            setError(null);

            await operations[op].action();
            onOperationComplete();

        } catch (error) {
            setError(`Failed to ${op} templates: ${error.message}`);
            console.error(`Batch operation error (${op}):`, error);
        } finally {
            setOperation(null);
        }
    };

    return (
        <Box>
            <Typography variant="subtitle2" gutterBottom>
                {selectedTemplates.length} templates selected
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
                {Object.entries(operations).map(([key, op]) => (
                    <Button
                        key={key}
                        startIcon={op.icon}
                        onClick={() => handleOperation(key)}
                        disabled={Boolean(operation)}
                    >
                        {op.label}
                    </Button>
                ))}
            </Box>

            {operation && (
                <Box sx={{ mt: 2 }}>
                    <LinearProgress variant="determinate" value={progress} />
                    <Typography variant="caption" sx={{ mt: 1 }}>
                        Processing... {progress}%
                    </Typography>
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}
        </Box>
    );
}

export { TemplatePreview, BatchOperations }; 