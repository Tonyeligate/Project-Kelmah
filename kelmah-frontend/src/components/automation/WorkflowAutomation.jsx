import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    Switch,
    FormControlLabel,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    DragIndicator,
    Save
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useSnackbar } from 'notistack';
import api from '../../api/axios';

function WorkflowAutomation() {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState(null);
    const [error, setError] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        conditions: '',
        actions: '',
        priority: 0,
        is_active: true
    });

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/automation/rules');
            setRules(response.data);
        } catch (error) {
            setError('Error loading automation rules');
            enqueueSnackbar('Error loading rules', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                conditions: JSON.parse(formData.conditions),
                actions: JSON.parse(formData.actions)
            };

            if (selectedRule) {
                await api.put(`/api/automation/rules/${selectedRule.id}`, data);
                enqueueSnackbar('Rule updated successfully', { variant: 'success' });
            } else {
                await api.post('/api/automation/rules', data);
                enqueueSnackbar('Rule created successfully', { variant: 'success' });
            }

            setDialogOpen(false);
            loadRules();
        } catch (error) {
            enqueueSnackbar(error.response?.data?.message || 'Error saving rule', { 
                variant: 'error' 
            });
        }
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const items = Array.from(rules);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setRules(items);

        try {
            await api.post('/api/automation/rules/reorder', {
                ruleIds: items.map(rule => rule.id)
            });
        } catch (error) {
            enqueueSnackbar('Error updating rule order', { variant: 'error' });
            loadRules(); // Reload original order
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
                        Workflow Automation Rules
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setSelectedRule(null);
                            setFormData({
                                name: '',
                                description: '',
                                conditions: '[]',
                                actions: '[]',
                                priority: 0,
                                is_active: true
                            });
                            setDialogOpen(true);
                        }}
                    >
                        New Rule
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="rules">
                        {(provided) => (
                            <List {...provided.droppableProps} ref={provided.innerRef}>
                                {rules.map((rule, index) => (
                                    <Draggable 
                                        key={rule.id} 
                                        draggableId={rule.id.toString()} 
                                        index={index}
                                    >
                                        {(provided) => (
                                            <ListItem
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                sx={{ 
                                                    border: '1px solid #eee',
                                                    mb: 1,
                                                    borderRadius: 1
                                                }}
                                            >
                                                <Box {...provided.dragHandleProps} sx={{ mr: 2 }}>
                                                    <DragIndicator />
                                                </Box>
                                                <ListItemText
                                                    primary={rule.name}
                                                    secondary={rule.description}
                                                />
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Chip
                                                        size="small"
                                                        label={`Priority: ${rule.priority}`}
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                checked={rule.is_active}
                                                                onChange={async (e) => {
                                                                    try {
                                                                        await api.patch(
                                                                            `/api/automation/rules/${rule.id}`,
                                                                            { is_active: e.target.checked }
                                                                        );
                                                                        loadRules();
                                                                    } catch (error) {
                                                                        enqueueSnackbar(
                                                                            'Error updating rule status',
                                                                            { variant: 'error' }
                                                                        );
                                                                    }
                                                                }}
                                                                size="small"
                                                            />
                                                        }
                                                        label="Active"
                                                    />
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setSelectedRule(rule);
                                                            setFormData({
                                                                name: rule.name,
                                                                description: rule.description,
                                                                conditions: JSON.stringify(
                                                                    JSON.parse(rule.conditions),
                                                                    null,
                                                                    2
                                                                ),
                                                                actions: JSON.stringify(
                                                                    JSON.parse(rule.actions),
                                                                    null,
                                                                    2
                                                                ),
                                                                priority: rule.priority,
                                                                is_active: rule.is_active
                                                            });
                                                            setDialogOpen(true);
                                                        }}
                                                    >
                                                        <Edit />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={async () => {
                                                            if (window.confirm('Delete this rule?')) {
                                                                try {
                                                                    await api.delete(
                                                                        `/api/automation/rules/${rule.id}`
                                                                    );
                                                                    enqueueSnackbar(
                                                                        'Rule deleted successfully',
                                                                        { variant: 'success' }
                                                                    );
                                                                    loadRules();
                                                                } catch (error) {
                                                                    enqueueSnackbar(
                                                                        'Error deleting rule',
                                                                        { variant: 'error' }
                                                                    );
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Box>
                                            </ListItem>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </List>
                        )}
                    </Droppable>
                </DragDropContext>
            </Paper>

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <form onSubmit={handleSubmit}>
                    <DialogTitle>
                        {selectedRule ? 'Edit Rule' : 'New Rule'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Rule Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        name: e.target.value
                                    }))}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        description: e.target.value
                                    }))}
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Conditions"
                                    value={formData.conditions}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        conditions: e.target.value
                                    }))}
                                    multiline
                                    rows={4}
                                    helperText="JSON format conditions"
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Actions"
                                    value={formData.actions}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        actions: e.target.value
                                    }))}
                                    multiline
                                    rows={4}
                                    helperText="JSON format actions"
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Priority"
                                    value={formData.priority}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        priority: parseInt(e.target.value)
                                    }))}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                is_active: e.target.checked
                                            }))}
                                        />
                                    }
                                    label="Active"
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained">
                            {selectedRule ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}

export default WorkflowAutomation; 