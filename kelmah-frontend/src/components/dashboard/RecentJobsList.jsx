import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateJobStatus } from '../../store/slices/dashboardSlice';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    Chip,
    IconButton,
    Button,
    Menu,
    MenuItem,
    CircularProgress
} from '@mui/material';
import {
    Work,
    AccessTime,
    MoreVert
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

function RecentJobsList() {
    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    
    const { recentJobs = [] } = useSelector(state => state.dashboard?.data || {});
    const loading = useSelector(state => state.dashboard?.loading);
    
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedJob, setSelectedJob] = useState(null);

    const handleStatusChange = async (newStatus) => {
        if (selectedJob) {
            try {
                await dispatch(updateJobStatus({ 
                    jobId: selectedJob.id, 
                    status: newStatus 
                })).unwrap();
                
                enqueueSnackbar('Job status updated successfully', { 
                    variant: 'success' 
                });
            } catch (error) {
                enqueueSnackbar(error?.message || 'Failed to update job status', { 
                    variant: 'error' 
                });
            }
            handleMenuClose();
        }
    };

    const handleMenuClick = (event, job) => {
        setAnchorEl(event.currentTarget);
        setSelectedJob(job);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedJob(null);
    };

    if (loading) {
        return (
            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    Recent Jobs
                </Typography>
                <Button variant="outlined" size="small" startIcon={<Work />}>
                    View All Jobs
                </Button>
            </Box>

            <List>
                {Array.isArray(recentJobs) && recentJobs.length > 0 ? (
                    recentJobs.map((job) => (
                        <ListItem
                            key={job?.id || Math.random()}
                            sx={{
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                '&:last-child': {
                                    borderBottom: 'none'
                                }
                            }}
                        >
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {job?.title || 'Untitled Job'}
                                        <Chip
                                            size="small"
                                            label={job?.status || 'unknown'}
                                            color={
                                                job?.status === 'active' ? 'success' :
                                                job?.status === 'pending' ? 'warning' : 'default'
                                            }
                                        />
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ mt: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <AccessTime fontSize="small" color="action" />
                                                <Typography variant="body2" color="text.secondary">
                                                    {job?.timePosted || 'Unknown time'}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {job?.applications || 0} applications
                                            </Typography>
                                        </Box>
                                    </Box>
                                }
                            />
                            <IconButton onClick={(e) => handleMenuClick(e, job)}>
                                <MoreVert />
                            </IconButton>
                        </ListItem>
                    ))
                ) : (
                    <ListItem>
                        <ListItemText
                            primary="No recent jobs"
                            secondary="Your recent job postings will appear here"
                        />
                    </ListItem>
                )}
            </List>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => handleStatusChange('active')}>Set Active</MenuItem>
                <MenuItem onClick={() => handleStatusChange('completed')}>Set Completed</MenuItem>
                <MenuItem onClick={() => handleStatusChange('cancelled')}>Cancel Job</MenuItem>
            </Menu>
        </Paper>
    );
}

export default RecentJobsList; 