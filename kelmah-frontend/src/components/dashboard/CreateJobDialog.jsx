import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    MenuItem,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import { createJob } from '../../store/slices/jobSlice'; // Make sure this path is correct

function CreateJobDialog({ open, onClose, onSuccess }) {
    const dispatch = useDispatch();
    const [jobData, setJobData] = useState({
        title: '',
        description: '',
        profession: '',  // Changed from category
        job_type: 'contract', // Added job_type
        budget: '',
        location: '',
        skills_required: '',  // Changed from skillsRequired
        deadline: ''  // Added deadline
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setJobData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            // Dispatch the createJob action
            await dispatch(createJob(jobData)).unwrap();
            onSuccess?.();
            onClose();
            // Reset form
            setJobData({
                title: '',
                description: '',
                profession: '',
                job_type: 'contract',
                budget: '',
                location: '',
                skills_required: '',
                deadline: ''
            });
        } catch (error) {
            console.error('Failed to create job:', error);
            // You might want to show an error message to the user here
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Create New Job</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Job Title"
                            name="title"
                            value={jobData.title}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            multiline
                            rows={4}
                            value={jobData.description}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required>
                            <InputLabel>Profession</InputLabel>
                            <Select
                                name="profession"
                                value={jobData.profession}
                                onChange={handleChange}
                                label="Profession"
                            >
                                <MenuItem value="Plumbing">Plumbing</MenuItem>
                                <MenuItem value="Electrical">Electrical</MenuItem>
                                <MenuItem value="Carpentry">Carpentry</MenuItem>
                                <MenuItem value="Painting">Painting</MenuItem>
                                <MenuItem value="Other">Other</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required>
                            <InputLabel>Job Type</InputLabel>
                            <Select
                                name="job_type"
                                value={jobData.job_type}
                                onChange={handleChange}
                                label="Job Type"
                            >
                                <MenuItem value="contract">Contract</MenuItem>
                                <MenuItem value="permanent">Permanent</MenuItem>
                                <MenuItem value="part_time">Part Time</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Budget"
                            name="budget"
                            type="number"
                            value={jobData.budget}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Location"
                            name="location"
                            value={jobData.location}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Skills Required"
                            name="skills_required"
                            value={jobData.skills_required}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Deadline"
                            name="deadline"
                            type="date"
                            value={jobData.deadline}
                            onChange={handleChange}
                            required
                            InputLabelProps={{
                                shrink: true,
                            }}
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
                    Create Job
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default CreateJobDialog;