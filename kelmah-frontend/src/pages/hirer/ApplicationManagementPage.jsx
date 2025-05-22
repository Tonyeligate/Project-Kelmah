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
    Avatar,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Person,
    AttachMoney,
    Schedule,
    Check,
    Close
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet';
import axios from '../../api/axios';

function ApplicationManagementPage() {
    const [activeTab, setActiveTab] = useState('pending');
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchApplications();
    }, [activeTab]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/applications?status=${activeTab}`);
            setApplications(response.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching applications:', error);
            setError('Failed to fetch applications');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (applicationId, status) => {
        try {
            setUpdating(true);
            await axios.patch(`/api/applications/${applicationId}/status`, {
                status,
                feedback
            });
            setShowReviewDialog(false);
            setFeedback('');
            fetchApplications();
        } catch (error) {
            console.error('Error updating application:', error);
            setError('Failed to update application status');
        } finally {
            setUpdating(false);
        }
    };

    const handleReview = (application) => {
        setSelectedApplication(application);
        setShowReviewDialog(true);
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
                <title>Application Management | Kelmah</title>
            </Helmet>
            
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Job Applications
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
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={8}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Avatar sx={{ mr: 2 }}>
                                                    {application.worker_name[0]}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="h6">
                                                        {application.worker_name}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Applied for: {application.job_title}
                                                    </Typography>
                                                </Box>
                                            </Box>

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

                                        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            {activeTab === 'pending' ? (
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        startIcon={<Check />}
                                                        fullWidth
                                                        onClick={() => handleReview(application)}
                                                    >
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        color="error"
                                                        startIcon={<Close />}
                                                        fullWidth
                                                        onClick={() => handleReview(application)}
                                                    >
                                                        Reject
                                                    </Button>
                                                </Box>
                                            ) : (
                                                <Chip
                                                    label={application.status}
                                                    color={application.status === 'accepted' ? 'success' : 'error'}
                                                    sx={{ textTransform: 'capitalize' }}
                                                />
                                            )}
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

            {/* Review Dialog */}
            <Dialog
                open={showReviewDialog}
                onClose={() => setShowReviewDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Review Application
                </DialogTitle>
                <DialogContent dividers>
                    <TextField
                        fullWidth
                        label="Feedback (Optional)"
                        multiline
                        rows={4}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setShowReviewDialog(false)}
                        color="inherit"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleStatusUpdate(selectedApplication?.id, 'rejected')}
                        color="error"
                        disabled={updating}
                    >
                        Reject
                    </Button>
                    <Button
                        onClick={() => handleStatusUpdate(selectedApplication?.id, 'accepted')}
                        color="success"
                        variant="contained"
                        disabled={updating}
                    >
                        Accept
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default ApplicationManagementPage; 