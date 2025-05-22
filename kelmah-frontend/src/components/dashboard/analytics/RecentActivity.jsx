import React from 'react';
import {
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemAvatar,
    Avatar
} from '@mui/material';
import {
    Work,
    Payment,
    Star,
    Message
} from '@mui/icons-material';

const getActivityIcon = (type) => {
    switch (type) {
        case 'job': return <Work />;
        case 'payment': return <Payment />;
        case 'review': return <Star />;
        case 'message': return <Message />;
        default: return <Work />;
    }
};

function RecentActivity({ activities = [] }) {
    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Recent Activity
            </Typography>
            <List>
                {activities.length > 0 ? (
                    activities.map((activity) => (
                        <ListItem key={activity.id}>
                            <ListItemAvatar>
                                <Avatar>
                                    {getActivityIcon(activity.type)}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={activity.title}
                                secondary={`${activity.description} • ${new Date(activity.timestamp).toLocaleDateString()}`}
                            />
                        </ListItem>
                    ))
                ) : (
                    <ListItem>
                        <ListItemText primary="No recent activity" />
                    </ListItem>
                )}
            </List>
        </Paper>
    );
}

export default RecentActivity; 