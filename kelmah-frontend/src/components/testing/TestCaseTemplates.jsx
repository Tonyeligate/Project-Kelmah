import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Chip,
    Tooltip,
    CircularProgress,
    Alert,
    Menu,
    MenuItem
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    ContentCopy,
    MoreVert,
    Category,
    Code,
    Save
} from '@mui/icons-material';
import { JsonEditor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';
import { useSnackbar } from 'notistack';

function TestCaseTemplates() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        input_schema: {},
        output_schema: {},
        assertions: [],
        variables: {},
        tags: []
    });

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/test-templates');
            setTemplates(response.data);
        } catch (error) {
            enqueueSnackbar('Error loading templates', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTemplate = async () => {
        try {
            if (editMode) {
                await api.put(`/api/test-templates/${selectedTemplate.id}`, formData);
                enqueueSnackbar('Template updated successfully', { variant: 'success' });
            } else {
                await api.post('/api/test-templates', formData);
                enqueueSnackbar('Template created successfully', { variant: 'success' });
            }
            setDialogOpen(false);
            loadTemplates();
        } catch (error) {
            enqueueSnackbar('Error saving template', { variant: 'error' });
        }
    };

    const handleDeleteTemplate = async (templateId) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;

        try {
            await api.delete(`/api/test-templates/${templateId}`);
            enqueueSnackbar('Template deleted successfully', { variant: 'success' });
            loadTemplates();
        } catch (error) {
            enqueueSnackbar('Error deleting template', { variant: 'error' });
        }
    };

    const handleEditTemplate = (template) => {
        setSelectedTemplate(template);
        setFormData({
            name: template.name,
            description: template.description,
            category: template.category,
            input_schema: template.input_schema,
            output_schema: template.output_schema,
            assertions: template.assertions,
            variables: template.variables,
            tags: template.tags
        });
        setEditMode(true);
        setDialogOpen(true);
    };

    const handleDuplicateTemplate = async (template) => {
        try {
            const duplicatedTemplate = {
                ...template,
                name: `${template.name} (Copy)`,
                id: undefined
            };
            await api.post('/api/test-templates', duplicatedTemplate);
            enqueueSnackbar('Template duplicated successfully', { variant: 'success' });
            loadTemplates();
        } catch (error) {
            enqueueSnackbar('Error duplicating template', { variant: 'error' });
        }
    };

    const handleCreateFromTemplate = (template) => {
        // Navigate to test case creation with template data
        // This would be implemented based on your routing setup
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">Test Case Templates</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => {
                        setSelectedTemplate(null);
                        setFormData({
                            name: '',
                            description: '',
                            category: '',
                            input_schema: {},
                            output_schema: {},
                            assertions: [],
                            variables: {},
                            tags: []
                        });
                        setEditMode(false);
                        setDialogOpen(true);
                    }}
                >
                    Create Template
                </Button>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {templates.map((template) => (
                        <Grid item xs={12} md={6} lg={4} key={template.id}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6">{template.name}</Typography>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                setSelectedTemplate(template);
                                                setMenuAnchorEl(e.currentTarget);
                                            }}
                                        >
                                            <MoreVert />
                                        </IconButton>
                                    </Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        {template.description}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                        <Chip
                                            size="small"
                                            icon={<Category />}
                                            label={template.category}
                                        />
                                        {template.tags.map((tag) => (
                                            <Chip
                                                key={tag}
                                                size="small"
                                                label={tag}
                                            />
                                        ))}
                                    </Box>
                                </CardContent>
                                <CardActions>
                                    <Button
                                        size="small"
                                        startIcon={<ContentCopy />}
                                        onClick={() => handleDuplicateTemplate(template)}
                                    >
                                        Duplicate
                                    </Button>
                                    <Button
                                        size="small"
                                        startIcon={<Add />}
                                        onClick={() => handleCreateFromTemplate(template)}
                                    >
                                        Use Template
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Template Menu */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={() => setMenuAnchorEl(null)}
            >
                <MenuItem onClick={() => {
                    handleEditTemplate(selectedTemplate);
                    setMenuAnchorEl(null);
                }}>
                    <Edit sx={{ mr: 1 }} /> Edit
                </MenuItem>
                <MenuItem onClick={() => {
                    handleDuplicateTemplate(selectedTemplate);
                    setMenuAnchorEl(null);
                }}>
                    <ContentCopy sx={{ mr: 1 }} /> Duplicate
                </MenuItem>
                <MenuItem onClick={() => {
                    handleDeleteTemplate(selectedTemplate.id);
                    setMenuAnchorEl(null);
                }}>
                    <Delete sx={{ mr: 1 }} /> Delete
                </MenuItem>
            </Menu>

            {/* Template Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {editMode ? 'Edit Template' : 'Create Template'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Template Name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    name: e.target.value
                                }))}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    description: e.target.value
                                }))}
                            />
                        </Grid>
                        {/* Add more form fields for other template properties */}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveTemplate}
                        startIcon={<Save />}
                    >
                        {editMode ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default TestCaseTemplates; 