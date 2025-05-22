import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    Switch,
    FormGroup,
    FormControlLabel,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
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
    Security,
    Add,
    Delete,
    Edit,
    Save,
    Check,
    Warning,
    Error,
    Info,
    Policy,
    Gavel,
    Assignment,
    CloudUpload
} from '@mui/icons-material';

function SecurityPolicies({ templateId }) {
    const [policies, setPolicies] = useState([]);
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [policyDialog, setPolicyDialog] = useState(false);
    const [evaluationResults, setEvaluationResults] = useState(null);

    useEffect(() => {
        loadPolicies();
    }, [templateId]);

    const loadPolicies = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/security-policies`);
            setPolicies(response.data);
        } catch (error) {
            console.error('Failed to load security policies:', error);
        }
    };

    const evaluatePolicies = async () => {
        try {
            const response = await api.post(`/api/templates/${templateId}/evaluate-policies`);
            setEvaluationResults(response.data);
        } catch (error) {
            console.error('Failed to evaluate policies:', error);
        }
    };

    const handleSavePolicy = async (policy) => {
        try {
            if (policy.id) {
                await api.put(`/api/security-policies/${policy.id}`, policy);
            } else {
                await api.post(`/api/templates/${templateId}/security-policies`, policy);
            }
            await loadPolicies();
            setPolicyDialog(false);
        } catch (error) {
            console.error('Failed to save policy:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Security Policies</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        startIcon={<Policy />}
                        onClick={evaluatePolicies}
                    >
                        Evaluate Policies
                    </Button>
                    <Button
                        startIcon={<Add />}
                        onClick={() => {
                            setSelectedPolicy(null);
                            setPolicyDialog(true);
                        }}
                    >
                        New Policy
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {policies.map(policy => (
                    <Grid item xs={12} md={6} key={policy.id}>
                        <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="subtitle1">
                                    {policy.name}
                                </Typography>
                                <Box>
                                    <Switch
                                        checked={policy.enabled}
                                        onChange={() => handleTogglePolicy(policy.id)}
                                        size="small"
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setSelectedPolicy(policy);
                                            setPolicyDialog(true);
                                        }}
                                    >
                                        <Edit />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDeletePolicy(policy.id)}
                                    >
                                        <Delete />
                                    </IconButton>
                                </Box>
                            </Box>

                            <Typography variant="body2" color="textSecondary" paragraph>
                                {policy.description}
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <Chip
                                    size="small"
                                    label={policy.severity}
                                    color={getSeverityColor(policy.severity)}
                                />
                                <Chip
                                    size="small"
                                    label={policy.category}
                                    variant="outlined"
                                />
                            </Box>

                            {evaluationResults?.results[policy.id] && (
                                <Alert
                                    severity={evaluationResults.results[policy.id].compliant ? 
                                        'success' : 'error'}
                                    sx={{ mt: 2 }}
                                >
                                    {evaluationResults.results[policy.id].message}
                                </Alert>
                            )}
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Policy Dialog */}
            <Dialog
                open={policyDialog}
                onClose={() => setPolicyDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedPolicy ? 'Edit Policy' : 'New Policy'}
                </DialogTitle>
                <DialogContent>
                    {/* Policy form */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPolicyDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => handleSavePolicy(selectedPolicy)}
                    >
                        Save Policy
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

// Compliance Reporting
function ComplianceReporting({ templateId }) {
    const [reports, setReports] = useState([]);
    const [frameworks, setFrameworks] = useState([]);
    const [selectedFramework, setSelectedFramework] = useState('');
    const [generating, setGenerating] = useState(false);
    const [complianceScore, setComplianceScore] = useState(null);

    useEffect(() => {
        loadComplianceData();
    }, [templateId]);

    const loadComplianceData = async () => {
        try {
            const [reportsRes, frameworksRes] = await Promise.all([
                api.get(`/api/templates/${templateId}/compliance-reports`),
                api.get(`/api/compliance-frameworks`)
            ]);
            setReports(reportsRes.data);
            setFrameworks(frameworksRes.data);
        } catch (error) {
            console.error('Failed to load compliance data:', error);
        }
    };

    const generateReport = async () => {
        try {
            setGenerating(true);
            const response = await api.post(`/api/templates/${templateId}/generate-compliance-report`, {
                frameworkId: selectedFramework
            });
            await loadComplianceData();
            setComplianceScore(response.data.score);
        } catch (error) {
            console.error('Failed to generate compliance report:', error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Compliance Reporting</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Compliance Framework</InputLabel>
                        <Select
                            value={selectedFramework}
                            onChange={(e) => setSelectedFramework(e.target.value)}
                            label="Compliance Framework"
                        >
                            {frameworks.map(framework => (
                                <MenuItem key={framework.id} value={framework.id}>
                                    {framework.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        startIcon={<Assignment />}
                        onClick={generateReport}
                        disabled={!selectedFramework || generating}
                    >
                        Generate Report
                    </Button>
                </Box>
            </Box>

            {complianceScore && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" gutterBottom align="center">
                        Compliance Score
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: 200
                        }}
                    >
                        <CircularProgress
                            variant="determinate"
                            value={complianceScore}
                            size={150}
                            thickness={5}
                            color={getComplianceScoreColor(complianceScore)}
                        />
                        <Typography
                            variant="h3"
                            sx={{ position: 'absolute' }}
                        >
                            {complianceScore}%
                        </Typography>
                    </Box>
                </Box>
            )}

            <Typography variant="subtitle1" gutterBottom>
                Recent Reports
            </Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Framework</TableCell>
                        <TableCell>Score</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {reports.map(report => (
                        <TableRow key={report.id}>
                            <TableCell>
                                {new Date(report.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>{report.framework}</TableCell>
                            <TableCell>
                                <Chip
                                    size="small"
                                    label={`${report.score}%`}
                                    color={getComplianceScoreColor(report.score)}
                                />
                            </TableCell>
                            <TableCell>
                                <Chip
                                    size="small"
                                    label={report.status}
                                    color={getStatusColor(report.status)}
                                />
                            </TableCell>
                            <TableCell>
                                <IconButton
                                    size="small"
                                    onClick={() => handleDownloadReport(report)}
                                >
                                    <CloudUpload />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Paper>
    );
}

export { SecurityPolicies, ComplianceReporting }; 