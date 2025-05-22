import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    CircularProgress,
    Alert,
    IconButton,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Work as WorkIcon,
    School as SchoolIcon,
    Star as StarIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const WorkerProfileForm = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profile, setProfile] = useState({
        bio: '',
        skills: [],
        experience: [],
        education: [],
        certifications: [],
        hourlyRate: '',
        availability: {
            monday: { start: '', end: '' },
            tuesday: { start: '', end: '' },
            wednesday: { start: '', end: '' },
            thursday: { start: '', end: '' },
            friday: { start: '', end: '' },
            saturday: { start: '', end: '' },
            sunday: { start: '', end: '' }
        },
        location: '',
        languages: [],
        portfolio: ''
    });

    const [availableSkills] = useState([
        'Electrical Installation',
        'Pipe Fitting',
        'Woodworking',
        'HVAC Systems',
        'Concrete Work',
        'Interior Painting',
        'Garden Design',
        'General Repairs',
        'Plumbing',
        'Carpentry',
        'Masonry',
        'Landscaping',
        'Roofing',
        'Flooring',
        'Window Installation',
        'Door Installation'
    ]);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        description: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/worker/profile`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setProfile(response.data.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load profile. Please try again later.');
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setProfile(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSkillToggle = (skill) => {
        setProfile(prev => ({
            ...prev,
            skills: prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill]
        }));
    };

    const handleAvailabilityChange = (day, field, value) => {
        setProfile(prev => ({
            ...prev,
            availability: {
                ...prev.availability,
                [day]: {
                    ...prev.availability[day],
                    [field]: value
                }
            }
        }));
    };

    const handleOpenDialog = (type, item = null) => {
        setDialogType(type);
        if (item) {
            setEditingItem(item);
            setFormData(item);
        } else {
            setEditingItem(null);
            setFormData({
                title: '',
                company: '',
                startDate: '',
                endDate: '',
                description: ''
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setDialogType(null);
        setEditingItem(null);
        setFormData({
            title: '',
            company: '',
            startDate: '',
            endDate: '',
            description: ''
        });
    };

    const handleAddItem = () => {
        if (!formData.title) return;

        setProfile(prev => ({
            ...prev,
            [dialogType]: [
                ...prev[dialogType],
                { ...formData, id: Date.now() }
            ]
        }));
        handleCloseDialog();
    };

    const handleUpdateItem = () => {
        if (!formData.title) return;

        setProfile(prev => ({
            ...prev,
            [dialogType]: prev[dialogType].map(item =>
                item.id === editingItem.id ? formData : item
            )
        }));
        handleCloseDialog();
    };

    const handleDeleteItem = (type, id) => {
        setProfile(prev => ({
            ...prev,
            [type]: prev[type].filter(item => item.id !== id)
        }));
    };

    const handleSubmit = async () => {
        try {
            await axios.put(`${BACKEND_URL}/worker/profile`, profile, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            // Show success message
        } catch (err) {
            setError('Failed to update profile. Please try again.');
        }
    };

    const renderExperienceItem = (item) => (
        <ListItem key={item.id}>
            <ListItemText
                primary={item.title}
                secondary={`${item.company} • ${item.startDate} - ${item.endDate || 'Present'}`}
            />
            <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleOpenDialog('experience', item)}>
                    <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => handleDeleteItem('experience', item.id)}>
                    <DeleteIcon />
                </IconButton>
            </ListItemSecondaryAction>
        </ListItem>
    );

    const renderEducationItem = (item) => (
        <ListItem key={item.id}>
            <ListItemText
                primary={item.title}
                secondary={`${item.company} • ${item.startDate} - ${item.endDate || 'Present'}`}
            />
            <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleOpenDialog('education', item)}>
                    <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => handleDeleteItem('education', item.id)}>
                    <DeleteIcon />
                </IconButton>
            </ListItemSecondaryAction>
        </ListItem>
    );

    const renderCertificationItem = (item) => (
        <ListItem key={item.id}>
            <ListItemText
                primary={item.title}
                secondary={`${item.company} • ${item.startDate}`}
            />
            <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleOpenDialog('certifications', item)}>
                    <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => handleDeleteItem('certifications', item.id)}>
                    <DeleteIcon />
                </IconButton>
            </ListItemSecondaryAction>
        </ListItem>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Card>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Worker Profile
                    </Typography>

                    <Grid container spacing={3}>
                        {/* Basic Information */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Bio"
                                value={profile.bio}
                                onChange={(e) => handleInputChange('bio', e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Hourly Rate"
                                type="number"
                                value={profile.hourlyRate}
                                onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Location"
                                value={profile.location}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                            />
                        </Grid>

                        {/* Skills */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Skills
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {availableSkills.map(skill => (
                                    <Chip
                                        key={skill}
                                        label={skill}
                                        onClick={() => handleSkillToggle(skill)}
                                        color={profile.skills.includes(skill) ? 'primary' : 'default'}
                                    />
                                ))}
                            </Box>
                        </Grid>

                        {/* Experience */}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <WorkIcon sx={{ mr: 1 }} />
                                <Typography variant="h6">
                                    Work Experience
                                </Typography>
                                <Button
                                    startIcon={<AddIcon />}
                                    onClick={() => handleOpenDialog('experience')}
                                    sx={{ ml: 'auto' }}
                                >
                                    Add Experience
                                </Button>
                            </Box>
                            <List>
                                {profile.experience.map(renderExperienceItem)}
                            </List>
                        </Grid>

                        {/* Education */}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <SchoolIcon sx={{ mr: 1 }} />
                                <Typography variant="h6">
                                    Education
                                </Typography>
                                <Button
                                    startIcon={<AddIcon />}
                                    onClick={() => handleOpenDialog('education')}
                                    sx={{ ml: 'auto' }}
                                >
                                    Add Education
                                </Button>
                            </Box>
                            <List>
                                {profile.education.map(renderEducationItem)}
                            </List>
                        </Grid>

                        {/* Certifications */}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <StarIcon sx={{ mr: 1 }} />
                                <Typography variant="h6">
                                    Certifications
                                </Typography>
                                <Button
                                    startIcon={<AddIcon />}
                                    onClick={() => handleOpenDialog('certifications')}
                                    sx={{ ml: 'auto' }}
                                >
                                    Add Certification
                                </Button>
                            </Box>
                            <List>
                                {profile.certifications.map(renderCertificationItem)}
                            </List>
                        </Grid>

                        {/* Availability */}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <ScheduleIcon sx={{ mr: 1 }} />
                                <Typography variant="h6">
                                    Availability
                                </Typography>
                            </Box>
                            <Grid container spacing={2}>
                                {Object.entries(profile.availability).map(([day, times]) => (
                                    <Grid item xs={12} sm={6} md={4} key={day}>
                                        <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                                            {day}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <TextField
                                                label="Start"
                                                type="time"
                                                value={times.start}
                                                onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                            />
                                            <TextField
                                                label="End"
                                                type="time"
                                                value={times.end}
                                                onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>

                        {/* Portfolio */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Portfolio URL"
                                value={profile.portfolio}
                                onChange={(e) => handleInputChange('portfolio', e.target.value)}
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                        >
                            Save Profile
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Dialog for adding/editing items */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>
                    {editingItem ? 'Edit' : 'Add'} {dialogType?.charAt(0).toUpperCase() + dialogType?.slice(1)}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Title"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Company/Organization"
                                value={formData.company}
                                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Start Date"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="End Date"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={editingItem ? handleUpdateItem : handleAddItem}
                        disabled={!formData.title}
                    >
                        {editingItem ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default WorkerProfileForm; 