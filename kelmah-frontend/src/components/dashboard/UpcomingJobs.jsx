import React from 'react';
import { 
    Paper, 
    Typography, 
    List, 
    ListItem, 
    ListItemText, 
    ListItemAvatar, 
    Avatar,
    Chip,
    Box,
    Button
} from '@mui/material';
import { 
    Work as WorkIcon,
    LocationOn,
    AccessTime
} from '@mui/icons-material';
import { format } from 'date-fns';

function UpcomingJobs({ jobs }) {
    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Upcoming Jobs
            </Typography>
            
            <List>
                {jobs?.map((job) => (
                    <ListItem 
                        key={job.id}
                        alignItems="flex-start"
                        sx={{ 
                            mb: 2, 
                            border: '1px solid #eee',
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'action.hover' }
                        }}
                    >
                        <ListItemAvatar>
                            <Avatar sx={{ bgcolor: job.color || 'primary.main' }}>
                                <WorkIcon />
                            </Avatar>
                        </ListItemAvatar>
                        
                        <ListItemText
                            primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="subtitle1">
                                        {job.title}
                                    </Typography>
                                    <Chip 
                                        label={`$${job.budget}`}
                                        color="primary"
                                        size="small"
                                    />
                                </Box>
                            }
                            secondary={
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {job.location}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                        <AccessTime sx={{ fontSize: 16, mr: 0.5 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {format(new Date(job.scheduledDate), 'PPp')}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                        <Button 
                                            variant="outlined" 
                                            size="small" 
                                            sx={{ mr: 1 }}
                                        >
                                            View Details
                                        </Button>
                                        <Button 
                                            variant="contained" 
                                            size="small"
                                        >
                                            Start Job
                                        </Button>
                                    </Box>
                                </Box>
                            }
                        />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
}

export default UpcomingJobs; 