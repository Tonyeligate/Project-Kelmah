import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Chip
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    ContentCopy
} from '@mui/icons-material';
import api from '../../api/axios';

const TEMPLATE_CATEGORIES = [
    'payment_not_received',
    'incorrect_amount',
    'service_not_delivered',
    'quality_issues',
    'general'
];

function DisputeTemplateManager() {
    const [templates, setTemplates] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        content: '',
        variables: ''
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/api/admin/dispute-templates');
            setTemplates(response.data);
        } catch (error) {
            setError(error.response?.data?.message || 'Error loading templates');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedTemplate) {
                await api.put(`/api/admin/dispute-templates/${selectedTemplate.id}`, formData);
            } else {
                await api.post('/api/admin/dispute-templates', formData);
            }
            setDialogOpen(false);
            fetchTemplates();
            resetForm();
        } catch (error) {
            setError(error.response?.data?.message || 'Error saving template');
        }
    };

    const handleEdit = (template) => {
        setSelectedTemplate(template);
        setFormData({
            title: template.title,
            category: template.category,
            content: template.content,
            variables: template.variables.join(', ')
        });
        setDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this template?')) {
            try {
                await api.delete(`/api/admin/dispute-templates/${id}`);
                fetchTemplates();
            } catch (error) {
                setError(error.response?.data?.message || 'Error deleting template');
            }
        }
    };

    const resetForm = () => {
        setSelectedTemplate(null);
        setFormData({
            title: '',
            category: '',
            content: '',
            variables: ''
        });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">
                    Dispute Resolution Templates
                </Typography>
                <Button
                    startIcon={<Add />}
                    variant="contained"
                    onClick={() => {
                        resetForm();
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

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Variables</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {templates.map((template) => (
                            <TableRow key={template.id}>
                                <TableCell>{template.title}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={template.category}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>
                                    {template.variables.map(variable => (
                                        <Chip
                                            key={variable}
                                            label={variable}
                                            size="small"
                                            sx={{ mr: 0.5 }}
                                        />
                                    ))}
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEdit(template)}
                                    >
                                        <Edit />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDelete(template.id)}
                                    >
                                        <Delete />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            navigator.clipboard.writeText(template.content);
                                        }}
                                    >
                                        <ContentCopy />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

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
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                            <TextField
                                label="Title"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    title: e.target.value
                                }))}
                                required
                            />

                            <FormControl required>
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

                            <TextField
                                label="Content"
                                multiline
                                rows={6}
                                value={formData.content}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    content: e.target.value
                                }))}
                                required
                                helperText="Use {{variable}} syntax for template variables"
                            />

                            <TextField
                                label="Variables"
                                value={formData.variables}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    variables: e.target.value
                                }))}
                                helperText="Comma-separated list of variable names"
                            />
                        </Box>
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
        </Box>
    );
}

export default DisputeTemplateManager; 