import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid
} from '@mui/material';

function ExportScheduleDialog({ open, onClose, config }) {
    const [schedule, setSchedule] = useState({
        frequency: 'daily',
        time: '00:00',
        recipients: '',
        format: config.format
    });

    const handleSchedule = async () => {
        try {
            await api.post('/api/export/schedule', {
                ...schedule,
                config
            });
            onClose();
        } catch (error) {
            console.error('Failed to schedule export:', error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Schedule Export</DialogTitle>
            <DialogContent>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Frequency</InputLabel>
                            <Select
                                value={schedule.frequency}
                                onChange={(e) => setSchedule(prev => ({
                                    ...prev,
                                    frequency: e.target.value
                                }))}
                            >
                                <MenuItem value="daily">Daily</MenuItem>
                                <MenuItem value="weekly">Weekly</MenuItem>
                                <MenuItem value="monthly">Monthly</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            type="time"
                            label="Time"
                            value={schedule.time}
                            onChange={(e) => setSchedule(prev => ({
                                ...prev,
                                time: e.target.value
                            }))}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Recipients (comma-separated emails)"
                            value={schedule.recipients}
                            onChange={(e) => setSchedule(prev => ({
                                ...prev,
                                recipients: e.target.value
                            }))}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSchedule}>
                    Schedule
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ExportScheduleDialog; 