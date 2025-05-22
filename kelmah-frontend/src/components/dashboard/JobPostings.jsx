import React from 'react';
import { 
    Paper, 
    Typography, 
    List, 
    ListItem, 
    ListItemText, 
    ListItemIcon,
    Chip
} from '@mui/material';
import { Work } from '@mui/icons-material';

function JobPostings({ jobs = [] }) {
    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Recent Job Postings
            </Typography>
            <List>
                {jobs.length > 0 ? jobs.map((job) => (
                    <ListItem key={job.id}>
                        <ListItemIcon>
                            <Work />
                        </ListItemIcon>
                        <ListItemText 
                            primary={job.title}
                            secondary={`Posted on ${new Date(job.created_at).toLocaleDateString()}`}
                        />
                        <Chip 
                            label={job.status}
                            color={job.status === 'active' ? 'success' : 'default'}
                            size="small"
                        />
                    </ListItem>
                )) : (
                    <ListItem>
                        <ListItemText primary="No job postings yet" />
                    </ListItem>
                )}
            </List>
        </Paper>
    );
}

export default JobPostings; 