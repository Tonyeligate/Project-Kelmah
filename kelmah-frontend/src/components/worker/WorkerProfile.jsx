import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Rating,
    Avatar,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Divider,
    Alert,
    Card,
    CardContent,
    Chip,
    IconButton,
    LinearProgress,
    Tabs,
    Tab,
    Stack,
    Badge,
    Tooltip,
    Menu,
    MenuItem
} from '@mui/material';
import {
    Edit as EditIcon,
    LocationOn as LocationIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LinkedIn as LinkedInIcon,
    Language as WebsiteIcon,
    Work as WorkIcon,
    AttachMoney as MoneyIcon,
    AccessTime as TimeIcon,
    Verified as VerifiedIcon,
    Add as AddIcon,
    PhotoCamera as CameraIcon,
    Upload as UploadIcon,
    MoreVert as MoreIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const Input = styled('input')({
    display: 'none',
});

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
    width: 150,
    height: 150,
    border: `4px solid ${theme.palette.background.paper}`,
    boxShadow: theme.shadows[3],
    margin: 'auto'
}));

const SkillBar = ({ name, level }) => {
    // Convert level (1-5) to percentage
    const percentage = (level / 5) * 100;
    
    return (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" fontWeight={500}>
                    {name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {level}/5
                </Typography>
            </Box>
            <LinearProgress 
                variant="determinate" 
                value={percentage} 
                sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'rgba(0,0,0,0.05)'
                }}
                color={level >= 4 ? "success" : level >= 3 ? "primary" : "secondary"}
            />
        </Box>
    );
};

const PortfolioItem = ({ image, title, description, onClick }) => {
    return (
        <Card 
            sx={{ 
                height: 220, 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                },
                backgroundImage: `url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end'
            }}
            onClick={onClick}
        >
            <Box 
                sx={{ 
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                    p: 2,
                    color: 'white'
                }}
            >
                <Typography variant="subtitle1" fontWeight={600}>
                    {title}
                </Typography>
                <Typography variant="body2" noWrap>
                    {description}
                </Typography>
            </Box>
        </Card>
    );
};

function WorkerProfile() {
    const { user, token } = useAuth();
    const [profile, setProfile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        profession: '',
        experienceYears: '',
        hourlyRate: '',
        bio: '',
        availability: ''
    });
    const [tabValue, setTabValue] = useState(0);
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, [token]);

    const fetchProfile = async () => {
        try {
            const response = await axios.get(
                `http://localhost:3000/api/workers/${user.userId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setProfile(response.data);
            setFormData({
                profession: response.data.profession || '',
                experienceYears: response.data.experience_years || '',
                hourlyRate: response.data.hourly_rate || '',
                bio: response.data.bio || '',
                availability: response.data.availability || ''
            });
            setError(null);
        } catch (err) {
            setError('Failed to load profile');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(
                'http://localhost:3000/api/workers',
                formData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setProfile(response.data);
            setEditing(false);
            setError(null);
        } catch (err) {
            setError('Failed to update profile');
            console.error(err);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profileImage', file);

        try {
            const response = await axios.post(
                'http://localhost:3000/api/workers/image',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            fetchProfile();
        } catch (err) {
            setError('Failed to upload image');
            console.error(err);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleMenuOpen = (event) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    // Mock data for skills and portfolio
    const skills = [
        { name: 'JavaScript', level: 5 },
        { name: 'React', level: 4 },
        { name: 'Node.js', level: 4 },
        { name: 'UI/UX Design', level: 3 },
        { name: 'Python', level: 3 },
        { name: 'Database Management', level: 4 },
    ];

    const portfolio = [
        { 
            id: 1, 
            title: 'E-commerce Website', 
            description: 'Full-stack e-commerce platform with React and Node.js',
            image: 'https://images.unsplash.com/photo-1557821552-17105176677c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
        },
        { 
            id: 2, 
            title: 'Mobile App Design', 
            description: 'UI/UX design for a fitness tracking app',
            image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1934&q=80'
        },
        { 
            id: 3, 
            title: 'Analytics Dashboard', 
            description: 'Real-time analytics dashboard for business intelligence',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
        },
        { 
            id: 4, 
            title: 'Social Media Platform', 
            description: 'Custom social media platform for a niche community',
            image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
        },
    ];

    // Mock certificates
    const certificates = [
        { id: 1, name: 'Advanced Web Development', issuer: 'Udemy', date: '2023-01-15', verified: true },
        { id: 2, name: 'React Certification', issuer: 'Meta', date: '2022-08-10', verified: true },
        { id: 3, name: 'UI/UX Design Fundamentals', issuer: 'Coursera', date: '2022-05-20', verified: false },
    ];

    if (loading) return <Box sx={{ p: 3 }}>Loading...</Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Profile Header Card */}
            <Card 
                elevation={2} 
                sx={{ 
                    mb: 3, 
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'visible'
                }}
            >
                {/* Cover Image */}
                <Box 
                    sx={{ 
                        height: 200, 
                        width: '100%', 
                        background: 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)',
                        position: 'relative'
                    }}
                >
                    <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                        <IconButton 
                            sx={{ bgcolor: 'background.paper', mr: 1 }}
                            onClick={handleMenuOpen}
                        >
                            <MoreIcon />
                        </IconButton>
                        <IconButton 
                            sx={{ bgcolor: 'background.paper' }}
                            onClick={() => setEditing(true)}
                        >
                            <EditIcon />
                        </IconButton>
                    </Box>
                </Box>

                {/* Profile Menu */}
                <Menu
                    anchorEl={menuAnchorEl}
                    open={Boolean(menuAnchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem onClick={handleMenuClose}>Download CV</MenuItem>
                    <MenuItem onClick={handleMenuClose}>Share Profile</MenuItem>
                    <MenuItem onClick={handleMenuClose}>Export Data</MenuItem>
                </Menu>
                
                {/* Profile Avatar */}
                <Box 
                    sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        mt: -9
                    }}
                >
                    <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                            <label htmlFor="profile-image">
                                <Input
                                    accept="image/*"
                                    id="profile-image"
                                    type="file"
                                    onChange={handleImageUpload}
                                />
                                <IconButton 
                                    component="span" 
                                    sx={{ 
                                        bgcolor: 'primary.main', 
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: 'primary.dark'
                                        }
                                    }}
                                >
                                    <CameraIcon />
                                </IconButton>
                            </label>
                        }
                    >
                        <ProfileAvatar
                            src={profile?.profile_image}
                            alt={profile?.username}
                        >
                            {profile?.username?.charAt(0)}
                        </ProfileAvatar>
                    </Badge>

                    <Box sx={{ textAlign: 'center', p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                            <Typography variant="h4" fontWeight={700}>
                                {profile?.username}
                            </Typography>
                            {profile?.is_verified && (
                                <Tooltip title="Verified Account">
                                    <VerifiedIcon color="primary" sx={{ ml: 1 }} />
                                </Tooltip>
                            )}
                        </Box>
                        
                        <Typography variant="h6" color="primary.main" gutterBottom fontWeight={500}>
                            {profile?.profession}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                            <Rating 
                                value={profile?.average_rating || 0} 
                                precision={0.5}
                                readOnly 
                                sx={{ mr: 1 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                                ({profile?.completed_jobs || 0} jobs completed)
                            </Typography>
                        </Box>
                        
                        <Typography 
                            variant="body1" 
                            color="text.secondary" 
                            sx={{ 
                                maxWidth: 600, 
                                mx: 'auto', 
                                mb: 3,
                                lineHeight: 1.7
                            }}
                        >
                            {profile?.bio}
                        </Typography>
                        
                        <Stack 
                            direction={{ xs: 'column', sm: 'row' }} 
                            spacing={2} 
                            justifyContent="center"
                            sx={{ mb: 2 }}
                        >
                            <Chip
                                icon={<WorkIcon />} 
                                label={`${profile?.experience_years} years experience`} 
                                color="default"
                                variant="outlined"
                            />
                            <Chip 
                                icon={<MoneyIcon />}
                                label={`$${profile?.hourly_rate}/hour`} 
                                color="primary"
                                variant="outlined"
                            />
                            <Chip 
                                icon={<TimeIcon />}
                                label={profile?.availability} 
                                color="success"
                                variant="outlined"
                            />
                        </Stack>
                        
                        <Stack 
                            direction="row" 
                            spacing={1} 
                            justifyContent="center"
                        >
                            <IconButton color="primary">
                                <EmailIcon />
                            </IconButton>
                            <IconButton color="primary">
                                <WebsiteIcon />
                            </IconButton>
                            <IconButton color="primary">
                                <LinkedInIcon />
                            </IconButton>
                            <IconButton color="primary">
                                <PhoneIcon />
                            </IconButton>
                        </Stack>
                    </Box>
                </Box>
            </Card>

            {/* Tabs navigation */}
            <Box sx={{ mb: 3 }}>
                <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        '& .MuiTab-root': {
                            minWidth: 0,
                            px: 3
                        }
                    }}
                >
                    <Tab label="Skills" />
                    <Tab label="Portfolio" />
                    <Tab label="Reviews" />
                    <Tab label="Certificates" />
                    <Tab label="Work History" />
                </Tabs>
            </Box>

            {/* Tab panels */}
            <Box sx={{ mb: 3 }}>
                {/* Skills Tab */}
                {tabValue === 0 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={7}>
                            <Card elevation={2} sx={{ p: 3, height: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                    <Typography variant="h6" fontWeight={600}>
                                        Technical Skills
                                    </Typography>
                                    <Button 
                                        startIcon={<AddIcon />}
                                        variant="outlined"
                                        size="small"
                                    >
                                        Add Skill
                                    </Button>
                                </Box>
                                <Grid container spacing={3}>
                                    {skills.map((skill, index) => (
                                        <Grid item xs={12} sm={6} key={index}>
                                            <SkillBar name={skill.name} level={skill.level} />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <Card elevation={2} sx={{ p: 3, height: '100%' }}>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Languages
                                </Typography>
                                <Box sx={{ mb: 3 }}>
                                    <SkillBar name="English" level={5} />
                                    <SkillBar name="Spanish" level={3} />
                                    <SkillBar name="French" level={2} />
                                </Box>

                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Soft Skills
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {['Communication', 'Teamwork', 'Problem Solving', 'Time Management', 'Adaptability', 'Critical Thinking'].map((skill, index) => (
                                        <Chip 
                                            key={index} 
                                            label={skill} 
                                            variant="outlined"
                                            size="small"
                                        />
                                    ))}
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {/* Portfolio Tab */}
                {tabValue === 1 && (
                    <Card elevation={2} sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                            <Typography variant="h6" fontWeight={600}>
                                Project Portfolio
                            </Typography>
                            <Button 
                                startIcon={<AddIcon />}
                                variant="outlined"
                                size="small"
                            >
                                Add Project
                            </Button>
                        </Box>
                        <Grid container spacing={3}>
                            {portfolio.map((item) => (
                                <Grid item xs={12} sm={6} md={3} key={item.id}>
                                    <PortfolioItem 
                                        image={item.image}
                                        title={item.title}
                                        description={item.description}
                                        onClick={() => console.log('View project', item.id)}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Card>
                )}

                {/* Reviews Tab */}
                {tabValue === 2 && (
                    <Card elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Client Reviews
                        </Typography>
                        {profile?.reviews?.length > 0 ? (
                            <List>
                                {profile.reviews.map((review, index) => (
                                    <React.Fragment key={index}>
                                        <ListItem alignItems="flex-start" sx={{ px: 2, py: 3 }}>
                                            <ListItemAvatar>
                                                <Avatar
                                                    src={review.client_image}
                                                    alt={review.client_name}
                                                >
                                                    {review.client_name.charAt(0)}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography fontWeight={600}>
                                                            {review.client_name}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {new Date(review.date).toLocaleDateString()}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <>
                                                        <Rating 
                                                            value={review.rating} 
                                                            size="small" 
                                                            readOnly 
                                                            sx={{ mt: 0.5, mb: 1 }}
                                                        />
                                                        <Typography
                                                            variant="body2"
                                                            color="text.primary"
                                                            sx={{ mt: 1 }}
                                                        >
                                                            {review.comment}
                                                        </Typography>
                                                        <Typography 
                                                            variant="body2" 
                                                            color="text.secondary"
                                                            sx={{ mt: 1 }}
                                                        >
                                                            Project: {review.job_title}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                        {index < profile.reviews.length - 1 && <Divider component="li" />}
                                    </React.Fragment>
                                ))}
                            </List>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography color="text.secondary">
                                    No reviews yet
                                </Typography>
                            </Box>
                        )}
                    </Card>
                )}

                {/* Certificates Tab */}
                {tabValue === 3 && (
                    <Card elevation={2} sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                            <Typography variant="h6" fontWeight={600}>
                                Certificates & Qualifications
                            </Typography>
                            <Button 
                                startIcon={<UploadIcon />}
                                variant="outlined"
                                size="small"
                            >
                                Upload Certificate
                            </Button>
                        </Box>
                        <List>
                            {certificates.map((cert, index) => (
                                <React.Fragment key={cert.id}>
                                    <ListItem alignItems="flex-start" sx={{ px: 2, py: 2 }}>
                                        <ListItemAvatar>
                                            <Avatar
                                                sx={{ bgcolor: 'primary.main' }}
                                            >
                                                {cert.issuer.charAt(0)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Typography fontWeight={600}>
                                                        {cert.name}
                                                    </Typography>
                                                    {cert.verified && (
                                                        <Tooltip title="Verified Certificate">
                                                            <VerifiedIcon color="primary" sx={{ ml: 1, fontSize: 18 }} />
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Issued by {cert.issuer} • {new Date(cert.date).toLocaleDateString()}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                        <Button size="small" variant="text">View</Button>
                                    </ListItem>
                                    {index < certificates.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            ))}
                        </List>
                    </Card>
                )}

                {/* Work History Tab */}
                {tabValue === 4 && (
                    <Card elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Work History
                        </Typography>
                        {profile?.work_history?.length > 0 ? (
                            <List>
                                {profile.work_history.map((job, index) => (
                                    <React.Fragment key={index}>
                                        <ListItem alignItems="flex-start" sx={{ px: 2, py: 3 }}>
                                            <ListItemAvatar>
                                                <Avatar
                                                    src={job.client_image}
                                                    alt={job.client_name}
                                                >
                                                    {job.client_name.charAt(0)}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography fontWeight={600}>
                                                            {job.title}
                                                        </Typography>
                                                        <Chip 
                                                            label={job.status} 
                                                            size="small"
                                                            color={job.status === 'Completed' ? 'success' : 'primary'}
                                                        />
                                                    </Box>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                            Client: {job.client_name}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {new Date(job.start_date).toLocaleDateString()} - 
                                                            {job.end_date ? new Date(job.end_date).toLocaleDateString() : 'Present'}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Payment: ${job.payment}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                        {index < profile.work_history.length - 1 && <Divider component="li" />}
                                    </React.Fragment>
                                ))}
                            </List>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography color="text.secondary">
                                    No work history available
                                </Typography>
                            </Box>
                        )}
                    </Card>
                )}
            </Box>

            {/* Edit Profile Dialog */}
            {editing && (
                <Card elevation={3} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        Edit Profile
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Profession"
                                    name="profession"
                                    value={formData.profession}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Years of Experience"
                                    name="experienceYears"
                                    type="number"
                                    value={formData.experienceYears}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Hourly Rate"
                                    name="hourlyRate"
                                    type="number"
                                    value={formData.hourlyRate}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Bio"
                                    name="bio"
                                    multiline
                                    rows={4}
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Availability"
                                    name="availability"
                                    value={formData.availability}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button type="submit" variant="contained">
                                        Save Changes
                                    </Button>
                                    <Button 
                                        variant="outlined" 
                                        color="secondary"
                                        onClick={() => setEditing(false)}
                                    >
                                        Cancel
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </form>
                </Card>
            )}
        </Box>
    );
}

export default WorkerProfile;