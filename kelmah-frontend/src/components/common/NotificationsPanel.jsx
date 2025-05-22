import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { Box, Typography, Button } from '@mui/material';
import { fetchNotifications } from '../../store/slices/notificationsSlice';

function NotificationsPanel() {
    const dispatch = useDispatch();
    const { items, loading, error, unreadCount } = useSelector((state) => state.notifications);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        const fetchData = async () => {
            try {
                await dispatch(fetchNotifications()).unwrap();
            } catch (error) {
                enqueueSnackbar(error.message || 'Failed to load notifications', {
                    variant: 'error',
                    autoHideDuration: 3000
                });
            }
        };
        fetchData();
    }, [dispatch, enqueueSnackbar]);

    if (error) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="error" gutterBottom>
                    {error.message}
                </Typography>
                <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => dispatch(fetchNotifications())}
                >
                    Retry
                </Button>
            </Box>
        );
    }

    // Rest of your component code...
} 