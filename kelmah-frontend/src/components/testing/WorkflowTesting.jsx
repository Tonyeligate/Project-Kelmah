import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Tooltip,
    Tabs,
    Tab,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    PlayArrow,
    Add,
    Delete,
    Edit,
    ExpandMore,
    Refresh,
    AutoFixHigh,
    CompareArrows,
    CheckCircle,
    Error,
    History
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { JsonEditor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';
import api from '../../api/axios';

function WorkflowTesting() {
    const [workflows, setWorkflows] = useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [testCases, setTestCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [testResults, setTestResults] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [newTestCase, setNewTestCase] = useState({
        name: '',
        description: '',
        input_data: {},
        expected_output: {}
    });
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        loadWorkflows();
    }, []);

    useEffect(() => {
        if (selectedWorkflow) {
            loadTestCases(selectedWorkflow);
        }
    }, [selectedWorkflow]);

    const loadWorkflows = async () => {
        try {
            const response = await api.get('/api/workflows');
            setWorkflows(response.data);
        } catch (error) {
            enqueueSnackbar('Error loading workflows', { variant: 'error' });
        }
    };

    const loadTestCases = async (workflowId) => {
        try {
            setLoading(true);
            const response = await api.get(`/api/workflows/${workflowId}/tests`);
            setTestCases(response.data);
        } catch (error) {
            enqueueSnackbar('Error loading test cases', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleRunTest = async (testId) => {
        try {
            setExecuting(true);
            const response = await api.post(`/api/tests/${testId}/run`);
            setTestResults(response.data);
            enqueueSnackbar('Test executed successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Error executing test', { variant: 'error' });
        } finally {
            setExecuting(false);
        }
    };

    const handleRunSuite = async () => {
        try {
            setExecuting(true);
            const response = await api.post(`/api/workflows/${selectedWorkflow}/tests/run-suite`);
            setTestResults(response.data);
            enqueueSnackbar('Test suite executed successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Error executing test suite', { variant: 'error' });
        } finally {
            setExecuting(false);
        }
    };

    const handleGenerateTestCases = async () => {
        try {
            setLoading(true);
            const response = await api.post(`/api/workflows/${selectedWorkflow}/tests/generate`);
            setTestCases(prev => [...prev, ...response.data]);
            enqueueSnackbar('Test cases generated successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Error generating test cases', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTestCase = async () => {
        try {
            const response = await api.post(`/api/workflows/${selectedWorkflow}/tests`, newTestCase);
            setTestCases(prev => [...prev, response.data]);
            setDialogOpen(false);
            setNewTestCase({
                name: '',
                description: '',
                input_data: {},
                expected_output: {}
            });
            enqueueSnackbar('Test case created successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Error creating test case', { variant: 'error' });
        }
    };

    return (
        <Box>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5">Workflow Testing</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            startIcon={<AutoFixHigh />}
                            onClick={handleGenerateTestCases}
                            disabled={!selectedWorkflow}
                        >
                            Generate Test Cases
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setDialogOpen(true)}
                            disabled={!selectedWorkflow}
                        >
                            New Test Case
                        </Button>
                    </Box>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>Select Workflow</InputLabel>
                            <Select
                                value={selectedWorkflow || ''}
                                onChange={(e) => setSelectedWorkflow(e.target.value)}
                                label="Select Workflow"
                            >
                                {workflows.map(workflow => (
                                    <MenuItem key={workflow.id} value={workflow.id}>
                                        {workflow.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {selectedWorkflow && (
                        <Grid item xs={12}>
                            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                                <Tab label="Test Cases" />
                                <Tab label="Test Results" />
                                <Tab label="History" />
                            </Tabs>

                            {activeTab === 0 && (
                                <List>
                                    {testCases.map(test => (
                                        <ListItem key={test.id}>
                                            <ListItemText
                                                primary={test.name}
                                                secondary={test.description}
                                            />
                                            <ListItemSecondaryAction>
                                                <Tooltip title="Run Test">
                                                    <IconButton
                                                        onClick={() => handleRunTest(test.id)}
                                                        disabled={executing}
                                                    >
                                                        <PlayArrow />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit">
                                                    <IconButton>
                                                        <Edit />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton>
                                                        <Delete />
                                                    </IconButton>
                                                </Tooltip>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            )}

                            {activeTab === 1 && testResults && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Test Results
                                    </Typography>
                                    {testResults.results.map((result, index) => (
                                        <Accordion key={index}>
                                            <AccordionSummary expandIcon={<ExpandMore />}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {result.passed ? (
                                                        <CheckCircle color="success" />
                                                    ) : (
                                                        <Error color="error" />
                                                    )}
                                                    <Typography>
                                                        Test Case: {result.testId}
                                                    </Typography>
                                                </Box>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                {result.differences.length > 0 ? (
                                                    <Box>
                                                        <Typography variant="subtitle2" gutterBottom>
                                                            Differences:
                                                        </Typography>
                                                        {result.differences.map((diff, idx) => (
                                                            <Box key={idx} sx={{ mb: 1 }}>
                                                                <Typography variant="body2">
                                                                    Field: {diff.field}
                                                                </Typography>
                                                                <Typography variant="body2" color="error">
                                                                    Expected: {JSON.stringify(diff.expected)}
                                                                </Typography>
                                                                <Typography variant="body2" color="warning.main">
                                                                    Actual: {JSON.stringify(diff.actual)}
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                ) : (
                                                    <Alert severity="success">
                                                        All assertions passed
                                                    </Alert>
                                                )}
                                            </AccordionDetails>
                                        </Accordion>
                                    ))}
                                </Box>
                            )}

                            {activeTab === 2 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Test History
                                    </Typography>
                                    {/* Test history implementation */}
                                </Box>
                            )}
                        </Grid>
                    )}
                </Grid>
            </Paper>

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Create New Test Case</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Test Name"
                                value={newTestCase.name}
                                onChange={(e) => setNewTestCase(prev => ({
                                    ...prev,
                                    name: e.target.value
                                }))}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Description"
                                value={newTestCase.description}
                                onChange={(e) => setNewTestCase(prev => ({
                                    ...prev,
                                    description: e.target.value
                                }))}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                                Input Data
                            </Typography>
                            <JsonEditor
                                value={newTestCase.input_data}
                                onChange={value => setNewTestCase(prev => ({
                                    ...prev,
                                    input_data: value
                                }))}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                                Expected Output
                            </Typography>
                            <JsonEditor
                                value={newTestCase.expected_output}
                                onChange={value => setNewTestCase(prev => ({
                                    ...prev,
                                    expected_output: value
                                }))}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveTestCase}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default WorkflowTesting; 