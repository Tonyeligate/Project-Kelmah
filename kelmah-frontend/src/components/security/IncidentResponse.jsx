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
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineOppositeContent,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton
} from '@mui/material';
import {
    Warning,
    Security,
    Assignment,
    Person,
    Schedule,
    Check,
    Error,
    Add,
    Edit,
    Delete,
    Refresh,
    Send,
    History
} from '@mui/icons-material';

function IncidentResponse({ templateId }) {
    const [incidents, setIncidents] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [workflows, setWorkflows] = useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [workflowDialog, setWorkflowDialog] = useState(false);

    useEffect(() => {
        loadIncidentData();
    }, [templateId]);

    const loadIncidentData = async () => {
        try {
            const [incidentsRes, workflowsRes] = await Promise.all([
                api.get(`/api/templates/${templateId}/incidents`),
                api.get(`/api/templates/${templateId}/incident-workflows`)
            ]);
            setIncidents(incidentsRes.data);
            setWorkflows(workflowsRes.data);
        } catch (error) {
            console.error('Failed to load incident data:', error);
        }
    };

    const handleIncidentAction = async (incidentId, action) => {
        try {
            await api.post(`/api/incidents/${incidentId}/actions`, { action });
            await loadIncidentData();
        } catch (error) {
            console.error('Failed to perform incident action:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Incident Response</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        startIcon={<Add />}
                        onClick={() => {
                            setSelectedWorkflow(null);
                            setWorkflowDialog(true);
                        }}
                    >
                        New Workflow
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Active Incidents */}
                <Grid item xs={12} md={8}>
                    <Typography variant="subtitle1" gutterBottom>
                        Active Incidents
                    </Typography>
                    {incidents.map(incident => (
                        <Paper
                            key={incident.id}
                            sx={{ p: 2, mb: 2, border: 1, borderColor: 'divider' }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="subtitle1">
                                    {incident.title}
                                </Typography>
                                <Chip
                                    size="small"
                                    label={incident.severity}
                                    color={getSeverityColor(incident.severity)}
                                />
                            </Box>

                            <Typography color="textSecondary" paragraph>
                                {incident.description}
                            </Typography>

                            <Timeline>
                                {incident.timeline.map((event, index) => (
                                    <TimelineItem key={index}>
                                        <TimelineOppositeContent color="textSecondary">
                                            {new Date(event.timestamp).toLocaleString()}
                                        </TimelineOppositeContent>
                                        <TimelineSeparator>
                                            <TimelineDot color={getEventColor(event.type)} />
                                            {index < incident.timeline.length - 1 && <TimelineConnector />}
                                        </TimelineSeparator>
                                        <TimelineContent>
                                            {event.description}
                                        </TimelineContent>
                                    </TimelineItem>
                                ))}
                            </Timeline>

                            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                <Button
                                    size="small"
                                    startIcon={<Assignment />}
                                    onClick={() => handleIncidentAction(incident.id, 'assign')}
                                >
                                    Assign
                                </Button>
                                <Button
                                    size="small"
                                    startIcon={<Check />}
                                    onClick={() => handleIncidentAction(incident.id, 'resolve')}
                                >
                                    Resolve
                                </Button>
                                <Button
                                    size="small"
                                    startIcon={<History />}
                                    onClick={() => setSelectedIncident(incident)}
                                >
                                    View Details
                                </Button>
                            </Box>
                        </Paper>
                    ))}
                </Grid>

                {/* Workflow Templates */}
                <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                        Response Workflows
                    </Typography>
                    <List>
                        {workflows.map(workflow => (
                            <ListItem
                                key={workflow.id}
                                sx={{
                                    border: 1,
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    mb: 1
                                }}
                            >
                                <ListItemText
                                    primary={workflow.name}
                                    secondary={workflow.description}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        onClick={() => {
                                            setSelectedWorkflow(workflow);
                                            setWorkflowDialog(true);
                                        }}
                                    >
                                        <Edit />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </Grid>
            </Grid>

            {/* Workflow Dialog */}
            <Dialog
                open={workflowDialog}
                onClose={() => setWorkflowDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedWorkflow ? 'Edit Workflow' : 'New Workflow'}
                </DialogTitle>
                <DialogContent>
                    <Stepper orientation="vertical">
                        {selectedWorkflow?.steps.map((step, index) => (
                            <Step key={index} active={true}>
                                <StepLabel>{step.name}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setWorkflowDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveWorkflow}
                    >
                        Save Workflow
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

// Vulnerability Management
function VulnerabilityManagement({ templateId }) {
    const [vulnerabilities, setVulnerabilities] = useState([]);
    const [scanStatus, setScanStatus] = useState(null);
    const [selectedVulnerability, setSelectedVulnerability] = useState(null);
    const [filters, setFilters] = useState({
        severity: 'all',
        status: 'all',
        type: 'all'
    });

    useEffect(() => {
        loadVulnerabilityData();
    }, [templateId, filters]);

    const loadVulnerabilityData = async () => {
        try {
            const response = await api.get(`/api/templates/${templateId}/vulnerabilities`, {
                params: filters
            });
            setVulnerabilities(response.data);
        } catch (error) {
            console.error('Failed to load vulnerability data:', error);
        }
    };

    const startScan = async () => {
        try {
            setScanStatus('scanning');
            await api.post(`/api/templates/${templateId}/vulnerability-scan`);
            await loadVulnerabilityData();
        } catch (error) {
            console.error('Failed to start vulnerability scan:', error);
        } finally {
            setScanStatus(null);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Vulnerability Management</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        startIcon={scanStatus === 'scanning' ? <Refresh /> : <Security />}
                        onClick={startScan}
                        disabled={scanStatus === 'scanning'}
                    >
                        {scanStatus === 'scanning' ? 'Scanning...' : 'Start Scan'}
                    </Button>
                </Box>
            </Box>

            {/* Filters */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Severity</InputLabel>
                        <Select
                            value={filters.severity}
                            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                            label="Severity"
                        >
                            <MenuItem value="all">All Severities</MenuItem>
                            <MenuItem value="critical">Critical</MenuItem>
                            <MenuItem value="high">High</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="low">Low</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                {/* Add more filters */}
            </Grid>

            {/* Vulnerability List */}
            {vulnerabilities.map(vuln => (
                <Paper
                    key={vuln.id}
                    sx={{ p: 2, mb: 2, border: 1, borderColor: 'divider' }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1">
                            {vuln.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                                size="small"
                                label={vuln.severity}
                                color={getSeverityColor(vuln.severity)}
                            />
                            <Chip
                                size="small"
                                label={vuln.status}
                                variant="outlined"
                            />
                        </Box>
                    </Box>

                    <Typography color="textSecondary" paragraph>
                        {vuln.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            size="small"
                            startIcon={<Assignment />}
                            onClick={() => handleVulnerabilityAction(vuln.id, 'assign')}
                        >
                            Assign
                        </Button>
                        <Button
                            size="small"
                            startIcon={<Security />}
                            onClick={() => handleVulnerabilityAction(vuln.id, 'patch')}
                        >
                            Apply Patch
                        </Button>
                        <Button
                            size="small"
                            startIcon={<History />}
                            onClick={() => setSelectedVulnerability(vuln)}
                        >
                            View Details
                        </Button>
                    </Box>
                </Paper>
            ))}

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
                        onClick={() => handleVulnerabilityAction(selectedVulnerability.id, 'fix')}
                        color="primary"
                    >
                        Fix Vulnerability
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

export { IncidentResponse, VulnerabilityManagement }; 