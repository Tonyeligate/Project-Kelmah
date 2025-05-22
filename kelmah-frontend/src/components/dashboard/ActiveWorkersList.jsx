import React from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Chip,
    Rating,
    IconButton,
    Skeleton
} from '@mui/material';
import {
    Message,
    LocationOn,
    MoreVert
} from '@mui/icons-material';

function ActiveWorkersList({ workers }) {
    // Ensure workers is an array and handle loading/error states
    const workersList = Array.isArray(workers) ? workers : [];
    
    // Loading state when workers is undefined
    if (workers === undefined) {
        return (
            <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                    Active Workers
                </Typography>
                <List>
                    {[1, 2, 3].map((index) => (
                        <ListItem key={index}>
                            <ListItemAvatar>
                                <Skeleton variant="circular" width={40} height={40} />
                            </ListItemAvatar>
                            <ListItemText
                                primary={<Skeleton width="60%" />}
                                secondary={<Skeleton width="40%" />}
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
                Active Workers
            </Typography>
            
            <List>
                {workersList.length > 0 ? (
                    workersList.map((worker) => (
                        <ListItem
                            key={worker?.id || Math.random()}
                            alignItems="flex-start"
                            sx={{
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                '&:last-child': {
                                    borderBottom: 'none'
                                }
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar src={worker?.avatar} alt={worker?.name || 'Worker'}>
                                    {worker?.name?.charAt(0) || 'W'}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {worker?.name || 'Unknown Worker'}
                                        <Chip
                                            size="small"
                                            label={worker?.status || 'unknown'}
                                            color={worker?.status === 'available' ? 'success' : 'default'}
                                        />
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ mt: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <LocationOn fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary">
                                                {worker?.location || 'Location unknown'}
                                            </Typography>
                                        </Box>
                                        <Rating value={worker?.rating || 0} readOnly size="small" />
                                    </Box>
                                }
                            />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton size="small">
                                    <Message fontSize="small" />
                                </IconButton>
                                <IconButton size="small">
                                    <MoreVert fontSize="small" />
                                </IconButton>
                            </Box>
                        </ListItem>
                    ))
                ) : (
                    <ListItem>
                        <ListItemText
                            primary="No active workers"
                            secondary="Workers will appear here when they're active"
                        />
                    </ListItem>
                )}
            </List>
        </Paper>
    );
}

export default ActiveWorkersList; 