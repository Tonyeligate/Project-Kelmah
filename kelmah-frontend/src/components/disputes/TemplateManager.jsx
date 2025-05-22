import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    CircularProgress,
    Tooltip
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    ContentCopy,
    History,
    Assessment
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../api/axios';

const TEMPLATE_CATEGORIES = [
    'payment_not_received',
    'incorrect_amount',
    'service_issue',
    'technical_error',
    'general'
];

function TemplateManager() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
    const [versions, setVersions] = useState([]);
    const [statsOpen, setStatsOpen] = useState(false);
    const [templateStats, setTemplateStats] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    const [formData, setFormData] = useState({
        title: '',
        category: '',
        content: '',
        variables: '',
        priority: 'normal',
        tags: '',
        conditions: ''
    });

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/admin/templates');
            setTemplates(response.data);
        } catch (error) {
            setError('Error loading templates');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                variables: formData.variables.split(',').map(v => v.trim()),
                tags: formData.tags.split(',').map(t => t.trim()),
                conditions: formData.conditions ? JSON.parse(formData.conditions) : {}
            };

            if (selectedTemplate) {
                await api.put(`/api/admin/templates/${selectedTemplate.id}`, data);
                enqueueSnackbar('Template updated successfully', { variant: 'success' });
            } else {
                await api.post('/api/admin/templates', data);
                enqueueSnackbar('Template created successfully', { variant: 'success' });
            }

            setDialogOpen(false);
            loadTemplates();
        } catch (error) {
            enqueueSnackbar(error.response?.data?.message || 'Error saving template', { variant: 'error' });
        }
    };

    const handleEdit = (template) => {
        setSelectedTemplate(template);
        setFormData({
            title: template.title,
            category: template.category,
            content: template.content,
            variables: JSON.parse(template.variables).join(', '),
            priority: template.priority,
            tags: JSON.parse(template.tags).join(', '),
            conditions: JSON.stringify(JSON.parse(template.conditions), null, 2)
        });
        setDialogOpen(true);
    };

    const handleDelete = async (templateId) => {
        if (window.confirm('Are you sure you want to delete this template?')) {
            try {
                await api.delete(`/api/admin/templates/${templateId}`);
                enqueueSnackbar('Template deleted successfully', { variant: 'success' });
                loadTemplates();
            } catch (error) {
                enqueueSnackbar('Error deleting template', { variant: 'error' });
            }
        }
    };

    const handleViewVersions = async (templateId) => {
        try {
            const response = await api.get(`/api/admin/templates/${templateId}/versions`);
            setVersions(response.data);
            setVersionHistoryOpen(true);
        } catch (error) {
            enqueueSnackbar('Error loading version history', { variant: 'error' });
        }
    };

    const handleViewStats = async (templateId) => {
        try {
            const response = await api.get(`/api/admin/templates/${templateId}/stats`);
            setTemplateStats(response.data);
            setStatsOpen(true);
        } catch (error) {
            enqueueSnackbar('Error loading template statistics', { variant: 'error' });
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6">
                        Resolution Templates
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setSelectedTemplate(null);
                            setFormData({
                                title: '',
                                category: '',
                                content: '',
                                variables: '',
                                priority: 'normal',
                                tags: '',
                                conditions: ''
                            });
                            setDialogOpen(true);
                        }}
                    >
                        Add Template
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Title</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Usage</TableCell>
                                <TableCell>Satisfaction</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {templates.map((template) => (
                                <TableRow key={template.id}>
                                    <TableCell>
                                        {template.title}
                                        {template.priority === 'high' && (
                                            <Chip
                                                size="small"
                                                color="error"
                                                label="High Priority"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {template.category.replace(/_/g, ' ')}
                                    </TableCell>
                                    <TableCell>{template.usage_count}</TableCell>
                                    <TableCell>
                                        {template.avg_satisfaction
                                            ? `${(template.avg_satisfaction).toFixed(1)}/5`
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="Edit">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(template)}
                                            >
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Version History">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleViewVersions(template.id)}
                                            >
                                                <History />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Statistics">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleViewStats(template.id)}
                                            >
                                                <Assessment />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(template.id)}
                                                color="error"
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Template Edit Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <form onSubmit={handleSubmit}>
                    <DialogTitle>
                        {selectedTemplate ? 'Edit Template' : 'New Template'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Title"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        title: e.target.value
                                    }))}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={formData.category}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            category: e.target.value
                                        }))}
                                        label="Category"
                                    >
                                        {TEMPLATE_CATEGORIES.map(category => (
                                            <MenuItem key={category} value={category}>
                                                {category.replace(/_/g, ' ')}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    label="Content"
                                    value={formData.content}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        content: e.target.value
                                    }))}
                                    required
                                    helperText="Use {{variable}} syntax for template variables"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Variables"
                                    value={formData.variables}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        variables: e.target.value
                                    }))}
                                    helperText="Comma-separated list of variable names"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Priority</InputLabel>
                                    <Select
                                        value={formData.priority}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            priority: e.target.value
                                        }))}
                                        label="Priority"
                                    >
                                        <MenuItem value="low">Low</MenuItem>
                                        <MenuItem value="normal">Normal</MenuItem>
                                        <MenuItem value="high">High</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Tags"
                                    value={formData.tags}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        tags: e.target.value
                                    }))}
                                    helperText="Comma-separated list of tags"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Conditions"
                                    value={formData.conditions}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        conditions: e.target.value
                                    }))}
                                    helperText="JSON format conditions for template usage"
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained">
                            {selectedTemplate ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Version History Dialog */}
            <Dialog
                open={versionHistoryOpen}
                onClose={() => setVersionHistoryOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Version History</DialogTitle>
                <DialogContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Version</TableCell>
                                    <TableCell>Created By</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {versions.map((version) => (
                                    <TableRow key={version.id}>
                                        <TableCell>v{version.version}</TableCell>
                                        <TableCell>{version.created_by_name}</TableCell>
                                        <TableCell>
                                            {new Date(version.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="Copy Content">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(version.content);
                                                        enqueueSnackbar('Content copied to clipboard', {
                                                            variant: 'success'
                                                        });
                                                    }}
                                                >
                                                    <ContentCopy />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setVersionHistoryOpen(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Statistics Dialog */}
            <Dialog
                open={statsOpen}
                onClose={() => setStatsOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Template Statistics</DialogTitle>
                <DialogContent>
                    {templateStats && (
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Total Uses
                                </Typography>
                                <Typography variant="h4">
                                    {templateStats.total_uses}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Avg. Satisfaction
                                </Typography>
                                <Typography variant="h4">
                                    {templateStats.avg_satisfaction
                                        ? `${templateStats.avg_satisfaction.toFixed(1)}/5`
                                        : 'N/A'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Success Rate
                                </Typography>
                                <Typography variant="h4">
                                    {templateStats.total_uses
                                        ? `${Math.round((templateStats.successful_resolutions / templateStats.total_uses) * 100)}%`
                                        : 'N/A'}
                                </Typography>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatsOpen(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default TemplateManager; 