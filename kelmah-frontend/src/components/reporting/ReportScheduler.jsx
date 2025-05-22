import React, { useState } from 'react';
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
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { Schedule, Add, Delete } from '@mui/icons-material';

function ReportScheduler() {
    const [schedules, setSchedules] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newSchedule, setNewSchedule] = useState({
        schedule: '',
        reportType: 'performance',
        format: 'xlsx',
        recipients: []
    });

    const handleSchedule = async () => {
        try {
            const response = await api.post('/api/reports/schedule', newSchedule);
            setSchedules([...schedules, response.data]);
            setDialogOpen(false);
        } catch (error) {
            console.error('Failed to schedule report:', error);
        }
    };

    return (
        <Box>
            <Button
                startIcon={<Add />}
                onClick={() => setDialogOpen(true)}
            >
                Schedule Report
            </Button>

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Schedule Report</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Cron Schedule"
                            value={newSchedule.schedule}
                            onChange={(e) => setNewSchedule(prev => ({
                                ...prev,
                                schedule: e.target.value
                            }))}
                            helperText="e.g., 0 0 * * * for daily at midnight"
                        />
                        
                        <FormControl>
                            <InputLabel>Report Type</InputLabel>
                            <Select
                                value={newSchedule.reportType}
                                onChange={(e) => setNewSchedule(prev => ({
                                    ...prev,
                                    reportType: e.target.value
                                }))}
                            >
                                <MenuItem value="performance">Performance Report</MenuItem>
                                <MenuItem value="coverage">Coverage Report</MenuItem>
                                <MenuItem value="patterns">Pattern Analysis</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Add more configuration options */}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSchedule} variant="contained">
                        Schedule
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default ReportScheduler; 