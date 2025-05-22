import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Stepper,
    Step,
    StepLabel,
    Card,
    CardContent,
    Grid,
    Chip,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Tooltip,
    CircularProgress
} from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import {
    BusinessCenter,
    AccessTime,
    Check,
    Close,
    Visibility,
    Message,
    Schedule,
    Star,
    Assignment,
    Update
} from '@mui/icons-material';
import { format } from 'date-fns';

const steps = ['Applied', 'Under Review', 'Interview', 'Decision'];

const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
        case 'pending':
            return 'warning';
        case 'accepted':
            return 'success';
        case 'rejected':
            return 'error';
        case 'interview':
            return 'info';
        default:
            return 'default';
    }
};

const getStepIndex = (status) => {
    switch (status.toLowerCase()) {
        case 'applied':
            return 0;
        case 'under_review':
            return 1;
        case 'interview':
            return 2;
        case 'accepted':
        case 'rejected':
            return 3;
        default:
            return 0;
    }
};

function ApplicationTracker({ applications = [], loading = false, onViewJob, onViewFeedback }) {
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [feedbackDialog, setFeedbackDialog] = useState({ open: false, data: null });
    const [detailsDialog, setDetailsDialog] = useState({ open: false, data: null });

    const handleViewDetails = async (application) => {
        setDetailsDialog({ open: true, data: application });
        if (onViewJob) {
            try {
                await onViewJob(application.id);
            } catch (error) {
                console.error('Error loading job details:', error);
            }
        }
    };

    const handleViewFeedback = async (application) => {
        setFeedbackDialog({ open: true, data: application });
        if (onViewFeedback) {
            try {
                await onViewFeedback(application.id);
            } catch (error) {
                console.error('Error loading feedback:', error);
            }
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    if (applications.length === 0) {
        return (
            <Alert severity="info" sx={{ m: 2 }}>
                No job applications found. Start applying to jobs to track your progress here!
            </Alert>
        );
    }

    return (
        <Box>
            <Grid container spacing={2}>
                {applications.map((application, index) => (
                    <Grid item xs={12} key={index}>
                        <Card variant="outlined">
                            <CardContent>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="h6" gutterBottom>
                                            {application.jobTitle}
                                        </Typography>
                                        <Typography color="textSecondary" gutterBottom>
                                            {application.companyName}
                                        </Typography>
                                        <Box display="flex" gap={1} mb={1}>
                                            <Chip
                                                size="small"
                                                color={getStatusColor(application.status)}
                                                label={application.status}
                                            />
                                            <Chip
                                                size="small"
                                                icon={<AccessTime />}
                                                label={format(new Date(application.appliedDate), 'MMM dd, yyyy')}
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Box display="flex" justifyContent="flex-end" gap={1}>
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    onClick={() => handleViewDetails(application)}
                                                    color="primary"
                                                >
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="View Feedback">
                                                <IconButton
                                                    onClick={() => handleViewFeedback(application)}
                                                    color="primary"
                                                    disabled={!application.hasFeedback}
                                                >
                                                    <Message />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Grid>
                                </Grid>
                                <Stepper activeStep={getStepIndex(application.status)} alternativeLabel>
                                    {steps.map((label) => (
                                        <Step key={label}>
                                            <StepLabel>{label}</StepLabel>
                                        </Step>
                                    ))}
                                </Stepper>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Job Details Dialog */}
            <Dialog
                open={detailsDialog.open}
                onClose={() => setDetailsDialog({ open: false, data: null })}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Job Application Details
                </DialogTitle>
                <DialogContent dividers>
                    {detailsDialog.data && (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="h6">{detailsDialog.data.jobTitle}</Typography>
                                <Typography color="textSecondary" gutterBottom>
                                    {detailsDialog.data.companyName}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2">Status</Typography>
                                <Chip
                                    size="small"
                                    color={getStatusColor(detailsDialog.data.status)}
                                    label={detailsDialog.data.status}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2">Applied Date</Typography>
                                <Typography>
                                    {format(new Date(detailsDialog.data.appliedDate), 'MMMM dd, yyyy')}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2">Job Description</Typography>
                                <Typography>{detailsDialog.data.description}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2">Application Timeline</Typography>
                                <Timeline>
                                    {detailsDialog.data.timeline?.map((event, index) => (
                                        <TimelineItem key={index}>
                                            <TimelineOppositeContent color="textSecondary">
                                                {format(new Date(event.date), 'MMM dd, yyyy')}
                                            </TimelineOppositeContent>
                                            <TimelineSeparator>
                                                <TimelineDot color={getStatusColor(event.status)} />
                                                {index < detailsDialog.data.timeline.length - 1 && <TimelineConnector />}
                                            </TimelineSeparator>
                                            <TimelineContent>
                                                <Typography>{event.title}</Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    {event.description}
                                                </Typography>
                                            </TimelineContent>
                                        </TimelineItem>
                                    ))}
                                </Timeline>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsDialog({ open: false, data: null })}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Feedback Dialog */}
            <Dialog
                open={feedbackDialog.open}
                onClose={() => setFeedbackDialog({ open: false, data: null })}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Application Feedback
                </DialogTitle>
                <DialogContent dividers>
                    {feedbackDialog.data?.feedback ? (
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Overall Assessment
                            </Typography>
                            <Typography paragraph>
                                {feedbackDialog.data.feedback.assessment}
                            </Typography>
                            
                            <Typography variant="subtitle2" gutterBottom>
                                Strengths
                            </Typography>
                            <Box component="ul">
                                {feedbackDialog.data.feedback.strengths?.map((strength, index) => (
                                    <li key={index}>
                                        <Typography>{strength}</Typography>
                                    </li>
                                ))}
                            </Box>

                            <Typography variant="subtitle2" gutterBottom>
                                Areas for Improvement
                            </Typography>
                            <Box component="ul">
                                {feedbackDialog.data.feedback.improvements?.map((improvement, index) => (
                                    <li key={index}>
                                        <Typography>{improvement}</Typography>
                                    </li>
                                ))}
                            </Box>
                        </Box>
                    ) : (
                        <Alert severity="info">
                            No feedback available for this application yet.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFeedbackDialog({ open: false, data: null })}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default ApplicationTracker;
