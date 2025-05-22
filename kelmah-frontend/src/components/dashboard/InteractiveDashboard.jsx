import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
    Box,
    Grid,
    Paper,
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    Button
} from '@mui/material';
import {
    MoreVert,
    Add,
    Edit,
    Delete,
    Settings
} from '@mui/icons-material';
import ChartConfigurator from '../visualization/ChartConfigurator';

function InteractiveDashboard() {
    const [widgets, setWidgets] = useState([]);
    const [layout, setLayout] = useState([]);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedWidget, setSelectedWidget] = useState(null);
    const [configOpen, setConfigOpen] = useState(false);

    useEffect(() => {
        loadDashboardConfig();
    }, []);

    const loadDashboardConfig = async () => {
        try {
            const response = await api.get('/api/dashboard/config');
            setWidgets(response.data.widgets);
            setLayout(response.data.layout);
        } catch (error) {
            console.error('Failed to load dashboard config:', error);
        }
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const newLayout = Array.from(layout);
        const [removed] = newLayout.splice(result.source.index, 1);
        newLayout.splice(result.destination.index, 0, removed);

        setLayout(newLayout);
        saveDashboardConfig({ ...widgets, layout: newLayout });
    };

    const handleWidgetConfig = async (widgetId, config) => {
        const updatedWidgets = widgets.map(w =>
            w.id === widgetId ? { ...w, config } : w
        );
        setWidgets(updatedWidgets);
        await saveDashboardConfig({ widgets: updatedWidgets, layout });
    };

    const saveDashboardConfig = async (config) => {
        try {
            await api.post('/api/dashboard/config', config);
        } catch (error) {
            console.error('Failed to save dashboard config:', error);
        }
    };

    return (
        <Box>
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="dashboard">
                    {(provided) => (
                        <Grid
                            container
                            spacing={3}
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {layout.map((widgetId, index) => {
                                const widget = widgets.find(w => w.id === widgetId);
                                return (
                                    <Draggable
                                        key={widgetId}
                                        draggableId={widgetId}
                                        index={index}
                                    >
                                        {(provided) => (
                                            <Grid
                                                item
                                                xs={12}
                                                md={widget.size || 6}
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                            >
                                                <Paper
                                                    sx={{
                                                        p: 2,
                                                        position: 'relative',
                                                        '&:hover .widget-actions': {
                                                            opacity: 1
                                                        }
                                                    }}
                                                >
                                                    <Box
                                                        {...provided.dragHandleProps}
                                                        className="widget-actions"
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 8,
                                                            right: 8,
                                                            opacity: 0,
                                                            transition: 'opacity 0.2s'
                                                        }}
                                                    >
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                setMenuAnchor(e.currentTarget);
                                                                setSelectedWidget(widget);
                                                            }}
                                                        >
                                                            <MoreVert />
                                                        </IconButton>
                                                    </Box>
                                                    {/* Render widget content based on type */}
                                                </Paper>
                                            </Grid>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}
                        </Grid>
                    )}
                </Droppable>
            </DragDropContext>

            {/* Widget Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
            >
                <MenuItem onClick={() => {
                    setConfigOpen(true);
                    setMenuAnchor(null);
                }}>
                    <Settings sx={{ mr: 1 }} /> Configure
                </MenuItem>
                <MenuItem onClick={() => {
                    // Handle edit
                    setMenuAnchor(null);
                }}>
                    <Edit sx={{ mr: 1 }} /> Edit
                </MenuItem>
                <MenuItem onClick={() => {
                    // Handle delete
                    setMenuAnchor(null);
                }}>
                    <Delete sx={{ mr: 1 }} /> Delete
                </MenuItem>
            </Menu>

            {/* Configuration Dialog */}
            <Dialog
                open={configOpen}
                onClose={() => setConfigOpen(false)}
                maxWidth="md"
                fullWidth
            >
                {selectedWidget && (
                    <ChartConfigurator
                        config={selectedWidget.config}
                        onChange={(config) => handleWidgetConfig(selectedWidget.id, config)}
                    />
                )}
            </Dialog>
        </Box>
    );
}

export default InteractiveDashboard; 