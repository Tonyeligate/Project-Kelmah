import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Alert,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow
} from '@mui/material';
import {
    Add,
    Delete,
    Edit,
    FileCopy,
    Save,
    Preview,
    CloudUpload,
    CloudDownload,
    Security,
    Lock,
    LockOpen
} from '@mui/icons-material';
import { JsonEditor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';

function ConfigurationTemplates({ templateId }) {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templateDialog, setTemplateDialog] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, [templateId]);

    const loadTemplates = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/config-templates`);
            setTemplates(response.data);
        } catch (error) {
            console.error('Failed to load configuration templates:', error);
        }
    };

    const handleSaveTemplate = async (template) => {
        try {
            if (template.id) {
                await api.put(`/api/config-templates/${template.id}`, template);
            } else {
                await api.post(`/api/templates/${templateId}/config-templates`, template);
            }
            await loadTemplates();
            setTemplateDialog(false);
        } catch (error) {
            console.error('Failed to save template:', error);
        }
    };

    const handleApplyTemplate = async (templateId, environmentId) => {
        try {
            await api.post(`/api/config-templates/${templateId}/apply`, {
                environmentId
            });
            // Show success message
        } catch (error) {
            console.error('Failed to apply template:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Configuration Templates</Typography>
                <Button
                    startIcon={<Add />}
                    onClick={() => {
                        setSelectedTemplate(null);
                        setTemplateDialog(true);
                    }}
                >
                    New Template
                </Button>
            </Box>

            <Grid container spacing={3}>
                {templates.map(template => (
                    <Grid item xs={12} md={6} key={template.id}>
                        <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="subtitle1">
                                    {template.name}
                                </Typography>
                                <Box>
                                    <IconButton
                                        size="small"
                                        onClick={() => handlePreviewTemplate(template)}
                                    >
                                        <Preview />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setSelectedTemplate(template);
                                            setTemplateDialog(true);
                                        }}
                                    >
                                        <Edit />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDeleteTemplate(template.id)}
                                    >
                                        <Delete />
                                    </IconButton>
                                </Box>
                            </Box>

                            <Typography variant="body2" color="textSecondary" paragraph>
                                {template.description}
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                {template.tags.map(tag => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        size="small"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>

                            <Button
                                size="small"
                                startIcon={<CloudUpload />}
                                onClick={() => handleApplyTemplate(template.id)}
                            >
                                Apply Template
                            </Button>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Template Dialog */}
            <Dialog
                open={templateDialog}
                onClose={() => setTemplateDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedTemplate ? 'Edit Template' : 'New Template'}
                </DialogTitle>
                <DialogContent>
                    {/* Template form with JsonEditor */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTemplateDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => handleSaveTemplate(selectedTemplate)}
                    >
                        Save Template
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

// Security Scanner
function SecurityScanner({ templateId }) {
    const [scanResults, setScanResults] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [scanHistory, setScanHistory] = useState([]);
    const [selectedVulnerability, setSelectedVulnerability] = useState(null);

    useEffect(() => {
        loadScanHistory();
    }, [templateId]);

    const loadScanHistory = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/security-scans`);
            setScanHistory(response.data);
        } catch (error) {
            console.error('Failed to load scan history:', error);
        }
    };

    const startScan = async () => {
        try {
            setScanning(true);
            const response = await api.post(`/api/templates/${templateId}/security-scan`);
            setScanResults(response.data);
            await loadScanHistory();
        } catch (error) {
            console.error('Failed to start security scan:', error);
        } finally {
            setScanning(false);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Security Scanner</Typography>
                <Button
                    startIcon={scanning ? null : <Security />}
                    onClick={startScan}
                    disabled={scanning}
                >
                    {scanning ? 'Scanning...' : 'Start Security Scan'}
                </Button>
            </Box>

            {scanResults && (
                <Grid container spacing={3}>
                    {/* Vulnerability Summary */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography color="error" variant="h4">
                                {scanResults.vulnerabilities.length}
                            </Typography>
                            <Typography color="textSecondary">
                                Vulnerabilities Found
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Risk Score */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography 
                                variant="h4"
                                color={getRiskColor(scanResults.riskScore)}
                            >
                                {scanResults.riskScore}
                            </Typography>
                            <Typography color="textSecondary">
                                Risk Score
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Scan Time */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h4">
                                {scanResults.scanDuration}s
                            </Typography>
                            <Typography color="textSecondary">
                                Scan Duration
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Vulnerabilities Table */}
                    <Grid item xs={12}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Severity</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Location</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {scanResults.vulnerabilities.map(vuln => (
                                    <TableRow key={vuln.id}>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={vuln.severity}
                                                color={getSeverityColor(vuln.severity)}
                                            />
                                        </TableCell>
                                        <TableCell>{vuln.type}</TableCell>
                                        <TableCell>{vuln.description}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                {vuln.location}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={vuln.status}
                                                color={getStatusColor(vuln.status)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => setSelectedVulnerability(vuln)}
                                            >
                                                <Preview />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Grid>
                </Grid>
            )}

            {/* Vulnerability Details Dialog */}
            <Dialog
                open={Boolean(selectedVulnerability)}
                onClose={() => setSelectedVulnerability(null)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Vulnerability Details
                </DialogTitle>
                <DialogContent>
                    {/* Vulnerability details and remediation steps */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedVulnerability(null)}>
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => handleFixVulnerability(selectedVulnerability)}
                        color="primary"
                    >
                        Fix Issue
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

export { ConfigurationTemplates, SecurityScanner }; 