import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Alert
} from '@mui/material';
import { addEvent } from '../../store/slices/calendarSlice';

const EVENT_TYPES = [
    { value: 'meeting', label: 'Meeting', color: '#4CAF50' },
    { value: 'deadline', label: 'Deadline', color: '#F44336' },
    { value: 'interview', label: 'Interview', color: '#2196F3' },
    { value: 'other', label: 'Other', color: '#9C27B0' }
];

function CreateEventDialog({ open, onClose, onSuccess }) {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    const [formData, setFormData] = useState({
        title: '',
        type: 'meeting',
        start: new Date().toISOString().slice(0, 16),
        end: new Date().toISOString().slice(0, 16),
        description: '',
        location: '',
        participants: ''
    });

    const validateForm = () => {
        const errors = {};
        
        if (!formData.title.trim()) {
            errors.title = 'Title is required';
        }

        if (!formData.start) {
            errors.start = 'Start date is required';
        }

        if (!formData.end) {
            errors.end = 'End date is required';
        }

        if (formData.start && formData.end && new Date(formData.end) <= new Date(formData.start)) {
            errors.end = 'End time must be after start time';
        }

        if (formData.participants) {
            const emails = formData.participants.split(',').map(email => email.trim());
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emails.every(email => emailRegex.test(email))) {
                errors.participants = 'Invalid email format';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (field) => (event) => {
        setFormData(prev => ({
            ...prev,
            [field]: event.target.value
        }));
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const eventData = {
                ...formData,
                color: EVENT_TYPES.find(t => t.value === formData.type)?.color,
                participants: formData.participants
                    ? formData.participants.split(',').map(email => email.trim())
                    : []
            };

            const result = await dispatch(addEvent(eventData)).unwrap();
            onSuccess?.(result);
            handleClose();
        } catch (err) {
            setError(err.message || 'Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            title: '',
            type: 'meeting',
            start: new Date().toISOString().slice(0, 16),
            end: new Date().toISOString().slice(0, 16),
            description: '',
            location: '',
            participants: ''
        });
        setError(null);
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>Schedule New Event</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Event Title"
                            required
                            value={formData.title}
                            onChange={handleChange('title')}
                            error={!!validationErrors.title}
                            helperText={validationErrors.title}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth required>
                            <InputLabel>Event Type</InputLabel>
                            <Select
                                value={formData.type}
                                onChange={handleChange('type')}
                                label="Event Type"
                            >
                                {EVENT_TYPES.map((type) => (
                                    <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Location"
                            value={formData.location}
                            onChange={handleChange('location')}
                            placeholder="Physical location or meeting link"
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Start Date & Time"
                            type="datetime-local"
                            value={formData.start}
                            onChange={handleChange('start')}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            required
                            error={!!validationErrors.start}
                            helperText={validationErrors.start}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="End Date & Time"
                            type="datetime-local"
                            value={formData.end}
                            onChange={handleChange('end')}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            required
                            error={!!validationErrors.end}
                            helperText={validationErrors.end}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Description"
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={handleChange('description')}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Participants"
                            value={formData.participants}
                            onChange={handleChange('participants')}
                            placeholder="Enter email addresses separated by commas"
                            error={!!validationErrors.participants}
                            helperText={validationErrors.participants}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    color="primary"
                >
                    {loading ? 'Creating...' : 'Create Event'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default CreateEventDialog; 