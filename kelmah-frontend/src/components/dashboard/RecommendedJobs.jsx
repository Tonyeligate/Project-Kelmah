import React from 'react';
import { 
    Card, 
    CardContent, 
    Typography, 
    Grid, 
    Chip, 
    Button, 
    Box,
    Rating,
    Paper 
} from '@mui/material';
import { LocationOn, WorkOutline, AccessTime } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

function RecommendedJobs({ jobs = [] }) {
    const formatDate = (dateString) => {
        try {
            // Make sure we have a valid date string
            if (!dateString) return 'Date not available';
            
            const date = new Date(dateString);
            // Check if date is valid
            if (isNaN(date.getTime())) return 'Invalid date';
            
            return formatDistanceToNow(date, { addSuffix: true });
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Date not available';
        }
    };

    if (jobs.length === 0) {
        return (
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Recommended Jobs
                </Typography>
                <Box sx={{ py: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        No recommended jobs available at the moment.
                    </Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Recommended Jobs
            </Typography>
            <Grid container spacing={2}>
                {jobs.map((job) => (
                    <Grid item xs={12} md={6} key={job.id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {job.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {job.description}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <LocationOn sx={{ mr: 1, fontSize: 20 }} />
                                    <Typography variant="body2">
                                        {job.location || 'Location not specified'}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <WorkOutline sx={{ mr: 1, fontSize: 20 }} />
                                    <Typography variant="body2">
                                        ${job.budget || 0}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <AccessTime sx={{ mr: 1, fontSize: 20 }} />
                                    <Typography variant="body2">
                                        {formatDate(job.postedDate)}
                                    </Typography>
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    {job.skills?.map((skill, index) => (
                                        <Chip
                                            key={index}
                                            label={skill}
                                            size="small"
                                            sx={{ mr: 1, mb: 1 }}
                                        />
                                    )) || null}
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button 
                                        variant="contained" 
                                        color="primary"
                                        size="small"
                                    >
                                        View Details
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
}

export default RecommendedJobs;