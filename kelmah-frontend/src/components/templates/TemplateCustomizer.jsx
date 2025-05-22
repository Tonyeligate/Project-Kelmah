import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    Button,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Add,
    Delete,
    DragIndicator,
    Save,
    Share,
    ContentCopy
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function TemplateCustomizer({ template, onSave }) {
    const [sections, setSections] = useState(template?.sections || []);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState(null);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(sections);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setSections(items);
    };

    const handleAddSection = () => {
        setSelectedSection(null);
        setDialogOpen(true);
    };

    const handleEditSection = (section, index) => {
        setSelectedSection({ ...section, index });
        setDialogOpen(true);
    };

    const handleSaveSection = (sectionData) => {
        const newSections = [...sections];
        if (selectedSection?.index !== undefined) {
            newSections[selectedSection.index] = sectionData;
        } else {
            newSections.push(sectionData);
        }
        setSections(newSections);
        setDialogOpen(false);
    };

    const handleDeleteSection = (index) => {
        const newSections = sections.filter((_, i) => i !== index);
        setSections(newSections);
    };

    const handleShare = async () => {
        try {
            const response = await api.post('/api/templates/share', {
                template: {
                    ...template,
                    sections
                }
            });
            // Copy share link to clipboard
            navigator.clipboard.writeText(response.data.shareUrl);
            setShareDialogOpen(true);
        } catch (error) {
            console.error('Failed to share template:', error);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">Template Customization</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        startIcon={<Share />}
                        onClick={handleShare}
                    >
                        Share
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={() => onSave({ ...template, sections })}
                    >
                        Save Template
                    </Button>
                </Box>
            </Box>

            <Paper sx={{ p: 3 }}>
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="sections">
                        {(provided) => (
                            <List {...provided.droppableProps} ref={provided.innerRef}>
                                {sections.map((section, index) => (
                                    <Draggable
                                        key={index}
                                        draggableId={`section-${index}`}
                                        index={index}
                                    >
                                        {(provided) => (
                                            <ListItem
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                            >
                                                <DragIndicator sx={{ mr: 2 }} />
                                                <ListItemText
                                                    primary={section.title}
                                                    secondary={
                                                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                            <Chip
                                                                size="small"
                                                                label={section.type}
                                                            />
                                                            {section.metrics?.map((metric, i) => (
                                                                <Chip
                                                                    key={i}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    label={metric}
                                                                />
                                                            ))}
                                                        </Box>
                                                    }
                                                />
                                                <ListItemSecondaryAction>
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() => handleEditSection(section, index)}
                                                    >
                                                        <Edit />
                                                    </IconButton>
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() => handleDeleteSection(index)}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </List>
                        )}
                    </Droppable>
                </DragDropContext>

                <Button
                    startIcon={<Add />}
                    onClick={handleAddSection}
                    sx={{ mt: 2 }}
                >
                    Add Section
                </Button>
            </Paper>

            {/* Section Dialog */}
            <SectionDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={handleSaveSection}
                section={selectedSection}
            />

            {/* Share Dialog */}
            <Dialog
                open={shareDialogOpen}
                onClose={() => setShareDialogOpen(false)}
            >
                <DialogTitle>Template Shared</DialogTitle>
                <DialogContent>
                    <Typography>
                        Share link has been copied to clipboard!
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        Anyone with this link can view and duplicate this template.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShareDialogOpen(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// Section Dialog Component
function SectionDialog({ open, onClose, onSave, section }) {
    const [formData, setFormData] = useState(section || {
        title: '',
        type: 'summary',
        metrics: [],
        options: {}
    });

    useEffect(() => {
        if (section) {
            setFormData(section);
        }
    }, [section]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {section ? 'Edit Section' : 'Add Section'}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Section Title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                title: e.target.value
                            }))}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Section Type</InputLabel>
                            <Select
                                value={formData.type}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    type: e.target.value
                                }))}
                            >
                                <MenuItem value="summary">Summary</MenuItem>
                                <MenuItem value="trend">Trend</MenuItem>
                                <MenuItem value="breakdown">Breakdown</MenuItem>
                                <MenuItem value="comparison">Comparison</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    {/* Add more section configuration options */}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={() => onSave(formData)}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default TemplateCustomizer; 