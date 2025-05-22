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
    Dialog,
    TextField,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Chip
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    FileCopy,
    Save,
    Preview
} from '@mui/icons-material';

function ExportTemplateManager() {
    const [templates, setTemplates] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [previewData, setPreviewData] = useState(null);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        const response = await api.get('/api/export-templates');
        setTemplates(response.data);
    };

    const handleSaveTemplate = async (templateData) => {
        if (selectedTemplate) {
            await api.put(`/api/export-templates/${selectedTemplate.id}`, templateData);
        } else {
            await api.post('/api/export-templates', templateData);
        }
        await loadTemplates();
        setDialogOpen(false);
    };

    const handlePreview = async (template) => {
        const response = await api.post('/api/export-templates/preview', template);
        setPreviewData(response.data);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Export Templates</Typography>
                <Button
                    startIcon={<Add />}
                    variant="contained"
                    onClick={() => {
                        setSelectedTemplate(null);
                        setDialogOpen(true);
                    }}
                >
                    Create Template
                </Button>
            </Box>

            <Grid container spacing={3}>
                {templates.map(template => (
                    <Grid item xs={12} md={4} key={template.id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {template.name}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                    <Chip label={template.format} size="small" />
                                    <Chip label={`${template.sections.length} sections`} size="small" />
                                </Box>
                                <Typography variant="body2" color="textSecondary">
                                    {template.description}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button
                                    size="small"
                                    startIcon={<Preview />}
                                    onClick={() => handlePreview(template)}
                                >
                                    Preview
                                </Button>
                                <Button
                                    size="small"
                                    startIcon={<Edit />}
                                    onClick={() => {
                                        setSelectedTemplate(template);
                                        setDialogOpen(true);
                                    }}
                                >
                                    Edit
                                </Button>
                                <Button
                                    size="small"
                                    startIcon={<FileCopy />}
                                >
                                    Duplicate
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <TemplateDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={handleSaveTemplate}
                template={selectedTemplate}
            />

            <PreviewDialog
                open={Boolean(previewData)}
                onClose={() => setPreviewData(null)}
                data={previewData}
            />
        </Box>
    );
}

// Version comparison UI
function VersionComparisonUI({ resourceId }) {
    const [versions, setVersions] = useState([]);
    const [selectedVersions, setSelectedVersions] = useState([]);
    const [diffData, setDiffData] = useState(null);

    useEffect(() => {
        loadVersions();
    }, [resourceId]);

    const loadVersions = async () => {
        const response = await api.get(`/api/versions/${resourceId}`);
        setVersions(response.data);
    };

    const handleCompare = async () => {
        if (selectedVersions.length !== 2) return;

        const response = await api.post('/api/versions/compare', {
            resourceId,
            version1: selectedVersions[0],
            version2: selectedVersions[1]
        });

        setDiffData(response.data);
    };

    const handleVersionSelect = (version) => {
        if (selectedVersions.includes(version)) {
            setSelectedVersions(selectedVersions.filter(v => v !== version));
        } else if (selectedVersions.length < 2) {
            setSelectedVersions([...selectedVersions, version]);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Version History</Typography>

            <List>
                {versions.map(version => (
                    <ListItem
                        key={version.id}
                        button
                        selected={selectedVersions.includes(version.id)}
                        onClick={() => handleVersionSelect(version.id)}
                    >
                        <ListItemText
                            primary={`Version ${version.number}`}
                            secondary={
                                <Box>
                                    <Typography variant="caption" display="block">
                                        {new Date(version.timestamp).toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {version.message}
                                    </Typography>
                                </Box>
                            }
                        />
                        <ListItemSecondaryAction>
                            <Button
                                size="small"
                                onClick={() => handleRestore(version.id)}
                            >
                                Restore
                            </Button>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>

            {selectedVersions.length === 2 && (
                <Button
                    variant="contained"
                    onClick={handleCompare}
                    sx={{ mt: 2 }}
                >
                    Compare Versions
                </Button>
            )}

            {diffData && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Changes
                    </Typography>
                    <Box
                        sx={{
                            bgcolor: 'background.paper',
                            p: 2,
                            borderRadius: 1,
                            maxHeight: 400,
                            overflow: 'auto'
                        }}
                    >
                        {diffData.changes.map((change, index) => (
                            <Box
                                key={index}
                                sx={{
                                    p: 1,
                                    mb: 1,
                                    bgcolor: change.type === 'add' ? 'success.light' :
                                        change.type === 'remove' ? 'error.light' : 'warning.light',
                                    borderRadius: 1
                                }}
                            >
                                <Typography variant="body2">
                                    {change.content}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}
        </Paper>
    );
}

export { ExportTemplateManager, VersionComparisonUI }; 