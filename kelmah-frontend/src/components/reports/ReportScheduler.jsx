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
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton
} from '@mui/material';
import {
    Add,
    Delete,
    Edit,
    Schedule,
    Email
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../api/axios';

function ReportScheduler() {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [error, setError] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    const [formData, setFormData] = useState({
        name: '',
        type: '',
        frequency: '',
        recipients: '',
        filters: {},
        format: 'pdf'
    });

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/reports/schedules');
            setSchedules(response.data);
        } catch (error) {
            setError('Error loading schedules');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                recipients: formData.recipients.split(',').map(r => r.trim()),
                filters: JSON.parse(formData.filters || '{}')
            };

            if (selectedSchedule) {
                await api.put(`/api/reports/schedules/${selectedSchedule.id}`, data);
                enqueueSnackbar('Schedule updated successfully', { variant: 'success' });
            } else {
                await api.post('/api/reports/schedules', data);
                enqueueSnackbar('Schedule created successfully', { variant: 'success' });
            }

            setDialogOpen(false);
            loadSchedules();
        } catch (error) {
            enqueueSnackbar(error.response?.data?.message || 'Error saving schedule', { 
                variant: 'error' 
            });
        }
    };

    const handleDelete = async (scheduleId) => {
        if (window.confirm('Are you sure you want to delete this schedule?')) {
            try {
                await api.delete(`/api/reports/schedules/${scheduleId}`);
                enqueueSnackbar('Schedule deleted successfully', { variant: 'success' });
                loadSchedules();
            } catch (error) {
                enqueueSnackbar('Error deleting schedule', { variant: 'error' });
            }
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
                        Scheduled Reports
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setSelectedSchedule(null);
                            setFormData({
                                name: '',
                                type: '',
                                frequency: '',
                                recipients: '',
                                filters: {},
                                format: 'pdf'
                            });
                            setDialogOpen(true);
                        }}
                    >
                        New Schedule
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <List>
                    {schedules.map((schedule) => (
                        <ListItem key={schedule.id}>
                            <ListItemText
                                primary={schedule.name}
                                secondary={`${schedule.type} - ${schedule.frequency}`}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                    size="small"
                                    label={`Next run: ${new Date(schedule.next_run).toLocaleString()}`}
                                    color="primary"
                                    variant="outlined"
                                />
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setSelectedSchedule(schedule);
                                        setFormData({
                                            name: schedule.name,
                                            type: schedule.type,
                                            frequency: schedule.frequency,
                                            recipients: JSON.parse(schedule.recipients).join(', '),
                                            filters: JSON.stringify(JSON.parse(schedule.filters), null, 2),
                                            format: schedule.format
                                        });
                                        setDialogOpen(true);
                                    }}
                                >
                                    <Edit />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => handleDelete(schedule.id)}
                                >
                                    <Delete />
                                </IconButton>
                            </Box>
                        </ListItem>
                    ))}
                </List>
            </Paper>

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <form onSubmit={handleSubmit}>
                    <DialogTitle>
                        {selectedSchedule ? 'Edit Schedule' : 'New Schedule'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Schedule Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        name: e.target.value
                                    }))}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Report Type</InputLabel>
                                    <Select
                                        value={formData.type}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            type: e.target.value
                                        }))}
                                        label="Report Type"
                                    >
                                        <MenuItem value="daily_summary">Daily Summary</MenuItem>
                                        <MenuItem value="weekly_analytics">Weekly Analytics</MenuItem>
                                        <MenuItem value="monthly_performance">Monthly Performance</MenuItem>
                                        <MenuItem value="custom_report">Custom Report</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Frequency</InputLabel>
                                    <Select
                                        value={formData.frequency}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            frequency: e.target.value
                                        }))}
                                        label="Frequency"
                                    >
                                        <MenuItem value="daily">Daily</MenuItem>
                                        <MenuItem value="weekly">Weekly</MenuItem>
                                        <MenuItem value="monthly">Monthly</MenuItem>
                                        <MenuItem value="custom">Custom</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Recipients"
                                    value={formData.recipients}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        recipients: e.target.value
                                    }))}
                                    helperText="Comma-separated email addresses"
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Filters"
                                    value={formData.filters}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        filters: e.target.value
                                    }))}
                                    helperText="JSON format filters"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Format</InputLabel>
                                    <Select
                                        value={formData.format}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            format: e.target.value
                                        }))}
                                        label="Format"
                                    >
                                        <MenuItem value="pdf">PDF</MenuItem>
                                        <MenuItem value="excel">Excel</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained">
                            {selectedSchedule ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}

export default ReportScheduler; 