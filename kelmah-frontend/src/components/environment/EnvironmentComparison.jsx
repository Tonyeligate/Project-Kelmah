import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    Tooltip,
    Divider
} from '@mui/material';
import {
    Compare,
    ArrowForward,
    Warning,
    CheckCircle,
    ContentCopy,
    Visibility,
    VisibilityOff,
    Edit,
    Save
} from '@mui/icons-material';
import ReactDiffViewer from 'react-diff-viewer';

function EnvironmentComparison({ templateId }) {
    const [environments, setEnvironments] = useState([]);
    const [sourceEnv, setSourceEnv] = useState('');
    const [targetEnv, setTargetEnv] = useState('');
    const [differences, setDifferences] = useState([]);
    const [compareMode, setCompareMode] = useState('simple');
    const [showSecrets, setShowSecrets] = useState(false);

    useEffect(() => {
        loadEnvironments();
    }, [templateId]);

    const loadEnvironments = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/environments`);
            setEnvironments(response.data);
        } catch (error) {
            console.error('Failed to load environments:', error);
        }
    };

    const compareEnvironments = async () => {
        try {
            const response = await api.post(`/api/environments/compare`, {
                sourceId: sourceEnv,
                targetId: targetEnv,
                mode: compareMode
            });
            setDifferences(response.data);
        } catch (error) {
            console.error('Failed to compare environments:', error);
        }
    };

    const handleSync = async (key) => {
        try {
            await api.post(`/api/environments/sync`, {
                sourceId: sourceEnv,
                targetId: targetEnv,
                keys: [key]
            });
            await compareEnvironments();
        } catch (error) {
            console.error('Failed to sync configuration:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Environment Comparison</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Source Environment</InputLabel>
                        <Select
                            value={sourceEnv}
                            onChange={(e) => setSourceEnv(e.target.value)}
                            label="Source Environment"
                        >
                            {environments.map(env => (
                                <MenuItem key={env.id} value={env.id}>
                                    {env.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Target Environment</InputLabel>
                        <Select
                            value={targetEnv}
                            onChange={(e) => setTargetEnv(e.target.value)}
                            label="Target Environment"
                        >
                            {environments.map(env => (
                                <MenuItem key={env.id} value={env.id}>
                                    {env.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        startIcon={<Compare />}
                        onClick={compareEnvironments}
                        disabled={!sourceEnv || !targetEnv}
                    >
                        Compare
                    </Button>
                </Box>
            </Box>

            {differences.length > 0 && (
                <Box>
                    <Typography variant="subtitle1" gutterBottom>
                        Configuration Differences
                    </Typography>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Configuration Key</TableCell>
                                <TableCell>Source Value</TableCell>
                                <TableCell>Target Value</TableCell>
                                <TableCell>Difference Type</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {differences.map(diff => (
                                <TableRow key={diff.key}>
                                    <TableCell>{diff.key}</TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontFamily: 'monospace',
                                                bgcolor: 'action.hover',
                                                p: 0.5,
                                                borderRadius: 1
                                            }}
                                        >
                                            {showSecrets ? diff.sourceValue : 
                                             diff.isSecret ? '********' : diff.sourceValue}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontFamily: 'monospace',
                                                bgcolor: 'action.hover',
                                                p: 0.5,
                                                borderRadius: 1
                                            }}
                                        >
                                            {showSecrets ? diff.targetValue :
                                             diff.isSecret ? '********' : diff.targetValue}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={diff.type}
                                            color={getDifferenceColor(diff.type)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleSync(diff.key)}
                                            title="Sync to target"
                                        >
                                            <ArrowForward />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            )}
        </Paper>
    );
}

// Configuration Validation
function ConfigurationValidator({ templateId }) {
    const [validationRules, setValidationRules] = useState([]);
    const [validationResults, setValidationResults] = useState(null);
    const [selectedEnvironment, setSelectedEnvironment] = useState('');
    const [environments, setEnvironments] = useState([]);
    const [validating, setValidating] = useState(false);

    useEffect(() => {
        loadValidationData();
    }, [templateId]);

    const loadValidationData = async () => {
        try {
            const [rulesRes, envsRes] = await Promise.all([
                api.get(`/api/templates/${templateId}/validation-rules`),
                api.get(`/api/templates/${templateId}/environments`)
            ]);
            setValidationRules(rulesRes.data);
            setEnvironments(envsRes.data);
        } catch (error) {
            console.error('Failed to load validation data:', error);
        }
    };

    const runValidation = async () => {
        try {
            setValidating(true);
            const response = await api.post(`/api/environments/${selectedEnvironment}/validate`);
            setValidationResults(response.data);
        } catch (error) {
            console.error('Failed to run validation:', error);
        } finally {
            setValidating(false);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Configuration Validation</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Select Environment</InputLabel>
                        <Select
                            value={selectedEnvironment}
                            onChange={(e) => setSelectedEnvironment(e.target.value)}
                            label="Select Environment"
                        >
                            {environments.map(env => (
                                <MenuItem key={env.id} value={env.id}>
                                    {env.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        startIcon={validating ? null : <CheckCircle />}
                        onClick={runValidation}
                        disabled={!selectedEnvironment || validating}
                    >
                        {validating ? 'Validating...' : 'Validate Configuration'}
                    </Button>
                </Box>
            </Box>

            {validationResults && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Alert
                            severity={validationResults.valid ? 'success' : 'error'}
                            sx={{ mb: 2 }}
                        >
                            {validationResults.valid ? 
                                'All configuration values are valid' : 
                                'Configuration validation failed'}
                        </Alert>
                    </Grid>

                    {validationResults.issues.map(issue => (
                        <Grid item xs={12} key={issue.id}>
                            <Paper sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="subtitle1">
                                        {issue.key}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={issue.severity}
                                        color={getSeverityColor(issue.severity)}
                                    />
                                </Box>
                                <Typography color="error" variant="body2">
                                    {issue.message}
                                </Typography>
                                {issue.suggestion && (
                                    <Typography color="textSecondary" variant="body2" sx={{ mt: 1 }}>
                                        Suggestion: {issue.suggestion}
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Paper>
    );
}

export { EnvironmentComparison, ConfigurationValidator }; 