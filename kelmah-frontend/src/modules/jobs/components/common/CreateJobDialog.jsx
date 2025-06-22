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
    Alert,
    InputAdornment,
    FormHelperText,
    Chip
} from '@mui/material';
import { AttachMoney } from '@mui/icons-material';
import { createJob } from '../../../jobs/services/jobSlice';
import PropTypes from 'prop-types';

const JOB_TYPES = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'one_time', label: 'One Time Project' }
];

const PAYMENT_TYPES = [
    { value: 'fixed', label: 'Fixed Price' },
    { value: 'hourly', label: 'Hourly Rate' },
];

const EXPERIENCE_LEVELS = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'expert', label: 'Expert' }
];

const PROFESSIONS = [
    'Web Development',
    'Mobile Development',
    'UI/UX Design',
    'Data Science',
    'DevOps',
    'Digital Marketing',
    'Content Writing',
    'Other'
];

function CreateJobDialog({ 
    open = false, 
    onClose = () => {}, 
    onSuccess = () => {} 
}) {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [skills, setSkills] = useState([]);
    const [skillInput, setSkillInput] = useState('');
    const [errors, setErrors] = useState({});
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        jobType: '',
        paymentType: 'fixed',
        experience: 'intermediate',
        budget: '',
        currency: 'GHS',
        location: '',
        skills: [],
        applicationDeadline: ''
    });

    const handleChange = (field) => (event) => {
        setFormData(prev => ({
            ...prev,
            [field]: event.target.value
        }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleAddSkill = () => {
        if (skillInput.trim() && !skills.includes(skillInput.trim())) {
            const newSkills = [...skills, skillInput.trim()];
            setSkills(newSkills);
            setFormData(prev => ({ ...prev, skills: newSkills }));
            setSkillInput('');
            if (errors.skills) {
                setErrors(prev => ({ ...prev, skills: null }));
            }
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        const newSkills = skills.filter(skill => skill !== skillToRemove);
        setSkills(newSkills);
        setFormData(prev => ({ ...prev, skills: newSkills }));
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.title) newErrors.title = 'Title is required';
        if (!formData.description) newErrors.description = 'Description is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.jobType) newErrors.jobType = 'Job type is required';
        if (!formData.paymentType) newErrors.paymentType = 'Payment type is required';
        if (!formData.experience) newErrors.experience = 'Experience level is required';
        if (!formData.budget) newErrors.budget = 'Budget is required';
        
        if (formData.budget && (isNaN(formData.budget) || parseFloat(formData.budget) <= 0)) {
            newErrors.budget = 'Budget must be a positive number';
        }
        
        if (formData.skills.length === 0) {
            newErrors.skills = 'At least one skill is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        
        try {
            setLoading(true);
            setError(null);
            
            const result = await dispatch(createJob(formData)).unwrap();
            onSuccess?.(result);
            onClose();
            
        } catch (err) {
            setError(err.message || 'Failed to create job');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSkill();
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>Create New Job</DialogTitle>
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
                            label="Job Title"
                            required
                            value={formData.title}
                            onChange={handleChange('title')}
                            error={!!errors.title}
                            helperText={errors.title}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Description"
                            required
                            multiline
                            rows={4}
                            value={formData.description}
                            onChange={handleChange('description')}
                            error={!!errors.description}
                            helperText={errors.description}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth required error={!!errors.category}>
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={formData.category}
                                onChange={handleChange('category')}
                                label="Category"
                            >
                                {PROFESSIONS.map((prof) => (
                                    <MenuItem key={prof} value={prof}>
                                        {prof}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth required error={!!errors.jobType}>
                            <InputLabel>Job Type</InputLabel>
                            <Select
                                value={formData.jobType}
                                onChange={handleChange('jobType')}
                                label="Job Type"
                            >
                                {JOB_TYPES.map((type) => (
                                    <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.jobType && <FormHelperText>{errors.jobType}</FormHelperText>}
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth required error={!!errors.paymentType}>
                            <InputLabel>Payment Type</InputLabel>
                            <Select
                                value={formData.paymentType}
                                onChange={handleChange('paymentType')}
                                label="Payment Type"
                            >
                                {PAYMENT_TYPES.map((type) => (
                                    <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.paymentType && <FormHelperText>{errors.paymentType}</FormHelperText>}
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth required error={!!errors.experience}>
                            <InputLabel>Experience Level</InputLabel>
                            <Select
                                value={formData.experience}
                                onChange={handleChange('experience')}
                                label="Experience Level"
                            >
                                {EXPERIENCE_LEVELS.map((level) => (
                                    <MenuItem key={level.value} value={level.value}>
                                        {level.label}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.experience && <FormHelperText>{errors.experience}</FormHelperText>}
                        </FormControl>
                    </Grid>

                    <Grid item xs={8} md={4}>
                        <TextField
                            fullWidth
                            label="Budget"
                            required
                            type="number"
                            value={formData.budget}
                            onChange={handleChange('budget')}
                            error={!!errors.budget}
                            helperText={errors.budget}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AttachMoney />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    <Grid item xs={4} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Currency</InputLabel>
                            <Select
                                value={formData.currency}
                                onChange={handleChange('currency')}
                                label="Currency"
                            >
                                <MenuItem value="GHS">GHS</MenuItem>
                                <MenuItem value="USD">USD</MenuItem>
                                <MenuItem value="EUR">EUR</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Location"
                            value={formData.location}
                            onChange={handleChange('location')}
                            placeholder="Remote or specific location"
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <FormControl fullWidth error={!!errors.skills}>
                            <TextField
                                fullWidth
                                label="Required Skills"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type skill and press Enter"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Button 
                                                onClick={handleAddSkill}
                                                disabled={!skillInput.trim()}
                                            >
                                                Add
                                            </Button>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            {errors.skills && <FormHelperText>{errors.skills}</FormHelperText>}
                        </FormControl>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            {skills.map((skill) => (
                                <Chip
                                    key={skill}
                                    label={skill}
                                    onDelete={() => handleRemoveSkill(skill)}
                                />
                            ))}
                        </Box>
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Application Deadline"
                            type="date"
                            value={formData.applicationDeadline}
                            onChange={handleChange('applicationDeadline')}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    color="primary"
                >
                    {loading ? 'Creating...' : 'Create Job'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

CreateJobDialog.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func,
    onSuccess: PropTypes.func
};

export default CreateJobDialog;

