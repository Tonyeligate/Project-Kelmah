import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';

function CreateEventDialog({ open, onClose, onSuccess }) {
    const [eventData, setEventData] = useState({
        title: '',
        description: '',
        type: '',
        startTime: '',
        endTime: '',
        location: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEventData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = () => {
        // Here you would typically make an API call to create the event
        console.log('Creating event:', eventData);
        // For now, we'll just simulate success
        onSuccess();
        // Reset form
        setEventData({
            title: '',
            description: '',
            type: '',
            startTime: '',
            endTime: '',
            location: ''
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Meeting Title"
                            name="title"
                            value={eventData.title}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            multiline
                            rows={3}
                            value={eventData.description}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Meeting Type</InputLabel>
                            <Select
                                name="type"
                                value={eventData.type}
                                onChange={handleChange}
                                label="Meeting Type"
                            >
                                <MenuItem value="interview">Interview</MenuItem>
                                <MenuItem value="discussion">Discussion</MenuItem>
                                <MenuItem value="site-visit">Site Visit</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Start Time"
                            name="startTime"
                            type="datetime-local"
                            value={eventData.startTime}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="End Time"
                            name="endTime"
                            type="datetime-local"
                            value={eventData.endTime}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Location"
                            name="location"
                            value={eventData.location}
                            onChange={handleChange}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    color="primary"
                >
                    Schedule Meeting
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default CreateEventDialog; 