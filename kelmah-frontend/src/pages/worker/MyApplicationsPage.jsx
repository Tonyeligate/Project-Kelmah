import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Tabs,
    Tab,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import {
    AttachMoney,
    Schedule,
    Business,
    ArrowForward
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import axios from '../../api/axios';

function MyApplicationsPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pending');
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

    useEffect(() => {
        fetchApplications();
    }, [activeTab]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/applications/my?status=${activeTab}`);
            setApplications(response.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching applications:', error);
            setError('Failed to fetch applications');
        } finally {
            setLoading(false);
        }
    };

    const handleViewJob = (jobId) => {
        navigate(`/jobs/${jobId}`);
    };

    const handleViewFeedback = (application) => {
        setSelectedApplication(application);
        setShowFeedbackDialog(true);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Helmet>
                <title>My Applications | Kelmah</title>
            </Helmet>
            
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    My Applications
                </Typography>

                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    sx={{ mb: 3 }}
                >
                    <Tab label="Pending" value="pending" />
                    <Tab label="Accepted" value="accepted" />
                    <Tab label="Rejected" value="rejected" />
                </Tabs>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {applications.map((application) => (
                        <Grid item xs={12} key={application.id}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="h6">
                                            {application.job_title}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Business fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary">
                                                Posted by {application.hirer_name}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={8}>
                                            <Typography variant="body1" sx={{ mb: 2 }}>
                                                {application.cover_letter}
                                            </Typography>

                                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <AttachMoney sx={{ mr: 1 }} />
                                                    <Typography>
                                                        Proposed: ${application.proposed_budget}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Schedule sx={{ mr: 1 }} />
                                                    <Typography>
                                                        Applied: {format(new Date(application.created_at), 'MMM d, yyyy')}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}>
                                            <Chip
                                                label={application.status}
                                                color={
                                                    application.status === 'accepted' ? 'success' :
                                                    application.status === 'rejected' ? 'error' :
                                                    'default'
                                                }
                                                sx={{ textTransform: 'capitalize' }}
                                            />
                                            
                                            {application.status !== 'pending' && application.feedback && (
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => handleViewFeedback(application)}
                                                >
                                                    View Feedback
                                                </Button>
                                            )}

                                            <Button
                                                variant="contained"
                                                endIcon={<ArrowForward />}
                                                onClick={() => handleViewJob(application.job_id)}
                                            >
                                                View Job
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}

                    {applications.length === 0 && (
                        <Grid item xs={12}>
                            <Typography color="text.secondary" align="center">
                                No {activeTab} applications found
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {/* Feedback Dialog */}
            <Dialog
                open={showFeedbackDialog}
                onClose={() => setShowFeedbackDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Application Feedback
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {selectedApplication?.feedback || 'No feedback provided'}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowFeedbackDialog(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default MyApplicationsPage; 