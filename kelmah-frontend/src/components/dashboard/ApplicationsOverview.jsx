import React from 'react';
import { 
    Paper, 
    Typography, 
    List, 
    ListItem, 
    ListItemText, 
    ListItemAvatar,
    Avatar
} from '@mui/material';
import { Person } from '@mui/icons-material';

function ApplicationsOverview({ applications = [] }) {
    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Recent Applications
            </Typography>
            <List>
                {applications.length > 0 ? applications.map((application) => (
                    <ListItem key={application.id}>
                        <ListItemAvatar>
                            <Avatar>
                                <Person />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                            primary={application.applicant_name}
                            secondary={`Applied for: ${application.job_title}`}
                        />
                    </ListItem>
                )) : (
                    <ListItem>
                        <ListItemText primary="No applications yet" />
                    </ListItem>
                )}
            </List>
        </Paper>
    );
}

export default ApplicationsOverview; 